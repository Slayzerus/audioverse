/**
 * glossyBarCaps.ts — Cap shape definitions and registries for glossy karaoke bars.
 *
 * Each cap shape is a pair of left/right generator functions that produce
 * SVG paths (outer border + inner fill) for a given bar height.
 */

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────

/** Cap shape geometry result */
export interface CapGeometry {
    /** Width of the cap in pixels */
    w: number;
    /** SVG path for the outer border shape */
    out: string;
    /** SVG path for the inner (fill) shape (inset by border width) */
    inn: string;
}

/** Cap shape generator function */
export type CapShapeGenerator = (H: number) => CapGeometry;

/** A named cap style with left and right generators */
export interface CapStyle {
    name: string;
    L: CapShapeGenerator;
    R: CapShapeGenerator;
}

/** Border width used in cap shape calculations */
const BW = 3;
const B = BW;

// ────────────────────────────────────────────────
// Cap shapes — LEFT SIDE
// ────────────────────────────────────────────────

export function pill_L(H: number): CapGeometry {
    const r = H / 2 | 0;
    return {
        w: r,
        out: `M${r} 0H${r}V${H}H${r}A${r} ${r} 0 0 1 0 ${r}A${r} ${r} 0 0 1 ${r} 0Z`,
        inn: `M${r} ${B}V${H - B}A${r - B} ${r - B} 0 0 1 ${B} ${r}A${r - B} ${r - B} 0 0 1 ${r} ${B}Z`
    };
}

export function sharp_L(H: number): CapGeometry {
    return { w: B + 1, out: `M0 0H${B + 1}V${H}H0Z`, inn: `M${B} ${B}H${B + 1}V${H - B}H${B}Z` };
}

export function soft_L(H: number): CapGeometry {
    const c = Math.min(14, H * 0.22) | 0, W = c + 2, ci = Math.max(c - B, 1);
    return {
        w: W,
        out: `M${c} 0H${W}V${H}H${c}Q0 ${H} 0 ${H - c}V${c}Q0 0 ${c} 0Z`,
        inn: `M${B + ci} ${B}H${W}V${H - B}H${B + ci}Q${B} ${H - B} ${B} ${H - B - ci}V${B + ci}Q${B} ${B} ${B + ci} ${B}Z`
    };
}

export function chamfer_L(H: number): CapGeometry {
    const c = H * 0.3 | 0, W = c + 2, ci = Math.max(c - B, 1);
    return {
        w: W,
        out: `M${c} 0H${W}V${H}H${c}L0 ${H - c}V${c}Z`,
        inn: `M${B + ci} ${B}H${W}V${H - B}H${B + ci}L${B} ${H - B - ci}V${B + ci}Z`
    };
}

export function arrow_L(H: number): CapGeometry {
    const a = H * 0.42 | 0, W = a + 2, ai = Math.max(a - (B * 1.4 | 0), 2);
    return {
        w: W,
        out: `M${a} 0H${W}V${H}H${a}L0 ${H / 2}Z`,
        inn: `M${B + ai} ${B}H${W}V${H - B}H${B + ai}L${B} ${H / 2}Z`
    };
}

export function shield_L(H: number): CapGeometry {
    const c = H * 0.3 | 0, W = c + 4, ci = Math.max(c - B, 1);
    return {
        w: W,
        out: `M${c} 0H${W}V${H}H${c * 0.6 | 0}L0 ${H - c}V${c}Q0 0 ${c} 0Z`,
        inn: `M${B + ci} ${B}H${W}V${H - B}H${B + (ci * 0.6 | 0)}L${B} ${H - B - ci}V${B + ci}Q${B} ${B} ${B + ci} ${B}Z`
    };
}

export function bracket_L(H: number): CapGeometry {
    const d = H * 0.16 | 0, W = d * 2 + 4;
    return {
        w: W,
        out: `M${d * 1.5 | 0} 0H${W}V${H}H${d * 1.5 | 0}C${d * 2.5 | 0} ${H * 0.35 | 0} ${d * 2.5 | 0} ${H * 0.65 | 0} ${d * 1.5 | 0} ${H}Z`,
        inn: `M${B + (d * 1.2 | 0)} ${B}H${W}V${H - B}H${B + (d * 1.2 | 0)}C${B + (d * 2.2 | 0)} ${H * 0.37 | 0} ${B + (d * 2.2 | 0)} ${H * 0.63 | 0} ${B + (d * 1.2 | 0)} ${H - B}Z`
    };
}

export function tab_L(H: number): CapGeometry {
    const c = H * 0.32 | 0, W = c + 3, ci = Math.max(c - B, 1);
    return {
        w: W,
        out: `M0 0H${W}V${H}H${c}Q0 ${H} 0 ${H - c}Z`,
        inn: `M${B} ${B}H${W}V${H - B}H${B + ci}Q${B} ${H - B} ${B} ${H - B - ci}Z`
    };
}

export function wave_L(H: number): CapGeometry {
    const d = H * 0.14 | 0, W = d * 3 + 2;
    return {
        w: W,
        out: `M${d * 2} 0H${W}V${H}H${d * 2}C${d * 0.5 | 0} ${H * 0.8 | 0} ${d * 3} ${H * 0.55 | 0} ${d * 0.5 | 0} ${H * 0.35 | 0}S${d} 0 ${d * 2} 0Z`,
        inn: `M${B + (d * 1.8 | 0)} ${B}H${W}V${H - B}H${B + (d * 1.8 | 0)}C${B + (d * 0.4 | 0)} ${H * 0.78 | 0} ${B + (d * 2.8 | 0)} ${H * 0.55 | 0} ${B + (d * 0.4 | 0)} ${H * 0.37 | 0}S${B + (d * 0.9 | 0)} ${B} ${B + (d * 1.8 | 0)} ${B}Z`
    };
}

export function ornate_L(H: number): CapGeometry {
    const s = H * 0.09 | 0, W = H * 0.35 | 0;
    return {
        w: W,
        out: `M${s * 3} 0H${W}V${H}H${s * 3}L${s} ${H - s * 2}L${s * 2} ${H * 0.65 | 0}L0 ${H / 2 | 0}L${s * 2} ${H * 0.35 | 0}L${s} ${s * 2}Z`,
        inn: `M${B + (s * 2.5 | 0)} ${B}H${W}V${H - B}H${B + (s * 2.5 | 0)}L${B + (s * 0.7 | 0)} ${H - B - (s * 1.6 | 0)}L${B + (s * 1.7 | 0)} ${H * 0.64 | 0}L${B} ${H / 2 | 0}L${B + (s * 1.7 | 0)} ${H * 0.36 | 0}L${B + (s * 0.7 | 0)} ${B + (s * 1.6 | 0)}Z`
    };
}

export function skewTL_L(H: number): CapGeometry {
    const s = H * 0.42 | 0, W = s + 2;
    return {
        w: W,
        out: `M${s} 0H${W}V${H}H0Z`,
        inn: `M${B + s - (B * 1.3 | 0)} ${B}H${W}V${H - B}H${B + 1}Z`
    };
}

export function skewTR_L(H: number): CapGeometry {
    const s = H * 0.42 | 0, W = s + 2;
    return {
        w: W,
        out: `M0 0H${W}V${H}H${s}Z`,
        inn: `M${B} ${B}H${W}V${H - B}H${B + s - (B * 1.3 | 0) + 1}Z`
    };
}

// ────────────────────────────────────────────────
// Cap shapes — RIGHT SIDE
// ────────────────────────────────────────────────

export function pill_R(H: number): CapGeometry {
    const r = H / 2 | 0;
    return {
        w: r,
        out: `M0 0A${r} ${r} 0 0 1 ${r} ${r}A${r} ${r} 0 0 1 0 ${H}Z`,
        inn: `M0 ${B}A${r - B} ${r - B} 0 0 1 ${r - B} ${r}A${r - B} ${r - B} 0 0 1 0 ${H - B}Z`
    };
}

export function sharp_R(H: number): CapGeometry {
    return { w: B + 1, out: `M0 0H${B + 1}V${H}H0Z`, inn: `M0 ${B}H1V${H - B}H0Z` };
}

export function soft_R(H: number): CapGeometry {
    const c = Math.min(14, H * 0.22) | 0, W = c + 2, ci = Math.max(c - B, 1);
    return {
        w: W,
        out: `M0 0H${W - c}Q${W} 0 ${W} ${c}V${H - c}Q${W} ${H} ${W - c} ${H}H0Z`,
        inn: `M0 ${B}H${W - B - ci}Q${W - B} ${B} ${W - B} ${B + ci}V${H - B - ci}Q${W - B} ${H - B} ${W - B - ci} ${H - B}H0Z`
    };
}

export function chamfer_R(H: number): CapGeometry {
    const c = H * 0.3 | 0, W = c + 2, ci = Math.max(c - B, 1);
    return {
        w: W,
        out: `M0 0H${W - c}L${W} ${c}V${H - c}L${W - c} ${H}H0Z`,
        inn: `M0 ${B}H${W - B - ci}L${W - B} ${B + ci}V${H - B - ci}L${W - B - ci} ${H - B}H0Z`
    };
}

export function arrow_R(H: number): CapGeometry {
    const a = H * 0.42 | 0, W = a + 2, ai = Math.max(a - (B * 1.4 | 0), 2);
    return {
        w: W,
        out: `M0 0H${W - a}L${W} ${H / 2}L${W - a} ${H}H0Z`,
        inn: `M0 ${B}H${W - B - ai}L${W - B} ${H / 2}L${W - B - ai} ${H - B}H0Z`
    };
}

export function shield_R(H: number): CapGeometry {
    const c = H * 0.3 | 0, W = c + 4, ci = Math.max(c - B, 1);
    return {
        w: W,
        out: `M0 0H${W - c}Q${W} 0 ${W} ${c}V${H - c}L${W - (c * 0.6 | 0)} ${H}H0Z`,
        inn: `M0 ${B}H${W - B - ci}Q${W - B} ${B} ${W - B} ${B + ci}V${H - B - ci}L${W - B - (ci * 0.6 | 0)} ${H - B}H0Z`
    };
}

export function bracket_R(H: number): CapGeometry {
    const d = H * 0.16 | 0, W = d * 2 + 4;
    return {
        w: W,
        out: `M0 0H${W - (d * 1.5 | 0)}C${W - (d * 2.5 | 0)} ${H * 0.35 | 0} ${W - (d * 2.5 | 0)} ${H * 0.65 | 0} ${W - (d * 1.5 | 0)} ${H}H0Z`,
        inn: `M0 ${B}H${W - B - (d * 1.2 | 0)}C${W - B - (d * 2.2 | 0)} ${H * 0.37 | 0} ${W - B - (d * 2.2 | 0)} ${H * 0.63 | 0} ${W - B - (d * 1.2 | 0)} ${H - B}H0Z`
    };
}

export function tab_R(H: number): CapGeometry {
    const c = H * 0.32 | 0, W = c + 3, ci = Math.max(c - B, 1);
    return {
        w: W,
        out: `M0 0H${W}V${H - c}Q${W} ${H} ${W - c} ${H}H0Z`,
        inn: `M0 ${B}H${W - B}V${H - B - ci}Q${W - B} ${H - B} ${W - B - ci} ${H - B}H0Z`
    };
}

export function wave_R(H: number): CapGeometry {
    const d = H * 0.14 | 0, W = d * 3 + 2;
    return {
        w: W,
        out: `M0 0H${W - d * 2}C${W - d} 0 ${W + (d * 0.3 | 0)} ${H * 0.2 | 0} ${W - (d * 0.5 | 0)} ${H * 0.35 | 0}S${W - (d * 0.5 | 0)} ${H * 0.8 | 0} ${W - d * 2} ${H}H0Z`,
        inn: `M0 ${B}H${W - B - (d * 1.8 | 0)}C${W - B - (d * 0.9 | 0)} ${B} ${W - B + (d * 0.1 | 0)} ${H * 0.22 | 0} ${W - B - (d * 0.4 | 0)} ${H * 0.37 | 0}S${W - B - (d * 0.4 | 0)} ${H * 0.78 | 0} ${W - B - (d * 1.8 | 0)} ${H - B}H0Z`
    };
}

export function ornate_R(H: number): CapGeometry {
    const s = H * 0.09 | 0, W = H * 0.35 | 0;
    return {
        w: W,
        out: `M0 0H${W - s * 3}L${W - s} ${s * 2}L${W - s * 2} ${H * 0.35 | 0}L${W} ${H / 2 | 0}L${W - s * 2} ${H * 0.65 | 0}L${W - s} ${H - s * 2}L${W - s * 3} ${H}H0Z`,
        inn: `M0 ${B}H${W - B - (s * 2.5 | 0)}L${W - B - (s * 0.7 | 0)} ${B + (s * 1.6 | 0)}L${W - B - (s * 1.7 | 0)} ${H * 0.36 | 0}L${W - B} ${H / 2 | 0}L${W - B - (s * 1.7 | 0)} ${H * 0.64 | 0}L${W - B - (s * 0.7 | 0)} ${H - B - (s * 1.6 | 0)}L${W - B - (s * 2.5 | 0)} ${H - B}H0Z`
    };
}

export function skewTL_R(H: number): CapGeometry {
    const s = H * 0.42 | 0, W = s + 2;
    return {
        w: W,
        out: `M0 0H${W}L${W - s} ${H}H0Z`,
        inn: `M0 ${B}H${W - B}L${W - B - s + (B * 1.3 | 0)} ${H - B}H0Z`
    };
}

export function skewTR_R(H: number): CapGeometry {
    const s = H * 0.42 | 0, W = s + 2;
    return {
        w: W,
        out: `M0 0H${W - s}L${W} ${H}H0Z`,
        inn: `M0 ${B}H${W - B - s + (B * 1.3 | 0)}L${W - B} ${H - B}H0Z`
    };
}

// ────────────────────────────────────────────────
// Cap style registries
// ────────────────────────────────────────────────

export const SYMMETRIC_CAPS: CapStyle[] = [
    { name: 'Pill', L: pill_L, R: pill_R },
    { name: 'Sharp', L: sharp_L, R: sharp_R },
    { name: 'Soft', L: soft_L, R: soft_R },
    { name: 'Chamfer', L: chamfer_L, R: chamfer_R },
    { name: 'Arrow', L: arrow_L, R: arrow_R },
    { name: 'Shield', L: shield_L, R: shield_R },
    { name: 'Bracket', L: bracket_L, R: bracket_R },
    { name: 'Tab', L: tab_L, R: tab_R },
    { name: 'Wave', L: wave_L, R: wave_R },
    { name: 'Ornate', L: ornate_L, R: ornate_R },
];

export const ASYMMETRIC_CAPS: CapStyle[] = [
    { name: 'Pill→Arrow', L: pill_L, R: arrow_R },
    { name: 'Arrow→Pill', L: arrow_L, R: pill_R },
    { name: 'Pill→Sharp', L: pill_L, R: sharp_R },
    { name: 'Sharp→Pill', L: sharp_L, R: pill_R },
    { name: 'Pill→Chamfer', L: pill_L, R: chamfer_R },
    { name: 'Chamfer→Pill', L: chamfer_L, R: pill_R },
    { name: 'Arrow→Sharp', L: arrow_L, R: sharp_R },
    { name: 'Sharp→Arrow', L: sharp_L, R: arrow_R },
    { name: 'Arrow→Chamfer', L: arrow_L, R: chamfer_R },
    { name: 'Chamfer→Arrow', L: chamfer_L, R: arrow_R },
    { name: 'Soft→Arrow', L: soft_L, R: arrow_R },
    { name: 'Shield→Chamfer', L: shield_L, R: chamfer_R },
    { name: 'Pill→Wave', L: pill_L, R: wave_R },
    { name: 'Wave→Arrow', L: wave_L, R: arrow_R },
    { name: 'Tab→Pill', L: tab_L, R: pill_R },
    { name: 'Ornate→Sharp', L: ornate_L, R: sharp_R },
    { name: 'Sharp→Ornate', L: sharp_L, R: ornate_R },
    { name: 'Bracket→Arrow', L: bracket_L, R: arrow_R },
    { name: 'Shield→Pill', L: shield_L, R: pill_R },
    { name: 'Wave→Ornate', L: wave_L, R: ornate_R },
];

export const SKEW_CAPS: CapStyle[] = [
    { name: 'Skew ╲', L: skewTL_L, R: skewTL_R },
    { name: 'Skew ╱', L: skewTR_L, R: skewTR_R },
    { name: '◇ Romb', L: arrow_L, R: arrow_R },
    { name: '╲→Pill', L: skewTL_L, R: pill_R },
    { name: 'Pill→╲', L: pill_L, R: skewTL_R },
    { name: '╱→Sharp', L: skewTR_L, R: sharp_R },
    { name: 'Sharp→╱', L: sharp_L, R: skewTR_R },
    { name: '╲→Arrow', L: skewTL_L, R: arrow_R },
    { name: 'Arrow→╱', L: arrow_L, R: skewTR_R },
    { name: '◇→Chamfer', L: arrow_L, R: chamfer_R },
];

/** All cap styles in one flat list for lookup by name */
export const ALL_CAP_STYLES: CapStyle[] = [...SYMMETRIC_CAPS, ...ASYMMETRIC_CAPS, ...SKEW_CAPS];

/** Default cap style */
export const DEFAULT_CAP_STYLE = SYMMETRIC_CAPS[0]; // Pill

/** Lookup cap style by name, falling back to Pill */
export function getCapStyleByName(name: string): CapStyle {
    return ALL_CAP_STYLES.find(c => c.name === name) || DEFAULT_CAP_STYLE;
}
