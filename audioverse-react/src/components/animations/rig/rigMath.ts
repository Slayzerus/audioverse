import type { BoneKey, RigConfig, RigPose, SolvedBone } from "./rigTypes";
import { BONE_ORDER } from "./rigTypes";

/// Convert degrees to radians.
export const deg2rad = (deg: number) => (deg * Math.PI) / 180;

/// Linear interpolation of angles with wrap-around.
export function lerpAngle(a: number, b: number, t: number): number {
    const da = ((b - a + 540) % 360) - 180;
    return a + da * Math.max(0, Math.min(1, t));
}

/// Forward kinematics (absolute angles in degrees).
export function solveFK(
    rig: RigConfig,
    pose: RigPose,
    sizePx: number
): Record<BoneKey, SolvedBone> {
    const out = {} as Record<BoneKey, SolvedBone>;
    const N = (v: number | undefined, fb: number) => (typeof v === "number" ? v : fb);

    for (const key of BONE_ORDER) {
        const spec = rig[key];
        const parent = spec.parent ? out[spec.parent] : undefined;

        let x: number, y: number;
        if (!parent) {
            x = N(spec.offset?.[0], 0.5) * sizePx;
            y = N(spec.offset?.[1], 0.58) * sizePx;
        } else {
            x = parent.x2 + N(spec.offset?.[0], 0) * sizePx;
            y = parent.y2 + N(spec.offset?.[1], 0) * sizePx;
        }

        const ang = N(pose[key], parent ? parent.angle : 0);
        const L = N(spec.length, 0) * sizePx;
        const dx = Math.cos(deg2rad(ang)) * L;
        const dy = Math.sin(deg2rad(ang)) * L;

        out[key] = { x, y, x2: x + dx, y2: y + dy, angle: ang };
    }
    return out;
}
