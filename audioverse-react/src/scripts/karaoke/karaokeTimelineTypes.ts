export interface KaraokeNoteData {
    startTime: number;
    duration: number;
    pitch: number;
    // true for golden notes (*) and rap-golden (G)
    isGold?: boolean;
}

import { cssColorToRgb, resolveCssColor, parseColorToRgb } from "../../utils/colorResolver";

// Tunable visual constants for golden-note effects
export const GOLD_PARTICLE_LIFE_MS = 1000; // how long burst lives (ms)
export const GOLD_PARTICLE_COUNT = 20; // particles per burst
export const GOLD_PARTICLE_BASE_SPEED = 70; // base speed scalar for particles
export const GOLD_PARTICLE_BASE_SIZE = 5; // size base multiplier
export const GOLD_GLOW_BLUR = 26; // glow blur for golden ball/notes
export const GOLD_SHADOW_COLOR = 'rgba(255,215,70,0.98)';

// Cache for SVG particle images (keyed by `${hue}-${size}-${variant}`)
const particleSvgCache: Map<string, HTMLImageElement> = new Map();

export const makeParticleSvgDataUrl = (hue: number, sat: number, light: number, size: number, seed: number) => {
    // simple star-like SVG with radial gradient
    const id = `g${seed}`;
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>\n` +
        `<defs>\n` +
        `<radialGradient id='g${id}' cx='50%' cy='40%' r='60%'>\n` +
        `<stop offset='0%' stop-color='hsl(${hue} ${sat}% ${light}%)' stop-opacity='1'/>\n` +
        `<stop offset='60%' stop-color='hsl(${hue} ${Math.max(10, sat - 30)}% ${Math.min(90, light + 10)}%)' stop-opacity='0.9'/>\n` +
        `<stop offset='100%' stop-color='rgba(0,0,0,0)' stop-opacity='0'/>\n` +
        `</radialGradient>\n` +
        `</defs>\n` +
        `<g transform='translate(${size / 2}, ${size / 2})'>\n` +
        `<circle cx='0' cy='0' r='${size * 0.45}' fill='url(#g${id})' />\n` +
        `</g>\n` +
        `</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const getParticleImage = (hue: number, sat: number, light: number, size: number, seed: number) => {
    const key = `${hue}-${sat}-${light}-${Math.round(size)}-${seed}`;
    let img = particleSvgCache.get(key);
    if (img) return img;
    img = new Image();
    img.src = makeParticleSvgDataUrl(hue, sat, light, size, seed);
    // store immediately (will render once loaded)
    particleSvgCache.set(key, img);
    return img;
};

// Color helpers: hex -> HSL -> CSS
export const hexToHsl = (hex: string) => {
    const h = hex.replace('#', '');
    const r = parseInt(h.length === 3 ? h[0] + h[0] : h.substring(0, 2), 16) / 255;
    const g = parseInt(h.length === 3 ? h[1] + h[1] : h.substring(2, 4), 16) / 255;
    const b = parseInt(h.length === 3 ? h[2] + h[2] : h.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let hOut = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: hOut = (g - b) / d + (g < b ? 6 : 0); break;
            case g: hOut = (b - r) / d + 2; break;
            case b: hOut = (r - g) / d + 4; break;
        }
        hOut /= 6;
    }
    return { h: Math.round(hOut * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

export const hslToCss = (h: number, s: number, l: number, a: number = 1) => {
    return `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${a})`;
};

/**
 * Returns per-accuracy RGB color based on frac (0–1):
 *   perfect (≥0.8) → green, good (0.4–0.8) → yellow, bad (<0.4) → orange-red
 */
export function accuracyColor(frac: number): [number, number, number] {
    // Use theme-aware tokens with hex fallbacks; convert to RGB numbers
    const perfect = cssColorToRgb('var(--accuracy-perfect, #38BD50)');
    const good = cssColorToRgb('var(--accuracy-good, #FFC107)');
    const bad = cssColorToRgb('var(--accuracy-bad, #F4511E)');
    if (frac >= 0.8) return perfect;
    if (frac >= 0.4) return good;
    return bad;
}

/** Resolve any CSS color (possibly var(...)) and return a hex string `#rrggbb`.
 * Falls back to `#ffcc00` if parsing fails.
 */
export function cssColorToHex(color: string): string {
    try {
        const resolved = resolveCssColor(color);
        const [r, g, b] = parseColorToRgb(resolved);
        const toHex = (v: number) => v.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase();
    } catch (_e) {
        /* Expected: CSS color resolution may fail for invalid/unknown color values */
        return '#ffcc00';
    }
}

/** Rounded rectangle path helper (does NOT call fill/stroke) */
export function roundedRect(ctx: CanvasRenderingContext2D, rx: number, ry: number, rw: number, rh: number, radius: number) {
    const r = Math.min(radius, rw / 2, rh / 2);
    ctx.beginPath();
    ctx.moveTo(rx + r, ry);
    ctx.lineTo(rx + rw - r, ry);
    ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + r);
    ctx.lineTo(rx + rw, ry + rh - r);
    ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - r, ry + rh);
    ctx.lineTo(rx + r, ry + rh);
    ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - r);
    ctx.lineTo(rx, ry + r);
    ctx.quadraticCurveTo(rx, ry, rx + r, ry);
    ctx.closePath();
}
