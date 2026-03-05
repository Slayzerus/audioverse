import Phaser from "phaser";

/* ────────────────────────────────────────────────────────────
   HitThatNoteGame — rhythm mini-game built with Phaser 3.
   Uses only procedural graphics (no external asset files).
   
   Gameplay:
   - Notes scroll from right to left along 4 lanes.
   - Press the matching key when the note reaches the hit zone.
   - Hold notes require sustained key press for their duration.
   - Score reflects timing accuracy (Perfect / Good / OK / Miss).
   ──────────────────────────────────────────────────────────── */

// ── Types ──

interface GameNote {
    startBeat: number;
    duration: number;       // in beats (0 = tap, >0 = hold)
    lane: number;           // 0-3
    rect: Phaser.GameObjects.Rectangle;
    holdBar?: Phaser.GameObjects.Rectangle;
    scored: boolean;
    isHeld: boolean;
    holdAccum: number;
}

type Accuracy = "perfect" | "good" | "ok" | "miss";

const LANE_KEYS = ["LEFT", "DOWN", "UP", "RIGHT"];
// Helper: read a CSS variable and convert to a Phaser color number (0xRRGGBB).
function cssVarToNumber(varName: string, fallback: number): number {
    try {
        if (typeof window === "undefined" || !window.getComputedStyle) return fallback;
        const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        if (!raw) return fallback;
        if (raw.startsWith("#")) {
            return Number("0x" + raw.slice(1));
        }
        const m = raw.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        if (m) return (parseInt(m[1]) << 16) + (parseInt(m[2]) << 8) + parseInt(m[3]);
    } catch (_e) {
        // Expected: getComputedStyle may fail in SSR or test environment
    }
    return fallback;
}

const LANE_COLORS = [
    cssVarToNumber("--player-color-1", 0xff4444),
    cssVarToNumber("--player-color-2", 0x44ff44),
    cssVarToNumber("--player-color-3", 0x4488ff),
    cssVarToNumber("--player-color-4", 0xffaa00),
];
const LANE_LABELS = ["\u25C0", "\u25BC", "\u25B2", "\u25B6"];

const ACCURACY_COLORS: Record<Accuracy, number> = {
    perfect: cssVarToNumber("--accuracy-perfect", 0xffdd00),
    good:    cssVarToNumber("--accuracy-good", 0x44ff44),
    ok:      cssVarToNumber("--accuracy-ok", 0x44aaff),
    miss:    cssVarToNumber("--accuracy-miss", 0xff4444),
};

// ── Chart generator ──

function generateChart(bars: number, difficulty: number, seed: number = 42): { startBeat: number; duration: number; lane: number }[] {
    const rng = mulberry32(seed);
    const notes: { startBeat: number; duration: number; lane: number }[] = [];
    const beatsPerBar = 4;
    const totalBeats = bars * beatsPerBar;
    const density = Math.min(0.9, 0.2 + difficulty * 0.15);

    for (let b = 0; b < totalBeats; b += 0.5) {
        if (rng() > density) continue;
        const lane = Math.floor(rng() * 4);
        const conflict = notes.some(n => n.lane === lane && Math.abs(n.startBeat - b) < 0.5);
        if (conflict) continue;
        const isHold = difficulty >= 3 && rng() > 0.7;
        const dur = isHold ? 0.5 + Math.floor(rng() * 3) * 0.5 : 0;
        notes.push({ startBeat: b, duration: dur, lane });
    }
    return notes;
}

function mulberry32(seed: number) {
    let s = seed | 0;
    return () => {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ── Scene config passed from React ──

export interface HitThatNoteConfig {
    bpm?: number;
    bars?: number;
    difficulty?: number;   // 1-5
    seed?: number;
    onGameEnd?: (score: number, maxScore: number, combo: number) => void;
}

// ── Scene ──

export class HitThatNoteGame extends Phaser.Scene {
    private cfg!: HitThatNoteConfig;
    private bpm = 120;
    private beatDuration = 0.5;
    private notes: GameNote[] = [];
    private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
    private score = 0;
    private maxPossible = 0;
    private combo = 0;
    private bestCombo = 0;
    private hitZoneX = 0;
    private scrollSpeed = 0;
    private elapsedSec = 0;
    private gameOver = false;
    private totalDurationSec = 0;

    // UI objects
    private scoreText!: Phaser.GameObjects.Text;
    private comboText!: Phaser.GameObjects.Text;
    private progressBar!: Phaser.GameObjects.Rectangle;
    private laneYs: number[] = [];
    private accuracyText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: "HitThatNoteGame" });
    }

    init(data: HitThatNoteConfig) {
        this.cfg = data || {};
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;
        this.bpm = this.cfg.bpm ?? 120;
        this.beatDuration = 60 / this.bpm;
        const bars = this.cfg.bars ?? 16;
        const diff = Math.max(1, Math.min(5, this.cfg.difficulty ?? 3));
        this.totalDurationSec = bars * 4 * this.beatDuration + 3;
        this.hitZoneX = 160;
        this.scrollSpeed = (W - this.hitZoneX) / (4 * this.beatDuration);

        // Background
        this.cameras.main.setBackgroundColor(cssVarToNumber("--bg-primary", 0x0a0a1a));

        // Lane lines
        const laneCount = 4;
        const laneHeight = (H - 100) / laneCount;
        this.laneYs = [];
        for (let i = 0; i < laneCount; i++) {
            const y = 60 + i * laneHeight + laneHeight / 2;
            this.laneYs.push(y);
            this.add.rectangle(W / 2, y, W, laneHeight - 4, LANE_COLORS[i], 0.08);
            this.add.text(this.hitZoneX - 40, y, LANE_LABELS[i], {
                fontSize: "28px", color: "#ffffff", fontStyle: "bold",
            }).setOrigin(0.5);
        }

        // Hit zone line
        this.add.rectangle(this.hitZoneX, H / 2, 6, H - 80, cssVarToNumber("--btn-text", 0xffffff), 0.6);

        // Keys
        if (this.input.keyboard) {
            for (const key of LANE_KEYS) {
                const kc = (Phaser.Input.Keyboard.KeyCodes as unknown as Record<string, number>)[key];
                if (kc !== undefined) {
                    this.keys[key] = this.input.keyboard.addKey(kc);
                }
            }
        }

        // Generate chart
        const chart = generateChart(bars, diff, this.cfg.seed ?? Date.now());
        this.maxPossible = chart.length * 100;
        this.notes = [];

        for (const c of chart) {
            const laneY = this.laneYs[c.lane];
            const rect = this.add.rectangle(W + 100, laneY, 20, laneHeight * 0.5, LANE_COLORS[c.lane]).setOrigin(0, 0.5);

            let holdBar: Phaser.GameObjects.Rectangle | undefined;
            if (c.duration > 0) {
                const noteW = Math.max(20, c.duration * this.beatDuration * this.scrollSpeed);
                holdBar = this.add.rectangle(W + 100, laneY, noteW, laneHeight * 0.2, LANE_COLORS[c.lane], 0.5).setOrigin(0, 0.5);
            }

            this.notes.push({
                startBeat: c.startBeat,
                duration: c.duration,
                lane: c.lane,
                rect,
                holdBar,
                scored: false,
                isHeld: false,
                holdAccum: 0,
            });
        }

        // UI
        this.scoreText = this.add.text(20, 10, "0", { fontSize: "32px", color: "#ffdd00", fontStyle: "bold" });
        this.comboText = this.add.text(W - 20, 10, "", { fontSize: "24px", color: "#44ff44" }).setOrigin(1, 0);

        this.add.rectangle(W / 2, H - 16, W - 40, 8, cssVarToNumber("--border-muted", 0x333333));
        this.progressBar = this.add.rectangle(20, H - 16, 0, 8, cssVarToNumber("--success", 0x00cc66)).setOrigin(0, 0.5);

        this.accuracyText = this.add.text(this.hitZoneX + 30, H / 2, "", {
            fontSize: "28px", color: "#fff", fontStyle: "bold",
        }).setOrigin(0, 0.5).setAlpha(0);

        this.score = 0;
        this.combo = 0;
        this.bestCombo = 0;
        this.elapsedSec = 0;
        this.gameOver = false;
    }

    update(_time: number, delta: number) {
        if (this.gameOver) return;
        const dt = delta / 1000;
        this.elapsedSec += dt;
        const W = this.scale.width;

        // Progress bar
        const pct = Math.min(1, this.elapsedSec / this.totalDurationSec);
        this.progressBar.width = (W - 40) * pct;

        // Move & check notes
        for (const n of this.notes) {
            const noteTimeSec = n.startBeat * this.beatDuration;
            const xOffset = (noteTimeSec - this.elapsedSec) * this.scrollSpeed;
            const x = this.hitZoneX + xOffset;
            n.rect.x = x;
            if (n.holdBar) n.holdBar.x = x;

            if (!n.scored && x < this.hitZoneX - 80) {
                this.missNote(n);
            }

            // Hold scoring
            if (n.isHeld && n.duration > 0 && !n.scored) {
                const key = LANE_KEYS[n.lane];
                if (this.keys[key]?.isDown) {
                    n.holdAccum += dt;
                    const needed = n.duration * this.beatDuration;
                    if (n.holdAccum >= needed * 0.85) {
                        this.scoreNote(n, "perfect");
                    }
                } else {
                    const needed = n.duration * this.beatDuration;
                    if (n.holdAccum / needed > 0.5) {
                        this.scoreNote(n, "good");
                    } else {
                        this.missNote(n);
                    }
                }
            }
        }

        // Key press detection (tap)
        for (let lane = 0; lane < 4; lane++) {
            const key = LANE_KEYS[lane];
            if (!this.keys[key] || !Phaser.Input.Keyboard.JustDown(this.keys[key])) continue;

            let best: GameNote | null = null;
            let bestDist = Infinity;
            for (const n of this.notes) {
                if (n.scored || n.lane !== lane || n.isHeld) continue;
                const dist = Math.abs(n.rect.x - this.hitZoneX);
                if (dist < bestDist && dist < 120) {
                    bestDist = dist;
                    best = n;
                }
            }

            if (best) {
                if (best.duration > 0) {
                    best.isHeld = true;
                    best.holdAccum = 0;
                    best.rect.setFillStyle(cssVarToNumber("--btn-text", 0xffffff));
                } else {
                    const acc: Accuracy = bestDist < 20 ? "perfect" : bestDist < 50 ? "good" : "ok";
                    this.scoreNote(best, acc);
                }
            }
        }

        if (this.elapsedSec >= this.totalDurationSec) {
            this.endGame();
        }
    }

    private scoreNote(n: GameNote, acc: Accuracy) {
        n.scored = true;
        const pts = acc === "perfect" ? 100 : acc === "good" ? 70 : 40;
        this.score += pts;
        this.combo++;
        if (this.combo > this.bestCombo) this.bestCombo = this.combo;

        this.showAccuracy(acc, n.rect.y);
        n.rect.setFillStyle(ACCURACY_COLORS[acc]);
        this.tweens.add({ targets: n.rect, alpha: 0, scaleX: 2, scaleY: 2, duration: 300, onComplete: () => n.rect.destroy() });
        if (n.holdBar) {
            this.tweens.add({ targets: n.holdBar, alpha: 0, duration: 300, onComplete: () => n.holdBar?.destroy() });
        }
        this.scoreText.setText(String(this.score));
        this.comboText.setText(this.combo >= 3 ? `${this.combo}x Combo!` : "");
    }

    private missNote(n: GameNote) {
        n.scored = true;
        this.combo = 0;
        this.showAccuracy("miss", n.rect.y);
        n.rect.setFillStyle(cssVarToNumber("--muted", 0x444444));
        this.tweens.add({ targets: n.rect, alpha: 0, duration: 400, onComplete: () => n.rect.destroy() });
        if (n.holdBar) {
            this.tweens.add({ targets: n.holdBar, alpha: 0, duration: 400, onComplete: () => n.holdBar?.destroy() });
        }
        this.comboText.setText("");
    }

    private showAccuracy(acc: Accuracy, y: number) {
        this.accuracyText.setText(acc.toUpperCase());
        this.accuracyText.setColor(`#${ACCURACY_COLORS[acc].toString(16).padStart(6, "0")}`);
        this.accuracyText.y = y;
        this.accuracyText.setAlpha(1);
        this.tweens.add({ targets: this.accuracyText, alpha: 0, y: y - 30, duration: 600 });
    }

    private endGame() {
        this.gameOver = true;
        const W = this.scale.width;
        const H = this.scale.height;

        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7);

        const pctScore = this.maxPossible > 0 ? Math.round((this.score / this.maxPossible) * 100) : 0;
        const grade = pctScore >= 95 ? "S" : pctScore >= 85 ? "A" : pctScore >= 70 ? "B" : pctScore >= 50 ? "C" : "D";
        const gradeColor = pctScore >= 95 ? "#ffdd00" : pctScore >= 85 ? "#44ff44" : pctScore >= 70 ? "#4488ff" : pctScore >= 50 ? "#ffaa00" : "#ff4444";

        this.add.text(W / 2, H / 2 - 80, grade, { fontSize: "96px", color: gradeColor, fontStyle: "bold" }).setOrigin(0.5);
        this.add.text(W / 2, H / 2, `Wynik: ${this.score} / ${this.maxPossible}`, { fontSize: "32px", color: "#fff" }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 50, `Najlepsze combo: ${this.bestCombo}x`, { fontSize: "22px", color: "#aaa" }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 90, `Trafno\u015B\u0107: ${pctScore}%`, { fontSize: "22px", color: "#aaa" }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 150, "Kliknij aby zagra\u0107 ponownie", { fontSize: "18px", color: "#888" }).setOrigin(0.5);
        this.input.once("pointerdown", () => this.scene.restart(this.cfg));

        this.cfg.onGameEnd?.(this.score, this.maxPossible, this.bestCombo);
    }
}
