import React from "react";
import type { CharacterConfig } from "../characterTypes";
import { DEFAULT_RIG, DEFAULT_POSE, type RigConfig, type RigPose } from "./rigTypes";
import RiggedBody from "./RiggedBody";
import { tweenPose, ease } from "./poseOps";
import type { ChoreoStep } from "../animationHelper";
import { rigPoseFor } from "./choreoRigBridge";
import type { PersonPose } from "../animationHelper";
import { solveFK } from "./rigMath";
import { solveTwoBoneIK } from "./ik";

/// Public methods exposed via ref.
export interface RigPlayerHandle {
    /// Set pose immediately (no tween).
    setPose(p: RigPose): void;
    /// Tween to pose in given duration.
    tweenTo(p: RigPose, durationMs?: number): Promise<void>;
    /// Play DSL choreo mapped to rig angles.
    playChoreo(steps: ChoreoStep[], defaultMs?: number): Promise<void>;
    /// Aim right hand to (x,y) in SVG space.
    aimRightHandAt(x: number, y: number): void;
    /// Raise card using IK and hold optional score.
    raiseCardIK(score?: number, durationMs?: number): Promise<void>;
}

/// Props for RigPlayer.
export type RigPlayerProps = {
    /// Character visuals.
    character: CharacterConfig;
    /// Rig proportions preset.
    rig?: RigConfig;
    /// Initial pose (optional).
    pose?: RigPose;
    /// Pixel size.
    size?: number;
    /// Show debug joints.
    debug?: boolean;
};

const RigPlayer = React.forwardRef<RigPlayerHandle, RigPlayerProps>(
    ({ character, rig, pose, size, debug }, ref) => {
        const [current, setCurrent] = React.useState<RigPose>({ ...DEFAULT_POSE, ...(pose ?? {}) });
        const r = rig ?? DEFAULT_RIG;
        const S = Math.max(140, Math.floor(size ?? character.size ?? 180));

        const setNow = (p: RigPose) => setCurrent({ ...DEFAULT_POSE, ...p });

        const aimRightHandAt = (x: number, y: number) => {
            const fk = solveFK(r, { ...DEFAULT_POSE, ...current }, S);
            const L1 = Math.hypot(fk.rUpperArm.x2 - fk.rUpperArm.x, fk.rUpperArm.y2 - fk.rUpperArm.y);
            const L2 = Math.hypot(fk.rForearm.x2 - fk.rForearm.x, fk.rForearm.y2 - fk.rForearm.y);
            const { upper, fore } = solveTwoBoneIK(fk.rShoulder.x, fk.rShoulder.y, L1, L2, x, y);
            setNow({ ...current, rUpperArm: upper, rForearm: fore });
        };

        const raiseCardIK = async (_score?: number, durationMs = 450) => {
            const fk = solveFK(r, { ...DEFAULT_POSE, ...current }, S);
            const tx = fk.head.x2 + S * 0.12;
            const ty = fk.head.y2 - S * 0.05;
            const L1 = Math.hypot(fk.rUpperArm.x2 - fk.rUpperArm.x, fk.rUpperArm.y2 - fk.rUpperArm.y);
            const L2 = Math.hypot(fk.rForearm.x2 - fk.rForearm.x, fk.rForearm.y2 - fk.rForearm.y);
            const { upper, fore } = solveTwoBoneIK(fk.rShoulder.x, fk.rShoulder.y, L1, L2, tx, ty);
            const target = { ...current, rUpperArm: upper, rForearm: fore, head: 60 };
            await tweenPose(current, target, durationMs, setNow, ease.inOut);
        };

        React.useImperativeHandle(ref, () => ({
            setPose: setNow,
            tweenTo: (p: RigPose, durationMs = 450) =>
                tweenPose(current, { ...DEFAULT_POSE, ...p }, durationMs, setNow, ease.inOut),
            playChoreo: async (steps: ChoreoStep[], defaultMs = 450) => {
                let cur = current;
                for (const s of steps) {
                    if (s.pose === "raiseCard") {
                        await raiseCardIK(undefined, s.options?.duration ?? defaultMs);
                        cur = { ...current };
                    } else {
                        const target = rigPoseFor(s.pose as PersonPose);
                        await tweenPose(cur, target, s.options?.duration ?? defaultMs, setNow, ease.inOut);
                        cur = target;
                    }
                    const hold = s.holdMs ?? 0;
                    if (hold > 0) await new Promise((r) => setTimeout(r, hold));
                }
            },
            aimRightHandAt,
            raiseCardIK,
        }));

        return <RiggedBody character={character} rig={r} pose={current} size={S} debug={debug} />;
    }
);

export default RigPlayer;
