/**
 * textureCache.ts — Async image loader + cache for seamless bar textures.
 *
 * Usage:
 *   preloadTexture(url);                            // fire-and-forget preload
 *   const pat = getTexturePattern(ctx, url, scale);  // returns CanvasPattern | null
 *   const img = getCachedImage(url);                 // returns HTMLImageElement | null
 */

const imageCache = new Map<string, HTMLImageElement>();
const loadingSet = new Set<string>();
const failedSet = new Set<string>();

/**
 * Start loading a texture image. Resolves when the image is ready.
 * Subsequent calls with the same URL return the cached image immediately.
 */
export function preloadTexture(url: string): Promise<HTMLImageElement> {
    const cached = imageCache.get(url);
    if (cached) return Promise.resolve(cached);
    if (failedSet.has(url)) return Promise.reject(new Error(`Texture failed: ${url}`));

    if (loadingSet.has(url)) {
        // Already loading — wait for it
        return new Promise((resolve, reject) => {
            const check = () => {
                if (imageCache.has(url)) resolve(imageCache.get(url)!);
                else if (failedSet.has(url)) reject(new Error(`Texture failed: ${url}`));
                else requestAnimationFrame(check);
            };
            check();
        });
    }

    loadingSet.add(url);
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            imageCache.set(url, img);
            loadingSet.delete(url);
            resolve(img);
        };
        img.onerror = () => {
            loadingSet.delete(url);
            failedSet.add(url);
            reject(new Error(`Failed to load texture: ${url}`));
        };
        img.src = url;
    });
}

/** Get a cached image (null if not yet loaded) */
export function getCachedImage(url: string): HTMLImageElement | null {
    return imageCache.get(url) ?? null;
}

/**
 * Get a CanvasPattern for the texture, or null if not yet loaded.
 * Automatically starts loading if not cached.
 * Scale: 1.0 = natural size, <1 = shrunken tiles, >1 = enlarged tiles.
 */
export function getTexturePattern(
    ctx: CanvasRenderingContext2D,
    url: string,
    scale = 1.0,
): CanvasPattern | null {
    const img = imageCache.get(url);
    if (!img) {
        // Start loading (fire-and-forget)
        if (!loadingSet.has(url) && !failedSet.has(url)) {
            preloadTexture(url).catch(() => { /* silently fail */ });
        }
        return null;
    }

    const pattern = ctx.createPattern(img, 'repeat');
    if (!pattern) return null;

    if (scale !== 1.0) {
        const matrix = new DOMMatrix();
        matrix.scaleSelf(scale, scale);
        pattern.setTransform(matrix);
    }

    return pattern;
}

/**
 * Preload multiple texture URLs in parallel.
 */
export function preloadTextures(urls: (string | null | undefined)[]): void {
    for (const url of urls) {
        if (url) preloadTexture(url).catch(() => { /* Expected: texture preload may fail for missing/invalid URLs */ });
    }
}

// ────────────────────────────────────────────────
// Overlay pattern → CanvasPattern cache
// ────────────────────────────────────────────────

import type { OverlayPattern } from "./glossyBarPatterns";

/**
 * Cache key: "patternName|color|color2"
 * Value: rendered tile as HTMLImageElement (ready for ctx.createPattern)
 */
const patternImageCache = new Map<string, HTMLImageElement>();
const patternLoadingSet = new Set<string>();

function patternCacheKey(patternName: string, color: string, color2?: string | null): string {
    return `${patternName}|${color}|${color2 ?? ''}`;
}

/**
 * Render an OverlayPattern (SVG pattern definition) into a tile HTMLImageElement.
 * The tile can then be used with ctx.createPattern('repeat').
 */
function renderPatternTile(pattern: OverlayPattern, color: string, color2?: string | null): Promise<HTMLImageElement> {
    const key = patternCacheKey(pattern.name, color, color2);
    const cached = patternImageCache.get(key);
    if (cached) return Promise.resolve(cached);

    if (patternLoadingSet.has(key)) {
        return new Promise((resolve, reject) => {
            const check = () => {
                if (patternImageCache.has(key)) resolve(patternImageCache.get(key)!);
                else if (!patternLoadingSet.has(key)) reject(new Error(`Pattern render failed: ${key}`));
                else requestAnimationFrame(check);
            };
            check();
        });
    }

    patternLoadingSet.add(key);

    // Generate the SVG <pattern> element string
    const patId = 'p';
    const patSvg = pattern.mk(patId, color, color2 ?? undefined);

    // Extract width/height from the pattern element
    const wMatch = patSvg.match(/width="(\d+)"/);
    const hMatch = patSvg.match(/height="(\d+)"/);
    const tileW = wMatch ? parseInt(wMatch[1], 10) : 16;
    const tileH = hMatch ? parseInt(hMatch[1], 10) : 16;

    // Build a full SVG that fills a tile-sized rect with the pattern
    const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileW}" height="${tileH}">` +
        `<defs>${patSvg}</defs>` +
        `<rect width="${tileW}" height="${tileH}" fill="url(#${patId})"/>` +
        `</svg>`;

    const blob = new Blob([fullSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            patternImageCache.set(key, img);
            patternLoadingSet.delete(key);
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            patternLoadingSet.delete(key);
            URL.revokeObjectURL(url);
            reject(new Error(`Failed to render pattern tile: ${pattern.name}`));
        };
        img.src = url;
    });
}

/**
 * Get a CanvasPattern for an overlay pattern, or null if the tile isn't loaded yet.
 * Automatically starts rendering the tile in the background if not cached.
 */
export function getOverlayCanvasPattern(
    ctx: CanvasRenderingContext2D,
    pattern: OverlayPattern,
    color: string,
    color2?: string | null,
): CanvasPattern | null {
    const key = patternCacheKey(pattern.name, color, color2);
    const img = patternImageCache.get(key);
    if (!img) {
        // Start rendering (fire-and-forget)
        if (!patternLoadingSet.has(key)) {
            renderPatternTile(pattern, color, color2).catch(() => { /* silently fail */ });
        }
        return null;
    }
    return ctx.createPattern(img, 'repeat');
}
