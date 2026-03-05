/**
 * photoFilters.ts — Canvas-based photo filter engine.
 *
 * Pure functions that operate on ImageData pixel arrays.
 * Each filter takes ImageData + optional params and returns a new ImageData.
 * Composable via `applyFilterChain`.
 */

// ── Types ──

export interface FilterParams {
    /** Intensity 0..1 (default 1 = full effect) */
    intensity?: number;
    [key: string]: unknown;
}

export interface FilterDefinition {
    id: string;
    name: string;
    /** Category for UI grouping */
    category: 'color' | 'light' | 'artistic' | 'vintage' | 'fun' | 'adjustment';
    /** Emoji icon for quick visual */
    icon: string;
    /** Apply filter to pixel data */
    apply: (data: ImageData, params?: FilterParams) => ImageData;
    /** Default params */
    defaults?: FilterParams;
}

export interface AdjustmentValues {
    brightness: number;   // -100..100
    contrast: number;     // -100..100
    saturation: number;   // -100..100
    temperature: number;  // -100..100  (neg = cool, pos = warm)
    tint: number;         // -100..100  (neg = green, pos = magenta)
    exposure: number;     // -100..100
    highlights: number;   // -100..100
    shadows: number;      // -100..100
    sharpness: number;    // 0..100
    vignette: number;     // 0..100
    grain: number;        // 0..100
    blur: number;         // 0..20
}

export const DEFAULT_ADJUSTMENTS: AdjustmentValues = {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    temperature: 0,
    tint: 0,
    exposure: 0,
    highlights: 0,
    shadows: 0,
    sharpness: 0,
    vignette: 0,
    grain: 0,
    blur: 0,
};

// ── Pixel helpers ──

function clamp(v: number): number {
    return v < 0 ? 0 : v > 255 ? 255 : v | 0;
}

function lerpColor(a: number, b: number, t: number): number {
    return clamp(a + (b - a) * t);
}

/** Create a working copy of ImageData */
function cloneImageData(src: ImageData): ImageData {
    return new ImageData(new Uint8ClampedArray(src.data), src.width, src.height);
}

/** Mix original and filtered based on intensity */
function blendIntensity(original: ImageData, filtered: ImageData, intensity: number): ImageData {
    if (intensity >= 1) return filtered;
    if (intensity <= 0) return cloneImageData(original);
    const out = cloneImageData(original);
    const od = out.data;
    const fd = filtered.data;
    for (let i = 0; i < od.length; i += 4) {
        od[i]     = lerpColor(od[i],     fd[i],     intensity);
        od[i + 1] = lerpColor(od[i + 1], fd[i + 1], intensity);
        od[i + 2] = lerpColor(od[i + 2], fd[i + 2], intensity);
    }
    return out;
}

// ── Core filter functions ──

function grayscale(data: ImageData): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        d[i] = d[i + 1] = d[i + 2] = gray;
    }
    return out;
}

function sepia(data: ImageData): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        d[i]     = clamp(r * 0.393 + g * 0.769 + b * 0.189);
        d[i + 1] = clamp(r * 0.349 + g * 0.686 + b * 0.168);
        d[i + 2] = clamp(r * 0.272 + g * 0.534 + b * 0.131);
    }
    return out;
}

function invert(data: ImageData): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    for (let i = 0; i < d.length; i += 4) {
        d[i]     = 255 - d[i];
        d[i + 1] = 255 - d[i + 1];
        d[i + 2] = 255 - d[i + 2];
    }
    return out;
}

function adjustBrightness(data: ImageData, amount: number): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    const adj = (amount / 100) * 128;
    for (let i = 0; i < d.length; i += 4) {
        d[i]     = clamp(d[i] + adj);
        d[i + 1] = clamp(d[i + 1] + adj);
        d[i + 2] = clamp(d[i + 2] + adj);
    }
    return out;
}

function adjustContrast(data: ImageData, amount: number): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    const factor = (259 * (amount + 255)) / (255 * (259 - amount));
    for (let i = 0; i < d.length; i += 4) {
        d[i]     = clamp(factor * (d[i] - 128) + 128);
        d[i + 1] = clamp(factor * (d[i + 1] - 128) + 128);
        d[i + 2] = clamp(factor * (d[i + 2] - 128) + 128);
    }
    return out;
}

function adjustSaturation(data: ImageData, amount: number): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    const sat = 1 + amount / 100;
    for (let i = 0; i < d.length; i += 4) {
        const gray = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
        d[i]     = clamp(gray + sat * (d[i] - gray));
        d[i + 1] = clamp(gray + sat * (d[i + 1] - gray));
        d[i + 2] = clamp(gray + sat * (d[i + 2] - gray));
    }
    return out;
}

function adjustTemperature(data: ImageData, amount: number): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    const adj = amount * 0.8;
    for (let i = 0; i < d.length; i += 4) {
        d[i]     = clamp(d[i] + adj);         // red
        d[i + 2] = clamp(d[i + 2] - adj);     // blue (inverse)
    }
    return out;
}

function adjustTint(data: ImageData, amount: number): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    const adj = amount * 0.5;
    for (let i = 0; i < d.length; i += 4) {
        d[i + 1] = clamp(d[i + 1] - adj); // decrease green for magenta, increase for green
    }
    return out;
}

function adjustExposure(data: ImageData, amount: number): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    const factor = Math.pow(2, amount / 50);
    for (let i = 0; i < d.length; i += 4) {
        d[i]     = clamp(d[i] * factor);
        d[i + 1] = clamp(d[i + 1] * factor);
        d[i + 2] = clamp(d[i + 2] * factor);
    }
    return out;
}

function adjustHighlights(data: ImageData, amount: number): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    const adj = amount / 100;
    for (let i = 0; i < d.length; i += 4) {
        const lum = (d[i] + d[i + 1] + d[i + 2]) / 3;
        if (lum > 128) {
            const factor = ((lum - 128) / 127) * adj * 40;
            d[i]     = clamp(d[i] + factor);
            d[i + 1] = clamp(d[i + 1] + factor);
            d[i + 2] = clamp(d[i + 2] + factor);
        }
    }
    return out;
}

function adjustShadows(data: ImageData, amount: number): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    const adj = amount / 100;
    for (let i = 0; i < d.length; i += 4) {
        const lum = (d[i] + d[i + 1] + d[i + 2]) / 3;
        if (lum < 128) {
            const factor = ((128 - lum) / 128) * adj * 40;
            d[i]     = clamp(d[i] + factor);
            d[i + 1] = clamp(d[i + 1] + factor);
            d[i + 2] = clamp(d[i + 2] + factor);
        }
    }
    return out;
}

function posterize(data: ImageData, levels = 4): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    const step = 255 / (levels - 1);
    for (let i = 0; i < d.length; i += 4) {
        d[i]     = clamp(Math.round(d[i] / step) * step);
        d[i + 1] = clamp(Math.round(d[i + 1] / step) * step);
        d[i + 2] = clamp(Math.round(d[i + 2] / step) * step);
    }
    return out;
}

function solarize(data: ImageData): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    for (let i = 0; i < d.length; i += 4) {
        d[i]     = d[i] > 128 ? 255 - d[i] : d[i];
        d[i + 1] = d[i + 1] > 128 ? 255 - d[i + 1] : d[i + 1];
        d[i + 2] = d[i + 2] > 128 ? 255 - d[i + 2] : d[i + 2];
    }
    return out;
}

function channelShift(data: ImageData): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        d[i] = g;     // R ← G
        d[i + 1] = b; // G ← B
        d[i + 2] = r; // B ← R
    }
    return out;
}

function cyberpunk(data: ImageData): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    for (let i = 0; i < d.length; i += 4) {
        const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        d[i]     = clamp(lum * 0.2 + d[i] * 0.8 + 30);         // boost red
        d[i + 1] = clamp(lum * 0.5 + d[i + 1] * 0.15 - 10);    // crush green
        d[i + 2] = clamp(lum * 0.3 + d[i + 2] * 0.9 + 50);     // heavy blue
    }
    return out;
}

function retroWave(data: ImageData): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    for (let i = 0; i < d.length; i += 4) {
        d[i]     = clamp(d[i] * 1.1 + 20);
        d[i + 1] = clamp(d[i + 1] * 0.6 - 10);
        d[i + 2] = clamp(d[i + 2] * 1.3 + 30);
    }
    return adjustContrast(out, 30);
}

function vintageFilm(data: ImageData): ImageData {
    let out = cloneImageData(data);
    const d = out.data;
    // warm tone overlay
    for (let i = 0; i < d.length; i += 4) {
        d[i]     = clamp(d[i] * 1.08 + 8);
        d[i + 1] = clamp(d[i + 1] * 0.95 + 5);
        d[i + 2] = clamp(d[i + 2] * 0.85 - 5);
    }
    out = adjustContrast(out, -15);
    return adjustSaturation(out, -20);
}

function kodachrome(data: ImageData): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        d[i]     = clamp(r * 1.129 + g * 0.097 + b * 0.035 - 12);
        d[i + 1] = clamp(r * 0.019 + g * 0.955 + b * 0.041 + 8);
        d[i + 2] = clamp(r * 0.016 + g * 0.033 + b * 0.837 + 28);
    }
    return out;
}

function polaroid(data: ImageData): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        d[i]     = clamp(r * 1.438 - g * 0.062 - b * 0.062 + 10);
        d[i + 1] = clamp(-r * 0.122 + g * 1.378 - b * 0.122 + 6);
        d[i + 2] = clamp(-r * 0.016 - g * 0.016 + b * 1.483 - 12);
    }
    return out;
}

function technicolor(data: ImageData): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        d[i]     = clamp(r * 1.913 - g * 0.282 - b * 0.023);
        d[i + 1] = clamp(-r * 0.204 + g * 1.397 - b * 0.018);
        d[i + 2] = clamp(-r * 0.199 - g * 0.291 + b * 1.765);
    }
    return out;
}

function brownie(data: ImageData): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        d[i]     = clamp(r * 0.599 + g * 0.345 + b * 0.272);
        d[i + 1] = clamp(r * 0.168 + g * 0.706 + b * 0.131);
        d[i + 2] = clamp(r * 0.131 + g * 0.168 + b * 0.706);
    }
    return out;
}

function duotone(data: ImageData, params?: FilterParams): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    const dark = hexToRgb((params?.darkColor as string) || '#001f3f');
    const light = hexToRgb((params?.lightColor as string) || '#ff851b');
    for (let i = 0; i < d.length; i += 4) {
        const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
        d[i]     = clamp(dark[0] + (light[0] - dark[0]) * lum);
        d[i + 1] = clamp(dark[1] + (light[1] - dark[1]) * lum);
        d[i + 2] = clamp(dark[2] + (light[2] - dark[2]) * lum);
    }
    return out;
}

function threshold(data: ImageData, level = 128): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    for (let i = 0; i < d.length; i += 4) {
        const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const v = lum >= level ? 255 : 0;
        d[i] = d[i + 1] = d[i + 2] = v;
    }
    return out;
}

function emboss(data: ImageData): ImageData {
    return convolve(data, [
        -2, -1, 0,
        -1,  1, 1,
         0,  1, 2,
    ]);
}

function edgeDetect(data: ImageData): ImageData {
    return convolve(data, [
        -1, -1, -1,
        -1,  8, -1,
        -1, -1, -1,
    ]);
}

function sharpen(data: ImageData, amount = 1): ImageData {
    const k = amount;
    return convolve(data, [
         0,    -k,     0,
        -k, 1 + 4*k, -k,
         0,    -k,     0,
    ]);
}

function comicBook(data: ImageData): ImageData {
    const edges = edgeDetect(data);
    const poster = posterize(data, 5);
    const out = cloneImageData(poster);
    const d = out.data;
    const ed = edges.data;
    for (let i = 0; i < d.length; i += 4) {
        const edgeLum = (ed[i] + ed[i + 1] + ed[i + 2]) / 3;
        if (edgeLum > 30) {
            d[i] = d[i + 1] = d[i + 2] = 0; // black edge lines
        }
    }
    return adjustSaturation(out, 40);
}

function heatMap(data: ImageData): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    for (let i = 0; i < d.length; i += 4) {
        const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
        // heatmap: blue → cyan → green → yellow → red
        if (lum < 0.25) {
            d[i] = 0;
            d[i + 1] = clamp(lum * 4 * 255);
            d[i + 2] = 255;
        } else if (lum < 0.5) {
            d[i] = 0;
            d[i + 1] = 255;
            d[i + 2] = clamp((1 - (lum - 0.25) * 4) * 255);
        } else if (lum < 0.75) {
            d[i] = clamp((lum - 0.5) * 4 * 255);
            d[i + 1] = 255;
            d[i + 2] = 0;
        } else {
            d[i] = 255;
            d[i + 1] = clamp((1 - (lum - 0.75) * 4) * 255);
            d[i + 2] = 0;
        }
    }
    return out;
}

function nightVision(data: ImageData): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    for (let i = 0; i < d.length; i += 4) {
        const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        d[i]     = 0;
        d[i + 1] = clamp(lum * 1.4 + 10);
        d[i + 2] = 0;
    }
    return out;
}

function xRay(data: ImageData): ImageData {
    let out = invert(data);
    out = grayscale(out);
    return adjustContrast(out, 40);
}

function crossProcess(data: ImageData): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    for (let i = 0; i < d.length; i += 4) {
        // S-curve on green, inverse on blue
        d[i]     = clamp(d[i] * 1.1 + 10);
        d[i + 1] = clamp(Math.pow(d[i + 1] / 255, 0.85) * 280);
        d[i + 2] = clamp(255 - (255 - d[i + 2]) * 0.7);
    }
    return out;
}

function lomoLeaks(data: ImageData): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    const w = data.width, h = data.height;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            // Warm light leak from top-left
            const dist = Math.sqrt(x * x + y * y) / Math.sqrt(w * w + h * h);
            const leak = Math.max(0, 1 - dist * 1.8) * 60;
            d[i]     = clamp(d[i] + leak * 1.5);
            d[i + 1] = clamp(d[i + 1] + leak * 0.8);
            d[i + 2] = clamp(d[i + 2] - leak * 0.3);
        }
    }
    return adjustSaturation(out, 15);
}

function fadeOut(data: ImageData): ImageData {
    let out = cloneImageData(data);
    out = adjustContrast(out, -30);
    const d = out.data;
    for (let i = 0; i < d.length; i += 4) {
        d[i]     = clamp(d[i] + 25);
        d[i + 1] = clamp(d[i + 1] + 20);
        d[i + 2] = clamp(d[i + 2] + 30);
    }
    return adjustSaturation(out, -30);
}

function glitch(data: ImageData): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    const w = data.width;
    // Shift some rows horizontally by random amounts
    for (let y = 0; y < data.height; y++) {
        if (Math.random() > 0.92) {
            const shift = Math.floor(Math.random() * 30 - 15);
            for (let x = 0; x < w; x++) {
                const srcX = ((x + shift) % w + w) % w;
                const di = (y * w + x) * 4;
                const si = (y * w + srcX) * 4;
                // Red channel from shifted position
                d[di] = data.data[si];
            }
        }
    }
    return out;
}

function pixelate(data: ImageData, blockSize = 8): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    const w = data.width, h = data.height;
    for (let by = 0; by < h; by += blockSize) {
        for (let bx = 0; bx < w; bx += blockSize) {
            let rSum = 0, gSum = 0, bSum = 0, count = 0;
            for (let dy = 0; dy < blockSize && by + dy < h; dy++) {
                for (let dx = 0; dx < blockSize && bx + dx < w; dx++) {
                    const i = ((by + dy) * w + (bx + dx)) * 4;
                    rSum += d[i]; gSum += d[i + 1]; bSum += d[i + 2];
                    count++;
                }
            }
            const rAvg = rSum / count, gAvg = gSum / count, bAvg = bSum / count;
            for (let dy = 0; dy < blockSize && by + dy < h; dy++) {
                for (let dx = 0; dx < blockSize && bx + dx < w; dx++) {
                    const i = ((by + dy) * w + (bx + dx)) * 4;
                    d[i] = rAvg; d[i + 1] = gAvg; d[i + 2] = bAvg;
                }
            }
        }
    }
    return out;
}

function oilPainting(data: ImageData, radius = 3): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    const src = data.data;
    const w = data.width, h = data.height;
    const levels = 20;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const counts = new Int32Array(levels);
            const rSum = new Float64Array(levels);
            const gSum = new Float64Array(levels);
            const bSum = new Float64Array(levels);
            for (let ky = -radius; ky <= radius; ky++) {
                for (let kx = -radius; kx <= radius; kx++) {
                    const ny = Math.min(h - 1, Math.max(0, y + ky));
                    const nx = Math.min(w - 1, Math.max(0, x + kx));
                    const ni = (ny * w + nx) * 4;
                    const lum = Math.floor(((src[ni] + src[ni + 1] + src[ni + 2]) / 3) * levels / 256);
                    const li = Math.min(lum, levels - 1);
                    counts[li]++;
                    rSum[li] += src[ni];
                    gSum[li] += src[ni + 1];
                    bSum[li] += src[ni + 2];
                }
            }
            let maxCount = 0, maxIdx = 0;
            for (let l = 0; l < levels; l++) {
                if (counts[l] > maxCount) { maxCount = counts[l]; maxIdx = l; }
            }
            const i = (y * w + x) * 4;
            d[i]     = rSum[maxIdx] / maxCount;
            d[i + 1] = gSum[maxIdx] / maxCount;
            d[i + 2] = bSum[maxIdx] / maxCount;
        }
    }
    return out;
}

function tiltShift(data: ImageData): ImageData {
    // Simple blur for top and bottom thirds
    const out = cloneImageData(data);
    const d = out.data;
    const src = data.data;
    const w = data.width, h = data.height;
    const centerY = h / 2;
    const focusHalf = h * 0.15;
    for (let y = 0; y < h; y++) {
        const dist = Math.abs(y - centerY);
        const blurRadius = dist < focusHalf ? 0 : Math.min(6, Math.floor((dist - focusHalf) / (h * 0.1)));
        if (blurRadius === 0) continue;
        for (let x = 0; x < w; x++) {
            let rSum = 0, gSum = 0, bSum = 0, count = 0;
            for (let ky = -blurRadius; ky <= blurRadius; ky++) {
                for (let kx = -blurRadius; kx <= blurRadius; kx++) {
                    const ny = Math.min(h - 1, Math.max(0, y + ky));
                    const nx = Math.min(w - 1, Math.max(0, x + kx));
                    const si = (ny * w + nx) * 4;
                    rSum += src[si]; gSum += src[si + 1]; bSum += src[si + 2];
                    count++;
                }
            }
            const i = (y * w + x) * 4;
            d[i] = rSum / count; d[i + 1] = gSum / count; d[i + 2] = bSum / count;
        }
    }
    return adjustSaturation(out, 20);
}

function pencilSketch(data: ImageData): ImageData {
    const gray = grayscale(data);
    const inv = invert(gray);
    // Simple Gaussian-like blur on inverted
    const blurred = boxBlur(inv, 8);
    const out = cloneImageData(gray);
    const d = out.data;
    const bd = blurred.data;
    // Color dodge blend
    for (let i = 0; i < d.length; i += 4) {
        const base = d[i];
        const blend = bd[i];
        const r = blend === 255 ? 255 : clamp((base * 256) / (255 - blend));
        d[i] = d[i + 1] = d[i + 2] = r;
    }
    return out;
}

function watercolor(data: ImageData): ImageData {
    let out = boxBlur(data, 3);
    out = adjustSaturation(out, 30);
    out = adjustContrast(out, -10);
    // Slight edge darkening
    const edges = edgeDetect(data);
    const d = out.data;
    const ed = edges.data;
    for (let i = 0; i < d.length; i += 4) {
        const edgeLum = (ed[i] + ed[i + 1] + ed[i + 2]) / 3;
        const darken = Math.min(edgeLum * 0.15, 25);
        d[i]     = clamp(d[i] - darken);
        d[i + 1] = clamp(d[i + 1] - darken);
        d[i + 2] = clamp(d[i + 2] - darken);
    }
    return out;
}

function dreamyGlow(data: ImageData): ImageData {
    const blurred = boxBlur(data, 6);
    const out = cloneImageData(data);
    const d = out.data;
    const bd = blurred.data;
    // Screen blend
    for (let i = 0; i < d.length; i += 4) {
        d[i]     = clamp(255 - ((255 - d[i]) * (255 - bd[i])) / 255);
        d[i + 1] = clamp(255 - ((255 - d[i + 1]) * (255 - bd[i + 1])) / 255);
        d[i + 2] = clamp(255 - ((255 - d[i + 2]) * (255 - bd[i + 2])) / 255);
    }
    return adjustSaturation(out, 15);
}

function frostedGlass(data: ImageData): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    const src = data.data;
    const w = data.width, h = data.height;
    const radius = 4;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const ox = x + Math.floor(Math.random() * radius * 2 - radius);
            const oy = y + Math.floor(Math.random() * radius * 2 - radius);
            const nx = Math.min(w - 1, Math.max(0, ox));
            const ny = Math.min(h - 1, Math.max(0, oy));
            const di = (y * w + x) * 4;
            const si = (ny * w + nx) * 4;
            d[di] = src[si]; d[di + 1] = src[si + 1]; d[di + 2] = src[si + 2];
        }
    }
    return out;
}

function pop(data: ImageData): ImageData {
    let out = adjustSaturation(data, 50);
    out = adjustContrast(out, 20);
    return adjustBrightness(out, 5);
}

function moody(data: ImageData): ImageData {
    let out = adjustSaturation(data, -25);
    out = adjustContrast(out, 15);
    out = adjustTemperature(out, -15);
    return adjustBrightness(out, -10);
}

function golden(data: ImageData): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    for (let i = 0; i < d.length; i += 4) {
        const lum = (d[i] + d[i + 1] + d[i + 2]) / 3;
        d[i]     = clamp(lum * 0.4 + d[i] * 0.7 + 20);
        d[i + 1] = clamp(lum * 0.3 + d[i + 1] * 0.6 + 10);
        d[i + 2] = clamp(lum * 0.1 + d[i + 2] * 0.3 - 10);
    }
    return adjustContrast(out, 10);
}

function radioactive(data: ImageData): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    for (let i = 0; i < d.length; i += 4) {
        d[i]     = clamp(d[i] * 0.3);
        d[i + 1] = clamp(d[i + 1] * 1.6 + 30);
        d[i + 2] = clamp(d[i + 2] * 0.2);
    }
    return out;
}

function arctic(data: ImageData): ImageData {
    let out = adjustTemperature(data, -50);
    out = adjustSaturation(out, -15);
    out = adjustBrightness(out, 10);
    return adjustContrast(out, 10);
}

function sunset(data: ImageData): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    for (let i = 0; i < d.length; i += 4) {
        d[i]     = clamp(d[i] * 1.15 + 15);
        d[i + 1] = clamp(d[i + 1] * 0.85 + 5);
        d[i + 2] = clamp(d[i + 2] * 0.65 - 10);
    }
    return adjustContrast(out, 10);
}

// ── Convolution helper ──

function convolve(data: ImageData, kernel: number[]): ImageData {
    const out = cloneImageData(data);
    const d = out.data;
    const src = data.data;
    const w = data.width, h = data.height;
    const size = Math.sqrt(kernel.length) | 0;
    const half = (size >> 1);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let r = 0, g = 0, b = 0;
            for (let ky = 0; ky < size; ky++) {
                for (let kx = 0; kx < size; kx++) {
                    const ny = Math.min(h - 1, Math.max(0, y + ky - half));
                    const nx = Math.min(w - 1, Math.max(0, x + kx - half));
                    const weight = kernel[ky * size + kx];
                    const si = (ny * w + nx) * 4;
                    r += src[si] * weight;
                    g += src[si + 1] * weight;
                    b += src[si + 2] * weight;
                }
            }
            const i = (y * w + x) * 4;
            d[i] = clamp(r);
            d[i + 1] = clamp(g);
            d[i + 2] = clamp(b);
        }
    }
    return out;
}

function boxBlur(data: ImageData, radius: number): ImageData {
    const size = radius * 2 + 1;
    const weight = 1 / (size * size);
    const kernel = new Array(size * size).fill(weight);
    return convolve(data, kernel);
}

function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    return [
        parseInt(h.substring(0, 2), 16),
        parseInt(h.substring(2, 4), 16),
        parseInt(h.substring(4, 6), 16),
    ];
}

// ── Canvas helpers for vignette & grain (applied via context) ──

export function applyVignette(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) {
    if (amount <= 0) return;
    const cx = w / 2, cy = h / 2;
    const radius = Math.max(w, h) * 0.7;
    const grad = ctx.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(0,0,0,${amount / 100 * 0.7})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
}

export function applyGrain(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) {
    if (amount <= 0) return;
    const imageData = ctx.getImageData(0, 0, w, h);
    const d = imageData.data;
    const intensity = amount / 100 * 50;
    for (let i = 0; i < d.length; i += 4) {
        const noise = (Math.random() - 0.5) * intensity;
        d[i]     = clamp(d[i] + noise);
        d[i + 1] = clamp(d[i + 1] + noise);
        d[i + 2] = clamp(d[i + 2] + noise);
    }
    ctx.putImageData(imageData, 0, 0);
}

// ── Filter catalog ──

export const PHOTO_FILTERS: FilterDefinition[] = [
    // Color
    { id: 'none',         name: 'Oryginał',     category: 'color',     icon: '🔲', apply: (d) => cloneImageData(d) },
    { id: 'grayscale',    name: 'Cz/B',         category: 'color',     icon: '⬛', apply: (d, p) => blendIntensity(d, grayscale(d), p?.intensity ?? 1) },
    { id: 'sepia',        name: 'Sepia',         category: 'color',     icon: '🟤', apply: (d, p) => blendIntensity(d, sepia(d), p?.intensity ?? 1) },
    { id: 'invert',       name: 'Negatyw',       category: 'color',     icon: '🔄', apply: (d, p) => blendIntensity(d, invert(d), p?.intensity ?? 1) },
    { id: 'duotone',      name: 'Duotone',       category: 'color',     icon: '🎨', apply: (d, p) => blendIntensity(d, duotone(d, p), p?.intensity ?? 1) },
    { id: 'channelShift', name: 'Channel Shift', category: 'color',     icon: '🌈', apply: (d, p) => blendIntensity(d, channelShift(d), p?.intensity ?? 1) },
    { id: 'threshold',    name: 'Próg',          category: 'color',     icon: '⚫', apply: (d, p) => blendIntensity(d, threshold(d), p?.intensity ?? 1) },
    { id: 'pop',          name: 'Pop',           category: 'color',     icon: '💥', apply: (d, p) => blendIntensity(d, pop(d), p?.intensity ?? 1) },

    // Light
    { id: 'dreamyGlow',   name: 'Dreamy Glow',   category: 'light',    icon: '✨', apply: (d, p) => blendIntensity(d, dreamyGlow(d), p?.intensity ?? 1) },
    { id: 'lomoLeaks',    name: 'Light Leaks',   category: 'light',    icon: '☀️', apply: (d, p) => blendIntensity(d, lomoLeaks(d), p?.intensity ?? 1) },
    { id: 'fadeOut',       name: 'Fade',          category: 'light',    icon: '🌫️', apply: (d, p) => blendIntensity(d, fadeOut(d), p?.intensity ?? 1) },
    { id: 'golden',        name: 'Golden',        category: 'light',    icon: '🌟', apply: (d, p) => blendIntensity(d, golden(d), p?.intensity ?? 1) },
    { id: 'sunset',        name: 'Sunset',        category: 'light',    icon: '🌅', apply: (d, p) => blendIntensity(d, sunset(d), p?.intensity ?? 1) },
    { id: 'moody',         name: 'Moody',         category: 'light',    icon: '🌑', apply: (d, p) => blendIntensity(d, moody(d), p?.intensity ?? 1) },
    { id: 'arctic',        name: 'Arctic',        category: 'light',    icon: '❄️', apply: (d, p) => blendIntensity(d, arctic(d), p?.intensity ?? 1) },

    // Vintage
    { id: 'vintageFilm',   name: 'Vintage Film',  category: 'vintage',  icon: '🎞️', apply: (d, p) => blendIntensity(d, vintageFilm(d), p?.intensity ?? 1) },
    { id: 'kodachrome',    name: 'Kodachrome',    category: 'vintage',  icon: '📷', apply: (d, p) => blendIntensity(d, kodachrome(d), p?.intensity ?? 1) },
    { id: 'polaroid',      name: 'Polaroid',      category: 'vintage',  icon: '📸', apply: (d, p) => blendIntensity(d, polaroid(d), p?.intensity ?? 1) },
    { id: 'technicolor',   name: 'Technicolor',   category: 'vintage',  icon: '🎬', apply: (d, p) => blendIntensity(d, technicolor(d), p?.intensity ?? 1) },
    { id: 'brownie',       name: 'Brownie',       category: 'vintage',  icon: '🍫', apply: (d, p) => blendIntensity(d, brownie(d), p?.intensity ?? 1) },
    { id: 'crossProcess',  name: 'Cross Process', category: 'vintage',  icon: '🧪', apply: (d, p) => blendIntensity(d, crossProcess(d), p?.intensity ?? 1) },

    // Artistic
    { id: 'pencilSketch',  name: 'Ołówek',        category: 'artistic', icon: '✏️', apply: (d, p) => blendIntensity(d, pencilSketch(d), p?.intensity ?? 1) },
    { id: 'oilPainting',   name: 'Olej',          category: 'artistic', icon: '🎨', apply: (d, p) => blendIntensity(d, oilPainting(d), p?.intensity ?? 1) },
    { id: 'watercolor',    name: 'Akwarela',      category: 'artistic', icon: '🖌️', apply: (d, p) => blendIntensity(d, watercolor(d), p?.intensity ?? 1) },
    { id: 'comicBook',     name: 'Komiks',        category: 'artistic', icon: '💬', apply: (d, p) => blendIntensity(d, comicBook(d), p?.intensity ?? 1) },
    { id: 'posterize',     name: 'Plakat',        category: 'artistic', icon: '🖼️', apply: (d, p) => blendIntensity(d, posterize(d, 5), p?.intensity ?? 1) },
    { id: 'emboss',        name: 'Płaskorzeźba',  category: 'artistic', icon: '🗿', apply: (d, p) => blendIntensity(d, emboss(d), p?.intensity ?? 1) },
    { id: 'edgeDetect',    name: 'Krawędzie',     category: 'artistic', icon: '🔍', apply: (d, p) => blendIntensity(d, edgeDetect(d), p?.intensity ?? 1) },
    { id: 'tiltShift',     name: 'Tilt Shift',    category: 'artistic', icon: '🔭', apply: (d, p) => blendIntensity(d, tiltShift(d), p?.intensity ?? 1) },

    // Fun
    { id: 'cyberpunk',     name: 'Cyberpunk',     category: 'fun',      icon: '🤖', apply: (d, p) => blendIntensity(d, cyberpunk(d), p?.intensity ?? 1) },
    { id: 'retroWave',     name: 'Retrowave',     category: 'fun',      icon: '🕹️', apply: (d, p) => blendIntensity(d, retroWave(d), p?.intensity ?? 1) },
    { id: 'nightVision',   name: 'Night Vision',  category: 'fun',      icon: '🌙', apply: (d, p) => blendIntensity(d, nightVision(d), p?.intensity ?? 1) },
    { id: 'xRay',          name: 'X-Ray',         category: 'fun',      icon: '☠️', apply: (d, p) => blendIntensity(d, xRay(d), p?.intensity ?? 1) },
    { id: 'heatMap',       name: 'Heat Map',      category: 'fun',      icon: '🔥', apply: (d, p) => blendIntensity(d, heatMap(d), p?.intensity ?? 1) },
    { id: 'radioactive',   name: 'Radioactive',   category: 'fun',      icon: '☢️', apply: (d, p) => blendIntensity(d, radioactive(d), p?.intensity ?? 1) },
    { id: 'glitch',        name: 'Glitch',        category: 'fun',      icon: '📺', apply: (d, p) => blendIntensity(d, glitch(d), p?.intensity ?? 1) },
    { id: 'pixelate',      name: 'Piksele',       category: 'fun',      icon: '🟩', apply: (d, p) => blendIntensity(d, pixelate(d), p?.intensity ?? 1) },
    { id: 'frostedGlass',  name: 'Matowe szkło',  category: 'fun',      icon: '🧊', apply: (d, p) => blendIntensity(d, frostedGlass(d), p?.intensity ?? 1) },
    { id: 'solarize',      name: 'Solaryzacja',   category: 'fun',      icon: '🌞', apply: (d, p) => blendIntensity(d, solarize(d), p?.intensity ?? 1) },
];

/** Get filter by ID */
export function getFilter(id: string): FilterDefinition | undefined {
    return PHOTO_FILTERS.find(f => f.id === id);
}

/** Apply adjustments to ImageData */
export function applyAdjustments(data: ImageData, adj: Partial<AdjustmentValues>): ImageData {
    let out = data;
    if (adj.exposure && adj.exposure !== 0)     out = adjustExposure(out, adj.exposure);
    if (adj.brightness && adj.brightness !== 0) out = adjustBrightness(out, adj.brightness);
    if (adj.contrast && adj.contrast !== 0)     out = adjustContrast(out, adj.contrast);
    if (adj.saturation && adj.saturation !== 0) out = adjustSaturation(out, adj.saturation);
    if (adj.temperature && adj.temperature !== 0) out = adjustTemperature(out, adj.temperature);
    if (adj.tint && adj.tint !== 0)             out = adjustTint(out, adj.tint);
    if (adj.highlights && adj.highlights !== 0) out = adjustHighlights(out, adj.highlights);
    if (adj.shadows && adj.shadows !== 0)       out = adjustShadows(out, adj.shadows);
    if (adj.sharpness && adj.sharpness > 0)     out = sharpen(out, adj.sharpness / 100);
    return out;
}

/** Full pipeline: filter + adjustments → canvas, then vignette & grain via context */
export function renderToCanvas(
    canvas: HTMLCanvasElement,
    sourceImage: HTMLImageElement,
    filterId: string,
    filterParams: FilterParams,
    adjustments: Partial<AdjustmentValues>,
    cropRect?: { x: number; y: number; w: number; h: number } | null,
    rotation?: number,
    flipH?: boolean,
    flipV?: boolean,
) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Source dimensions
    const sw = sourceImage.naturalWidth;
    const sh = sourceImage.naturalHeight;

    // Crop region (in source pixels)
    const crop = cropRect ?? { x: 0, y: 0, w: sw, h: sh };

    // Rotation affects output dimensions
    const rot = ((rotation ?? 0) % 360 + 360) % 360;
    const swapped = rot === 90 || rot === 270;
    const outW = swapped ? crop.h : crop.w;
    const outH = swapped ? crop.w : crop.h;

    canvas.width = outW;
    canvas.height = outH;

    ctx.save();
    ctx.translate(outW / 2, outH / 2);
    if (rot) ctx.rotate((rot * Math.PI) / 180);
    if (flipH) ctx.scale(-1, 1);
    if (flipV) ctx.scale(1, -1);
    ctx.drawImage(sourceImage, crop.x, crop.y, crop.w, crop.h, -crop.w / 2, -crop.h / 2, crop.w, crop.h);
    ctx.restore();

    // Apply filter
    if (filterId && filterId !== 'none') {
        const filter = getFilter(filterId);
        if (filter) {
            const imgData = ctx.getImageData(0, 0, outW, outH);
            const filtered = filter.apply(imgData, filterParams);
            ctx.putImageData(filtered, 0, 0);
        }
    }

    // Apply adjustments
    const hasAdj = Object.values(adjustments).some(v => v !== 0 && v !== undefined);
    if (hasAdj) {
        const imgData = ctx.getImageData(0, 0, outW, outH);
        const adjusted = applyAdjustments(imgData, adjustments);
        ctx.putImageData(adjusted, 0, 0);
    }

    // Vignette & grain (applied via context drawing)
    if (adjustments.vignette && adjustments.vignette > 0) {
        applyVignette(ctx, outW, outH, adjustments.vignette);
    }
    if (adjustments.grain && adjustments.grain > 0) {
        applyGrain(ctx, outW, outH, adjustments.grain);
    }
}

/** Export canvas as File (for upload) */
export function canvasToFile(canvas: HTMLCanvasElement, filename = 'photo.jpg', quality = 0.92): Promise<File> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            blob => {
                if (!blob) return reject(new Error('Canvas toBlob failed'));
                resolve(new File([blob], filename, { type: 'image/jpeg' }));
            },
            'image/jpeg',
            quality,
        );
    });
}
