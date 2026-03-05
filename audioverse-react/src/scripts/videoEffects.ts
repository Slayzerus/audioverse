/**
 * videoEffects.ts — Video filter/effect engine for the VideoEditor.
 *
 * Works by rendering each video frame to a canvas and applying CSS-filter-style
 * adjustments plus custom pixel-manipulation effects in real time.
 *
 * The architecture mirrors photoFilters.ts but is optimised for 30 fps playback.
 */

// ── Types ──

export interface VideoAdjustments {
    brightness: number;   // -100..100
    contrast: number;     // -100..100
    saturation: number;   // -100..100
    exposure: number;     // -100..100
    temperature: number;  // -100..100
    hue: number;          // -180..180 degrees
    sharpness: number;    // 0..100
    vignette: number;     // 0..100
    blur: number;         // 0..20
    grain: number;        // 0..100
    fade: number;         // 0..100  (lighten blacks)
    sepia: number;        // 0..100
}

export const DEFAULT_VIDEO_ADJUSTMENTS: Readonly<VideoAdjustments> = {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    exposure: 0,
    temperature: 0,
    hue: 0,
    sharpness: 0,
    vignette: 0,
    blur: 0,
    grain: 0,
    fade: 0,
    sepia: 0,
};

export interface VideoFilterDef {
    id: string;
    name: string;
    icon: string;
    category: VideoFilterCategory;
    adjustments: Partial<VideoAdjustments>;
    /** Optional custom tint RGBA applied at low opacity */
    tint?: [number, number, number, number];
}

export type VideoFilterCategory = "all" | "color" | "cinematic" | "vintage" | "creative" | "fun";

// ── Filter library ──

export const VIDEO_FILTERS: VideoFilterDef[] = [
    { id: "none", name: "Brak", icon: "🚫", category: "all", adjustments: {} },

    // ── Color ──
    { id: "vivid", name: "Żywe", icon: "🎨", category: "color", adjustments: { saturation: 40, contrast: 15, brightness: 5 } },
    { id: "muted", name: "Wyciszone", icon: "🌫️", category: "color", adjustments: { saturation: -30, fade: 12 } },
    { id: "warm", name: "Ciepłe", icon: "🌅", category: "color", adjustments: { temperature: 30, saturation: 10, brightness: 5 } },
    { id: "cool", name: "Chłodne", icon: "❄️", category: "color", adjustments: { temperature: -30, saturation: 5 } },
    { id: "bw", name: "Czarno-białe", icon: "⬛", category: "color", adjustments: { saturation: -100, contrast: 20 } },
    { id: "highkey", name: "High-Key", icon: "☀️", category: "color", adjustments: { brightness: 25, contrast: -15, saturation: -15 } },
    { id: "lowkey", name: "Low-Key", icon: "🌑", category: "color", adjustments: { brightness: -20, contrast: 30, saturation: -10 } },

    // ── Cinematic ──
    { id: "teal_orange", name: "Teal & Orange", icon: "🎬", category: "cinematic", adjustments: { temperature: 20, saturation: 15, contrast: 20 }, tint: [0, 60, 80, 20] },
    { id: "blockbuster", name: "Blockbuster", icon: "🎥", category: "cinematic", adjustments: { contrast: 30, saturation: -10, brightness: -5 }, tint: [10, 20, 40, 15] },
    { id: "noir", name: "Film Noir", icon: "🕵️", category: "cinematic", adjustments: { saturation: -100, contrast: 40, brightness: -10, vignette: 40, grain: 15 } },
    { id: "bleach", name: "Bleach Bypass", icon: "🧪", category: "cinematic", adjustments: { saturation: -40, contrast: 35, brightness: 5 } },
    { id: "golden_hour", name: "Złota godzina", icon: "🌇", category: "cinematic", adjustments: { temperature: 35, brightness: 10, saturation: 15, fade: 5 }, tint: [40, 25, 0, 12] },
    { id: "moonlight", name: "Światło księżycowe", icon: "🌙", category: "cinematic", adjustments: { temperature: -25, brightness: -10, contrast: 15, saturation: -20 }, tint: [0, 10, 30, 15] },

    // ── Vintage ──
    { id: "retro_70s", name: "Retro 70s", icon: "📻", category: "vintage", adjustments: { saturation: -15, temperature: 20, contrast: -10, fade: 20, grain: 20 }, tint: [30, 20, 0, 10] },
    { id: "vhs", name: "VHS", icon: "📼", category: "vintage", adjustments: { saturation: -20, brightness: 5, contrast: -8, grain: 30, blur: 0.5 }, tint: [10, 5, 20, 12] },
    { id: "polaroid", name: "Polaroid", icon: "📸", category: "vintage", adjustments: { saturation: -15, temperature: 15, brightness: 8, contrast: -5, fade: 10 } },
    { id: "cross_process", name: "Cross Process", icon: "🔄", category: "vintage", adjustments: { saturation: 20, contrast: 25, temperature: -10, hue: 15 }, tint: [0, 20, 10, 10] },
    { id: "sepia_tone", name: "Sepia", icon: "🟤", category: "vintage", adjustments: { saturation: -60, brightness: 5, sepia: 60 } },

    // ── Creative ──
    { id: "neon", name: "Neon", icon: "💜", category: "creative", adjustments: { saturation: 60, contrast: 30, brightness: 10 }, tint: [20, 0, 40, 12] },
    { id: "cyberpunk", name: "Cyberpunk", icon: "🤖", category: "creative", adjustments: { saturation: 40, contrast: 35, temperature: -15, hue: 10 }, tint: [30, 0, 40, 15] },
    { id: "dreamy", name: "Sennik", icon: "💭", category: "creative", adjustments: { blur: 1.5, brightness: 15, saturation: 10, contrast: -10, fade: 15 } },
    { id: "hdr", name: "HDR", icon: "📱", category: "creative", adjustments: { contrast: 35, saturation: 25, sharpness: 40, brightness: 5 } },
    { id: "lomo", name: "Lomo", icon: "🔍", category: "creative", adjustments: { saturation: 30, contrast: 20, vignette: 50, brightness: 5 } },

    // ── Fun ──
    { id: "sunset_glow", name: "Zachód słońca", icon: "🌄", category: "fun", adjustments: { temperature: 40, saturation: 25, brightness: 8 }, tint: [50, 20, 0, 15] },
    { id: "arctic", name: "Arktyka", icon: "🧊", category: "fun", adjustments: { temperature: -40, brightness: 10, saturation: -10 }, tint: [0, 20, 50, 12] },
    { id: "horror", name: "Horror", icon: "👻", category: "fun", adjustments: { saturation: -40, contrast: 30, brightness: -15, grain: 20, vignette: 50 }, tint: [0, 10, 0, 10] },
    { id: "pop_art", name: "Pop Art", icon: "🎨", category: "fun", adjustments: { saturation: 80, contrast: 40, brightness: 10 } },
    { id: "infrared", name: "Podczerwień", icon: "🔴", category: "fun", adjustments: { hue: 180, saturation: 30, contrast: 15 }, tint: [30, 0, 10, 10] },
];

// ── Transition definitions ──

export type TransitionKind = "none" | "fade" | "dissolve" | "wipe_left" | "wipe_right" | "wipe_up" | "wipe_down"
    | "zoom_in" | "zoom_out" | "blur_in" | "blur_out" | "slide_left" | "slide_right" | "kenburns";

export interface TransitionDef {
    id: TransitionKind;
    name: string;
    icon: string;
}

export const VIDEO_TRANSITIONS: TransitionDef[] = [
    { id: "none",        name: "Brak",             icon: "🚫" },
    { id: "fade",        name: "Zanikanie",        icon: "🌗" },
    { id: "dissolve",    name: "Rozpuszczenie",    icon: "💫" },
    { id: "wipe_left",   name: "Wycieranie ←",     icon: "⬅️" },
    { id: "wipe_right",  name: "Wycieranie →",     icon: "➡️" },
    { id: "wipe_up",     name: "Wycieranie ↑",     icon: "⬆️" },
    { id: "wipe_down",   name: "Wycieranie ↓",     icon: "⬇️" },
    { id: "zoom_in",     name: "Zoom przybliżenie",icon: "🔎" },
    { id: "zoom_out",    name: "Zoom oddalenie",   icon: "🔍" },
    { id: "blur_in",     name: "Rozmycie wejście", icon: "🌀" },
    { id: "blur_out",    name: "Rozmycie wyjście", icon: "💨" },
    { id: "slide_left",  name: "Przesunięcie ←",   icon: "📤" },
    { id: "slide_right", name: "Przesunięcie →",   icon: "📥" },
    { id: "kenburns",    name: "Ken Burns",        icon: "🎞️" },
];

// ── Text overlay for video ──

export interface VideoTextOverlay {
    id: string;
    text: string;
    x: number;           // fraction 0..1
    y: number;
    fontSize: number;    // px at 1080p
    color: string;
    bold: boolean;
    italic: boolean;
    outline: boolean;
    outlineColor: string;
    bg: boolean;
    bgColor: string;
    startTime: number;   // seconds
    endTime: number;     // seconds
    animation: TextAnimation;
}

export type TextAnimation = "none" | "fade_in" | "slide_up" | "typewriter" | "bounce" | "scale_in";

export const TEXT_ANIMATIONS: { id: TextAnimation; name: string; icon: string }[] = [
    { id: "none",       name: "Brak",        icon: "—" },
    { id: "fade_in",    name: "Zanikanie",   icon: "🌗" },
    { id: "slide_up",   name: "Wjazd ↑",    icon: "⬆️" },
    { id: "typewriter", name: "Maszyna",     icon: "⌨️" },
    { id: "bounce",     name: "Odbicie",     icon: "🏀" },
    { id: "scale_in",   name: "Powiększenie",icon: "🔎" },
];

// ── Speed presets ──

export interface SpeedPreset {
    id: string;
    label: string;
    rate: number;
    icon: string;
}

export const SPEED_PRESETS: SpeedPreset[] = [
    { id: "0.25x", label: "0.25×", rate: 0.25, icon: "🐌" },
    { id: "0.5x",  label: "0.5×",  rate: 0.5,  icon: "🐢" },
    { id: "0.75x", label: "0.75×", rate: 0.75, icon: "🚶" },
    { id: "1x",    label: "1×",    rate: 1,    icon: "▶️" },
    { id: "1.25x", label: "1.25×", rate: 1.25, icon: "🏃" },
    { id: "1.5x",  label: "1.5×",  rate: 1.5,  icon: "🚀" },
    { id: "2x",    label: "2×",    rate: 2,    icon: "⚡" },
    { id: "3x",    label: "3×",    rate: 3,    icon: "💨" },
];

// ── Video editor serialisable state ──

export interface VideoClipState {
    /** Which filter is applied */
    filterId: string;
    filterIntensity: number;
    /** Per-slider adjustments */
    adjustments: VideoAdjustments;
    /** Playback speed */
    speed: number;
    /** Trim points in seconds */
    trimStart: number;
    trimEnd: number;
    /** Rotation in 90° increments (0, 90, 180, 270) */
    rotation: number;
    flipH: boolean;
    flipV: boolean;
    /** Volume 0..1 */
    volume: number;
    /** Text overlays */
    textOverlays: VideoTextOverlay[];
    /** Transition at start */
    transitionIn: TransitionKind;
    /** Transition at end */
    transitionOut: TransitionKind;
    /** Transition duration seconds */
    transitionDuration: number;
}

export const DEFAULT_CLIP_STATE: Readonly<VideoClipState> = {
    filterId: "none",
    filterIntensity: 1,
    adjustments: { ...DEFAULT_VIDEO_ADJUSTMENTS },
    speed: 1,
    trimStart: 0,
    trimEnd: 0,
    rotation: 0,
    flipH: false,
    flipV: false,
    volume: 1,
    textOverlays: [],
    transitionIn: "none",
    transitionOut: "none",
    transitionDuration: 0.5,
};

// ── CSS filter string builder ──

/**
 * Build a CSS `filter` string from the video adjustments.
 * This is applied to the canvas context via ctx.filter (Chrome/Edge).
 * For broader support we also have a pixel-level fallback.
 */
export function buildCssFilter(adj: VideoAdjustments, intensity: number = 1): string {
    const lerp = (v: number) => v * intensity;
    const parts: string[] = [];

    // brightness: CSS expects 1 = normal, 0 = black, 2 = 2× bright
    const br = 1 + lerp(adj.brightness + adj.exposure * 0.5) / 100;
    if (Math.abs(br - 1) > 0.005) parts.push(`brightness(${br.toFixed(3)})`);

    // contrast
    const ct = 1 + lerp(adj.contrast) / 100;
    if (Math.abs(ct - 1) > 0.005) parts.push(`contrast(${ct.toFixed(3)})`);

    // saturate
    const st = 1 + lerp(adj.saturation) / 100;
    if (Math.abs(st - 1) > 0.005) parts.push(`saturate(${st.toFixed(3)})`);

    // hue-rotate
    const hr = lerp(adj.hue);
    if (Math.abs(hr) > 0.5) parts.push(`hue-rotate(${hr.toFixed(1)}deg)`);

    // sepia
    const sp = lerp(adj.sepia) / 100;
    if (sp > 0.005) parts.push(`sepia(${Math.min(sp, 1).toFixed(3)})`);

    // blur
    const bl = lerp(adj.blur);
    if (bl > 0.05) parts.push(`blur(${bl.toFixed(1)}px)`);

    return parts.length > 0 ? parts.join(" ") : "none";
}

// ── Frame renderer ──

/**
 * Render a single video frame to a target canvas with all effects applied.
 * Designed to be called from requestAnimationFrame at ~30fps.
 */
export function renderVideoFrame(
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    w: number,
    h: number,
    adj: VideoAdjustments,
    filterDef: VideoFilterDef | null,
    intensity: number,
    rotation: number,
    flipH: boolean,
    flipV: boolean,
): void {
    const merged: VideoAdjustments = { ...DEFAULT_VIDEO_ADJUSTMENTS };
    if (filterDef && filterDef.id !== "none") {
        for (const [k, v] of Object.entries(filterDef.adjustments)) {
            const key = k as keyof VideoAdjustments;
            merged[key] = merged[key] + (v as number) * intensity;
        }
    }
    for (const [k, v] of Object.entries(adj)) {
        const key = k as keyof VideoAdjustments;
        merged[key] = merged[key] + (v as number);
    }

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    // Apply rotation + flip transforms
    ctx.translate(w / 2, h / 2);
    if (rotation) ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.translate(-w / 2, -h / 2);

    // Apply CSS filter string if supported
    const cssFilter = buildCssFilter(merged, 1);
    if (cssFilter !== "none") {
        ctx.filter = cssFilter;
    }

    ctx.drawImage(video, 0, 0, w, h);
    ctx.filter = "none";

    // Apply tint
    if (filterDef?.tint) {
        const [r, g, b, a] = filterDef.tint;
        ctx.globalAlpha = (a * intensity) / 100;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
    }

    // Temperature (warm/cool overlay)
    const temp = merged.temperature;
    if (Math.abs(temp) > 1) {
        ctx.globalAlpha = Math.abs(temp) / 250;
        ctx.fillStyle = temp > 0 ? `rgba(255, 160, 50, 1)` : `rgba(50, 130, 255, 1)`;
        ctx.globalCompositeOperation = "overlay";
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
    }

    // Fade (lighten blacks)
    if (merged.fade > 1) {
        const fadeV = Math.min(merged.fade, 100) / 100;
        ctx.globalAlpha = fadeV * 0.5;
        ctx.fillStyle = "#444";
        ctx.globalCompositeOperation = "lighten";
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
    }

    // Vignette
    if (merged.vignette > 1) {
        const vg = merged.vignette / 100;
        const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.7);
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, `rgba(0,0,0,${(vg * 0.85).toFixed(2)})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }

    // Film grain
    if (merged.grain > 1) {
        const grainIntensity = merged.grain / 100;
        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;
        // Apply grain every 2nd pixel for perf
        for (let i = 0; i < d.length; i += 8) {
            const noise = (Math.random() - 0.5) * grainIntensity * 60;
            d[i] += noise;
            d[i + 1] += noise;
            d[i + 2] += noise;
        }
        ctx.putImageData(imgData, 0, 0);
    }

    ctx.restore();
}

// ── Transition renderer ──

/**
 * Apply a transition effect between two frames. `progress` is 0..1.
 * `fromCtx` has the "before" frame, `toCtx` has the "after" frame.
 * Result is drawn to `outCtx`.
 */
export function renderTransition(
    outCtx: CanvasRenderingContext2D,
    fromCanvas: HTMLCanvasElement | null,
    toCanvas: HTMLCanvasElement,
    w: number,
    h: number,
    kind: TransitionKind,
    progress: number,
): void {
    const p = Math.max(0, Math.min(1, progress));
    outCtx.clearRect(0, 0, w, h);

    switch (kind) {
        case "none":
            outCtx.drawImage(toCanvas, 0, 0, w, h);
            break;

        case "fade":
            if (fromCanvas) {
                outCtx.globalAlpha = 1 - p;
                outCtx.drawImage(fromCanvas, 0, 0, w, h);
            }
            outCtx.globalAlpha = p;
            outCtx.drawImage(toCanvas, 0, 0, w, h);
            outCtx.globalAlpha = 1;
            break;

        case "dissolve": {
            if (fromCanvas) {
                outCtx.drawImage(fromCanvas, 0, 0, w, h);
            }
            outCtx.globalAlpha = p;
            outCtx.drawImage(toCanvas, 0, 0, w, h);
            outCtx.globalAlpha = 1;
            break;
        }

        case "wipe_left":
            if (fromCanvas) outCtx.drawImage(fromCanvas, 0, 0, w, h);
            outCtx.drawImage(toCanvas, 0, 0, w, h, 0, 0, w * p, h);
            break;

        case "wipe_right":
            if (fromCanvas) outCtx.drawImage(fromCanvas, 0, 0, w, h);
            { const sx = w * (1 - p); outCtx.drawImage(toCanvas, sx, 0, w * p, h, sx, 0, w * p, h); }
            break;

        case "wipe_up":
            if (fromCanvas) outCtx.drawImage(fromCanvas, 0, 0, w, h);
            outCtx.drawImage(toCanvas, 0, 0, w, h, 0, 0, w, h * p);
            break;

        case "wipe_down":
            if (fromCanvas) outCtx.drawImage(fromCanvas, 0, 0, w, h);
            { const sy = h * (1 - p); outCtx.drawImage(toCanvas, 0, sy, w, h * p, 0, sy, w, h * p); }
            break;

        case "zoom_in":
            if (fromCanvas) {
                outCtx.globalAlpha = 1 - p;
                outCtx.drawImage(fromCanvas, 0, 0, w, h);
            }
            outCtx.globalAlpha = p;
            { const s = 0.5 + p * 0.5; const dx = (w - w * s) / 2; const dy = (h - h * s) / 2; outCtx.drawImage(toCanvas, dx, dy, w * s, h * s); }
            outCtx.globalAlpha = 1;
            break;

        case "zoom_out":
            if (fromCanvas) {
                const s2 = 1 + p * 0.5;
                const dx2 = (w - w * s2) / 2;
                const dy2 = (h - h * s2) / 2;
                outCtx.globalAlpha = 1 - p;
                outCtx.drawImage(fromCanvas, dx2, dy2, w * s2, h * s2);
            }
            outCtx.globalAlpha = p;
            outCtx.drawImage(toCanvas, 0, 0, w, h);
            outCtx.globalAlpha = 1;
            break;

        case "blur_in":
            outCtx.filter = `blur(${((1 - p) * 12).toFixed(1)}px)`;
            outCtx.drawImage(toCanvas, 0, 0, w, h);
            outCtx.filter = "none";
            break;

        case "blur_out":
            if (fromCanvas) {
                outCtx.filter = `blur(${(p * 12).toFixed(1)}px)`;
                outCtx.globalAlpha = 1 - p;
                outCtx.drawImage(fromCanvas, 0, 0, w, h);
                outCtx.filter = "none";
                outCtx.globalAlpha = 1;
            }
            outCtx.globalAlpha = p;
            outCtx.drawImage(toCanvas, 0, 0, w, h);
            outCtx.globalAlpha = 1;
            break;

        case "slide_left":
            if (fromCanvas) outCtx.drawImage(fromCanvas, -w * p, 0, w, h);
            outCtx.drawImage(toCanvas, w * (1 - p), 0, w, h);
            break;

        case "slide_right":
            if (fromCanvas) outCtx.drawImage(fromCanvas, w * p, 0, w, h);
            outCtx.drawImage(toCanvas, -w * (1 - p), 0, w, h);
            break;

        case "kenburns":
            // Slow zoom + pan from center
            { const kbS = 1 + p * 0.15; const kbDx = (w - w * kbS) / 2 - p * 20; const kbDy = (h - h * kbS) / 2; outCtx.drawImage(toCanvas, kbDx, kbDy, w * kbS, h * kbS); }
            break;
    }
}

// ── Text overlay renderer (for video) ──

export function renderVideoTextOverlay(
    ctx: CanvasRenderingContext2D,
    ov: VideoTextOverlay,
    w: number,
    h: number,
    currentTime: number,
): void {
    if (currentTime < ov.startTime || currentTime > ov.endTime) return;

    const elapsed = currentTime - ov.startTime;
    const dur = ov.endTime - ov.startTime;

    // Calculate animation progress (0..1)
    let animProgress = 1;
    const animDur = 0.5; // animation lasts 0.5s
    if (elapsed < animDur) animProgress = elapsed / animDur;

    const px = ov.x * w;
    const py = ov.y * h;
    const fs = ov.fontSize * (h / 1080); // scale relative to 1080p

    let drawAlpha = 1;
    let drawOffsetY = 0;
    let drawScale = 1;
    let charsToShow = ov.text.length;

    switch (ov.animation) {
        case "fade_in":
            drawAlpha = animProgress;
            break;
        case "slide_up":
            drawOffsetY = (1 - animProgress) * fs * 2;
            drawAlpha = animProgress;
            break;
        case "typewriter":
            charsToShow = Math.floor(animProgress * ov.text.length);
            break;
        case "bounce": {
            const t = animProgress;
            // Simple bounce easing
            if (t < 0.5) drawScale = 1 + Math.sin(t * Math.PI) * 0.3;
            else drawScale = 1;
            break;
        }
        case "scale_in":
            drawScale = 0.3 + animProgress * 0.7;
            drawAlpha = animProgress;
            break;
    }

    // Fade-out in last 0.3s
    const fadeOutStart = dur - 0.3;
    if (elapsed > fadeOutStart && dur > 0.5) {
        drawAlpha *= 1 - (elapsed - fadeOutStart) / 0.3;
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, drawAlpha));
    ctx.translate(px, py + drawOffsetY);
    if (drawScale !== 1) ctx.scale(drawScale, drawScale);

    const fontStyle = `${ov.italic ? "italic " : ""}${ov.bold ? "bold " : ""}${fs}px 'Segoe UI', sans-serif`;
    ctx.font = fontStyle;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const displayText = ov.text.slice(0, charsToShow);
    const lines = displayText.split("\n");
    const lineHeight = fs * 1.2;

    lines.forEach((line, i) => {
        const ly = (i - (lines.length - 1) / 2) * lineHeight;

        if (ov.bg) {
            const meas = ctx.measureText(line);
            const pad = fs * 0.3;
            ctx.fillStyle = ov.bgColor || "rgba(0,0,0,0.6)";
            ctx.fillRect(-meas.width / 2 - pad, ly - fs / 2 - pad / 2, meas.width + pad * 2, fs + pad);
        }

        if (ov.outline) {
            ctx.strokeStyle = ov.outlineColor || "#000000";
            ctx.lineWidth = Math.max(2, fs / 12);
            ctx.lineJoin = "round";
            ctx.strokeText(line, 0, ly);
        }

        ctx.fillStyle = ov.color;
        ctx.fillText(line, 0, ly);
    });

    ctx.restore();
}

// ── Serialisation ──

export function serializeVideoState(state: VideoClipState): string {
    return JSON.stringify(state);
}

export function deserializeVideoState(json: string): VideoClipState | null {
    try {
        return JSON.parse(json) as VideoClipState;
    } catch {
        /* Expected: JSON.parse may fail on malformed serialized state */
        return null;
    }
}

// ── Adjustment slider metadata (for UI) ──

export const VIDEO_ADJUSTMENT_SLIDERS: { key: keyof VideoAdjustments; label: string; min: number; max: number; icon: string }[] = [
    { key: "brightness",  label: "Jasność",      min: -100, max: 100, icon: "fa-sun-o" },
    { key: "contrast",    label: "Kontrast",     min: -100, max: 100, icon: "fa-adjust" },
    { key: "saturation",  label: "Nasycenie",    min: -100, max: 100, icon: "fa-tint" },
    { key: "exposure",    label: "Ekspozycja",   min: -100, max: 100, icon: "fa-circle-o" },
    { key: "temperature", label: "Temperatura",  min: -100, max: 100, icon: "fa-thermometer" },
    { key: "hue",         label: "Odcień",       min: -180, max: 180, icon: "fa-paint-brush" },
    { key: "sharpness",   label: "Ostrość",      min: 0,    max: 100, icon: "fa-bolt" },
    { key: "vignette",    label: "Winietowanie", min: 0,    max: 100, icon: "fa-circle" },
    { key: "blur",        label: "Rozmycie",     min: 0,    max: 20,  icon: "fa-low-vision" },
    { key: "grain",       label: "Ziarno",       min: 0,    max: 100, icon: "fa-braille" },
    { key: "fade",        label: "Wyblakłe",     min: 0,    max: 100, icon: "fa-eraser" },
    { key: "sepia",       label: "Sepia",        min: 0,    max: 100, icon: "fa-photo" },
];

/**
 * Format seconds → mm:ss.f
 */
export function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s.toFixed(1)}`;
}
