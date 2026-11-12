// make-clips.mjs — retargets REAL motion-capture clips onto the Avaturn rig and writes a GLB
// with exactly the 5 named clips the app plays: Idle, SitIdle, Walk, Wave, Celebrate.
//
//   node make-clips.mjs <in.glb> <out.glb> [--ual <UAL1_Standard.glb>] [--mocap <dir>]
//
// Inputs
//   <in.glb>   GLB carrying the Avaturn rig (Mixamo bone names without the `mixamorig` prefix,
//              T-pose rest, metres). Either the graft.mjs output or the current
//              public/models/avatar.glb (meshopt is decoded on read). Meshes, materials and
//              textures are passed through untouched; existing animations are dropped.
//   --ual      Quaternius "Universal Animation Library" (CC0 1.0), file
//              `Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb`
//              (https://quaternius.itch.io/universal-animation-library, ~16 MB, not committed).
//              Clips used: Idle_Loop -> Idle, Sitting_Idle_Loop -> SitIdle, Walk_Loop -> Walk.
//   --mocap    Directory with the Bandai Namco Research Motiondataset-2 BVH files (CC BY-NC 4.0,
//              https://github.com/BandaiNamcoResearchInc/Bandai-Namco-Research-Motiondataset),
//              default ./mocap: dataset-2_wave-right-hand_normal_001.bvh -> Wave,
//              dataset-2_raise-up-both-hands_active_002.bvh -> Celebrate.
// Output
//   <out.glb>  uncompressed GLB, 30 fps LINEAR tracks (rotation for all 52 joints + Hips
//              translation). Feed it to optimize.mjs (resample + meshopt) to produce
//              public/models/avatar.glb.
//
// Retargeting: for every mapped bone the source world rotation is expressed relative to a
// calibrated T-pose reference (bind pose for the glTF source; a standing frame for the BVH
// source, whose zero pose is not a T-pose) and re-applied on the target bind pose:
//   R_target(t) = R_source(t) · R_sourceRef⁻¹ · R_targetRest,  R_sourceRef = arc(dirSrc→dirTgt) · R_source(ref)
// Hips translation is scaled by the hips-height ratio. Post-processing: facing yaw fix,
// feet snapped to the floor, XZ root motion stripped (Walk), seamless loop closure
// (Idle/SitIdle/Walk), and Wave/Celebrate eased from/to the Idle first frame so crossfades are clean.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import * as THREE from 'three';

const FPS = 30;
const FINGER_RELAX = 0.5; // 0 = mocap fingers as-is, 1 = flat bind-pose hand; the Mannequin's half-closed fists read as claws on this mesh
const args = process.argv.slice(2);
const positional = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const opt = (flag, def) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : def; };
const here = path.dirname(fileURLToPath(import.meta.url));
const [inPath, outPath] = positional;
if (!inPath || !outPath) { console.error('usage: node make-clips.mjs <in.glb> <out.glb> [--ual UAL1_Standard.glb] [--mocap dir]'); process.exit(1); }
const ualPath = opt('--ual', path.join(here, 'mocap/UAL1_Standard.glb'));
const mocapDir = opt('--mocap', path.join(here, 'mocap'));

const CLIPS = [
  { name: 'Idle', src: 'ual', clip: 'Idle_Loop', loop: true },
  { name: 'SitIdle', src: 'ual', clip: 'Sitting_Idle_Loop', loop: true },
  { name: 'Walk', src: 'ual', clip: 'Walk_Loop', loop: true, inPlace: true },
  { name: 'Wave', src: 'bvh', file: 'dataset-2_wave-right-hand_normal_001.bvh', segments: [[0, 2.2], [5.0, Infinity]], splice: 0.3, ease: [0.3, 0.4] },
  { name: 'Celebrate', src: 'bvh', file: 'dataset-2_raise-up-both-hands_active_002.bvh', ease: [0.3, 0.3] },
];

const SIDES = [['Left', 'l', 'L'], ['Right', 'r', 'R']];
const UAL_MAP = { Hips: 'pelvis', Spine: 'spine_01', Spine1: 'spine_02', Spine2: 'spine_03', Neck: 'neck_01', Head: 'Head' };
const BVH_MAP = { Hips: 'Hips', Spine: 'Spine', Spine1: 'Chest', Spine2: 'Chest', Neck: 'Neck', Head: 'Head' };
for (const [T, s, S] of SIDES) {
  Object.assign(UAL_MAP, {
    [`${T}Shoulder`]: `clavicle_${s}`, [`${T}Arm`]: `upperarm_${s}`, [`${T}ForeArm`]: `lowerarm_${s}`, [`${T}Hand`]: `hand_${s}`,
    [`${T}UpLeg`]: `thigh_${s}`, [`${T}Leg`]: `calf_${s}`, [`${T}Foot`]: `foot_${s}`, [`${T}ToeBase`]: `ball_${s}`,
  });
  for (const f of ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky']) for (let i = 1; i <= 3; i++) UAL_MAP[`${T}Hand${f}${i}`] = `${f.toLowerCase()}_0${i}_${s}`;
  Object.assign(BVH_MAP, {
    [`${T}Shoulder`]: `Shoulder_${S}`, [`${T}Arm`]: `UpperArm_${S}`, [`${T}ForeArm`]: `LowerArm_${S}`, [`${T}Hand`]: `Hand_${S}`,
    [`${T}UpLeg`]: `UpperLeg_${S}`, [`${T}Leg`]: `LowerLeg_${S}`, [`${T}Foot`]: `Foot_${S}`, [`${T}ToeBase`]: `Toes_${S}`,
  });
}
// Preferred child used to measure a bone's direction when a joint has several children.
const PREF = {
  Hips: 'Spine', Spine2: 'Neck', LeftHand: 'LeftHandMiddle1', RightHand: 'RightHandMiddle1',
  pelvis: 'spine_01', spine_03: 'neck_01', hand_l: 'middle_01_l', hand_r: 'middle_01_r',
  Chest: 'Neck',
};

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const Q = () => new THREE.Quaternion();
const Y_AXIS = V(0, 1, 0);
const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };

// ---------- skeleton helper: hierarchy, FK, bone directions ----------
class Skeleton {
  constructor(names, parentOf, axisOf) {
    this.names = names; this.parentOf = parentOf; this.axisOf = axisOf; // axisOf(name) -> local bone axis
    this.children = new Map(names.map((n) => [n, []]));
    for (const n of names) if (parentOf.get(n) && this.children.has(parentOf.get(n))) this.children.get(parentOf.get(n)).push(n);
  }
  // world pose from local TRS: locals Map<name,{t,q,s}>; returns Map<name,{q,p}>
  fk(locals, rootTransform) {
    const out = new Map();
    for (const n of this.names) {
      const l = locals.get(n);
      const par = out.get(this.parentOf.get(n)) ?? rootTransform;
      const p = l.t.clone().multiply(par.s ?? V(1, 1, 1)).applyQuaternion(par.q).add(par.p);
      const q = par.q.clone().multiply(l.q);
      const s = (par.s ?? V(1, 1, 1)).clone().multiply(l.s ?? V(1, 1, 1));
      out.set(n, { q, p, s });
    }
    return out;
  }
  dir(pose, name) {
    const kids = this.children.get(name) ?? [];
    const pick = PREF[name] && kids.includes(PREF[name]) ? PREF[name] : kids[0];
    if (pick) {
      const d = pose.get(pick).p.clone().sub(pose.get(name).p);
      if (d.lengthSq() > 1e-8) return d.normalize();
    }
    return this.axisOf(name).clone().applyQuaternion(pose.get(name).q).normalize();
  }
}

// ---------- target rig ----------
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(inPath);
const root = doc.getRoot();
const buffer = root.listBuffers()[0];
const skin = root.listSkins().find((s) => s.listJoints().some((j) => j.getName() === 'Hips'));
const hipsNode = skin.listJoints().find((j) => j.getName() === 'Hips');
const tNodes = new Map(); const tOrder = [];
(function walk(n) { tNodes.set(n.getName(), n); tOrder.push(n.getName()); for (const c of n.listChildren()) walk(c); })(hipsNode);
const tParent = new Map(tOrder.map((n) => [n, tNodes.get(n).getParentNode()?.getName()]));
const target = new Skeleton(tOrder, tParent, () => Y_AXIS);
const tRestLocal = new Map(tOrder.map((n) => { const nd = tNodes.get(n); return [n, { t: V(...nd.getTranslation()), q: new THREE.Quaternion(...nd.getRotation()), s: V(...nd.getScale()) }]; }));
const armatureWorld = (() => { // world transform of Hips' parent (normally identity)
  let m = new THREE.Matrix4(); let n = hipsNode.getParentNode();
  while (n) { m = new THREE.Matrix4().compose(V(...n.getTranslation()), new THREE.Quaternion(...n.getRotation()), V(...n.getScale())).multiply(m); n = n.getParentNode(); }
  const p = V(), q = Q(), s = V(); m.decompose(p, q, s); return { p, q, s };
})();
const tRest = target.fk(tRestLocal, armatureWorld);
const tHipsY = tRest.get('Hips').p.y;
const FOOT = [['LeftFoot', tRest.get('LeftFoot').p.y], ['RightFoot', tRest.get('RightFoot').p.y], ['LeftToeBase', tRest.get('LeftToeBase').p.y], ['RightToeBase', tRest.get('RightToeBase').p.y]];
console.log(`target: ${tOrder.length} joints, hips ${tHipsY.toFixed(3)} m, foot ${FOOT[0][1].toFixed(3)} toe ${FOOT[2][1].toFixed(3)}`);

// ---------- source A: glTF (Quaternius UAL) ----------
async function loadGltfSource(file) {
  const d = await io.read(file); const r = d.getRoot();
  const scene = r.listScenes()[0];
  const names = []; const parentOf = new Map(); const nodes = new Map();
  (function walk(n, p) { names.push(n.getName()); nodes.set(n.getName(), n); parentOf.set(n.getName(), p); for (const c of n.listChildren()) walk(c, n.getName()); })
  (scene.listChildren()[0], undefined);
  for (const extra of scene.listChildren().slice(1)) (function walk(n, p) { names.push(n.getName()); nodes.set(n.getName(), n); parentOf.set(n.getName(), p); for (const c of n.listChildren()) walk(c, n.getName()); })(extra, undefined);
  const skel = new Skeleton(names, parentOf, () => Y_AXIS);
  const rest = new Map(names.map((n) => { const nd = nodes.get(n); return [n, { t: V(...nd.getTranslation()), q: new THREE.Quaternion(...nd.getRotation()), s: V(...nd.getScale()) }]; }));
  const identity = { p: V(), q: Q(), s: V(1, 1, 1) };
  const anims = new Map(r.listAnimations().map((a) => [a.getName(), a]));
  function frames(clipName) {
    const a = anims.get(clipName); if (!a) throw new Error(`UAL clip not found: ${clipName}. Available: ${[...anims.keys()].join(', ')}`);
    const chans = a.listChannels().map((c) => {
      const s = c.getSampler(); const inp = s.getInput().getArray(); const out = s.getOutput(); const n = out.getElementSize();
      const vals = out.getArray(); return { node: c.getTargetNode().getName(), path: c.getTargetPath(), times: inp, vals, n };
    });
    const dur = Math.max(...chans.map((c) => c.times[c.times.length - 1]));
    const nF = Math.round(dur * FPS) + 1; const res = [];
    for (let f = 0; f < nF; f++) {
      const t = Math.min(dur, f / FPS);
      const locals = new Map([...rest].map(([k, v]) => [k, { t: v.t.clone(), q: v.q.clone(), s: v.s.clone() }]));
      for (const c of chans) {
        let i = 0; while (i < c.times.length - 2 && c.times[i + 1] < t) i++;
        const t0 = c.times[i], t1 = c.times[Math.min(i + 1, c.times.length - 1)];
        const a01 = t1 > t0 ? Math.min(1, Math.max(0, (t - t0) / (t1 - t0))) : 0;
        const A = Array.from(c.vals.subarray(i * c.n, i * c.n + c.n)), B = Array.from(c.vals.subarray((i + 1) * c.n, (i + 1) * c.n + c.n));
        const l = locals.get(c.node);
        if (c.path === 'rotation') l.q = new THREE.Quaternion(...A).slerp(B.length ? new THREE.Quaternion(...B) : new THREE.Quaternion(...A), a01);
        else if (c.path === 'translation') l.t = V(...A).lerp(B.length ? V(...B) : V(...A), a01);
        else if (c.path === 'scale') l.s = V(...A).lerp(B.length ? V(...B) : V(...A), a01);
      }
      res.push(skel.fk(locals, identity));
    }
    return res;
  }
  return { skel, ref: skel.fk(rest, identity), frames, hips: 'pelvis', left: 'thigh_l', right: 'thigh_r', clipNames: [...anims.keys()] };
}

// ---------- source B: BVH (Bandai Namco Research Motiondataset) ----------
function parseBvh(file) {
  const txt = fs.readFileSync(file, 'utf8');
  const [hier, motion] = txt.split(/MOTION/);
  const tok = hier.replace(/[{}]/g, (m) => ` ${m} `).split(/\s+/).filter(Boolean);
  const joints = []; const stack = []; let i = 0;
  while (i < tok.length) {
    const t = tok[i];
    if (t === 'ROOT' || t === 'JOINT') { joints.push({ name: tok[i + 1], parent: stack.at(-1)?.name, off: V(), ch: [] }); i += 2; }
    else if (t === 'End') { joints.push({ name: `${stack.at(-1).name}_end`, parent: stack.at(-1).name, off: V(), ch: [], end: true }); i += 2; }
    else if (t === '{') { stack.push(joints.at(-1)); i++; }
    else if (t === '}') { stack.pop(); i++; }
    else if (t === 'OFFSET') { joints.at(-1).off.set(+tok[i + 1], +tok[i + 2], +tok[i + 3]); i += 4; }
    else if (t === 'CHANNELS') { const n = +tok[i + 1]; joints.at(-1).ch = tok.slice(i + 2, i + 2 + n); i += 2 + n; }
    else i++;
  }
  const lines = motion.trim().split('\n'); const nF = +lines[0].split(/\s+/)[1]; const ft = +lines[1].split(/\s+/)[2];
  const data = lines.slice(2, 2 + nF).map((l) => l.trim().split(/\s+/).map(Number));
  return { joints, data, ft };
}
function loadBvhSource(dir, refFile) {
  const cache = new Map();
  const load = (f) => { if (!cache.has(f)) cache.set(f, parseBvh(path.join(dir, f))); return cache.get(f); };
  const first = load(refFile);
  const names = first.joints.map((j) => j.name);
  const parentOf = new Map(first.joints.map((j) => [j.name, j.parent]));
  const offX = new Map(first.joints.map((j) => [j.name, Math.sign(j.off.x || 1)]));
  const skel = new Skeleton(names, parentOf, (n) => V(offX.get(n), 0, 0));
  const AX = { X: V(1, 0, 0), Y: V(0, 1, 0), Z: V(0, 0, 1) };
  function frames(file) {
    const { joints, data, ft } = load(file);
    if (Math.abs(1 / ft - FPS) > 0.5) throw new Error(`${file}: expected ${FPS} fps, got ${1 / ft}`);
    return data.map((row) => {
      let k = 0; const locals = new Map();
      for (const j of joints) {
        const t = j.off.clone(); const q = Q();
        for (const c of j.ch) {
          const v = row[k++];
          if (c.endsWith('position')) t['xyz'['XYZ'.indexOf(c[0])]] = v;
          else q.multiply(new THREE.Quaternion().setFromAxisAngle(AX[c[0]], THREE.MathUtils.degToRad(v)));
        }
        locals.set(j.name, { t: t.multiplyScalar(0.01), q, s: V(1, 1, 1) });
      }
      return skel.fk(locals, { p: V(), q: Q(), s: V(1, 1, 1) });
    });
  }
  return { skel, ref: frames(refFile)[0], frames, hips: 'Hips', left: 'UpperLeg_L', right: 'UpperLeg_R' };
}

// ---------- retarget ----------
function yawFix(src) { // rotation about Y that makes the source's left axis point +X (facing +Z like the target)
  const l = src.ref.get(src.left).p.clone().sub(src.ref.get(src.right).p);
  return new THREE.Quaternion().setFromAxisAngle(Y_AXIS, Math.atan2(l.z, l.x));
}
function rotatePose(pose, y) {
  const out = new Map(); for (const [k, v] of pose) out.set(k, { q: y.clone().multiply(v.q), p: v.p.clone().applyQuaternion(y), s: v.s }); return out;
}
function retarget(src, rawFrames, map, staticPose) {
  const y = yawFix(src);
  const ref = rotatePose(src.ref, y);
  const frames = rawFrames.map((f) => rotatePose(f, y));
  const corr = new Map(); // target name -> inv(R_sourceRef) * R_targetRest
  for (const [t, s] of Object.entries(map)) {
    if (!tNodes.has(t) || !ref.has(s)) continue;
    const arc = new THREE.Quaternion().setFromUnitVectors(src.skel.dir(ref, s), target.dir(tRest, t));
    const sRef = arc.multiply(ref.get(s).q);
    corr.set(t, sRef.invert().multiply(tRest.get(t).q));
  }
  const k = tHipsY / ref.get(src.hips).p.y;
  const out = [];
  for (const f of frames) {
    const locals = new Map();
    const world = new Map();
    for (const n of tOrder) {
      const parName = tParent.get(n);
      const par = world.get(parName) ?? armatureWorld;
      let q;
      if (corr.has(n)) {
        const w = f.get(map[n]).q.clone().multiply(corr.get(n));
        q = par.q.clone().invert().multiply(w);
      } else q = (staticPose?.rot.get(n) ?? tRestLocal.get(n).q).clone();
      if (/Hand(Thumb|Index|Middle|Ring|Pinky)\d$/.test(n) && corr.has(n)) q.slerp(tRestLocal.get(n).q, FINGER_RELAX);
      const t = n === 'Hips' ? f.get(src.hips).p.clone().multiplyScalar(k).sub(armatureWorld.p).applyQuaternion(par.q.clone().invert()) : tRestLocal.get(n).t.clone();
      locals.set(n, { t, q, s: V(1, 1, 1) });
      world.set(n, { q: par.q.clone().multiply(q), p: t.clone().applyQuaternion(par.q).add(par.p) });
    }
    out.push({ rot: new Map([...locals].map(([n, l]) => [n, l.q])), hips: locals.get('Hips').t });
  }
  return out;
}
function fkTarget(frame) {
  const locals = new Map(tOrder.map((n) => [n, { t: n === 'Hips' ? frame.hips : tRestLocal.get(n).t, q: frame.rot.get(n), s: V(1, 1, 1) }]));
  return target.fk(locals, armatureWorld);
}
function poseDistance(a, b) {
  let maxDeg = 0; for (const n of tOrder) maxDeg = Math.max(maxDeg, THREE.MathUtils.radToDeg(a.rot.get(n).angleTo(b.rot.get(n))));
  return { deg: maxDeg, cm: a.hips.distanceTo(b.hips) * 100 };
}
function blendFrames(a, b, w) {
  return { rot: new Map(tOrder.map((n) => [n, a.rot.get(n).clone().slerp(b.rot.get(n), w)])), hips: a.hips.clone().lerp(b.hips, w) };
}

// ---------- post-processing ----------
function centerXZ(frames, inPlace) {
  const restX = tRest.get('Hips').p.x, restZ = tRest.get('Hips').p.z;
  const n = frames.length;
  const mx = frames.reduce((s, f) => s + f.hips.x, 0) / n, mz = frames.reduce((s, f) => s + f.hips.z, 0) / n;
  for (const f of frames) {
    if (inPlace) { f.hips.x = restX; f.hips.z = restZ; } else { f.hips.x += restX - mx; f.hips.z += restZ - mz; }
  }
}
function snapFloor(frames) {
  const offs = frames.map((f) => { const w = fkTarget(f); return Math.min(...FOOT.map(([n, y0]) => w.get(n).p.y - y0)); }).sort((a, b) => a - b);
  const off = offs[Math.floor(offs.length * 0.1)];
  for (const f of frames) f.hips.y -= off;
  return off;
}
function closeLoop(frames) {
  const d = poseDistance(frames[0], frames.at(-1));
  if (d.deg < 3 && d.cm < 1.5) frames.pop();
  frames.push(frames[0]);
  return d;
}
function splice(frames, segments, blendSec) {
  const parts = segments.map(([a, b]) => frames.slice(Math.round(a * FPS), Math.min(frames.length, Math.round(b * FPS) + 1)));
  let out = parts[0]; const k = Math.round(blendSec * FPS);
  for (const p of parts.slice(1)) {
    const head = out.slice(0, out.length - k), tailA = out.slice(out.length - k), headB = p.slice(0, k);
    out = [...head, ...tailA.map((f, i) => blendFrames(f, headB[i], smooth((i + 1) / (k + 1)))), ...p.slice(k)];
  }
  return out;
}
function easeToPose(frames, pose, [inSec, outSec]) {
  const n = frames.length;
  return frames.map((f, i) => {
    const t = i / FPS, tEnd = (n - 1 - i) / FPS;
    const w = Math.max(1 - smooth(t / inSec), 1 - smooth(tEnd / outSec));
    return w > 0 ? blendFrames(f, pose, w) : f;
  });
}

// ---------- build ----------
const ual = await loadGltfSource(ualPath);
const bvhRef = CLIPS.find((c) => c.src === 'bvh' && c.name === 'Wave').file;
const bvh = loadBvhSource(mocapDir, bvhRef);
const sitTransition = ual.clipNames.find((n) => /^Sit(ting)?_?(Down|Stand)/i.test(n));
console.log(`UAL clips: ${ual.clipNames.length}${sitTransition ? `, stand→sit candidate: ${sitTransition}` : ', no stand→sit transition clip (Sit skipped)'}`);

for (const a of root.listAnimations()) {
  for (const c of a.listChannels()) c.dispose();
  for (const s of a.listSamplers()) { s.getInput()?.dispose(); s.getOutput()?.dispose(); s.dispose(); }
  a.dispose();
}
const meshopt = root.listExtensionsUsed().find((e) => e.extensionName === 'EXT_meshopt_compression');
if (meshopt) meshopt.dispose();

let idlePose = null;
const report = [];
for (const c of CLIPS) {
  let frames = c.src === 'ual'
    ? retarget(ual, ual.frames(c.clip), UAL_MAP, idlePose)
    : retarget(bvh, bvh.frames(c.file), BVH_MAP, idlePose);
  if (c.segments) frames = splice(frames, c.segments, c.splice);
  centerXZ(frames, !!c.inPlace);
  const floor = snapFloor(frames);
  if (c.ease && idlePose) frames = easeToPose(frames, idlePose, c.ease);
  let seam = null;
  if (c.loop) seam = closeLoop(frames);
  if (c.name === 'Idle') idlePose = frames[0];

  // write tracks
  const n = frames.length;
  const times = doc.createAccessor(`${c.name}.t`).setType('SCALAR').setArray(new Float32Array(frames.map((_, i) => i / FPS))).setBuffer(buffer);
  const anim = doc.createAnimation(c.name);
  for (const j of tOrder) {
    const arr = new Float32Array(n * 4); let prev = null;
    frames.forEach((f, i) => { const q = f.rot.get(j).clone(); if (prev && q.dot(prev) < 0) q.set(-q.x, -q.y, -q.z, -q.w); prev = q; arr.set([q.x, q.y, q.z, q.w], i * 4); });
    const acc = doc.createAccessor(`${c.name}.${j}.q`).setType('VEC4').setArray(arr).setBuffer(buffer);
    const s = doc.createAnimationSampler().setInput(times).setOutput(acc).setInterpolation('LINEAR');
    anim.addSampler(s).addChannel(doc.createAnimationChannel().setTargetNode(tNodes.get(j)).setTargetPath('rotation').setSampler(s));
  }
  const hp = new Float32Array(n * 3); frames.forEach((f, i) => hp.set([f.hips.x, f.hips.y, f.hips.z], i * 3));
  const hAcc = doc.createAccessor(`${c.name}.Hips.t`).setType('VEC3').setArray(hp).setBuffer(buffer);
  const hs = doc.createAnimationSampler().setInput(times).setOutput(hAcc).setInterpolation('LINEAR');
  anim.addSampler(hs).addChannel(doc.createAnimationChannel().setTargetNode(tNodes.get('Hips')).setTargetPath('translation').setSampler(hs));

  // QA numbers
  const worlds = frames.map(fkTarget);
  const footY = worlds.flatMap((w) => FOOT.map(([nm, y0]) => w.get(nm).p.y - y0));
  const hipsXZ = Math.max(...frames.map((f) => Math.hypot(f.hips.x - frames[0].hips.x, f.hips.z - frames[0].hips.z)));
  report.push(`${c.name.padEnd(9)} ${((n - 1) / FPS).toFixed(2)}s ${String(n).padStart(3)}f  feet Δy [${(Math.min(...footY) * 100).toFixed(1)}, ${(Math.max(...footY) * 100).toFixed(1)}] cm  hips y ${Math.min(...frames.map((f) => f.hips.y)).toFixed(2)}–${Math.max(...frames.map((f) => f.hips.y)).toFixed(2)}  xz drift ${(hipsXZ * 100).toFixed(1)} cm  floor fix ${(floor * 100).toFixed(1)} cm${seam ? `  seam ${seam.deg.toFixed(1)}° / ${seam.cm.toFixed(1)} cm` : ''}${idlePose && c.name !== 'Idle' ? `  vs Idle start ${poseDistance(frames[0], idlePose).deg.toFixed(1)}° end ${poseDistance(frames.at(-1), idlePose).deg.toFixed(1)}°` : ''}`);
}
console.log(report.join('\n'));
await io.write(outPath, doc);
console.log(`wrote ${outPath} (${(fs.statSync(outPath).size / 1e6).toFixed(2)} MB)`);
