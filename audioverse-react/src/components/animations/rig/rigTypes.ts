/// Bone name keys used in the rig.
export type BoneKey =
    | "root"
    | "pelvis"
    | "spineLower"
    | "spineUpper"
    | "neck"
    | "head"
    | "lShoulder"
    | "lUpperArm"
    | "lForearm"
    | "lHand"
    | "rShoulder"
    | "rUpperArm"
    | "rForearm"
    | "rHand"
    | "lThigh"
    | "lShin"
    | "lFoot"
    | "rThigh"
    | "rShin"
    | "rFoot";

/// Bone specification relative to the character size.
export type BoneSpec = {
    /// Parent bone key (undefined for the root).
    parent?: BoneKey;
    /// Length as a fraction of character size (px = length * size).
    length?: number;
    /// Static offset from parent joint, in fractions of size [dx, dy].
    offset?: [number, number];
};

/// Complete rig configuration describing all bones.
export type RigConfig = Record<BoneKey, BoneSpec>;

/// Per-bone rotation in degrees (clockwise, 0° = pointing right).
export type RigPose = Partial<Record<BoneKey, number>>;

/// World-space FK result for a single bone.
export type SolvedBone = {
    /// Start x (px).
    x: number;
    /// Start y (px).
    y: number;
    /// End x (px).
    x2: number;
    /// End y (px).
    y2: number;
    /// World rotation (deg).
    angle: number;
};

/// Ordered list for safe FK traversal.
export const BONE_ORDER: BoneKey[] = [
    "root","pelvis","spineLower","spineUpper","neck","head",
    "lShoulder","lUpperArm","lForearm","lHand",
    "rShoulder","rUpperArm","rForearm","rHand",
    "lThigh","lShin","lFoot","rThigh","rShin","rFoot",
];

/// Default humanoid rig (proportions tuned for ~180px height).
export const DEFAULT_RIG: RigConfig = {
    root: { parent: undefined, length: 0, offset: [0.50, 0.58] },
    pelvis: { parent: "root", length: 0.02, offset: [0, 0] },

    spineLower: { parent: "pelvis", length: 0.10, offset: [0, -0.02] },
    spineUpper: { parent: "spineLower", length: 0.10, offset: [0, -0.02] },
    neck: { parent: "spineUpper", length: 0.04, offset: [0, -0.01] },
    head: { parent: "neck", length: 0.09, offset: [0, -0.01] },

    lShoulder: { parent: "spineUpper", length: 0, offset: [-0.11, 0] },
    lUpperArm: { parent: "lShoulder", length: 0.12 },
    lForearm: { parent: "lUpperArm", length: 0.12 },
    lHand: { parent: "lForearm", length: 0.05 },

    rShoulder: { parent: "spineUpper", length: 0, offset: [0.11, 0] },
    rUpperArm: { parent: "rShoulder", length: 0.12 },
    rForearm: { parent: "rUpperArm", length: 0.12 },
    rHand: { parent: "rForearm", length: 0.05 },

    lThigh: { parent: "pelvis", length: 0.15, offset: [-0.05, 0.02] },
    lShin: { parent: "lThigh", length: 0.15 },
    lFoot: { parent: "lShin", length: 0.06 },

    rThigh: { parent: "pelvis", length: 0.15, offset: [0.05, 0.02] },
    rShin: { parent: "rThigh", length: 0.15 },
    rFoot: { parent: "rShin", length: 0.06 },
};

/// Neutral standing pose (deg).
export const DEFAULT_POSE: RigPose = {
    pelvis: 90, spineLower: 90, spineUpper: 90, neck: 80, head: 70,
    lUpperArm: 140, lForearm: 160, lHand: 150,
    rUpperArm: 40, rForearm: 20, rHand: 30,
    lThigh: 100, lShin: 95, lFoot: 0, rThigh: 80, rShin: 85, rFoot: 0,
};
