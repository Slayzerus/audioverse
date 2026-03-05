/**
 * Alternative animation strategies for the karaoke timeline.
 *
 * Each strategy draws the "indicator" (ball/wipe/pulse/bounce) at the given
 * position on the canvas. The existing ball+trail+paint logic is the 'ball' mode.
 * These alternatives are drawn INSTEAD of the ball code path when a different
 * animationMode is selected.
 */

import type { KaraokeAnimMode } from "./karaokeDisplaySettings";

export interface AnimDrawParams {
    ctx: CanvasRenderingContext2D;
    ballX: number;
    ballY: number;
    ballRadius: number;
    playerColor: string;
    ballIsGold: boolean;
    currentTime: number;
    width: number;
    height: number;
    /** Notes currently visible on screen, mapped to pixel coords */
    visibleNotes: { x: number; y: number; w: number; h: number; isGold?: boolean; isSung?: boolean }[];
}

// ─── Wipe mode ────────────────────────────────────────────────
// A vertical color wipe sweeps across note bars instead of a ball.
function drawWipeMode(p: AnimDrawParams): void {
    const { ctx, ballX, height, playerColor, currentTime } = p;

    // Vertical wipe line
    ctx.save();
    ctx.globalCompositeOperation = "source-over";

    // Wipe everything to the left of the cursor with player color overlay
    const wipeGrad = ctx.createLinearGradient(Math.max(0, ballX - 60), 0, ballX, 0);
    wipeGrad.addColorStop(0, "rgba(0,0,0,0)");
    wipeGrad.addColorStop(1, playerColor);
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = wipeGrad;
    ctx.fillRect(Math.max(0, ballX - 60), 0, 60, height);

    // Vertical cursor line
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = playerColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = playerColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(ballX, 0);
    ctx.lineTo(ballX, height);
    ctx.stroke();

    // Small diamond at cursor Y position
    const dSize = 6 + Math.sin(currentTime * 6) * 2;
    ctx.fillStyle = p.ballIsGold ? "#FFD700" : playerColor;
    ctx.beginPath();
    ctx.moveTo(ballX, p.ballY - dSize);
    ctx.lineTo(ballX + dSize * 0.7, p.ballY);
    ctx.lineTo(ballX, p.ballY + dSize);
    ctx.lineTo(ballX - dSize * 0.7, p.ballY);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Color fill on sung notes
    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    ctx.globalAlpha = 0.35;
    for (const note of p.visibleNotes) {
        if (!note.isSung) continue;
        ctx.fillStyle = note.isGold ? "#FFD700" : playerColor;
        ctx.fillRect(note.x, note.y, note.w, note.h);
    }
    ctx.restore();
}

// ─── Pulse mode ───────────────────────────────────────────────
// Active notes pulse/glow in concentric rings; no ball travels.
function drawPulseMode(p: AnimDrawParams): void {
    const { ctx, ballX, ballY, ballRadius, playerColor, ballIsGold, currentTime } = p;

    // Concentric expanding rings at cursor position
    const ringCount = 3;
    const baseRadius = ballRadius * 1.5;
    const time = currentTime * 4;

    ctx.save();
    for (let i = 0; i < ringCount; i++) {
        const phase = (time + i * 2.1) % (Math.PI * 2);
        const expand = Math.sin(phase) * 0.5 + 0.5; // 0..1
        const r = baseRadius + expand * ballRadius * 3;
        const alpha = (1 - expand) * 0.5;

        ctx.globalAlpha = alpha;
        ctx.strokeStyle = ballIsGold ? "#FFD700" : playerColor;
        ctx.lineWidth = 2 - expand;
        ctx.beginPath();
        ctx.arc(ballX, ballY, r, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Central glow dot
    ctx.globalAlpha = 0.8;
    ctx.shadowColor = ballIsGold ? "#FFD700" : playerColor;
    ctx.shadowBlur = 16 + Math.sin(currentTime * 8) * 4;
    ctx.fillStyle = ballIsGold ? "#FFF0A8" : playerColor;
    const dotSize = ballRadius * (0.8 + Math.sin(currentTime * 10) * 0.2);
    ctx.beginPath();
    ctx.arc(ballX, ballY, dotSize, 0, Math.PI * 2);
    ctx.fill();

    // Pulse highlight on active notes
    for (const note of p.visibleNotes) {
        if (!note.isSung) continue;
        const notePhase = (currentTime * 6 + note.x * 0.01) % (Math.PI * 2);
        const noteAlpha = 0.15 + Math.sin(notePhase) * 0.1;
        ctx.globalAlpha = noteAlpha;
        ctx.fillStyle = note.isGold ? "#FFD700" : playerColor;
        ctx.fillRect(note.x, note.y, note.w, note.h);
    }
    ctx.restore();
}

// ─── Bounce mode ──────────────────────────────────────────────
// Ball bounces between notes with an arc trajectory; no continuous trail.
function drawBounceMode(p: AnimDrawParams): void {
    const { ctx, ballX, ballY, ballRadius, playerColor, ballIsGold, currentTime } = p;

    // Bounce arc: ball follows a parabolic arc, varying Y above the target
    const bounceHeight = 20 + Math.abs(Math.sin(currentTime * 3)) * 15;
    const bouncePhase = (currentTime * 5) % (Math.PI * 2);
    const yOffset = -Math.abs(Math.sin(bouncePhase)) * bounceHeight;
    const drawY = ballY + yOffset;

    // Shadow on the "ground" (the note pitch line)
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    const shadowScale = 1 - Math.abs(yOffset) / (bounceHeight + 20);
    ctx.beginPath();
    ctx.ellipse(ballX, ballY + ballRadius * 0.5, ballRadius * shadowScale * 1.5, ballRadius * 0.3 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Trail of fading dots showing recent positions
    ctx.save();
    const trailCount = 5;
    for (let i = 0; i < trailCount; i++) {
        const tOffset = (i + 1) * 0.04;
        const pastPhase = ((currentTime - tOffset) * 5) % (Math.PI * 2);
        const pastY = ballY + (-Math.abs(Math.sin(pastPhase)) * bounceHeight);
        const alpha = 0.15 * (1 - i / trailCount);
        const size = ballRadius * (0.6 - i * 0.08);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = playerColor;
        ctx.beginPath();
        ctx.arc(ballX - i * 3, pastY, Math.max(2, size), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    // Draw the ball with stretch/squash
    ctx.save();
    const squash = 1 + Math.abs(Math.sin(bouncePhase)) * 0.15;
    const stretch = 1 / squash;

    ctx.translate(ballX, drawY);
    ctx.scale(stretch, squash);

    ctx.shadowColor = ballIsGold ? "#FFD700" : playerColor;
    ctx.shadowBlur = 12;
    ctx.fillStyle = ballIsGold ? "#FFF0A8" : playerColor;
    ctx.beginPath();
    ctx.arc(0, 0, ballRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.stroke();
    ctx.restore();

    // Small sparkle at landing points
    if (Math.abs(Math.sin(bouncePhase)) < 0.1) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = ballIsGold ? "#FFD700" : playerColor;
        for (let i = 0; i < 4; i++) {
            const ang = (i / 4) * Math.PI * 2 + currentTime;
            const sx = ballX + Math.cos(ang) * (ballRadius + 4);
            const sy = ballY + Math.sin(ang) * 2;
            ctx.beginPath();
            ctx.arc(sx, sy, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

/** Draw the alternative animation indicator based on the selected mode.
 *  Returns false if mode is 'ball' (caller should use existing code). */
export function drawAlternativeAnimation(mode: KaraokeAnimMode, params: AnimDrawParams): boolean {
    switch (mode) {
        case "wipe":
            drawWipeMode(params);
            return true;
        case "pulse":
            drawPulseMode(params);
            return true;
        case "bounce":
            drawBounceMode(params);
            return true;
        case "ball":
        default:
            return false; // use existing ball code
    }
}
