import { type AnimationClip, type Bone, type Object3D, Quaternion, QuaternionKeyframeTrack, Vector3 } from "three";

/**
 * Calm typing: the mocap/IK `Typing` clip pumps the upper arms at every key tap, which reads as "clicking buttons".
 * The shoulder/upper-arm rotation tracks are damped towards their first key (in place, once per clip) so the
 * motion stays in the forearms, wrists and fingers; head/breathing tracks are untouched.
 */
const DAMPING: Record<string, number> = {
  LeftShoulder: 1,
  RightShoulder: 1,
  LeftArm: 0.85,
  RightArm: 0.85,
  LeftForeArm: 0.45,
  RightForeArm: 0.45,
};

export function dampTypingClip(clip: AnimationClip) {
  if (clip.userData.calmTyping) return;
  clip.userData.calmTyping = true;
  const a = new Quaternion();
  const first = new Quaternion();
  for (const track of clip.tracks) {
    if (!(track instanceof QuaternionKeyframeTrack)) continue;
    const bone = track.name.split(".")[0];
    const k = DAMPING[bone];
    if (!k) continue;
    const v = track.values;
    first.fromArray(v, 0);
    for (let i = 4; i < v.length; i += 4) {
      a.fromArray(v, i).slerp(first, k).toArray(v, i);
    }
  }
}

/**
 * Where the wrists (Hand bones) rest, set-local space (metres), whatever the clip does: the clip rests the hands on
 * the knees, out of reach of the keys; the wrists are brought to the front edge of the base (lap height + 4 cm, z just
 * in front of the trackpad) every frame; the clip keeps the lateral wrist motion and the finger taps.
 */
export const HAND_REST = { y: 0.655, z: 0.225 } as const;
export const HAND_PITCH = -0.42;

type Arm = { upper: Bone; fore: Bone; hand: Bone; tip: Object3D };

export function findArms(root: Object3D): Arm[] {
  const arms: Arm[] = [];
  for (const side of ["Left", "Right"] as const) {
    const upper = root.getObjectByName(`${side}Arm`) as Bone | undefined;
    const fore = root.getObjectByName(`${side}ForeArm`) as Bone | undefined;
    const hand = root.getObjectByName(`${side}Hand`) as Bone | undefined;
    const tip = root.getObjectByName(`${side}HandMiddle3`) ?? hand;
    if (upper && fore && hand && tip) arms.push({ upper, fore, hand, tip });
  }
  return arms;
}

const S = new Vector3();
const E = new Vector3();
const H = new Vector3();
const T = new Vector3();
const axis = new Vector3();
const u = new Vector3();
const w = new Vector3();
const qWorld = new Quaternion();
const qParent = new Quaternion();
const qTmp = new Quaternion();

/** Applies a world-space rotation to a bone (premultiplied in its parent's frame). */
export function rotateWorld(bone: Object3D, q: Quaternion) {
  bone.parent?.getWorldQuaternion(qParent);
  qTmp.copy(qParent).invert().multiply(q).multiply(qParent);
  bone.quaternion.premultiply(qTmp);
  bone.updateMatrixWorld(true);
}

/**
 * Two-bone analytic IK, applied after the animation each frame: moves the hand (as posed by the clip) by `offset`
 * (world space) by bending the elbow and swinging the upper arm, so the typing taps are kept but the fingers sit over
 * the keyboard. Cheap enough for two arms per frame.
 */
export function offsetHand(arm: Arm, offset: Vector3) {
  const { upper, fore, hand } = arm;
  upper.getWorldPosition(S);
  fore.getWorldPosition(E);
  hand.getWorldPosition(H);
  T.copy(H).add(offset);

  const l1 = S.distanceTo(E);
  const l2 = E.distanceTo(H);
  const d = Math.min(S.distanceTo(T), l1 + l2 - 1e-4);
  const dCur = S.distanceTo(H);

  // Bend/extend the elbow around the arm plane normal until shoulder→hand matches shoulder→target.
  u.subVectors(E, S);
  w.subVectors(H, E);
  axis.crossVectors(u, w);
  if (axis.lengthSq() < 1e-10) return;
  axis.normalize();
  const cosCur = (l1 * l1 + l2 * l2 - dCur * dCur) / (2 * l1 * l2);
  const cosNew = (l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2);
  // Interior elbow angle (π = straight): a smaller angle means the forearm turns further away from the upper arm,
  // i.e. a negative rotation about upper × fore.
  const delta = Math.acos(Math.max(-1, Math.min(1, cosNew))) - Math.acos(Math.max(-1, Math.min(1, cosCur)));
  rotateWorld(fore, qWorld.setFromAxisAngle(axis, -delta));

  // Swing the whole arm so the hand lands on the target.
  hand.getWorldPosition(H);
  u.subVectors(H, S).normalize();
  w.subVectors(T, S).normalize();
  rotateWorld(upper, qWorld.setFromUnitVectors(u, w));
}
