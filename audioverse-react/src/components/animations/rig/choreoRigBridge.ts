import type { RigPose } from "./rigTypes";
import { DEFAULT_POSE } from "./rigTypes";
import { POSE_HAPPY, POSE_ANGRY, POSE_DANCE_A } from "./presets";
import type { PersonPose, ChoreoStep } from "../animationHelper";
import { tweenPose, ease } from "./poseOps";

/// Map a high-level PersonPose from your DSL to a rig pose.
export function rigPoseFor(pose: PersonPose): RigPose {
    switch (pose) {
        case "happy":
        case "celebrate":
            return POSE_HAPPY;
        case "angry":
        case "shouting":
            return POSE_ANGRY;
        case "danceA":
        case "danceB":
        case "danceC":
            return POSE_DANCE_A;
        case "raiseCard":
            return { ...DEFAULT_POSE, rUpperArm: 350, rForearm: 320, lUpperArm: 140, lForearm: 150, head: 60 };
        case "waveHand":
            return { ...DEFAULT_POSE, rUpperArm: 330, rForearm: 300 };
        case "facepalm":
            return { ...DEFAULT_POSE, rUpperArm: 20, rForearm: 340, head: 80 };
        case "shrug":
            return { ...DEFAULT_POSE, lUpperArm: 110, rUpperArm: 70, head: 85 };
        case "nodYes":
            return { ...DEFAULT_POSE, head: 90 };
        case "shakeNo":
            return { ...DEFAULT_POSE, head: 60 };
        case "rock":
            return { ...DEFAULT_POSE, pelvis: 100, spineLower: 100, spineUpper: 80 };
        case "jump":
            return { ...DEFAULT_POSE, lThigh: 70, rThigh: 110, lShin: 70, rShin: 110 };
        case "leanBack":
            return { ...DEFAULT_POSE, spineLower: 80, spineUpper: 70, head: 50 };
        case "pointRight":
            return { ...DEFAULT_POSE, rUpperArm: 10, rForearm: 350 };
        case "idle":
        default:
            return DEFAULT_POSE;
    }
}

/// Play a DSL program by tweening the provided pose setter.
export async function playRigFromChoreo(
    steps: ChoreoStep[],
    setPose: (p: RigPose) => void,
    opts?: { duration?: number; easing?: (t: number) => number }
): Promise<void> {
    const duration = opts?.duration ?? 450;
    const easeFn = opts?.easing ?? ease.inOut;
    let current = DEFAULT_POSE;
    for (const s of steps) {
        const target = rigPoseFor(s.pose as PersonPose);
        await tweenPose(current, target, s.options?.duration ?? duration, setPose, easeFn);
        current = target;
        const hold = s.holdMs ?? 0;
        if (hold > 0) await new Promise((r) => setTimeout(r, hold));
    }
}
