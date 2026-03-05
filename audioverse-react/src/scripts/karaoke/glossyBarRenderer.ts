/**
 * glossyBarRenderer.ts — Glossy SVG bar generator for karaoke note timeline.
 *
 * Generates glossy, 3D-look note bars with configurable:
 * - Cap shapes (pill, sharp, soft, chamfer, arrow, shield, bracket, tab, wave, ornate, skew)
 * - Overlay patterns (flames, zigzag, scales, hex, dots, stars, etc.)
 * - Colors, highlight, glow, glass transparency
 *
 * Based on the standalone glossy-buttons-v8 generator, adapted for Canvas rendering.
 *
 * Sub-modules:
 * - glossyBarCaps.ts   — cap shape definitions & registries
 * - glossyBarPatterns.ts — overlay pattern definitions
 * - karaokeSettings.ts  — per-player karaoke visual settings (bar fills + font)
 */

// Re-export sub-modules for backward compatibility
export type { CapGeometry, CapShapeGenerator, CapStyle } from "./glossyBarCaps";
export {
    pill_L, sharp_L, soft_L, chamfer_L, arrow_L, shield_L, bracket_L, tab_L, wave_L, ornate_L, skewTL_L, skewTR_L,
    pill_R, sharp_R, soft_R, chamfer_R, arrow_R, shield_R, bracket_R, tab_R, wave_R, ornate_R, skewTL_R, skewTR_R,
    SYMMETRIC_CAPS, ASYMMETRIC_CAPS, SKEW_CAPS, ALL_CAP_STYLES, DEFAULT_CAP_STYLE, getCapStyleByName
} from "./glossyBarCaps";

export type { OverlayPattern } from "./glossyBarPatterns";
export { OVERLAY_PATTERNS, getPatternByName } from "./glossyBarPatterns";

export type { KaraokeBarFill, KaraokeFontSettings, PlayerKaraokeSettings, EmptyBarPreset, PlayerBarStyle } from "./karaokeSettings";
export {
    DEFAULT_BAR_FILL, DEFAULT_EMPTY_BAR_FILL, DEFAULT_GOLD_EMPTY_BAR_FILL, DEFAULT_GOLD_FILLED_BAR_FILL,
    DEFAULT_FONT_SETTINGS, DEFAULT_KARAOKE_SETTINGS,
    DEFAULT_PLAYER_BAR_STYLE,
    loadKaraokeSettings, saveKaraokeSettings, hydratePlayerKaraokeSettingsFromBackend,
    loadAllKaraokeSettings,
    loadPlayerBarStyle, savePlayerBarStyle, loadPlayerBarStyles
} from "./karaokeSettings";

import type { CapStyle } from "./glossyBarCaps";
import type { OverlayPattern } from "./glossyBarPatterns";

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────

/** Render options for a glossy bar */
export interface GlossyBarOptions {
    /** Total width in pixels */
    width: number;
    /** Total height in pixels */
    height: number;
    /** Cap style to use */
    capStyle: CapStyle;
    /** Base color (hex, e.g. "#2196f3") */
    color: string;
    /** Highlight intensity 0-100 (default 70) */
    highlight?: number;
    /** Bottom glow intensity 0-100 (default 55) */
    glow?: number;
    /** Glass transparency 0-100 — 100 = fully transparent/white (default 0) */
    glass?: number;
    /** optional overlay pattern */
    pattern?: OverlayPattern | null;
    /** Secondary color for pattern overlay (hex). If omitted, auto-derived from main color */
    patternColor?: string | null;
    /** Pattern-only mode: no glossy 3D button, just the pattern fill inside a simple rounded rect.
     *  Gray bars = unsung notes, colored bars = sung by player. */
    patternOnly?: boolean;
    /** Texture image URL for filling the bar (overrides/supplements gradient fill) */
    textureUrl?: string | null;
    /** Texture tile scale for SVG preview (default 1.0) */
    textureScale?: number;
}

// ────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────

/** Border width used in cap shape calculations */
const BW = 3;
const B = BW;

// ────────────────────────────────────────────────
// Color helpers
// ────────────────────────────────────────────────

/** Convert hex color to HSL [h: 0-360, s: 0-100, l: 0-100] */
export function hexToHsl(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (mx + mn) / 2;
    if (mx !== mn) {
        const d = mx - mn;
        s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
        switch (mx) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

/** Normalize any CSS hex to 6-digit lowercase */
export function normalizeHex(hex: string): string {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return '#' + h.toLowerCase();
}

// ────────────────────────────────────────────────
// SVG rendering — generates full SVG string
// ────────────────────────────────────────────────

/** Translate SVG path commands by a horizontal offset dx */
function txPath(p: string, dx: number): string {
    return p.replace(/([MLHVCSQTAZ])/gi, '\n$1').split('\n').filter(Boolean).map(s => {
        const c = s[0];
        const nums = s.slice(1).trim().split(/[\s,]+/).map(Number);
        if (c === 'H') return `H${nums[0] + dx}`;
        if (c === 'V' || c === 'Z') return s;
        if ('MLCSQT'.includes(c.toUpperCase())) {
            for (let j = 0; j < nums.length; j += 2) nums[j] += dx;
            return c + nums.join(' ');
        }
        if (c === 'A' && nums.length >= 7) {
            nums[5] += dx;
            return c + nums.join(' ');
        }
        return s;
    }).join('');
}

/** Render a complete glossy bar as SVG markup string */
export function renderGlossyBarSvg(opts: GlossyBarOptions): string {
    const { width: totalW, height: H, capStyle: style, color, highlight: hi = 70, glow: gl = 55, glass: gs = 0, pattern: patStyle = null, patternColor = null, patternOnly = false, textureUrl = null, textureScale: texScale = 1.0 } = opts;
    const [hu, sa, li] = hexToHsl(normalizeHex(color));

    const id = 'c' + Math.random().toString(36).slice(2, 7);
    const lc = style.L(H), rc = style.R(H), midW = totalW - lc.w - rc.w;
    if (midW < 4) return '';

    // ── Pattern-only mode: flat fill + pattern, no 3D effects ──
    if (patternOnly && patStyle) {
        const baseClr = `hsl(${hu},${sa}%,${li}%)`;
        const pClrAuto = `hsl(${hu},${Math.max(sa - 20, 0)}%,${Math.min(li + 30, 95)}%)`;
        const pClr = patternColor ? patternColor : pClrAuto;
        const mX = lc.w, rXv = lc.w + midW;
        const iL = lc.inn, iM = `M${mX} ${B}H${rXv}V${H - B}H${mX}Z`, iR = txPath(rc.inn, rXv);
        const oL = lc.out, oM = `M${mX} 0H${rXv}V${H}H${mX}Z`, oR = txPath(rc.out, rXv);
        const patDef = patStyle.mk(id + 'pat', pClr, patternColor || undefined);

        const tw2 = Math.round(256 * texScale), th2 = Math.round(256 * texScale);
        const texDef2 = textureUrl ? `<pattern id="${id}tex" patternUnits="userSpaceOnUse" width="${tw2}" height="${th2}"><image href="${textureUrl}" width="${tw2}" height="${th2}" preserveAspectRatio="none"/></pattern>` : '';
        const texRect2 = textureUrl ? `<rect x="0" y="0" width="${totalW}" height="${H}" fill="url(#${id}tex)" opacity=".85" clip-path="url(#${id}c)"/>` : '';

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${H}" viewBox="0 0 ${totalW} ${H}"><defs>
${patDef}
${texDef2}
<clipPath id="${id}c"><path d="${iL}"/><path d="${iM}"/><path d="${iR}"/></clipPath>
</defs>
<path d="${oL}" fill="rgba(255,255,255,.18)"/><path d="${oM}" fill="rgba(255,255,255,.18)"/><path d="${oR}" fill="rgba(255,255,255,.18)"/>
<path d="${iL}" fill="${baseClr}" opacity=".22"/><path d="${iM}" fill="${baseClr}" opacity=".22"/><path d="${iR}" fill="${baseClr}" opacity=".22"/>
${texRect2}
<rect x="0" y="0" width="${totalW}" height="${H}" fill="url(#${id}pat)" clip-path="url(#${id}c)"/>
</svg>`;
    }

    const bDk = `hsl(${hu},${Math.min(sa + 10, 100)}%,${Math.max(li - 22, 4)}%)`;
    const bMd = `hsl(${hu},${sa}%,${li}%)`;
    const bLt = `hsl(${hu},${Math.max(sa - 12, 0)}%,${Math.min(li + 18, 88)}%)`;
    const bGw = `hsl(${hu},${Math.min(sa + 20, 100)}%,${Math.min(li + 30, 93)}%)`;
    const pClrAuto = `hsl(${hu},${Math.max(sa - 20, 0)}%,${Math.min(li + 30, 95)}%)`;
    const pClr = patternColor ? patternColor : pClrAuto;
    const hiOp = (hi / 100) * 0.78;
    const glOp = (gl / 100) * 0.65;
    const bdOp = 1 - (gs / 100) * 0.87;

    const bT = B, bB = H - B, hiB = bT + (bB - bT) * 0.44, glT = bT + (bB - bT) * 0.58;
    const midX = lc.w, rX = lc.w + midW;

    const oL = lc.out, oM = `M${midX} 0H${rX}V${H}H${midX}Z`, oR = txPath(rc.out, rX);
    const iL = lc.inn, iM = `M${midX} ${B}H${rX}V${H - B}H${midX}Z`, iR = txPath(rc.inn, rX);

    const patDef = patStyle ? patStyle.mk(id + 'pat', pClr, patternColor || undefined) : '';
    const patRect = patStyle ? `<rect x="0" y="0" width="${totalW}" height="${H}" fill="url(#${id}pat)" clip-path="url(#${id}c)"/>` : '';

    // Texture image pattern (if a texture URL is specified)
    const tw = Math.round(256 * texScale), th = Math.round(256 * texScale);
    const texDef = textureUrl ? `<pattern id="${id}tex" patternUnits="userSpaceOnUse" width="${tw}" height="${th}"><image href="${textureUrl}" width="${tw}" height="${th}" preserveAspectRatio="none"/></pattern>` : '';
    const texRect = textureUrl ? `<rect x="0" y="0" width="${totalW}" height="${H}" fill="url(#${id}tex)" opacity="${bdOp * 0.9}" clip-path="url(#${id}c)"/>` : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${H}" viewBox="0 0 ${totalW} ${H}"><defs>
${patDef}
${texDef}
<linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="rgba(255,255,255,.55)"/><stop offset=".3" stop-color="rgba(255,255,255,.35)"/><stop offset="1" stop-color="rgba(255,255,255,.08)"/></linearGradient>
<linearGradient id="${id}f" x1="0" y1="${bT}" x2="0" y2="${bB}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${bLt}"/><stop offset=".5" stop-color="${bMd}"/><stop offset="1" stop-color="${bDk}"/></linearGradient>
<linearGradient id="${id}h" x1="0" y1="${bT}" x2="0" y2="${hiB}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity="${hiOp}"/><stop offset=".5" stop-color="#fff" stop-opacity="${hiOp * 0.25}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="${id}g" x1="0" y1="${glT}" x2="0" y2="${bB}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${bGw}" stop-opacity="0"/><stop offset=".6" stop-color="${bGw}" stop-opacity="${glOp * 0.6}"/><stop offset="1" stop-color="${bGw}" stop-opacity="${glOp}"/></linearGradient>
<clipPath id="${id}c"><path d="${iL}"/><path d="${iM}"/><path d="${iR}"/></clipPath>
</defs>
<path d="${oL}" fill="url(#${id}b)"/><path d="${oM}" fill="url(#${id}b)"/><path d="${oR}" fill="url(#${id}b)"/>
<path d="${iL}" fill="url(#${id}f)" opacity="${bdOp}"/><path d="${iM}" fill="url(#${id}f)" opacity="${bdOp}"/><path d="${iR}" fill="url(#${id}f)" opacity="${bdOp}"/>
${texRect}
${patRect}
<rect x="0" y="${glT}" width="${totalW}" height="${bB - glT}" fill="url(#${id}g)" clip-path="url(#${id}c)"/>
<rect x="0" y="${bT}" width="${totalW}" height="${hiB - bT}" fill="url(#${id}h)" clip-path="url(#${id}c)"/>
</svg>`;
}

// ────────────────────────────────────────────────
// Canvas rendering — draw glossy bar directly on Canvas 2D
// ────────────────────────────────────────────────

/** Internal: parse SVG path into Canvas2D commands */
function drawSvgPathOnCanvas(ctx: CanvasRenderingContext2D, pathStr: string) {
    const tokens = pathStr.match(/[MLHVCSQTAZmlhvcsqtaz][^MLHVCSQTAZmlhvcsqtaz]*/g);
    if (!tokens) return;
    let cx = 0, cy = 0;
    for (const tok of tokens) {
        const cmd = tok[0];
        const nums = tok.slice(1).trim().split(/[\s,]+/).filter(Boolean).map(Number);
        switch (cmd) {
            case 'M': cx = nums[0]; cy = nums[1]; ctx.moveTo(cx, cy); break;
            case 'L': cx = nums[0]; cy = nums[1]; ctx.lineTo(cx, cy); break;
            case 'H': cx = nums[0]; ctx.lineTo(cx, cy); break;
            case 'V': cy = nums[0]; ctx.lineTo(cx, cy); break;
            case 'C':
                ctx.bezierCurveTo(nums[0], nums[1], nums[2], nums[3], nums[4], nums[5]);
                cx = nums[4]; cy = nums[5]; break;
            case 'Q':
                ctx.quadraticCurveTo(nums[0], nums[1], nums[2], nums[3]);
                cx = nums[2]; cy = nums[3]; break;
            case 'S': {
                // Smooth cubic — for simplicity approximate with bezierCurveTo reusing last control
                ctx.bezierCurveTo(cx, cy, nums[0], nums[1], nums[2], nums[3]);
                cx = nums[2]; cy = nums[3]; break;
            }
            case 'A': {
                // SVG arc → Canvas arc (endpoint-to-center parameterization per SVG spec)
                // nums: rx ry x-rotation largeArc sweep endX endY
                const rx0 = Math.abs(nums[0]);
                const ry0 = Math.abs(nums[1]);
                const largeArc = nums[3] !== 0;
                const sweepFlag = nums[4] !== 0;
                const x2 = nums[5], y2 = nums[6];
                const x1 = cx, y1 = cy;

                // Degenerate: skip if endpoints are the same or radii are zero
                if ((Math.abs(x1 - x2) < 0.001 && Math.abs(y1 - y2) < 0.001) || rx0 < 0.001 || ry0 < 0.001) {
                    ctx.lineTo(x2, y2);
                    cx = x2; cy = y2;
                    break;
                }

                // Circular arcs (rx ≈ ry) → use Canvas arc()
                const r = (rx0 + ry0) / 2;
                const dx = (x1 - x2) / 2;
                const dy = (y1 - y2) / 2;
                const dSq = dx * dx + dy * dy;

                // Ensure radius is large enough to reach both endpoints
                const adjR = dSq > r * r ? Math.sqrt(dSq) : r;
                const adjRSq = adjR * adjR;

                const sq = Math.sqrt(Math.max(0, (adjRSq - dSq) / dSq));
                const sign = (largeArc !== sweepFlag) ? 1 : -1;

                // Center of the arc circle
                const cxArc = (x1 + x2) / 2 + sign * sq * dy;
                const cyArc = (y1 + y2) / 2 - sign * sq * dx;

                const startAngle = Math.atan2(y1 - cyArc, x1 - cxArc);
                const endAngle = Math.atan2(y2 - cyArc, x2 - cxArc);

                // SVG sweep=1 → clockwise (y-down) → Canvas counterclockwise=false
                ctx.arc(cxArc, cyArc, adjR, startAngle, endAngle, !sweepFlag);
                cx = x2; cy = y2;
                break;
            }
            case 'Z': ctx.closePath(); break;
        }
    }
}

/**
 * Draw a glossy bar directly onto a Canvas2D context at position (x, y).
 *
 * This renders the same visual as `renderGlossyBarSvg` but using Canvas commands,
 * which is much more efficient for real-time karaoke timeline rendering.
 */
export function drawGlossyBarOnCanvas(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    totalW: number, H: number,
    capStyle: CapStyle,
    color: string,
    highlight = 70,
    glow = 55,
    glass = 0,
    _pattern?: OverlayPattern | null,
    _patternColor?: string | null,
    patternOnly = false,
    texturePattern?: CanvasPattern | null,
    overlayCanvasPattern?: CanvasPattern | null,
): void {
    const [hu, sa, li] = hexToHsl(normalizeHex(color));

    const lc = capStyle.L(H), rc = capStyle.R(H), midW = totalW - lc.w - rc.w;
    if (midW < 0) {
        // Bar is too narrow for caps — draw a simple pill-shaped colored rectangle as fallback
        const [hu, , li2] = hexToHsl(normalizeHex(color));
        ctx.save();
        ctx.translate(x, y);
        ctx.globalAlpha = 1 - (glass / 100) * 0.87;
        ctx.fillStyle = `hsl(${hu},50%,${Math.min(li2 + 10, 80)}%)`;
        const r2 = Math.min(totalW / 2, H / 2);
        ctx.beginPath();
        ctx.moveTo(r2, 0);
        ctx.lineTo(totalW - r2, 0);
        ctx.quadraticCurveTo(totalW, 0, totalW, r2);
        ctx.lineTo(totalW, H - r2);
        ctx.quadraticCurveTo(totalW, H, totalW - r2, H);
        ctx.lineTo(r2, H);
        ctx.quadraticCurveTo(0, H, 0, H - r2);
        ctx.lineTo(0, r2);
        ctx.quadraticCurveTo(0, 0, r2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        return;
    }

    const midX = lc.w, rX = lc.w + midW;

    // ── Pattern-only mode: flat tinted fill, no 3D effects ──
    if (patternOnly) {
        const baseClr = `hsla(${hu},${sa}%,${li}%,0.22)`;
        ctx.save();
        ctx.translate(x, y);

        // Subtle outer border
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.beginPath(); drawSvgPathOnCanvas(ctx, lc.out); ctx.fill();
        ctx.fillRect(midX, 0, midW, H);
        ctx.beginPath(); drawSvgPathOnCanvas(ctx, txPath(rc.out, rX)); ctx.fill();

        // Flat tinted inner fill
        ctx.fillStyle = baseClr;
        ctx.beginPath(); drawSvgPathOnCanvas(ctx, lc.inn); ctx.fill();
        ctx.fillRect(midX, B, midW, H - 2 * B);
        ctx.beginPath(); drawSvgPathOnCanvas(ctx, txPath(rc.inn, rX)); ctx.fill();

        // Texture overlay (if provided) — clipped to inner shape
        if (texturePattern) {
            ctx.save();
            ctx.beginPath();
            drawSvgPathOnCanvas(ctx, lc.inn);
            ctx.rect(midX, B, midW, H - 2 * B);
            drawSvgPathOnCanvas(ctx, txPath(rc.inn, rX));
            ctx.clip();
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = texturePattern;
            ctx.fillRect(0, 0, totalW, H);
            ctx.globalAlpha = 1;
            ctx.restore();
        }

        // Overlay pattern (Stars, Flames, etc.) — clipped to inner shape
        if (overlayCanvasPattern) {
            ctx.save();
            ctx.beginPath();
            drawSvgPathOnCanvas(ctx, lc.inn);
            ctx.rect(midX, B, midW, H - 2 * B);
            drawSvgPathOnCanvas(ctx, txPath(rc.inn, rX));
            ctx.clip();
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = overlayCanvasPattern;
            ctx.fillRect(0, 0, totalW, H);
            ctx.globalAlpha = 1;
            ctx.restore();
        }

        ctx.restore();
        return;
    }

    const bDk = `hsl(${hu},${Math.min(sa + 10, 100)}%,${Math.max(li - 22, 4)}%)`;
    const bMd = `hsl(${hu},${sa}%,${li}%)`;
    const bLt = `hsl(${hu},${Math.max(sa - 12, 0)}%,${Math.min(li + 18, 88)}%)`;
    const bGw = `hsl(${hu},${Math.min(sa + 20, 100)}%,${Math.min(li + 30, 93)}%)`;

    const hiOp = (highlight / 100) * 0.78;
    const glOp = (glow / 100) * 0.65;
    const bdOp = 1 - (glass / 100) * 0.87;

    const bT = B, bB = H - B, bH = bB - bT;
    const hiB = bT + bH * 0.44;
    const glT = bT + bH * 0.58;

    ctx.save();
    ctx.translate(x, y);

    // ── 1. Outer border glow gradient ──
    const outerGrad = ctx.createLinearGradient(0, 0, 0, H);
    outerGrad.addColorStop(0, 'rgba(255,255,255,0.55)');
    outerGrad.addColorStop(0.3, 'rgba(255,255,255,0.35)');
    outerGrad.addColorStop(1, 'rgba(255,255,255,0.08)');
    ctx.fillStyle = outerGrad;
    // Left cap outer
    ctx.beginPath(); drawSvgPathOnCanvas(ctx, lc.out); ctx.fill();
    // Mid outer
    ctx.fillRect(midX, 0, midW, H);
    // Right cap outer (translated)
    ctx.beginPath(); drawSvgPathOnCanvas(ctx, txPath(rc.out, rX)); ctx.fill();

    // ── 2. Inner fill gradient ──
    const fillGrad = ctx.createLinearGradient(0, bT, 0, bB);
    fillGrad.addColorStop(0, bLt);
    fillGrad.addColorStop(0.5, bMd);
    fillGrad.addColorStop(1, bDk);
    ctx.globalAlpha = bdOp;
    ctx.fillStyle = fillGrad;
    ctx.beginPath(); drawSvgPathOnCanvas(ctx, lc.inn); ctx.fill();
    ctx.fillRect(midX, B, midW, H - 2 * B);
    ctx.beginPath(); drawSvgPathOnCanvas(ctx, txPath(rc.inn, rX)); ctx.fill();
    ctx.globalAlpha = 1;

    // ── 2b. Texture overlay (if provided) — drawn on top of color fill, below gloss ──
    if (texturePattern) {
        ctx.save();
        ctx.beginPath();
        drawSvgPathOnCanvas(ctx, lc.inn);
        ctx.rect(midX, B, midW, H - 2 * B);
        drawSvgPathOnCanvas(ctx, txPath(rc.inn, rX));
        ctx.clip();
        ctx.globalAlpha = bdOp * 0.9;
        ctx.fillStyle = texturePattern;
        ctx.fillRect(0, 0, totalW, H);
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // ── 2c. Overlay pattern (Stars, Flames, etc.) — clipped to inner shape ──
    if (overlayCanvasPattern) {
        ctx.save();
        ctx.beginPath();
        drawSvgPathOnCanvas(ctx, lc.inn);
        ctx.rect(midX, B, midW, H - 2 * B);
        drawSvgPathOnCanvas(ctx, txPath(rc.inn, rX));
        ctx.clip();
        ctx.globalAlpha = bdOp * 0.85;
        ctx.fillStyle = overlayCanvasPattern;
        ctx.fillRect(0, 0, totalW, H);
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // ── 3. Create clip for inner shape (for highlight/glow layers) ──
    ctx.save();
    ctx.beginPath();
    drawSvgPathOnCanvas(ctx, lc.inn);
    ctx.rect(midX, B, midW, H - 2 * B);
    drawSvgPathOnCanvas(ctx, txPath(rc.inn, rX));
    ctx.clip();

    // ── 4. Bottom glow ──
    const glowGrad = ctx.createLinearGradient(0, glT, 0, bB);
    glowGrad.addColorStop(0, 'transparent');
    glowGrad.addColorStop(0.6, bGw.replace(')', `, ${glOp * 0.6})`).replace('hsl', 'hsla'));
    glowGrad.addColorStop(1, bGw.replace(')', `, ${glOp})`).replace('hsl', 'hsla'));
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, glT, totalW, bB - glT);

    // ── 5. Top highlight ──
    const hiGrad = ctx.createLinearGradient(0, bT, 0, hiB);
    hiGrad.addColorStop(0, `rgba(255,255,255,${hiOp})`);
    hiGrad.addColorStop(0.5, `rgba(255,255,255,${hiOp * 0.25})`);
    hiGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hiGrad;
    ctx.fillRect(0, bT, totalW, hiB - bT);

    ctx.restore(); // un-clip
    ctx.restore(); // un-translate
}
