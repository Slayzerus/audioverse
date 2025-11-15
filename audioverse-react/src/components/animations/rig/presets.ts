import type { RigConfig, RigPose } from "./rigTypes";
import { DEFAULT_RIG, DEFAULT_POSE } from "./rigTypes";

/// Slim proportions preset.
export const RIG_SLIM: RigConfig = {
    ...DEFAULT_RIG,
    lUpperArm: { ...DEFAULT_RIG.lUpperArm, length: 0.11 },
    lForearm: { ...DEFAULT_RIG.lForearm, length: 0.11 },
    rUpperArm: { ...DEFAULT_RIG.rUpperArm, length: 0.11 },
    rForearm: { ...DEFAULT_RIG.rForearm, length: 0.11 },
    lThigh: { ...DEFAULT_RIG.lThigh, length: 0.14 },
    lShin: { ...DEFAULT_RIG.lShin, length: 0.14 },
    rThigh: { ...DEFAULT_RIG.rThigh, length: 0.14 },
    rShin: { ...DEFAULT_RIG.rShin, length: 0.14 },
};

/// Broad shoulders preset.
export const RIG_HERO: RigConfig = {
    ...DEFAULT_RIG,
    lShoulder: { ...DEFAULT_RIG.lShoulder, offset: [-0.13, 0] },
    rShoulder: { ...DEFAULT_RIG.rShoulder, offset: [0.13, 0] },
    lUpperArm: { ...DEFAULT_RIG.lUpperArm, length: 0.13 },
    rUpperArm: { ...DEFAULT_RIG.rUpperArm, length: 0.13 },
};

/// Robot-like short limbs preset.
export const RIG_ROBOT: RigConfig = {
    ...DEFAULT_RIG,
    lUpperArm: { ...DEFAULT_RIG.lUpperArm, length: 0.10 },
    lForearm: { ...DEFAULT_RIG.lForearm, length: 0.10 },
    rUpperArm: { ...DEFAULT_RIG.rUpperArm, length: 0.10 },
    rForearm: { ...DEFAULT_RIG.rForearm, length: 0.10 },
    lThigh: { ...DEFAULT_RIG.lThigh, length: 0.13 },
    lShin: { ...DEFAULT_RIG.lShin, length: 0.13 },
    rThigh: { ...DEFAULT_RIG.rThigh, length: 0.13 },
    rShin: { ...DEFAULT_RIG.rShin, length: 0.13 },
};

/// Convenience happy pose.
export const POSE_HAPPY: RigPose = {
    ...DEFAULT_POSE,
    spineUpper: 80, neck: 70, head: 60,
    lUpperArm: 60, lForearm: 20, rUpperArm: 120, rForearm: 160,
};

/// Convenience angry pose.
export const POSE_ANGRY: RigPose = {
    ...DEFAULT_POSE,
    head: 90, lUpperArm: 150, rUpperArm: 30, lForearm: 160, rForearm: 20,
};

/// Convenience dance pose.
export const POSE_DANCE_A: RigPose = {
    ...DEFAULT_POSE,
    pelvis: 100, lThigh: 120, rThigh: 70, lUpperArm: 30, rUpperArm: 150,
};
