/**
 * Shared types, constants, and helpers for the ModelEditor.
 */
import * as THREE from "three";
import type { Pose3DSequenceResult } from "../../models/modelsAiVideo";

export type { Pose3DSequenceResult };

/* ═══════════════════════════════════════════
   Types
   ═══════════════════════════════════════════ */

export interface SceneNode {
  id: string;
  name: string;
  type: "group" | "mesh" | "bone" | "light" | "camera" | "helper";
  object: THREE.Object3D;
  children: SceneNode[];
  expanded: boolean;
  visible: boolean;
}

export interface AnimClip {
  name: string;
  clip: THREE.AnimationClip;
  duration: number;
  source: string; // filename it came from
}

export type TransformMode = "translate" | "rotate" | "scale";
export type ShadingMode = "wireframe" | "solid" | "material" | "rendered";
export type EditorMode = "object" | "edit" | "pose";
export type PropTab = "object" | "material" | "world" | "modifiers" | "physics";
export type AddMenuCat = "mesh" | "light" | "camera" | "empty" | null;

/* ═══════════════════════════════════════════
   Constants & helpers
   ═══════════════════════════════════════════ */

export const DEG = 180 / Math.PI;
export const fmtTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(2);
  return `${m}:${sec.padStart(5, "0")}`;
};

export const SUPPORTED_EXTENSIONS = [
  ".fbx",
  ".glb",
  ".gltf",
  ".obj",
  ".mtl",
  ".dae",
  ".stl",
  ".ply",
  ".3ds",
  ".3mf",
  ".amf",
  ".pcd",
  ".vtk",
  ".vtp",
  ".wrl",
  ".vrml",
  ".gcode",
  ".svg",
  ".usdz",
];

/* ═══════════════════════════════════════════
   AI helpers — convert pose3D to AnimationClip
   ═══════════════════════════════════════════ */

/** Standard bone names mapping from pose keypoints */
export const POSE_TO_BONE: Record<string, string> = {
  nose: "Head",
  left_eye: "Head",
  right_eye: "Head",
  left_ear: "Head",
  right_ear: "Head",
  left_shoulder: "LeftArm",
  right_shoulder: "RightArm",
  left_elbow: "LeftForeArm",
  right_elbow: "RightForeArm",
  left_wrist: "LeftHand",
  right_wrist: "RightHand",
  left_hip: "LeftUpLeg",
  right_hip: "RightUpLeg",
  left_knee: "LeftLeg",
  right_knee: "RightLeg",
  left_ankle: "LeftFoot",
  right_ankle: "RightFoot",
};

export function pose3dToClip(result: Pose3DSequenceResult): THREE.AnimationClip | null {
  if (!result.frames || result.frames.length === 0) return null;

  const fps = result.fps || 30;
  const tracks: THREE.KeyframeTrack[] = [];

  // Group keypoints by bone across all frames
  const boneData = new Map<
    string,
    { times: number[]; positions: number[] }
  >();

  for (const frame of result.frames) {
    const t = frame.timestamp_sec ?? frame.frame_index / fps;
    // Take first person
    const person = frame.persons?.[0];
    if (!person) continue;

    for (const kp of person.keypoints) {
      const boneName = POSE_TO_BONE[kp.name];
      if (!boneName) continue;

      let data = boneData.get(boneName);
      if (!data) {
        data = { times: [], positions: [] };
        boneData.set(boneName, data);
      }
      data.times.push(t);
      // Scale pose coordinates to reasonable 3D space
      data.positions.push(kp.x * 0.01, kp.y * 0.01, kp.z * 0.01);
    }
  }

  for (const [boneName, data] of boneData) {
    tracks.push(
      new THREE.VectorKeyframeTrack(
        `${boneName}.position`,
        data.times,
        data.positions,
      ),
    );
  }

  if (tracks.length === 0) return null;

  const duration =
    result.frames[result.frames.length - 1].timestamp_sec ??
    result.frame_count / fps;

  return new THREE.AnimationClip("AI_Pose", duration, tracks);
}
