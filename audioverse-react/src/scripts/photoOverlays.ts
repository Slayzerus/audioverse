/**
 * photoOverlays.ts — Overlay / layer engine for PhotoEditor.
 *
 * Handles emojis, text, shapes, freehand drawing strokes, and decorative frames
 * as positioned layers on top of the base (filtered) image.
 *
 * All positions use **fractional coordinates** (0 … 1) relative to the rendered
 * canvas so overlays survive crop / resize changes.
 */

import type { AdjustmentValues } from "./photoFilters";

// ═══════════════════════════════════════════════════════════════
// ── Overlay types
// ═══════════════════════════════════════════════════════════════

export type OverlayType = "emoji" | "text" | "shape" | "drawing" | "frame";

export interface BaseOverlay {
    id: string;
    type: OverlayType;
    /** Centre X as fraction of canvas width  (0 … 1) */
    x: number;
    /** Centre Y as fraction of canvas height (0 … 1) */
    y: number;
    scaleX: number;
    scaleY: number;
    /** Degrees */
    rotation: number;
    /** 0 … 1 */
    opacity: number;
}

export interface EmojiOverlay extends BaseOverlay {
    type: "emoji";
    emoji: string;
    /** Base font size in px (before scale) */
    fontSize: number;
}

export interface TextOverlay extends BaseOverlay {
    type: "text";
    text: string;
    fontFamily: string;
    fontSize: number;
    color: string;
    bold: boolean;
    italic: boolean;
    outlineColor: string | null;
    outlineWidth: number;
    shadow: string | null;
    background: string | null;
    backgroundPadding: number;
}

export type ShapeKind =
    | "rect"
    | "circle"
    | "triangle"
    | "star"
    | "heart"
    | "arrow"
    | "diamond"
    | "hexagon"
    | "cross"
    | "lightning";

export interface ShapeOverlay extends BaseOverlay {
    type: "shape";
    shapeKind: ShapeKind;
    /** Base width / height in px */
    width: number;
    height: number;
    fillColor: string | null;
    strokeColor: string;
    strokeWidth: number;
}

export interface DrawingStroke {
    /** Array of [x, y] fractions (0 … 1) */
    points: [number, number][];
    color: string;
    width: number;
    opacity: number;
}

export interface DrawingOverlay extends BaseOverlay {
    type: "drawing";
    strokes: DrawingStroke[];
}

export type FrameStyleId =
    | "simple"
    | "double"
    | "rounded"
    | "polaroid"
    | "film"
    | "vintage"
    | "ornate"
    | "shadow"
    | "neon"
    | "torn";

export interface FrameOverlay extends BaseOverlay {
    type: "frame";
    frameStyle: FrameStyleId;
    color: string;
    /** Border thickness as fraction of min(w,h) */
    thickness: number;
}

export type Overlay =
    | EmojiOverlay
    | TextOverlay
    | ShapeOverlay
    | DrawingOverlay
    | FrameOverlay;

// ═══════════════════════════════════════════════════════════════
// ── Catalogues
// ═══════════════════════════════════════════════════════════════

// -- Emoji catalogue -------------------------------------------------

export interface EmojiCategory {
    id: string;
    label: string;
    icon: string;
    emojis: string[];
}

export const EMOJI_CATALOG: EmojiCategory[] = [
    {
        id: "faces",
        label: "Buźki",
        icon: "😊",
        emojis: [
            "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","😉","😊","😇",
            "🥰","😍","🤩","😘","😗","😚","😋","😛","😜","🤪","😝","🤑",
            "🤗","🤭","🤫","🤔","😐","😑","😶","🙄","😏","😣","😥","😮",
            "🤐","😯","😪","😫","🥱","😴","🤤","😌","😷","🤒","🤕","🤢",
            "🤮","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐",
            "😤","😡","🤬","😈","👿","💀","☠️","💩","🤡","👹","👻","👽","🤖",
        ],
    },
    {
        id: "gestures",
        label: "Gesty",
        icon: "👍",
        emojis: [
            "👍","👎","👊","✊","🤛","🤜","🤝","👏","🙌","🫶","👐","🤲",
            "🙏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","👇","☝️","✋",
            "🤚","🖐️","🖖","👋","🤏","✍️","💪","🦾","🦵","🦶","👂","👃",
            "👀","👁️","👅","👄",
        ],
    },
    {
        id: "hearts",
        label: "Serca",
        icon: "❤️",
        emojis: [
            "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","❤️‍🔥","💔","❣️",
            "💕","💞","💓","💗","💖","💘","💝","💟","♥️","💌","💋","💍","💎",
        ],
    },
    {
        id: "animals",
        label: "Zwierzki",
        icon: "🐶",
        emojis: [
            "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮",
            "🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧","🐦","🦆","🦅","🦉",
            "🦋","🐌","🐞","🐙","🐬","🐳","🦈","🐊","🐘","🦒","🦘","🐴","🦄",
        ],
    },
    {
        id: "party",
        label: "Impreza",
        icon: "🎉",
        emojis: [
            "🎉","🎊","🎈","🎁","🎀","🎃","🎄","🎆","🎇","✨","🏆","🏅",
            "🥇","🥈","🥉","🎪","🎭","🎨","🎬","🎤","🎧","🎼","🎵","🎶",
            "🎹","🥁","🎷","🎺","🎸","🎻","🎲","🎯","🎳","🕹️","🎮","🎰",
        ],
    },
    {
        id: "food",
        label: "Jedzenie",
        icon: "🍕",
        emojis: [
            "🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🍒","🍑","🥭",
            "🍍","🥝","🍅","🥑","🍆","🌽","🌶️","🍞","🧀","🥚","🍳","🥓",
            "🍗","🌭","🍔","🍟","🍕","🌮","🌯","🥪","🍝","🍜","🍣","🍤",
            "🍦","🍰","🎂","🍩","🍪","🍫","🍬","🍭","🍿","☕","🍵","🍺",
            "🍻","🥂","🍷","🍸","🍹","🧃","🍾",
        ],
    },
    {
        id: "nature",
        label: "Natura",
        icon: "🌸",
        emojis: [
            "🌸","🌺","🌹","🌻","🌼","💐","🌷","🌱","🪴","🌲","🌳","🌴",
            "🌵","🍀","☘️","🌿","🍃","🍂","🍁","🌊","🌈","☀️","🌤️","⛅",
            "☁️","🌧️","⛈️","🌩️","❄️","☃️","⛄","🔥","💧","💦","🌏","🌙",
            "🌟","💫","✨","☄️",
        ],
    },
    {
        id: "symbols",
        label: "Symbole",
        icon: "⚡",
        emojis: [
            "⚡","💥","🔥","✨","💫","🌟","⭐","💡","💣","🧨","🎯","♠️",
            "♥️","♦️","♣️","🔮","🧿","♻️","⚜️","⭕","✅","❌","➕","➖",
            "❗","❓","‼️","⁉️","💯","🔴","🟠","🟡","🟢","🔵","🟣","⚫",
            "⚪","🔺","🔻","🔶","🔷","🏳️","🏴","🚩","🏳️‍🌈",
        ],
    },
];

// -- Shape catalogue --------------------------------------------------

export interface ShapeDef {
    id: ShapeKind;
    label: string;
    icon: string;
}

export const SHAPE_CATALOG: ShapeDef[] = [
    { id: "rect",      label: "Prostokąt",  icon: "⬜" },
    { id: "circle",    label: "Koło",        icon: "⭕" },
    { id: "triangle",  label: "Trójkąt",    icon: "🔺" },
    { id: "star",      label: "Gwiazda",    icon: "⭐" },
    { id: "heart",     label: "Serce",      icon: "❤️" },
    { id: "arrow",     label: "Strzałka",   icon: "➡️" },
    { id: "diamond",   label: "Romb",       icon: "💎" },
    { id: "hexagon",   label: "Sześciokąt", icon: "⬡" },
    { id: "cross",     label: "Krzyżyk",    icon: "✚" },
    { id: "lightning", label: "Błyskawica", icon: "⚡" },
];

// -- Frame catalogue --------------------------------------------------

export interface FrameStyleDef {
    id: FrameStyleId;
    label: string;
    icon: string;
}

export const FRAME_CATALOG: FrameStyleDef[] = [
    { id: "simple",  label: "Prosta",      icon: "▪️" },
    { id: "double",  label: "Podwójna",    icon: "◻️" },
    { id: "rounded", label: "Zaokrąglona", icon: "⬜" },
    { id: "polaroid",label: "Polaroid",    icon: "📸" },
    { id: "film",    label: "Klisza",      icon: "🎞️" },
    { id: "vintage", label: "Vintage",     icon: "🖼️" },
    { id: "ornate",  label: "Ozdobna",     icon: "🏛️" },
    { id: "shadow",  label: "Cień",        icon: "🌑" },
    { id: "neon",    label: "Neon",        icon: "💡" },
    { id: "torn",    label: "Podarta",     icon: "📃" },
];

// ═══════════════════════════════════════════════════════════════
// ── ID generation
// ═══════════════════════════════════════════════════════════════

let _nextId = 1;
export function generateOverlayId(): string {
    return `ov-${_nextId++}-${Date.now().toString(36)}`;
}

// ═══════════════════════════════════════════════════════════════
// ── Rendering
// ═══════════════════════════════════════════════════════════════

/** Render all overlays to a canvas context. */
export function renderAllOverlays(
    ctx: CanvasRenderingContext2D,
    overlays: Overlay[],
    w: number,
    h: number,
) {
    for (const ov of overlays) renderSingleOverlay(ctx, ov, w, h);
}

function renderSingleOverlay(
    ctx: CanvasRenderingContext2D,
    ov: Overlay,
    w: number,
    h: number,
) {
    ctx.save();
    ctx.globalAlpha = ov.opacity;

    if (ov.type === "drawing") {
        renderDrawing(ctx, ov, w, h);
        ctx.restore();
        return;
    }
    if (ov.type === "frame") {
        renderFrame(ctx, ov, w, h);
        ctx.restore();
        return;
    }

    // Position-based overlays (emoji, text, shape)
    const cx = ov.x * w;
    const cy = ov.y * h;
    ctx.translate(cx, cy);
    ctx.rotate((ov.rotation * Math.PI) / 180);
    ctx.scale(ov.scaleX, ov.scaleY);

    switch (ov.type) {
        case "emoji":
            renderEmoji(ctx, ov);
            break;
        case "text":
            renderText(ctx, ov);
            break;
        case "shape":
            renderShape(ctx, ov);
            break;
    }
    ctx.restore();
}

// -- Emoji -------------------------------------------------------

function renderEmoji(ctx: CanvasRenderingContext2D, ov: EmojiOverlay) {
    ctx.font = `${ov.fontSize}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ov.emoji, 0, 0);
}

// -- Text --------------------------------------------------------

function renderText(ctx: CanvasRenderingContext2D, ov: TextOverlay) {
    const style = `${ov.italic ? "italic " : ""}${ov.bold ? "bold " : ""}`;
    ctx.font = `${style}${ov.fontSize}px ${ov.fontFamily || "Arial"},sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const lines = ov.text.split("\n");
    const lineH = ov.fontSize * 1.25;
    const totalH = lineH * lines.length;
    const startY = -(totalH / 2) + lineH / 2;

    // Background
    if (ov.background) {
        const maxW = Math.max(...lines.map(l => ctx.measureText(l).width));
        const pad = ov.backgroundPadding;
        ctx.fillStyle = ov.background;
        const rx = -(maxW / 2 + pad);
        const ry = startY - lineH / 2 - pad;
        roundRect(ctx, rx, ry, maxW + pad * 2, totalH + pad * 2, 6);
        ctx.fill();
    }

    // Shadow
    if (ov.shadow) {
        ctx.shadowColor = ov.shadow;
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
    }

    for (let i = 0; i < lines.length; i++) {
        const ly = startY + i * lineH;
        if (ov.outlineColor && ov.outlineWidth > 0) {
            ctx.strokeStyle = ov.outlineColor;
            ctx.lineWidth = ov.outlineWidth;
            ctx.lineJoin = "round";
            ctx.strokeText(lines[i], 0, ly);
        }
        ctx.fillStyle = ov.color;
        ctx.fillText(lines[i], 0, ly);
    }
    ctx.shadowColor = "transparent";
}

// -- Shape -------------------------------------------------------

function renderShape(ctx: CanvasRenderingContext2D, ov: ShapeOverlay) {
    drawShapePath(ctx, ov.shapeKind, ov.width, ov.height);
    if (ov.fillColor) {
        ctx.fillStyle = ov.fillColor;
        ctx.fill();
    }
    if (ov.strokeColor && ov.strokeWidth > 0) {
        ctx.strokeStyle = ov.strokeColor;
        ctx.lineWidth = ov.strokeWidth;
        ctx.stroke();
    }
}

function drawShapePath(ctx: CanvasRenderingContext2D, kind: ShapeKind, w: number, h: number) {
    const hw = w / 2, hh = h / 2;
    ctx.beginPath();
    switch (kind) {
        case "rect":
            ctx.rect(-hw, -hh, w, h);
            break;
        case "circle":
            ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
            break;
        case "triangle":
            ctx.moveTo(0, -hh);
            ctx.lineTo(hw, hh);
            ctx.lineTo(-hw, hh);
            ctx.closePath();
            break;
        case "star": {
            const spikes = 5, outer = Math.min(hw, hh), inner = outer * 0.4;
            for (let i = 0; i < spikes * 2; i++) {
                const r = i % 2 === 0 ? outer : inner;
                const a = (Math.PI * i) / spikes - Math.PI / 2;
                if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
                else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
            ctx.closePath();
            break;
        }
        case "heart": {
            const s = Math.min(hw, hh);
            ctx.moveTo(0, s * 0.4);
            ctx.bezierCurveTo(-s, -s * 0.2, -s * 0.6, -s, 0, -s * 0.4);
            ctx.bezierCurveTo(s * 0.6, -s, s, -s * 0.2, 0, s * 0.4);
            break;
        }
        case "arrow":
            ctx.moveTo(-hw, -hh * 0.3);
            ctx.lineTo(hw * 0.3, -hh * 0.3);
            ctx.lineTo(hw * 0.3, -hh);
            ctx.lineTo(hw, 0);
            ctx.lineTo(hw * 0.3, hh);
            ctx.lineTo(hw * 0.3, hh * 0.3);
            ctx.lineTo(-hw, hh * 0.3);
            ctx.closePath();
            break;
        case "diamond":
            ctx.moveTo(0, -hh);
            ctx.lineTo(hw, 0);
            ctx.lineTo(0, hh);
            ctx.lineTo(-hw, 0);
            ctx.closePath();
            break;
        case "hexagon":
            for (let i = 0; i < 6; i++) {
                const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                const r = Math.min(hw, hh);
                const px = Math.cos(a) * r, py = Math.sin(a) * r;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();
            break;
        case "cross": {
            const t = Math.min(hw, hh) * 0.3;
            ctx.moveTo(-t, -hh); ctx.lineTo(t, -hh); ctx.lineTo(t, -t);
            ctx.lineTo(hw, -t); ctx.lineTo(hw, t); ctx.lineTo(t, t);
            ctx.lineTo(t, hh); ctx.lineTo(-t, hh); ctx.lineTo(-t, t);
            ctx.lineTo(-hw, t); ctx.lineTo(-hw, -t); ctx.lineTo(-t, -t);
            ctx.closePath();
            break;
        }
        case "lightning": {
            const s = Math.min(hw, hh);
            ctx.moveTo(-s * 0.1, -s); ctx.lineTo(s * 0.5, -s * 0.1);
            ctx.lineTo(s * 0.05, -s * 0.1); ctx.lineTo(s * 0.4, s);
            ctx.lineTo(-s * 0.15, s * 0.15); ctx.lineTo(s * 0.05, s * 0.15);
            ctx.lineTo(-s * 0.4, -s * 0.5);
            ctx.closePath();
            break;
        }
    }
}

// -- Drawing (freehand strokes) ----------------------------------

function renderDrawing(ctx: CanvasRenderingContext2D, ov: DrawingOverlay, w: number, h: number) {
    for (const stroke of ov.strokes) {
        if (stroke.points.length < 2) continue;
        ctx.beginPath();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalAlpha = stroke.opacity;
        const [sx, sy] = stroke.points[0];
        ctx.moveTo(sx * w, sy * h);
        for (let i = 1; i < stroke.points.length; i++) {
            const [px, py] = stroke.points[i];
            ctx.lineTo(px * w, py * h);
        }
        ctx.stroke();
    }
}

// -- Canvas stroke (draw a live, in-progress stroke) -------------

export function renderLiveStroke(
    ctx: CanvasRenderingContext2D,
    points: [number, number][],
    color: string,
    width: number,
    canvasW: number,
    canvasH: number,
) {
    if (points.length < 2) return;
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(points[0][0] * canvasW, points[0][1] * canvasH);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0] * canvasW, points[i][1] * canvasH);
    }
    ctx.stroke();
    ctx.restore();
}

// -- Frame -------------------------------------------------------

function renderFrame(ctx: CanvasRenderingContext2D, ov: FrameOverlay, w: number, h: number) {
    const t = Math.min(w, h) * ov.thickness;
    ctx.strokeStyle = ov.color;
    ctx.fillStyle = ov.color;

    switch (ov.frameStyle) {
        case "simple":
            ctx.lineWidth = t;
            ctx.strokeRect(t / 2, t / 2, w - t, h - t);
            break;
        case "double":
            ctx.lineWidth = t * 0.3;
            ctx.strokeRect(t * 0.15, t * 0.15, w - t * 0.3, h - t * 0.3);
            ctx.strokeRect(t * 0.7, t * 0.7, w - t * 1.4, h - t * 1.4);
            break;
        case "rounded":
            ctx.lineWidth = t;
            roundRect(ctx, t / 2, t / 2, w - t, h - t, t * 2);
            ctx.stroke();
            break;
        case "polaroid":
            ctx.fillRect(0, 0, w, t);
            ctx.fillRect(0, 0, t, h);
            ctx.fillRect(w - t, 0, t, h);
            ctx.fillRect(0, h - t * 3, w, t * 3);
            break;
        case "film": {
            ctx.fillRect(0, 0, w, t);
            ctx.fillRect(0, h - t, w, t);
            const holeW = t * 0.5, holeH = t * 0.7;
            const count = Math.floor(w / (t * 1.5)) || 1;
            const spacing = w / (count + 1);
            ctx.fillStyle = "#111";
            for (let i = 1; i <= count; i++) {
                const cx = spacing * i;
                roundRect(ctx, cx - holeW / 2, (t - holeH) / 2, holeW, holeH, 2);
                ctx.fill();
                roundRect(ctx, cx - holeW / 2, h - t + (t - holeH) / 2, holeW, holeH, 2);
                ctx.fill();
            }
            break;
        }
        case "vintage": {
            ctx.lineWidth = t * 0.5;
            ctx.strokeRect(t * 0.25, t * 0.25, w - t * 0.5, h - t * 0.5);
            ctx.lineWidth = 1;
            ctx.strokeStyle = ov.color + "88";
            ctx.strokeRect(t, t, w - t * 2, h - t * 2);
            const os = t * 0.8;
            for (const [dx, dy] of [[0, 0], [w - os, 0], [0, h - os], [w - os, h - os]] as const) {
                ctx.beginPath();
                ctx.moveTo(dx + os * 0.2, dy + os * 0.2);
                ctx.lineTo(dx + os * 0.8, dy + os * 0.2);
                ctx.lineTo(dx + os * 0.5, dy + os * 0.5);
                ctx.lineTo(dx + os * 0.2, dy + os * 0.8);
                ctx.closePath();
                ctx.strokeStyle = ov.color;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
            break;
        }
        case "ornate": {
            ctx.lineWidth = t * 0.4;
            ctx.strokeRect(t * 0.2, t * 0.2, w - t * 0.4, h - t * 0.4);
            const cs = t * 1.5;
            ctx.lineWidth = 2;
            for (const [ox, oy, sx, sy] of [
                [0, 0, 1, 1], [w, 0, -1, 1], [0, h, 1, -1], [w, h, -1, -1],
            ] as [number, number, number, number][]) {
                ctx.save();
                ctx.translate(ox, oy);
                ctx.scale(sx, sy);
                ctx.beginPath();
                ctx.arc(cs * 0.3, cs * 0.3, cs * 0.2, 0, Math.PI * 1.5, true);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, cs * 0.5);
                ctx.quadraticCurveTo(cs * 0.5, cs * 0.5, cs * 0.5, 0);
                ctx.stroke();
                ctx.restore();
            }
            break;
        }
        case "shadow":
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = t * 2;
            ctx.shadowOffsetX = t * 0.5;
            ctx.shadowOffsetY = t * 0.5;
            ctx.lineWidth = t * 0.3;
            ctx.strokeRect(t, t, w - t * 2, h - t * 2);
            ctx.shadowColor = "transparent";
            break;
        case "neon":
            for (let i = 3; i >= 0; i--) {
                ctx.shadowColor = ov.color;
                ctx.shadowBlur = t * (i + 1) * 2;
                ctx.lineWidth = t * 0.2;
                ctx.strokeStyle = i === 0 ? "#fff" : ov.color;
                ctx.globalAlpha = i === 0 ? ov.opacity : 0.3 * ov.opacity;
                ctx.strokeRect(t, t, w - t * 2, h - t * 2);
            }
            ctx.shadowColor = "transparent";
            break;
        case "torn": {
            const step = 8;
            const seed = (i: number) => {
                const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
                return (x - Math.floor(x)) - 0.5;
            };
            // Top
            ctx.beginPath(); ctx.moveTo(0, 0);
            for (let i = 0, x = 0; x <= w; x += step, i++) ctx.lineTo(x, t + seed(i) * t * 0.8);
            ctx.lineTo(w, 0); ctx.closePath(); ctx.fill();
            // Bottom
            ctx.beginPath(); ctx.moveTo(0, h);
            for (let i = 0, x = 0; x <= w; x += step, i++) ctx.lineTo(x, h - t - seed(i + 1000) * t * 0.8);
            ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
            // Left
            ctx.beginPath(); ctx.moveTo(0, 0);
            for (let i = 0, y = 0; y <= h; y += step, i++) ctx.lineTo(t + seed(i + 2000) * t * 0.8, y);
            ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
            // Right
            ctx.beginPath(); ctx.moveTo(w, 0);
            for (let i = 0, y = 0; y <= h; y += step, i++) ctx.lineTo(w - t - seed(i + 3000) * t * 0.8, y);
            ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
            break;
        }
    }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// ═══════════════════════════════════════════════════════════════
// ── Hit testing
// ═══════════════════════════════════════════════════════════════

/**
 * Returns `true` when the point (px, py) in canvas-fraction space
 * hits the bounding box of the overlay (ignoring rotation).
 */
export function hitTestOverlay(
    ov: Overlay,
    px: number,
    py: number,
    _w: number,
    _h: number,
): boolean {
    if (ov.type === "drawing" || ov.type === "frame") return false;

    let hitW: number, hitH: number;
    switch (ov.type) {
        case "emoji":
            hitW = hitH = (ov.fontSize * ov.scaleX) / _w;
            break;
        case "text": {
            hitW = (ov.text.length * ov.fontSize * 0.55 * ov.scaleX) / _w;
            hitH = (ov.fontSize * 1.3 * ov.scaleY) / _h;
            break;
        }
        case "shape":
            hitW = (ov.width * ov.scaleX) / _w;
            hitH = (ov.height * ov.scaleY) / _h;
            break;
        default:
            return false;
    }

    const margin = 15 / _w;
    return Math.abs(px - ov.x) < hitW / 2 + margin && Math.abs(py - ov.y) < hitH / 2 + margin;
}

// ═══════════════════════════════════════════════════════════════
// ── Factory helpers
// ═══════════════════════════════════════════════════════════════

export function createEmojiOverlay(emoji: string, canvasW: number, canvasH: number): EmojiOverlay {
    return {
        id: generateOverlayId(),
        type: "emoji",
        x: 0.5, y: 0.5,
        scaleX: 1, scaleY: 1,
        rotation: 0, opacity: 1,
        emoji,
        fontSize: Math.round(Math.min(canvasW, canvasH) * 0.08),
    };
}

export function createTextOverlay(text = "Tekst"): TextOverlay {
    return {
        id: generateOverlayId(),
        type: "text",
        x: 0.5, y: 0.5,
        scaleX: 1, scaleY: 1,
        rotation: 0, opacity: 1,
        text,
        fontFamily: "Arial",
        fontSize: 36,
        color: "#ffffff",
        bold: true,
        italic: false,
        outlineColor: "#000000",
        outlineWidth: 2,
        shadow: null,
        background: null,
        backgroundPadding: 6,
    };
}

export function createShapeOverlay(kind: ShapeKind): ShapeOverlay {
    return {
        id: generateOverlayId(),
        type: "shape",
        x: 0.5, y: 0.5,
        scaleX: 1, scaleY: 1,
        rotation: 0, opacity: 1,
        shapeKind: kind,
        width: 100, height: 100,
        fillColor: null,
        strokeColor: "#ffffff",
        strokeWidth: 3,
    };
}

export function createDrawingOverlay(): DrawingOverlay {
    return {
        id: generateOverlayId(),
        type: "drawing",
        x: 0, y: 0,
        scaleX: 1, scaleY: 1,
        rotation: 0, opacity: 1,
        strokes: [],
    };
}

export function createFrameOverlay(style: FrameStyleId, color = "#ffffff"): FrameOverlay {
    return {
        id: generateOverlayId(),
        type: "frame",
        x: 0, y: 0,
        scaleX: 1, scaleY: 1,
        rotation: 0, opacity: 1,
        frameStyle: style,
        color,
        thickness: 0.03,
    };
}

// ═══════════════════════════════════════════════════════════════
// ── Serialisation  (for backend FiltersJson field)
// ═══════════════════════════════════════════════════════════════

export interface PhotoEditorState {
    filter: string;
    filterIntensity: number;
    adjustments: AdjustmentValues;
    rotation: number;
    flipH: boolean;
    flipV: boolean;
    cropRect: { x: number; y: number; w: number; h: number } | null;
    overlays: Overlay[];
}

export function serializeEditorState(state: PhotoEditorState): string {
    return JSON.stringify(state);
}

export function deserializeEditorState(json: string): PhotoEditorState | null {
    try {
        return JSON.parse(json) as PhotoEditorState;
    } catch {
        /* Expected: JSON.parse may fail on malformed serialized state */
        return null;
    }
}
