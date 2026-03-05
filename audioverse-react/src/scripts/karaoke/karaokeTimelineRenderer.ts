import type { KaraokeNoteData } from './karaokeTimelineTypes';
import {
    cssColorToHex, roundedRect, hexToHsl, hslToCss, getParticleImage,
    GOLD_PARTICLE_LIFE_MS, GOLD_PARTICLE_COUNT, GOLD_PARTICLE_BASE_SPEED, GOLD_PARTICLE_BASE_SIZE,
    GOLD_GLOW_BLUR, GOLD_SHADOW_COLOR
} from './karaokeTimelineTypes';
import { hzToUltrastarPitch } from './karaokeNoteParsing';
import { resolveCssColor } from "../../utils/colorResolver";
import { drawAlternativeAnimation } from "./karaokeAnimations";
import type { KaraokeAnimMode } from "./karaokeDisplaySettings";
import { drawGlossyBarOnCanvas, getCapStyleByName, getPatternByName,
    DEFAULT_BAR_FILL, DEFAULT_EMPTY_BAR_FILL, DEFAULT_GOLD_FILLED_BAR_FILL, DEFAULT_GOLD_EMPTY_BAR_FILL,
    DEFAULT_FONT_SETTINGS } from "./glossyBarRenderer";
import type { PlayerKaraokeSettings, KaraokeBarFill, KaraokeFontSettings, CapStyle, OverlayPattern } from "./glossyBarRenderer";
import { getTexturePattern, getOverlayCanvasPattern } from "./textureCache";
import { getScoringPreset } from '../../constants/karaokeScoringConfig';
import { dkLog } from '../../constants/debugKaraoke';

// Offscreen persistent paint layer and mask
let paintLayer: HTMLCanvasElement | null = null;
let paintCtx: CanvasRenderingContext2D | null = null;
let barsMask: HTMLCanvasElement | null = null;
let barsMaskCtx: CanvasRenderingContext2D | null = null;
// Offscreen persistent gap paint (for painting in areas without bars)
let gapPaintLayer: HTMLCanvasElement | null = null;
let gapPaintCtx: CanvasRenderingContext2D | null = null;
// Last loaded song id to clear persistent layers when song changes
let lastSongId: string | number | null = null;
// Verse rating popup state
let lastVerseKey: string = '';
let lastVerseTime: number = 0;
// Diagnostic: last player name for one-time settings log
let _lastLoggedPlayer: string = '';

/**
 * Rysuje całą linię nut, złotą kulkę oraz UI
 */
export const drawTimeline = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    noteLines: KaraokeNoteData[][],
    currentTime: number,
    playerName: string,
    score: number,
    playerBgColor: string,
    userPitch?: { t: number; hz: number }[],
    songId?: string | number,
    gapDesaturation?: number,
    segmentScores?: { start: number; end: number; pitch: number; frac: number; isGold?: boolean; noteStart?: number; noteEnd?: number }[],
    difficultyLevel?: string,
    isPlaying?: boolean,
    goldSettings?: { lifeMs?: number; count?: number; baseSpeed?: number; baseSize?: number; glowBlur?: number; shadowColor?: string },
    goldBursts?: { playerId: number; createdAt: number; noteStart: number; notePitch: number; seed: number }[],
    algorithmLabel?: string,
    algorithmColor?: string,
    panOffset?: number,
    visibleWidth?: number,
    combo?: { maxCombo: number; currentCombo: number; totalComboBonus: number },
    verseRatings?: { verseIndex: number; hitFraction: number; label: string; comboBonus: number }[],
    animationMode?: KaraokeAnimMode,
    karaokeSettings?: PlayerKaraokeSettings | null,
) => {
    ctx.clearRect(0, 0, width, height);

    // ── Resolve 4 independent bar fills from karaokeSettings ──
    const ks = karaokeSettings ?? null;
    const fb: KaraokeBarFill = ks?.filledBar ?? DEFAULT_BAR_FILL;
    const eb: KaraokeBarFill = ks?.emptyBar ?? DEFAULT_EMPTY_BAR_FILL;
    const gfb: KaraokeBarFill = ks?.goldFilledBar ?? DEFAULT_GOLD_FILLED_BAR_FILL;
    const geb: KaraokeBarFill = ks?.goldEmptyBar ?? DEFAULT_GOLD_EMPTY_BAR_FILL;
    const fontSettings: KaraokeFontSettings = ks?.font ?? DEFAULT_FONT_SETTINGS;

    // Per-bar cap styles
    const filledCapStyle: CapStyle = getCapStyleByName(fb.capStyleName);
    const emptyCapStyle: CapStyle = getCapStyleByName(eb.capStyleName);
    const goldFilledCapStyle: CapStyle = getCapStyleByName(gfb.capStyleName);
    const goldEmptyCapStyle: CapStyle = getCapStyleByName(geb.capStyleName);

    // Per-bar patterns
    const filledPattern: OverlayPattern | null = fb.patternName ? getPatternByName(fb.patternName) : null;
    const emptyPattern: OverlayPattern | null = eb.patternName ? getPatternByName(eb.patternName) : null;
    const goldFilledPattern: OverlayPattern | null = gfb.patternName ? getPatternByName(gfb.patternName) : null;
    const goldEmptyPattern: OverlayPattern | null = geb.patternName ? getPatternByName(geb.patternName) : null;

    // Per-bar overlay canvas patterns (SVG patterns → CanvasPattern for tiling)
    const filledOverlayPat = filledPattern ? getOverlayCanvasPattern(ctx, filledPattern, fb.patternColor ?? fb.color ?? '#ffffff', fb.patternColor) : null;
    const emptyOverlayPat = emptyPattern ? getOverlayCanvasPattern(ctx, emptyPattern, eb.patternColor ?? eb.color ?? '#d1d5db', eb.patternColor) : null;
    const goldFilledOverlayPat = goldFilledPattern ? getOverlayCanvasPattern(ctx, goldFilledPattern, gfb.patternColor ?? '#FFD700', gfb.patternColor) : null;
    const goldEmptyOverlayPat = goldEmptyPattern ? getOverlayCanvasPattern(ctx, goldEmptyPattern, geb.patternColor ?? '#FFD700', geb.patternColor) : null;

    // Diagnostic log (once per playerName change)
    if (_lastLoggedPlayer !== playerName) {
        _lastLoggedPlayer = playerName;
        dkLog('RENDER', `🎨 Renderer używa ustawień dla "${playerName}" — filled: cap=${fb.capStyleName}, glass=${fb.glass} | empty: cap=${eb.capStyleName}, glass=${eb.glass} | goldFilled: cap=${gfb.capStyleName}, pattern=${gfb.patternName ?? 'brak'} | goldEmpty: cap=${geb.capStyleName}, pattern=${geb.patternName ?? 'brak'} | hasSettings=${!!ks}`, {
            filledBar: fb, emptyBar: eb, goldFilledBar: gfb, goldEmptyBar: geb,
            filledOverlay: !!filledOverlayPat, emptyOverlay: !!emptyOverlayPat,
            goldFilledOverlay: !!goldFilledOverlayPat, goldEmptyOverlay: !!goldEmptyOverlayPat,
        });
    }

    // Per-bar textures
    const filledTexPat = fb.textureUrl ? getTexturePattern(ctx, fb.textureUrl, fb.textureScale) : null;
    const emptyTexPat = eb.textureUrl ? getTexturePattern(ctx, eb.textureUrl, eb.textureScale) : null;
    const goldFilledTexPat = gfb.textureUrl ? getTexturePattern(ctx, gfb.textureUrl, gfb.textureScale) : null;
    const goldEmptyTexPat = geb.textureUrl ? getTexturePattern(ctx, geb.textureUrl, geb.textureScale) : null;

    // Resolve any CSS var(...) player color into a concrete CSS color string for canvas usage
    const resolvedPlayerBg = (typeof document !== 'undefined')
        ? resolveCssColor(playerBgColor || 'var(--accent-primary, #ffcc00)')
        : (playerBgColor || 'var(--accent-primary, #ffcc00)');
    // Player color as hex — used as default fill for sung bars when no explicit color is set
    const playerHex = cssColorToHex(resolvedPlayerBg || '#ffcc00');

    // Resolved font family and style for canvas text
    // IMPORTANT: Canvas 2D API does NOT support CSS custom properties (var(--x))
    // so all colors must be resolved to concrete values before use.
    const rc = (c: string) => resolveCssColor(c);
    const ff = fontSettings.fontFamily || 'Arial';
    const fsize = fontSettings.fontSize || 18;
    const fcolor = rc(fontSettings.fontColor || 'var(--btn-text, #fff)');
    const foutline = fontSettings.outlineColor ? rc(fontSettings.outlineColor) : null;
    const foutlineW = typeof fontSettings.outlineWidth === 'number' ? fontSettings.outlineWidth : 0;
    const fshadow = fontSettings.shadow || null;

    // Track song changes (reset any song-scoped state)
    if (typeof songId !== 'undefined' && lastSongId !== songId) {
        lastSongId = songId;
    }

    // Persistent paint layer and bars mask (module-scoped singletons)
    // NOTE: With a panning timeline the viewport shifts every frame,
    // so persistent paint layers would accumulate stale blobs.
    // We clear them each frame to avoid artifacts.
    if (typeof document !== 'undefined') {
        if (!paintLayer || paintLayer.width !== width || paintLayer.height !== height) {
            paintLayer = document.createElement('canvas');
            paintLayer.width = width;
            paintLayer.height = height;
            paintCtx = paintLayer.getContext('2d');
        }
        if (paintCtx) paintCtx.clearRect(0, 0, width, height);

        if (!barsMask || barsMask.width !== width || barsMask.height !== height) {
            barsMask = document.createElement('canvas');
            barsMask.width = width;
            barsMask.height = height;
            barsMaskCtx = barsMask.getContext('2d');
        }
        if (barsMaskCtx) barsMaskCtx.clearRect(0, 0, width, height);

        if (!gapPaintLayer || gapPaintLayer.width !== width || gapPaintLayer.height !== height) {
            gapPaintLayer = document.createElement('canvas');
            gapPaintLayer.width = width;
            gapPaintLayer.height = height;
            gapPaintCtx = gapPaintLayer.getContext('2d');
        }
        if (gapPaintCtx) gapPaintCtx.clearRect(0, 0, width, height);
    }

    // UI (Ziom i 10000 pts) na górze
    // UI elements are pinned to the visible viewport via panOffset compensation
    const uiOffsetX = panOffset ? -panOffset : 0;
    const vw = visibleWidth || width;
    ctx.fillStyle = resolvedPlayerBg;
    ctx.font = `bold ${fsize}px ${ff}`;
    const nameWidth = ctx.measureText(playerName).width;
    const nameBoxW = nameWidth + 20;
    ctx.fillRect(uiOffsetX + 10, 5, nameBoxW, 25);
    // Font color, outline, shadow for player name
    ctx.save();
    ctx.fillStyle = fcolor;
    if (fshadow) {
        // Example: '2px 2px 4px #000'
        const m = fshadow.match(/(-?\d+)px\s+(-?\d+)px\s+(\d+)px\s+(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|[a-zA-Z]+)/);
        if (m) {
            ctx.shadowOffsetX = parseInt(m[1], 10);
            ctx.shadowOffsetY = parseInt(m[2], 10);
            ctx.shadowBlur = parseInt(m[3], 10);
            ctx.shadowColor = m[4];
        }
    }
    ctx.fillText(playerName, uiOffsetX + 20, 22);
    if (foutline && foutlineW > 0) {
        ctx.lineWidth = foutlineW;
        ctx.strokeStyle = foutline;
        ctx.strokeText(playerName, uiOffsetX + 20, 22);
    }
    ctx.restore();

    // Algorithm badge obok nazwy gracza
    if (algorithmLabel) {
        const badgeColor = rc(algorithmColor || 'var(--text-secondary, #6b7280)');
        ctx.font = `bold 12px ${ff}`;
        const algW = ctx.measureText(algorithmLabel).width;
        const badgePad = 8;
        const badgeX = uiOffsetX + 10 + nameBoxW + 6;
        const badgeH = 20;
        const badgeY = 7;
        const badgeFullW = algW + badgePad * 2;
        // rounded rect
        const r = 4;
        ctx.beginPath();
        ctx.moveTo(badgeX + r, badgeY);
        ctx.lineTo(badgeX + badgeFullW - r, badgeY);
        ctx.quadraticCurveTo(badgeX + badgeFullW, badgeY, badgeX + badgeFullW, badgeY + r);
        ctx.lineTo(badgeX + badgeFullW, badgeY + badgeH - r);
        ctx.quadraticCurveTo(badgeX + badgeFullW, badgeY + badgeH, badgeX + badgeFullW - r, badgeY + badgeH);
        ctx.lineTo(badgeX + r, badgeY + badgeH);
        ctx.quadraticCurveTo(badgeX, badgeY + badgeH, badgeX, badgeY + badgeH - r);
        ctx.lineTo(badgeX, badgeY + r);
        ctx.quadraticCurveTo(badgeX, badgeY, badgeX + r, badgeY);
        ctx.closePath();
        ctx.fillStyle = badgeColor;
        ctx.fill();
        ctx.fillStyle = fcolor;
        ctx.fillText(algorithmLabel, badgeX + badgePad, badgeY + 14);
        ctx.font = `bold ${fsize}px ${ff}`; // restore
    }

    // UI – Punkty gracza
    const scoreWidth = 120;
    ctx.fillStyle = resolvedPlayerBg;
    ctx.fillRect(uiOffsetX + vw - scoreWidth - 10, 5, scoreWidth, 25);
    ctx.fillStyle = fcolor;
    ctx.fillText(`${score} pts`, uiOffsetX + vw - scoreWidth + 15, 22);

    // Combo multiplier badge (right of score box)
    if (combo && combo.currentCombo >= 5) {
        const comboLabel = combo.currentCombo >= 50 ? '3x' : combo.currentCombo >= 30 ? '2.5x' : combo.currentCombo >= 20 ? '2x' : combo.currentCombo >= 10 ? '1.5x' : '';
        const comboText = `${combo.currentCombo} combo${comboLabel ? ' ' + comboLabel : ''}`;
        ctx.font = `bold 12px ${ff}`;
        const combW = ctx.measureText(comboText).width;
        const combBoxW = combW + 16;
        const combX = uiOffsetX + vw - scoreWidth - 10 - combBoxW - 6;
        ctx.fillStyle = rc(combo.currentCombo >= 20 ? 'var(--success, #FFD700)' : 'var(--warning, #ff9800)');
        ctx.globalAlpha = 0.9;
        roundedRect(ctx, combX, 7, combBoxW, 21, 4);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = rc(combo.currentCombo >= 20 ? 'var(--text-primary, #000)' : 'var(--btn-text, #fff)');
        ctx.fillText(comboText, combX + 8, 22);
        ctx.font = `bold 14px ${ff}`;
    }

    // Verse rating popup (latest verse, fades after 2s)
    if (verseRatings && verseRatings.length > 0) {
        const lastVerse = verseRatings[verseRatings.length - 1];
        // Show only recent verse ratings (use a module-scoped timestamp for fade)
        if (lastVerse.label) {
            const vrKey = `${verseRatings.length}-${lastVerse.label}`;
            if (vrKey !== lastVerseKey) {
                lastVerseKey = vrKey;
                lastVerseTime = Date.now();
            }
            const age = Date.now() - lastVerseTime;
            if (age < 2500) {
                const alpha = age < 2000 ? 1 : 1 - (age - 2000) / 500;
                const vrColors: Record<string, string> = {
                    Perfect: rc('var(--success, #00e676)'),
                    Great: rc('var(--success, #66bb6a)'),
                    Good: rc('var(--accent-primary, #ffeb3b)'),
                    OK: rc('var(--warning, #ff9800)'),
                    Bad: rc('var(--error, #ef5350)'),
                    Awful: rc('var(--error, #b71c1c)')
                };
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.font = `bold ${Math.round(fsize * 1.2)}px ${ff}`;
                const vrText = lastVerse.label;
                const vrW = ctx.measureText(vrText).width;
                const vrX = uiOffsetX + vw / 2 - vrW / 2;
                ctx.fillStyle = vrColors[vrText] || fcolor;
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 6;
                ctx.fillText(vrText, vrX, 58);
                if (foutline && foutlineW > 0) {
                    ctx.lineWidth = foutlineW;
                    ctx.strokeStyle = foutline;
                    ctx.strokeText(vrText, vrX, 58);
                }
                ctx.restore();
            }
        }
    }

    // Notatki rysuj poniżej UI
    const timelineStart = currentTime - 2;
    const timelineEnd = currentTime + 5;
    const timelineTopMargin = 40; // Margin for UI

    // Wyznacz min/max pitch z nut
    let minPitch = Infinity;
    let maxPitch = -Infinity;
    noteLines.forEach(line => {
        line.forEach(note => {
            if (note.pitch < minPitch) minPitch = note.pitch;
            if (note.pitch > maxPitch) maxPitch = note.pitch;
        });
    });
    // Uwzględnij również wykryte userPitch (z octave-foldingiem wg UltraStar WorldParty),
    // aby wykryte wysokości głosu mieściły się w zakresie nut
    if (userPitch && Array.isArray(userPitch) && userPitch.length > 0) {
        // Oblicz średni pitch nut jako referencję do octave-foldingu
        let refPitch: number | null = null;
        if (isFinite(minPitch) && isFinite(maxPitch)) {
            refPitch = Math.round((minPitch + maxPitch) / 2);
        }
        let userMin = Infinity;
        let userMax = -Infinity;
        userPitch.forEach(({ t, hz }) => {
            if (!hz || hz <= 0) return;
            // Znajdź nutę aktywną w tym momencie jako cel octave-foldingu
            let targetPitch = refPitch;
            for (const line of noteLines) {
                for (const note of line) {
                    if (t >= note.startTime && t <= note.startTime + note.duration) {
                        targetPitch = note.pitch;
                    }
                }
            }
            const usPitch = hzToUltrastarPitch(hz, targetPitch);
            if (usPitch < userMin) userMin = usPitch;
            if (usPitch > userMax) userMax = usPitch;
        });
        if (userMin !== Infinity && userMax !== -Infinity) {
            if (userMin < minPitch) minPitch = Math.floor(userMin - 2);
            if (userMax > maxPitch) maxPitch = Math.ceil(userMax + 2);
        }
    }
    // If no notes / user didn't provide range, set default range
    if (!isFinite(minPitch) || !isFinite(maxPitch)) {
        minPitch = 40;
        maxPitch = 80;
    }
    // Jeśli zakres się skurczył do jednego punktu, rozszerz go minimalnie
    if (minPitch === maxPitch) {
        minPitch = Math.max(0, minPitch - 6);
        maxPitch = maxPitch + 6;
    }

    // Function converting pitch to Y (dynamic scale)
    const pitchToY = (pitch: number) => {
        const usableHeight = height - timelineTopMargin - 10; // 10px margines dolny
        return timelineTopMargin + usableHeight - ((pitch - minPitch) / (maxPitch - minPitch)) * usableHeight;
    };

    // Visual mapping based on difficulty: bar height derived from semitone tolerance
    const activeDifficultyVisual = difficultyLevel || 'normal';
    const activePreset = getScoringPreset((activeDifficultyVisual as 'easy' | 'normal' | 'hard'));
    const usableH = height - timelineTopMargin - 10;
    const semitonePx = usableH / Math.max(1, maxPitch - minPitch);
    // Minimum 10px so pill/rounded cap styles remain visually distinct
    const barHeight = Math.max(10, Math.round(semitonePx * (1 + 2 * activePreset.semitoneTolerance) * 0.3));
    const baseBall = Math.max(5, Math.round(barHeight * 0.45));

    // Rysuj linie pomocnicze — cienkie linie na środku każdego tonu
    const drawDynamicGuideLines = (ctx: CanvasRenderingContext2D, width: number, _height: number, _topOffset: number, minPitch: number, maxPitch: number) => {
        ctx.lineWidth = 1;
        for (let p = Math.ceil(minPitch); p <= Math.floor(maxPitch); p++) {
            const cy = pitchToY(p);
            ctx.strokeStyle = rc((p % 2 === 0) ? 'var(--guide-line-strong, rgba(255, 255, 255, 0.12))' : 'var(--guide-line-weak, rgba(255, 255, 255, 0.06))');
            ctx.beginPath();
            ctx.moveTo(0, Math.round(cy) + 0.5);
            ctx.lineTo(width, Math.round(cy) + 0.5);
            ctx.stroke();
        }
    };
    drawDynamicGuideLines(ctx, width, height - timelineTopMargin, timelineTopMargin, minPitch, maxPitch);
    // clear bars mask each frame before populating it during note drawing
    if (barsMaskCtx) barsMaskCtx.clearRect(0, 0, width, height);

    // Position the ball continuously along the timeline (based on currentTime)
    const ballX = ((currentTime - timelineStart) / (timelineEnd - timelineStart)) * width;
    let ballY = height * 0.5;
    let foundActiveNote = false;
    let ballIsGold = false;

    // Rysuj nuty z dynamiczną skalą
    const drawNotelineDynamic = (
        ctx: CanvasRenderingContext2D,
        width: number,
        _height: number,
        noteLine: KaraokeNoteData[],
        timelineStart: number,
        timelineEnd: number,
        _topOffset: number = 0
    ) => {
        // Helper: rounded rectangle path
        const roundRect = (cx: CanvasRenderingContext2D, rx: number, ry: number, rw: number, rh: number, radius: number) => {
            const r = Math.min(radius, rw / 2, rh / 2);
            cx.beginPath();
            cx.moveTo(rx + r, ry);
            cx.lineTo(rx + rw - r, ry);
            cx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + r);
            cx.lineTo(rx + rw, ry + rh - r);
            cx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - r, ry + rh);
            cx.lineTo(rx + r, ry + rh);
            cx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - r);
            cx.lineTo(rx, ry + r);
            cx.quadraticCurveTo(rx, ry, rx + r, ry);
            cx.closePath();
        };
        const noteRadius = Math.max(2, barHeight / 2);

        noteLine.forEach(note => {
            if (note.startTime + note.duration < timelineStart || note.startTime > timelineEnd) return;
            const x = ((note.startTime - timelineStart) / (timelineEnd - timelineStart)) * width;
            const noteWidth = (note.duration / (timelineEnd - timelineStart)) * width;
            const y = pitchToY(note.pitch) - barHeight / 2;

            // Zbierz trafione segmenty dla tej nuty (z segmentScores)
            const hitSegs: { x1: number; x2: number; frac: number }[] = [];
            if (Array.isArray(segmentScores)) {
                const noteEnd = note.startTime + note.duration;
                segmentScores.forEach(s => {
                    if (s.pitch !== note.pitch) return;
                    // If segment carries noteStart/noteEnd, match exact note to avoid bleeding into adjacent same-pitch notes
                    if (s.noteStart != null && s.noteEnd != null) {
                        if (Math.abs(s.noteStart - note.startTime) > 0.01 || Math.abs(s.noteEnd - noteEnd) > 0.01) return;
                    }
                    const segStart = Math.max(s.start, note.startTime);
                    const segEnd = Math.min(s.end, noteEnd);
                    if (segStart >= segEnd) return;
                    const sx1 = ((segStart - timelineStart) / (timelineEnd - timelineStart)) * width;
                    const sx2 = ((segEnd - timelineStart) / (timelineEnd - timelineStart)) * width;
                    hitSegs.push({ x1: sx1, x2: sx2, frac: s.frac });
                });
            }

            if (note.isGold) {
                // Golden note: subtle gold glow outline to distinguish from regular
                ctx.save();
                const _shadowColor = (goldSettings && goldSettings.shadowColor) ? goldSettings.shadowColor : GOLD_SHADOW_COLOR;
                const _glowBlur = (goldSettings && typeof goldSettings.glowBlur === 'number') ? goldSettings.glowBlur : GOLD_GLOW_BLUR;
                ctx.shadowColor = _shadowColor;
                ctx.shadowBlur = Math.max(4, _glowBlur - 12);
                ctx.fillStyle = rc('var(--gold-overlay, rgba(255, 215, 0, 0.15))');
                roundRect(ctx, x - 1, y - 1, noteWidth + 2, barHeight + 2, noteRadius);
                ctx.fill();
                ctx.restore();
                // Bazowy pasek — golden base as glossy bar
                const goldHex = cssColorToHex('var(--gold-base, #b4af9f)');
                drawGlossyBarOnCanvas(ctx, x, y, noteWidth, barHeight, goldEmptyCapStyle, geb.color ?? goldHex, geb.highlight, geb.glow, geb.glass, goldEmptyPattern, geb.patternColor, geb.patternOnly, goldEmptyTexPat, goldEmptyOverlayPat);
                // Gold shimmer stripe on unhit golden bar
                ctx.save();
                roundRect(ctx, x, y, noteWidth, barHeight, noteRadius);
                ctx.clip();
                ctx.globalAlpha = 0.18;
                    ctx.fillStyle = rc('var(--success, #FFD700)');
                ctx.fillRect(x, y, noteWidth, Math.max(1, barHeight * 0.25));
                ctx.globalAlpha = 1;
                ctx.restore();
                // Trafione fragmenty — clip to note shape, per-accuracy 3D gradient
                if (hitSegs.length > 0) {
                    ctx.save();
                    roundRect(ctx, x, y, noteWidth, barHeight, noteRadius);
                    ctx.clip();
                    hitSegs.forEach(hs => {
                        const hsW = Math.max(1, hs.x2 - hs.x1);
                        // Gold filled bars use gold color by default when no explicit color
                        const goldHitDefault = '#FFD700';
                        drawGlossyBarOnCanvas(ctx, hs.x1, y, hsW, barHeight, goldFilledCapStyle, gfb.color ?? goldHitDefault, gfb.highlight, gfb.glow, gfb.glass, goldFilledPattern, gfb.patternColor, gfb.patternOnly, goldFilledTexPat, goldFilledOverlayPat);
                    });
                    ctx.restore();
                }
                // Border: subtle gold outline for unhit gold notes (no border for hit)
                if (hitSegs.length === 0) {
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = rc('var(--gold-outline, rgba(255, 215, 0, 0.35))');
                    roundRect(ctx, x + 0.5, y + 0.5, noteWidth - 1, Math.max(1, barHeight - 1), noteRadius);
                    ctx.stroke();
                }
            } else {
                // Zwykła nuta: bazowy pasek — empty note (gray / glass) as glossy bar
                const emptyHex = cssColorToHex('var(--note-base, #d1d5db)');
                drawGlossyBarOnCanvas(ctx, x, y, noteWidth, barHeight, emptyCapStyle, eb.color ?? emptyHex, eb.highlight, eb.glow, eb.glass, emptyPattern, eb.patternColor, eb.patternOnly, emptyTexPat, emptyOverlayPat);
                // Trafione fragmenty — glossy bar per hit segment
                if (hitSegs.length > 0) {
                    ctx.save();
                    roundRect(ctx, x, y, noteWidth, barHeight, noteRadius);
                    ctx.clip();
                    hitSegs.forEach(hs => {
                        const hsW = Math.max(1, hs.x2 - hs.x1);
                        drawGlossyBarOnCanvas(ctx, hs.x1, y, hsW, barHeight, filledCapStyle, fb.color ?? playerHex, fb.highlight, fb.glow, fb.glass, filledPattern, fb.patternColor, fb.patternOnly, filledTexPat, filledOverlayPat);
                    });
                    ctx.restore();
                }
            }
            // also draw the same bar into the bars mask so painting can be clipped to bars
            if (barsMaskCtx) {
                barsMaskCtx.fillStyle = '#ffffff';
                barsMaskCtx.fillRect(x, y, noteWidth, barHeight);
            }
        });
    };

    // Draw each note line and determine ball pitch. The horizontal position is continuous
    // (based on currentTime mapped into the visible timeline). Vertically, when on a note
    // the ball locks to that note's pitch; when between notes it will hold the pitch of
    // the next upcoming note (or the last note if no upcoming one exists).
    noteLines.forEach(line => {
        drawNotelineDynamic(ctx, width, height - timelineTopMargin, line, timelineStart, timelineEnd, timelineTopMargin);
        for (const note of line) {
            if (currentTime >= note.startTime && currentTime <= note.startTime + note.duration) {
                // active note: ball follows the note pitch
                ballY = pitchToY(note.pitch);
                foundActiveNote = true;
                ballIsGold = !!note.isGold;
                break; // this line has the active note for now
            }
        }
    });

    // 📌 Jeśli nie ma aktywnej nuty, znajdź najbliższą w wersie
    if (!foundActiveNote) {
        // Find the next upcoming note (smallest startTime > currentTime)
        let nextNote: KaraokeNoteData | null = null;
        let lastNote: KaraokeNoteData | null = null;
        for (const line of noteLines) {
            for (const note of line) {
                if (note.startTime > currentTime) {
                    if (!nextNote || note.startTime < nextNote.startTime) nextNote = note;
                }
                if (note.startTime <= currentTime) {
                    if (!lastNote || note.startTime > lastNote.startTime) lastNote = note;
                }
            }
        }
        if (nextNote) {
            // hold pitch of the next note while flying between notes
            ballY = pitchToY(nextNote.pitch);
            ballIsGold = !!nextNote.isGold;
        } else if (lastNote) {
            // no upcoming notes: hold last note's pitch
            ballY = pitchToY(lastNote.pitch);
            ballIsGold = !!lastNote.isGold;
        } else {
            // fallback: center
            ballY = height * 0.5;
        }
        // ballX remains continuous (mapped from currentTime), so it will fly smoothly
    }



    // 📌 Rysowanie kulki: użyj koloru gracza, dodaj ślad i zamalowywanie pasków
    const playerColor = resolvedPlayerBg || rc('var(--accent-primary, #ffcc00)');
    // pulse animation based on currentTime for subtle liveliness
    const pulse = 1 + Math.sin((currentTime || 0) * 8) * 0.06;
    const ballRadius = baseBall * pulse;

    // ── Alternative animation modes (wipe, pulse, bounce) ──
    // Build visible notes list for alternative renderers
    const _visibleNotes: { x: number; y: number; w: number; h: number; isGold?: boolean; isSung?: boolean }[] = [];
    for (const line of noteLines) {
        for (const n of line) {
            if (n.startTime + n.duration < timelineStart || n.startTime > timelineEnd) continue;
            const nx = ((n.startTime - timelineStart) / (timelineEnd - timelineStart)) * width;
            const nw = (n.duration / (timelineEnd - timelineStart)) * width;
            const ny = pitchToY(n.pitch) - (barHeight / 2);
            const isSung = n.startTime + n.duration <= currentTime;
            _visibleNotes.push({ x: nx, y: ny, w: nw, h: barHeight, isGold: n.isGold, isSung });
        }
    }
    const usedAltAnim = drawAlternativeAnimation(animationMode || "ball", {
        ctx, ballX, ballY, ballRadius, playerColor, ballIsGold, currentTime,
        width, height, visibleNotes: _visibleNotes,
    });

    if (!usedAltAnim) {
    // Composite persistent paint layers (bars paint + gap paint) from previous frames
    if (paintLayer) ctx.drawImage(paintLayer, 0, 0);
    if (gapPaintLayer) ctx.drawImage(gapPaintLayer, 0, 0);

    // 1) Soft transient trail (paints empty areas visually, not persistent)
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.28;
    const trailRadius = Math.max(18, ballRadius * 5);
    const grad = ctx.createRadialGradient(ballX, ballY, 0, ballX, ballY, trailRadius);
    grad.addColorStop(0, playerColor);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ballX, ballY, trailRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2) Paint into persistent paintLayer (only keep paint where bars exist using barsMask)
    // Only update persistent layers while the song is actively playing
    if (isPlaying && paintCtx && barsMask) {
        // draw the paint blob
        paintCtx.save();
        paintCtx.globalCompositeOperation = 'source-over';
        paintCtx.globalAlpha = 0.95;
        paintCtx.fillStyle = playerColor;
        paintCtx.beginPath();
        paintCtx.arc(ballX, ballY, ballRadius + 4, 0, Math.PI * 2);
        paintCtx.fill();
        paintCtx.restore();

        // Mask paint to bars: keep paint pixels only where barsMask is opaque
        paintCtx.save();
        paintCtx.globalCompositeOperation = 'destination-in';
        paintCtx.drawImage(barsMask, 0, 0);
        paintCtx.restore();

        // Composite updated paint layer onto main canvas
        ctx.drawImage(paintLayer as HTMLCanvasElement, 0, 0);
    }

    // 2b) Paint into gap persistent layer (keep paint only where bars are NOT present)
    if (isPlaying && gapPaintCtx && barsMask) {
        // Use multiply blending and a desaturated version of player color for gap paint
            try {
            const parsed = cssColorToHex(playerColor);
            const { h, s, l } = hexToHsl(parsed);
            const factor = typeof gapDesaturation === 'number' ? gapDesaturation : 0.25;
            const desat = hslToCss(h, Math.max(10, Math.round(s * factor)), l, 0.85);
            gapPaintCtx.save();
            gapPaintCtx.globalCompositeOperation = 'multiply';
            gapPaintCtx.globalAlpha = 0.65;
            gapPaintCtx.fillStyle = desat;
            gapPaintCtx.beginPath();
            gapPaintCtx.arc(ballX, ballY, Math.max(8, ballRadius + 6), 0, Math.PI * 2);
            gapPaintCtx.fill();
            gapPaintCtx.restore();

            // Erase any gap paint that overlaps actual bars (we want gap paint only in gaps)
            gapPaintCtx.save();
            gapPaintCtx.globalCompositeOperation = 'destination-out';
            gapPaintCtx.drawImage(barsMask, 0, 0);
            gapPaintCtx.restore();

            // Composite updated gap paint layer onto main canvas
            ctx.drawImage(gapPaintLayer as HTMLCanvasElement, 0, 0);
        } catch (_e) {
            // fallback: plain fill if color parsing fails
            gapPaintCtx.save();
            gapPaintCtx.globalCompositeOperation = 'source-over';
            gapPaintCtx.globalAlpha = 0.6;
            gapPaintCtx.fillStyle = playerColor;
            gapPaintCtx.beginPath();
            gapPaintCtx.arc(ballX, ballY, Math.max(8, ballRadius + 6), 0, Math.PI * 2);
            gapPaintCtx.fill();
            gapPaintCtx.restore();

            gapPaintCtx.save();
            gapPaintCtx.globalCompositeOperation = 'destination-out';
            gapPaintCtx.drawImage(barsMask, 0, 0);
            gapPaintCtx.restore();

            ctx.drawImage(gapPaintLayer as HTMLCanvasElement, 0, 0);
        }
    }

    // 3) Draw the ball itself with glow and border
    // Use goldSettings (if provided) to customize glow/shadow
    const shadowColor = (goldSettings && goldSettings.shadowColor) ? goldSettings.shadowColor : GOLD_SHADOW_COLOR;
    const glowBlur = (goldSettings && typeof goldSettings.glowBlur === 'number') ? goldSettings.glowBlur : GOLD_GLOW_BLUR;
    ctx.save();
    // brighter gold glow when over a golden note
    if (ballIsGold) {
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = glowBlur;
        ctx.fillStyle = rc('var(--gold-light, #FFF0A8)');
    } else {
        ctx.shadowColor = playerColor;
        ctx.shadowBlur = 10;
        ctx.fillStyle = playerColor;
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = rc('var(--shadow, rgba(0,0,0,0.35))');
    ctx.stroke();
    ctx.restore();
    } // end !usedAltAnim

    // Particle bursts for gold-full events (positioned at the note's x,y)
    try {
        if (Array.isArray(goldBursts) && goldBursts.length > 0) {
            const now = Date.now();
            const LIFE = (goldSettings && typeof goldSettings.lifeMs === 'number') ? goldSettings.lifeMs : GOLD_PARTICLE_LIFE_MS; // ms
            const star = (cx: number, cy: number, radius: number, spikes = 5) => {
                const outer = radius;
                const inner = radius * 0.45;
                ctx.beginPath();
                let rot = Math.PI / 2 * 3;
                let x = cx;
                let y = cy;
                const step = Math.PI / spikes;
                ctx.moveTo(cx, cy - outer);
                for (let i = 0; i < spikes; i++) {
                    x = cx + Math.cos(rot) * outer;
                    y = cy + Math.sin(rot) * outer;
                    ctx.lineTo(x, y);
                    rot += step;
                    x = cx + Math.cos(rot) * inner;
                    y = cy + Math.sin(rot) * inner;
                    ctx.lineTo(x, y);
                    rot += step;
                }
                ctx.lineTo(cx, cy - outer);
                ctx.closePath();
            };

            // simple LCG for deterministic random sequence per burst
            const makeRng = (seedNum: number) => {
                let s = seedNum >>> 0;
                return () => {
                    s = (s * 1664525 + 1013904223) >>> 0;
                    return (s & 0x7fffffff) / 0x7fffffff;
                };
            };

            goldBursts.forEach(b => {
                const age = now - b.createdAt;
                if (age < 0 || age > LIFE) return;
                const lifeFrac = age / LIFE;
                // compute note position on timeline
                const px = ((b.noteStart - (currentTime - 2)) / (7)) * width; // timelineStart=currentTime-2, timelineEnd=currentTime+5 => span 7s
                const py = pitchToY(b.notePitch);
                const rng = makeRng(b.seed || Math.floor(b.createdAt % 100000));
                const particleCount = (goldSettings && typeof goldSettings.count === 'number') ? goldSettings.count : GOLD_PARTICLE_COUNT;
                const baseSpeed = (goldSettings && typeof goldSettings.baseSpeed === 'number') ? goldSettings.baseSpeed : GOLD_PARTICLE_BASE_SPEED;
                const baseSize = (goldSettings && typeof goldSettings.baseSize === 'number') ? goldSettings.baseSize : GOLD_PARTICLE_BASE_SIZE;
                for (let i = 0; i < particleCount; i++) {
                    const r1 = rng();
                    const r2 = rng();
                    const ang = (i / particleCount) * Math.PI * 2 + r1 * Math.PI * 0.6 + lifeFrac * 1.5;
                    const speed = 6 + baseSpeed * (1 - lifeFrac) * (0.5 + r2 * 0.8);
                    const x = px + Math.cos(ang) * speed;
                    const y = py + Math.sin(ang) * speed * (0.8 + r1 * 0.6);
                    const baseR = Math.max(1, baseSize * (1 - lifeFrac) * (0.5 + r2));
                    const hue = 40 + Math.round(20 * rng());
                    const sat = 70 + Math.round(20 * rng());
                    const alpha = Math.max(0, 1 - lifeFrac) * (0.9 - rng() * 0.3);
                    // use SVG texture as particle sprite (fallback to rect if not loaded yet)
                    const imgSize = Math.max(6, baseR * 2.6);
                    const img = getParticleImage(hue, sat, 60, Math.round(imgSize), (b.seed || 0) + i);
                    if (img && img.complete) {
                        ctx.save();
                        ctx.translate(x, y + 4);
                        ctx.rotate(ang + lifeFrac * 4 + (rng() - 0.5) * 1.2);
                        ctx.globalAlpha = alpha;
                        ctx.drawImage(img, -baseR / 2, -baseR / 2, baseR, baseR);
                        ctx.restore();
                    } else {
                        ctx.save();
                        ctx.translate(x, y + 4);
                        ctx.rotate(ang + lifeFrac * 4);
                        ctx.fillStyle = `hsla(${hue}, ${sat}%, 60%, ${alpha})`;
                        ctx.fillRect(-baseR / 2, -baseR / 2, baseR, baseR);
                        ctx.restore();
                    }
                    // occasional small star drawn on top (rotate)
                    if (rng() > 0.85) {
                        ctx.save();
                        ctx.globalAlpha = Math.max(0.35, 1 - lifeFrac);
                        ctx.fillStyle = `hsla(${30 + Math.round(10 * rng())}, ${60 + Math.round(30 * rng())}%, ${70 + Math.round(10 * rng())}%, ${alpha})`;
                        ctx.strokeStyle = `rgba(0,0,0,${0.12 * (1 - lifeFrac)})`;
                        ctx.lineWidth = 0.8;
                        star(x, y + 4, baseR * (1.4 + rng()));
                        ctx.fill();
                        ctx.stroke();
                        ctx.restore();
                    }
                }
            });
        }
    } catch (_e) { /* Best-effort — no action needed on failure */ }



    // Return ball position and gold flag so callers can pan/center or react
    return { ballX, ballY, ballIsGold };
};
