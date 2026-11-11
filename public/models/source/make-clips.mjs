// Procedurally keyframes SitIdle / Walk / Wave / Celebrate for the Mixamo-style rig
// of the Avaturn export, keeps Avaturn's Idle, and writes a GLB with 5 named clips.
import { NodeIO, Accessor } from '@gltf-transform/core';
import * as THREE from 'three';

const [,, inPath, outPath] = process.argv;
const io = new NodeIO();
const doc = await io.read(inPath);
const root = doc.getRoot();
const buffer = root.listBuffers()[0];

const nodes = Object.fromEntries(root.listNodes().map((n) => [n.getName(), n]));
const base = {}; // name -> { q: Quaternion, t: Vector3, parent }
for (const n of root.listNodes()) {
  base[n.getName()] = {
    q: new THREE.Quaternion(...n.getRotation()),
    t: new THREE.Vector3(...n.getTranslation()),
    parent: n.getParentNode()?.getName() ?? null,
  };
}
// Use the first frame of Avaturn's Idle clip as the base pose (node rest is a T-pose).
const idleAnim = root.listAnimations().find((a) => a.getName().startsWith('Idle'));
for (const ch of idleAnim.listChannels()) {
  const name = ch.getTargetNode().getName();
  const out = ch.getSampler().getOutput();
  const el = [];
  out.getElement(0, el);
  if (ch.getTargetPath() === 'rotation') base[name].q = new THREE.Quaternion(...el);
  if (ch.getTargetPath() === 'translation') base[name].t = new THREE.Vector3(...el);
}
const worldBase = {};
function worldQ(name) {
  if (worldBase[name]) return worldBase[name];
  const b = base[name];
  const q = b.parent ? worldQ(b.parent).clone().multiply(b.q) : b.q.clone();
  worldBase[name] = q;
  return q;
}

const DEG = Math.PI / 180;
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const rot = (axis, deg) => new THREE.Quaternion().setFromAxisAngle(axis, deg * DEG);
const mul = (...qs) => qs.reduce((a, b) => a.multiply(b), new THREE.Quaternion());

const ORDER = ['Hips','Spine','Spine1','Spine2','Neck','Head',
  'LeftShoulder','LeftArm','LeftForeArm','LeftHand','RightShoulder','RightArm','RightForeArm','RightHand',
  'LeftUpLeg','LeftLeg','LeftFoot','LeftToeBase','RightUpLeg','RightLeg','RightFoot','RightToeBase'];

// pose(t) returns { deltas: {bone: Quaternion (world-axis delta relative to parent's delta)}, hips: Vector3 offset }
function solve(deltas) {
  const D = {}; const out = {};
  for (const name of ORDER) {
    const b = base[name];
    const parentD = b.parent && D[b.parent] ? D[b.parent] : new THREE.Quaternion();
    const spec = deltas[name] ?? new THREE.Quaternion();
    D[name] = spec.clone().multiply(parentD);
    const wNew = D[name].clone().multiply(worldQ(name));
    const parentWNew = b.parent && D[b.parent] ? D[b.parent].clone().multiply(worldQ(b.parent)) : (b.parent ? worldQ(b.parent) : new THREE.Quaternion());
    out[name] = parentWNew.clone().invert().multiply(wNew);
  }
  return out;
}

function makeClip(name, duration, fps, poseFn, loop = true) {
  const n = Math.round(duration * fps) + 1;
  const times = new Float32Array(n);
  const rotTracks = Object.fromEntries(ORDER.map((b) => [b, new Float32Array(n * 4)]));
  const hipsT = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = i / fps;
    const tt = loop ? (i === n - 1 ? 0 : t) : t; // last frame == first for seamless loop
    times[i] = t;
    const { deltas, hips } = poseFn(tt, duration);
    const locals = solve(deltas);
    for (const b of ORDER) {
      const q = locals[b];
      rotTracks[b].set([q.x, q.y, q.z, q.w], i * 4);
    }
    const h = base.Hips.t.clone().add(hips ?? new THREE.Vector3());
    hipsT.set([h.x, h.y, h.z], i * 3);
  }
  const anim = doc.createAnimation(name);
  const input = doc.createAccessor().setType(Accessor.Type.SCALAR).setArray(times).setBuffer(buffer);
  for (const b of ORDER) {
    const out = doc.createAccessor().setType(Accessor.Type.VEC4).setArray(rotTracks[b]).setBuffer(buffer);
    const s = doc.createAnimationSampler().setInput(input).setOutput(out).setInterpolation('LINEAR');
    const c = doc.createAnimationChannel().setTargetNode(nodes[b]).setTargetPath('rotation').setSampler(s);
    anim.addSampler(s).addChannel(c);
  }
  const outT = doc.createAccessor().setType(Accessor.Type.VEC3).setArray(hipsT).setBuffer(buffer);
  const sT = doc.createAnimationSampler().setInput(input).setOutput(outT).setInterpolation('LINEAR');
  anim.addSampler(sT).addChannel(doc.createAnimationChannel().setTargetNode(nodes.Hips).setTargetPath('translation').setSampler(sT));
  return anim;
}

const sin = (t, period, phase = 0) => Math.sin((t / period) * Math.PI * 2 + phase);

// ---- SitIdle: seated on an invisible chair, hands on thighs, soft breathing
makeClip('SitIdle', 6, 15, (t) => {
  const breath = sin(t, 3);
  const hipsDrop = -0.43;
  return {
    hips: new THREE.Vector3(0, hipsDrop, -0.02),
    deltas: {
      Hips: rot(X, 6),
      Spine: rot(X, -4 + breath * 1.2),
      Spine1: rot(X, -3 + breath * 0.8),
      Neck: rot(X, 2),
      Head: mul(rot(X, -2 + breath * 0.5), rot(Y, sin(t, 6) * 4)),
      LeftUpLeg: mul(rot(X, -86), rot(Y, -8)),
      LeftLeg: rot(X, 88),
      LeftFoot: rot(X, -4),
      RightUpLeg: mul(rot(X, -86), rot(Y, 8)),
      RightLeg: rot(X, 88),
      RightFoot: rot(X, -4),
      LeftArm: mul(rot(X, -22), rot(Z, -12)),
      LeftForeArm: rot(X, -30 + breath * 1.5),
      LeftHand: mul(rot(Y, 35), rot(X, 20)),
      RightArm: mul(rot(X, -22), rot(Z, 12)),
      RightForeArm: rot(X, -30 + breath * 1.5),
      RightHand: mul(rot(Y, -35), rot(X, 20)),
    },
  };
});

// ---- Walk: 1 s cycle, in place
makeClip('Walk', 1.0, 30, (t, d) => {
  const p = (t / d) * Math.PI * 2; // 0..2pi, left leg forward at p=0
  const swing = Math.sin(p);
  const kneeL = Math.max(0, Math.sin(p + Math.PI / 2 + 0.6)) ** 1.5 * 55; // bends while swinging through
  const kneeR = Math.max(0, Math.sin(p - Math.PI / 2 + 0.6)) ** 1.5 * 55;
  const bob = Math.abs(Math.cos(p)) * 0.035 - 0.02;
  return {
    hips: new THREE.Vector3(Math.sin(p) * 0.015, bob, 0),
    deltas: {
      Hips: mul(rot(Y, -swing * 6), rot(Z, Math.sin(p) * 3), rot(X, 3)),
      Spine: rot(Y, swing * 5),
      Spine1: rot(Y, swing * 4),
      Spine2: rot(X, -2),
      Head: rot(Y, -swing * 4),
      LeftUpLeg: rot(X, -swing * 24),
      LeftLeg: rot(X, kneeL),
      LeftFoot: rot(X, -swing * 10 - kneeL * 0.3),
      RightUpLeg: rot(X, swing * 24),
      RightLeg: rot(X, kneeR),
      RightFoot: rot(X, swing * 10 - kneeR * 0.3),
      LeftArm: mul(rot(X, swing * 26 + 4), rot(Z, 6)),
      LeftForeArm: rot(X, -12 + Math.max(0, swing) * 18),
      RightArm: mul(rot(X, -swing * 26 + 4), rot(Z, -6)),
      RightForeArm: rot(X, -12 + Math.max(0, -swing) * 18),
    },
  };
});

// ---- Wave: right hand up, friendly wave
makeClip('Wave', 2.4, 30, (t) => {
  const w = sin(t, 0.6);
  const breath = sin(t, 2.4);
  return {
    hips: new THREE.Vector3(0, 0, 0),
    deltas: {
      Spine: rot(Z, -3),
      Spine1: rot(Z, -2),
      Head: mul(rot(Z, 6 + breath), rot(Y, -8)),
      RightShoulder: rot(Z, -15),
      RightArm: mul(rot(Z, -118), rot(Y, 10)),
      RightForeArm: mul(rot(Z, -55 + w * 22), rot(X, -10)),
      RightHand: rot(Z, w * 12),
      LeftArm: rot(X, 3 + breath * 1.5),
      LeftForeArm: rot(X, -6),
    },
  };
});

// ---- Celebrate: arms up, little hop, fists pumping
makeClip('Celebrate', 1.6, 30, (t, d) => {
  const p = (t / d) * Math.PI * 2;
  const hop = Math.max(0, Math.sin(p * 2)) * 0.07;
  const pump = Math.sin(p * 2);
  const legLift = Math.max(0, Math.sin(p * 2)) * 10;
  return {
    hips: new THREE.Vector3(0, hop, 0),
    deltas: {
      Hips: rot(X, -4),
      Spine: rot(X, -6),
      Spine1: rot(X, -5 + pump * 2),
      Head: rot(X, -10),
      LeftShoulder: rot(Z, 15),
      LeftArm: mul(rot(Z, 92 + pump * 6), rot(Y, -20)),
      LeftForeArm: mul(rot(Z, 55 + pump * 20), rot(X, -35)),
      RightShoulder: rot(Z, -15),
      RightArm: mul(rot(Z, -92 - pump * 6), rot(Y, 20)),
      RightForeArm: mul(rot(Z, -55 - pump * 20), rot(X, -35)),
      LeftUpLeg: rot(X, -legLift),
      LeftLeg: rot(X, legLift * 1.6),
      RightUpLeg: rot(X, -legLift),
      RightLeg: rot(X, legLift * 1.6),
      LeftFoot: rot(X, -legLift * 0.5),
      RightFoot: rot(X, -legLift * 0.5),
    },
  };
});

// Rename Avaturn idle
for (const a of root.listAnimations()) if (a.getName().startsWith('Idle')) a.setName('Idle');
// Order: Idle first
await io.write(outPath, doc);
console.log('clips:', root.listAnimations().map((a) => a.getName()).join(', '));
