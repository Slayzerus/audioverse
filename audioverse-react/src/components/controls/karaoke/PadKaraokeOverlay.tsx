/**
 * PadKaraokeOverlay — visual overlay for pad karaoke mode.
 *
 * Shows:
 * - Lane indicators at the bottom with key labels
 * - Upcoming notes flowing down into the lanes
 * - Hit/miss feedback flashes
 * - Current note indicator
 */
import React, { useEffect, useRef } from 'react';
import { PadLane, PadNoteEvent, PadHitFeedback, PadDifficulty } from '../../../scripts/karaoke/padNotePlayer';

// ─── Props ────────────────────────────────────────────────────────────────────

interface PadKaraokeOverlayProps {
  lanes: PadLane[];
  events: PadNoteEvent[];
  currentTime: number;
  activeLanes: boolean[];
  difficulty: PadDifficulty;
  feedbackQueue: PadHitFeedback[];
  isPlaying: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LANE_HEIGHT = 60;          // height of the key indicators at bottom
const NOTE_PREVIEW_WINDOW = 4;   // seconds of upcoming notes to show
const OVERLAY_HEIGHT = 300;      // total overlay height

// ─── Component ────────────────────────────────────────────────────────────────

const PadKaraokeOverlay: React.FC<PadKaraokeOverlayProps> = ({
  lanes,
  events,
  currentTime,
  activeLanes,
  difficulty,
  feedbackQueue,
  isPlaying,
}) => {
  const laneCount = lanes.length;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const feedbackRef = useRef<PadHitFeedback[]>([]);

  // Keep feedback in sync
  useEffect(() => {
    feedbackRef.current = feedbackQueue;
  }, [feedbackQueue]);

  // Canvas-based rendering for performance
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, w, h);

    const laneWidth = w / laneCount;

    // ─── Background lanes (subtle vertical stripes) ───────────────────
    for (let i = 0; i < laneCount; i++) {
      const x = i * laneWidth;
      ctx.fillStyle = i % 2 === 0 ? 'var(--pad-stripe-a, rgba(255,255,255,0.03))' : 'var(--pad-stripe-b, rgba(255,255,255,0.01))';
      ctx.fillRect(x, 0, laneWidth, h);

      // Lane separator lines
      if (i > 0) {
        ctx.strokeStyle = 'var(--pad-separator, rgba(255,255,255,0.1))';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
    }

    // ─── Hit zone line ────────────────────────────────────────────────
    const hitZoneY = h - LANE_HEIGHT - 10;
    ctx.strokeStyle = 'var(--pad-hitline, rgba(255,255,255,0.4))';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(0, hitZoneY);
    ctx.lineTo(w, hitZoneY);
    ctx.stroke();
    ctx.setLineDash([]);

    // ─── Upcoming notes ───────────────────────────────────────────────
    const pixelsPerSec = (h - LANE_HEIGHT - 20) / NOTE_PREVIEW_WINDOW;

    for (const ev of events) {
      const noteStart = ev.note.startTime;
      const noteEnd = noteStart + ev.note.duration;

      // Notes that are within the preview window
      const timeDiff = noteStart - currentTime;
      if (timeDiff > NOTE_PREVIEW_WINDOW || noteEnd < currentTime - 0.5) continue;

      const lane = ev.lane;
      const x = lane * laneWidth + 4;
      const noteW = laneWidth - 8;

      // Y position: notes flow downward, hit zone = hitZoneY when timeDiff = 0
      const y = hitZoneY - (timeDiff * pixelsPerSec);
      const durPx = ev.note.duration * pixelsPerSec;

      // Determine if note is currently active
      const isActive = currentTime >= noteStart - 0.15 && currentTime <= noteEnd + 0.15;
      const isPast = currentTime > noteEnd + 0.15;

      // Color based on state
      const laneColor = lanes[lane]?.color ?? '#888';
      if (isPast) {
        ctx.fillStyle = 'var(--pad-note-past, rgba(100,100,100,0.3))';
      } else if (isActive) {
        // Glow when active
        ctx.fillStyle = laneColor;
        ctx.shadowColor = laneColor;
        ctx.shadowBlur = 12;
      } else {
        ctx.fillStyle = laneColor + '99'; // semi-transparent
      }

      // Draw note bar (rounded rect)
      const barH = Math.max(durPx, 8);
      const radius = 6;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + noteW - radius, y);
      ctx.quadraticCurveTo(x + noteW, y, x + noteW, y + radius);
      ctx.lineTo(x + noteW, y + barH - radius);
      ctx.quadraticCurveTo(x + noteW, y + barH, x + noteW - radius, y + barH);
      ctx.lineTo(x + radius, y + barH);
      ctx.quadraticCurveTo(x, y + barH, x, y + barH - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Gold star for golden notes
      if (ev.note.isGold) {
        ctx.fillStyle = 'var(--gold-star, #fbbf24)';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★', x + noteW / 2, y + barH / 2 + 5);
      }
    }

    // ─── Lane key indicators (bottom) ─────────────────────────────────
    for (let i = 0; i < laneCount; i++) {
      const x = i * laneWidth;
      const y = h - LANE_HEIGHT;
      const isActive = activeLanes[i];
      const laneColor = lanes[i]?.color ?? '#888';

      // Background
      ctx.fillStyle = isActive
        ? laneColor
        : 'var(--pad-bg, rgba(30,30,30,0.9))';
      ctx.fillRect(x + 2, y + 2, laneWidth - 4, LANE_HEIGHT - 4);

      // Border
      ctx.strokeStyle = isActive ? 'var(--text-on-light, #fff)' : laneColor;
      ctx.lineWidth = isActive ? 3 : 1;
      ctx.strokeRect(x + 2, y + 2, laneWidth - 4, LANE_HEIGHT - 4);

      // Key label
      ctx.fillStyle = isActive ? 'var(--text-on-dark, #000)' : 'var(--text-on-light, #fff)';
      ctx.font = `bold ${Math.min(24, laneWidth * 0.3)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(lanes[i]?.label ?? '', x + laneWidth / 2, y + LANE_HEIGHT / 2);

      // Gamepad button label (smaller, below key)
      const btnLabels = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT'];
      const btnIdx = lanes[i]?.gamepadButton ?? -1;
      if (btnIdx >= 0 && btnIdx < btnLabels.length) {
        ctx.fillStyle = isActive ? 'var(--pad-btn-on-dark, rgba(0,0,0,0.6))' : 'var(--pad-btn-on-light, rgba(255,255,255,0.4))';
        ctx.font = `10px sans-serif`;
        ctx.fillText(btnLabels[btnIdx], x + laneWidth / 2, y + LANE_HEIGHT - 8);
      }
    }

    // ─── Feedback flashes ─────────────────────────────────────────────
    for (const fb of feedbackRef.current) {
      const age = currentTime - fb.time;
      if (age < 0 || age > 0.8) continue;
      const alpha = Math.max(0, 1 - age / 0.8);
      const lx = fb.lane * laneWidth;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `bold 20px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';

      if (fb.type === 'perfect') {
        ctx.fillStyle = 'var(--success, #10b981)';
        ctx.fillText('PERFECT', lx + laneWidth / 2, hitZoneY - 10 - age * 40);
      } else if (fb.type === 'good') {
        ctx.fillStyle = 'var(--warning, #f59e0b)';
        ctx.fillText('GOOD', lx + laneWidth / 2, hitZoneY - 10 - age * 40);
      } else {
        ctx.fillStyle = 'var(--error, #ef4444)';
        ctx.fillText('MISS', lx + laneWidth / 2, hitZoneY - 10 - age * 40);
      }
      ctx.restore();
    }

  }, [currentTime, lanes, events, activeLanes, laneCount, isPlaying]);

  if (!isPlaying || laneCount === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: OVERLAY_HEIGHT,
        zIndex: 35,
        pointerEvents: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Pad karaoke note highway — hit notes in time with the music"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
      {/* Difficulty badge */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 12,
          background: 'var(--pad-badge-bg, rgba(0,0,0,0.6))',
          color: 'var(--btn-text, #fff)',
          padding: '4px 12px',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        🎮 PAD — {difficulty}
      </div>
    </div>
  );
};

export default PadKaraokeOverlay;
