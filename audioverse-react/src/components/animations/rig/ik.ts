/// 2-bone planar IK (shoulder->elbow->hand). Returns absolute angles (deg) for upper and forearm.
export function solveTwoBoneIK(
    sx: number, sy: number,   /// Shoulder position (px)
    L1: number, L2: number,   /// Upper + forearm lengths (px)
    tx: number, ty: number    /// Target position (px)
): { upper: number; fore: number } {
    const dx = tx - sx, dy = ty - sy;
    const D = Math.hypot(dx, dy);
    const d = Math.max(1e-5, Math.min(D, L1 + L2 - 1e-5));

    const base = Math.atan2(dy, dx);
    const cosElbow = (L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2);
    const elbow = Math.acos(Math.max(-1, Math.min(1, cosElbow)));

    const cosShoulder = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d);
    const shoulderOffset = Math.acos(Math.max(-1, Math.min(1, cosShoulder)));

    const upper = base - shoulderOffset;       // "elbow down" configuration
    const fore = upper + (Math.PI - elbow);

    return { upper: (upper * 180) / Math.PI, fore: (fore * 180) / Math.PI };
}
