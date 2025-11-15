import type { BoneKey, RigPose } from "./rigTypes";
import { lerpAngle } from "./rigMath";

/// Easing functions (t in [0..1]).
export const ease = {
    /// Smoothstep-like ease in-out.
    inOut: (t: number) => t * t * (3 - 2 * t),
    /// Fast-in, slow-out.
    outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
    /// Slow-in, fast-out.
    inCubic: (t: number) => t * t * t,
};

/// Blend two poses by factor t.
export function blendPose(a: RigPose, b: RigPose, t: number): RigPose {
    const out: RigPose = {};
    const keys = new Set<BoneKey>([
        ...(Object.keys(a) as BoneKey[]),
        ...(Object.keys(b) as BoneKey[]),
    ]);
    keys.forEach((k) => {
        const av = a[k] ?? b[k];
        const bv = b[k] ?? a[k];
        if (typeof av === "number" && typeof bv === "number") out[k] = lerpAngle(av, bv, t);
    });
    return out;
}

/// Tween helper driven by requestAnimationFrame.
export function tweenPose(
    from: RigPose,
    to: RigPose,
    durationMs: number,
    set: (p: RigPose) => void,
    easing: (t: number) => number = ease.inOut
): Promise<void> {
    const start = performance.now();
    return new Promise<void>((resolve) => {
        const frame = () => {
            const t = Math.min(1, (performance.now() - start) / Math.max(1, durationMs));
            set(blendPose(from, to, easing(t)));
            if (t < 1) requestAnimationFrame(frame);
            else resolve();
        };
        requestAnimationFrame(frame);
    });
}
