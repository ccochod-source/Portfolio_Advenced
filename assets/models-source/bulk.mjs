import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRequire = createRequire(import.meta.url);
let require = projectRequire;
try {
  projectRequire.resolve("@gltf-transform/core");
} catch {
  const toolDir = process.env.V6R3_TOOL_DIR;
  if (!toolDir) throw new Error("Install gltf-transform dependencies or set V6R3_TOOL_DIR.");
  require = createRequire(path.join(toolDir, "package.json"));
}

const { NodeIO } = require("@gltf-transform/core");
const { ALL_EXTENSIONS } = require("@gltf-transform/extensions");
const { meshopt } = require("@gltf-transform/functions");
const { MeshoptDecoder, MeshoptEncoder } = require("meshoptimizer");

await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready]);

const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const defaultModel = path.join(repoDir, "public/models/avatar.glb");
const inputPath = path.resolve(process.argv[2] ?? defaultModel);
const outputPath = path.resolve(process.argv[3] ?? defaultModel);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.decoder": MeshoptDecoder, "meshopt.encoder": MeshoptEncoder });
const document = await io.read(inputPath);

const SMOOTHING_ITERATIONS = 5;
const SMOOTHING_STRENGTH = 0.5;
const WELD_SCALE = 100_000;
const isHandOrFinger = (name) => /Hand|Thumb|Index|Middle|Ring|Pinky/.test(name);
const smoothstep = (min, max, value) => {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return t * t * (3 - 2 * t);
};
const normalize = (vector) => {
  const length = Math.hypot(...vector);
  return length > 1e-8 ? vector.map((value) => value / length) : [0, 0, 1];
};
const multiplyMatrices = (a, b) => {
  const result = new Array(16).fill(0);
  for (let column = 0; column < 4; column++) {
    for (let row = 0; row < 4; row++) {
      for (let k = 0; k < 4; k++) result[column * 4 + row] += a[k * 4 + row] * b[column * 4 + k];
    }
  }
  return result;
};
const transformPoint = (matrix, point) => [
  matrix[0] * point[0] + matrix[4] * point[1] + matrix[8] * point[2] + matrix[12],
  matrix[1] * point[0] + matrix[5] * point[1] + matrix[9] * point[2] + matrix[13],
  matrix[2] * point[0] + matrix[6] * point[1] + matrix[10] * point[2] + matrix[14],
];

function createWeldedAdjacency(positions, indexAccessor) {
  const groups = [];
  const vertexGroup = new Array(positions.getCount());
  const byPosition = new Map();

  for (let index = 0; index < positions.getCount(); index++) {
    const position = positions.getElement(index, []);
    const key = position.map((value) => Math.round(value * WELD_SCALE)).join(":");
    let groupIndex = byPosition.get(key);
    if (groupIndex === undefined) {
      groupIndex = groups.length;
      byPosition.set(key, groupIndex);
      groups.push({ vertices: [], neighbors: new Set() });
    }
    groups[groupIndex].vertices.push(index);
    vertexGroup[index] = groupIndex;
  }

  const indexCount = indexAccessor?.getCount() ?? positions.getCount();
  const indexAt = (index) => (indexAccessor ? indexAccessor.getElement(index, [])[0] : index);
  const addEdge = (a, b) => {
    const from = vertexGroup[a];
    const to = vertexGroup[b];
    if (from === to) return;
    groups[from].neighbors.add(to);
    groups[to].neighbors.add(from);
  };

  for (let index = 0; index + 2 < indexCount; index += 3) {
    const a = indexAt(index);
    const b = indexAt(index + 1);
    const c = indexAt(index + 2);
    addEdge(a, b);
    addEdge(b, c);
    addEdge(c, a);
  }

  return { groups, vertexGroup };
}

function smoothScalars(values, groups, fixedZero) {
  let current = values;
  for (let iteration = 0; iteration < SMOOTHING_ITERATIONS; iteration++) {
    current = current.map((value, index) => {
      if (fixedZero[index]) return 0;
      const neighbors = [...groups[index].neighbors];
      if (neighbors.length === 0) return value;
      const neighborMean = neighbors.reduce((sum, neighbor) => sum + current[neighbor], 0) / neighbors.length;
      return value * (1 - SMOOTHING_STRENGTH) + neighborMean * SMOOTHING_STRENGTH;
    });
  }
  return current;
}

function smoothVectors(vectors, groups) {
  let current = vectors;
  for (let iteration = 0; iteration < SMOOTHING_ITERATIONS; iteration++) {
    current = current.map((vector, index) => {
      const neighbors = [...groups[index].neighbors];
      if (neighbors.length === 0) return vector;
      const sum = neighbors.reduce(
        (result, neighbor) => result.map((value, axis) => value + current[neighbor][axis]),
        [0, 0, 0],
      );
      const mean = sum.map((value) => value / neighbors.length);
      return normalize(
        vector.map((value, axis) => value * (1 - SMOOTHING_STRENGTH) + mean[axis] * SMOOTHING_STRENGTH),
      );
    });
  }
  return current;
}

const distanceAlong = (point, start, end) => {
  const direction = end.map((value, axis) => value - start[axis]);
  const lengthSquared = direction.reduce((sum, value) => sum + value * value, 0);
  if (lengthSquared <= 1e-8) return 0;
  const projection = point.reduce((sum, value, axis) => sum + (value - start[axis]) * direction[axis], 0) / lengthSquared;
  return Math.max(0, Math.min(1, projection));
};

for (const node of document.getRoot().listNodes()) {
  const mesh = node.getMesh();
  const skin = node.getSkin();
  if (!mesh || !skin) continue;

  const joints = skin.listJoints();
  const names = joints.map((joint) => joint.getName());
  const inverseBindMatrices = skin.getInverseBindMatrices();
  const jointWorldMatrices = joints.map((joint) => joint.getWorldMatrix([]));
  const jointMatrices = jointWorldMatrices.map((matrix, index) =>
    multiplyMatrices(matrix, inverseBindMatrices.getElement(index, [])),
  );
  const jointOrigins = new Map(
    joints.map((joint, index) => [joint.getName(), [jointWorldMatrices[index][12], jointWorldMatrices[index][13], jointWorldMatrices[index][14]]]),
  );
  const leftArmStart = jointOrigins.get("LeftArm");
  const leftElbow = jointOrigins.get("LeftForeArm");
  const rightArmStart = jointOrigins.get("RightArm");
  const rightElbow = jointOrigins.get("RightForeArm");
  const nodeMatrix = node.getWorldMatrix([]);

  for (const primitive of mesh.listPrimitives()) {
    const positions = primitive.getAttribute("POSITION");
    const normals = primitive.getAttribute("NORMAL");
    const indices = primitive.getIndices();
    const jointSets = [0, 1]
      .map((set) => ({
        indices: primitive.getAttribute(`JOINTS_${set}`),
        weights: primitive.getAttribute(`WEIGHTS_${set}`),
    }))
      .filter(({ indices, weights }) => indices && weights);
    if (!positions || !normals || jointSets.length === 0) continue;

    const { groups, vertexGroup } = createWeldedAdjacency(positions, indices);
    const groupMagnitudes = new Array(groups.length).fill(0);
    const groupNormals = groups.map((group) => {
      const sum = [0, 0, 0];
      for (const index of group.vertices) {
        const normal = normals.getElement(index, []);
        for (let axis = 0; axis < 3; axis++) sum[axis] += normal[axis];
      }
      return normalize(sum);
    });
    const groupExcluded = new Array(groups.length).fill(false);
    const groupSamples = new Array(groups.length).fill(0);

    for (let index = 0; index < positions.getCount(); index++) {
      const position = positions.getElement(index, []);
      const groupIndex = vertexGroup[index];
      const influence = new Map();
      let excluded = false;

      for (const { indices, weights } of jointSets) {
        const jointIndices = indices.getElement(index, []);
        const vertexWeights = weights.getElement(index, []);
        for (let slot = 0; slot < jointIndices.length; slot++) {
          const weight = vertexWeights[slot];
          if (weight <= 0) continue;
          const name = names[jointIndices[slot]];
          if (name === "Neck" || name === "Head" || isHandOrFinger(name)) excluded = true;
          influence.set(name, (influence.get(name) ?? 0) + weight);
        }
      }
      if (excluded) {
        groupExcluded[groupIndex] = true;
        continue;
      }

      let bindPosition = [0, 0, 0];
      for (const { indices, weights } of jointSets) {
        const jointIndices = indices.getElement(index, []);
        const vertexWeights = weights.getElement(index, []);
        for (let slot = 0; slot < jointIndices.length; slot++) {
          const vertexWeight = vertexWeights[slot];
          if (vertexWeight <= 0) continue;
          const transformed = transformPoint(jointMatrices[jointIndices[slot]], position);
          bindPosition = bindPosition.map((value, axis) => value + transformed[axis] * vertexWeight);
        }
      }
      bindPosition = transformPoint(nodeMatrix, bindPosition);

      const weight = (name) => influence.get(name) ?? 0;
      const neckTaper =
        1 -
        smoothstep(1.38, 1.515, bindPosition[1]) *
          (1 - smoothstep(0.08, 0.2, Math.abs(bindPosition[0])));
      const leftProgress = leftArmStart && leftElbow ? distanceAlong(bindPosition, leftArmStart, leftElbow) : 0;
      const rightProgress = rightArmStart && rightElbow ? distanceAlong(bindPosition, rightArmStart, rightElbow) : 0;
      const leftArmProfile = 1 - 0.5 * smoothstep(0.55, 1, leftProgress);
      const rightArmProfile = 1 - 0.5 * smoothstep(0.55, 1, rightProgress);
      const magnitude =
        (0.024 * (weight("Spine1") + weight("Spine2")) +
          0.01 * weight("Spine") +
          0.024 * 0.35 * (weight("LeftShoulder") + weight("RightShoulder")) +
          0.02 * (weight("LeftArm") * leftArmProfile + weight("RightArm") * rightArmProfile) +
          0.008 * (weight("LeftForeArm") + weight("RightForeArm"))) *
        neckTaper;
      groupMagnitudes[groupIndex] += magnitude;
      groupSamples[groupIndex]++;
    }

    for (let index = 0; index < groups.length; index++) {
      if (groupSamples[index] > 0) groupMagnitudes[index] /= groupSamples[index];
    }
    const magnitudes = smoothScalars(groupMagnitudes, groups, groupExcluded);
    const smoothedNormals = smoothVectors(groupNormals, groups);
    let changed = 0;
    let maxOffset = 0;

    for (let index = 0; index < positions.getCount(); index++) {
      const groupIndex = vertexGroup[index];
      const magnitude = magnitudes[groupIndex];
      if (magnitude <= 1e-7) continue;
      const offset = smoothedNormals[groupIndex].map((value) => value * magnitude);
      const position = positions.getElement(index, []);
      positions.setElement(index, position.map((value, axis) => value + offset[axis]));
      changed++;
      maxOffset = Math.max(maxOffset, magnitude);
    }

    if (changed > 0) {
      console.log(`${mesh.getName()}: ${changed} vertices moved; max offset ${(maxOffset * 100).toFixed(2)} cm`);
    }
  }
}

await document.transform(meshopt({ encoder: MeshoptEncoder, level: "medium" }));
await io.write(outputPath, document);
console.log(`Wrote ${outputPath}`);
