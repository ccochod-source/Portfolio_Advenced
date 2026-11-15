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

const selectedWeights = new Set([
  "Spine",
  "Spine1",
  "Spine2",
  "LeftShoulder",
  "RightShoulder",
  "LeftArm",
  "RightArm",
  "LeftForeArm",
  "RightForeArm",
]);
const isHandOrFinger = (name) => /Hand|Thumb|Index|Middle|Ring|Pinky/.test(name);
const smoothstep = (min, max, value) => {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return t * t * (3 - 2 * t);
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

for (const node of document.getRoot().listNodes()) {
  const mesh = node.getMesh();
  const skin = node.getSkin();
  if (!mesh || !skin) continue;

  const joints = skin.listJoints();
  const names = joints.map((joint) => joint.getName());
  const inverseBindMatrices = skin.getInverseBindMatrices();
  const jointMatrices = joints.map((joint, index) =>
    multiplyMatrices(joint.getWorldMatrix([]), inverseBindMatrices.getElement(index, [])),
  );
  const nodeMatrix = node.getWorldMatrix([]);

  for (const primitive of mesh.listPrimitives()) {
    const positions = primitive.getAttribute("POSITION");
    const normals = primitive.getAttribute("NORMAL");
    const jointSets = [0, 1]
      .map((set) => ({
        indices: primitive.getAttribute(`JOINTS_${set}`),
        weights: primitive.getAttribute(`WEIGHTS_${set}`),
      }))
      .filter(({ indices, weights }) => indices && weights);
    if (!positions || !normals || jointSets.length === 0) continue;

    let changed = 0;
    let maxOffset = 0;
    for (let index = 0; index < positions.getCount(); index++) {
      const position = positions.getElement(index, []);
      const normal = normals.getElement(index, []);
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
          if (selectedWeights.has(name)) influence.set(name, (influence.get(name) ?? 0) + weight);
        }
      }
      if (excluded) continue;

      const weight = (name) => influence.get(name) ?? 0;
      const forearms = weight("LeftForeArm") + weight("RightForeArm");
      const targetWeight =
        weight("Spine1") +
        weight("Spine2") +
        weight("LeftShoulder") +
        weight("RightShoulder") +
        weight("LeftArm") +
        weight("RightArm") +
        (weight("Spine") + forearms) * 0.5;
      if (targetWeight <= 0) continue;

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

      const neckTaper =
        1 -
        smoothstep(1.38, 1.515, bindPosition[1]) *
          (1 - smoothstep(0.08, 0.2, Math.abs(bindPosition[0])));
      const torsoWeight = weight("Spine1") + weight("Spine2") + weight("LeftShoulder") + weight("RightShoulder") + weight("Spine") * 0.5;
      const armWeight = weight("LeftArm") + weight("RightArm");
      const thickness = (0.028 * torsoWeight + 0.022 * armWeight + 0.01 * forearms) * neckTaper;
      const lateral =
        0.03 *
        (weight("LeftShoulder") + weight("LeftArm") - weight("RightShoulder") - weight("RightArm")) *
        neckTaper;
      const normalLength = Math.hypot(normal[0], normal[1], normal[2]) || 1;
      const offset = [
        (normal[0] / normalLength) * thickness + lateral,
        (normal[1] / normalLength) * thickness,
        (normal[2] / normalLength) * thickness,
      ];
      positions.setElement(index, position.map((value, axis) => value + offset[axis]));
      changed++;
      maxOffset = Math.max(maxOffset, Math.hypot(...offset));
    }

    if (changed > 0) {
      console.log(`${mesh.getName()}: ${changed} vertices moved; max offset ${(maxOffset * 100).toFixed(2)} cm`);
    }
  }
}

await document.transform(meshopt({ encoder: MeshoptEncoder, level: "medium" }));
await io.write(outputPath, document);
console.log(`Wrote ${outputPath}`);
