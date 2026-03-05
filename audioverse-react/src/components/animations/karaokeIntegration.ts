// components/animations/karaokeIntegration.ts
// Integracja zdarzeń wyniku + reakcje jurorów + preset playIntro

import type { PersonControls } from "./animationHelper";
import { runRounds } from "./choreoDSL";
import { seq } from "./choreoDSL";
import type { ChoreoBuilder } from "./choreoDSL";
import type { RunContext } from "./choreoDSL";

/* -------------------- Results event bus -------------------- */
export type ScoreEvent = { score: number; at: number };

type ScoreHandler = (e: ScoreEvent) => void;

class ScoreBus {
    private target = new EventTarget();

    push(score: number) {
        const e: ScoreEvent = { score, at: Date.now() };
        this.target.dispatchEvent(new CustomEvent<ScoreEvent>("score", { detail: e }));
    }

    subscribe(handler: ScoreHandler): () => void {
        const wrap = (ev: Event) => handler((ev as CustomEvent<ScoreEvent>).detail);
        this.target.addEventListener("score", wrap as EventListener);
        return () => this.target.removeEventListener("score", wrap as EventListener);
    }
}

export const scoreBus = new ScoreBus();

export type ScoreListenerOptions = {
    minIntervalMs?: number; // throttling (min odstęp między eventami, niezależny od dedupe)
    dedupeWindowMs?: number; // anti-spam: w tym oknie ignoruj identyczny ZAOKRĄGLONY wynik
    roundTo?: number; // ile miejsc po przecinku do dedupe (np. 1 => 0.1)
};

export function onScore(
    handler: (score: number) => void,
    opts: ScoreListenerOptions = {}
): () => void {
    const min = opts.minIntervalMs ?? 400;
    const dedupe = opts.dedupeWindowMs ?? 800;
    const roundTo = Math.max(0, Math.floor(opts.roundTo ?? 1));

    let lastEventAt = 0; // do throttlingu
    let lastRounded: string | null = null;
    let lastRoundedAt = 0; // czas ostatniego identycznego rounded, do dedupe

    return scoreBus.subscribe((e) => {
        const now = e.at;

        // throttle
        if (now - lastEventAt < min) return;
        lastEventAt = now;

        // dedupe
        const factor = Math.pow(10, roundTo);
        const rounded = (Math.round(e.score * factor) / factor).toFixed(roundTo);
        if (lastRounded && rounded === lastRounded && now - lastRoundedAt < dedupe) return;
        lastRounded = rounded;
        lastRoundedAt = now;

        handler(e.score);
    });
}

/* -------------------- Reakcje z wagami -------------------- */
export function reactionForScore(score: number, rng = Math.random): ChoreoBuilder {
    const r = rng();
    if (score >= 8.5) {
        const strong = [
            seq().happy(300).celebrate(600),
            seq().danceA(300).danceB(300).celebrate(500),
            seq().jump(400).raiseCard(score, 700),
        ];
        return strong[Math.floor(r * strong.length)];
    }
    if (score >= 5.5) {
        const mid = [
            seq().shrug(450),
            seq().nodYes(450),
            seq().leanBack(400),
        ];
        return mid[Math.floor(r * mid.length)].raiseCard(score, 700);
    }
    const low = [
        seq().angry(400).shouting(400),
        seq().facepalm(500).disappointed(400),
        seq().swearing(450).shakeNo(450),
    ];
    return low[Math.floor(r * low.length)].raiseCard(score, 900);
}

/* -------------------- Preset: Intro -------------------- */
export async function playIntro(actors: PersonControls[]): Promise<void> {
    if (!actors.length) return;
    const programs = [
        seq().enterFromLeft(0.6).waveHand(600).raiseCard(9, 700).idle(200),
        seq().enterFromRight(0.6).spin(600).danceA(400).idle(200),
        seq().enterFromLeft(0.5).jump(450).pointRight(350).idle(200),
        seq().enterFromRight(0.5).happy(300).raiseCard(10, 800),
    ];
    await runRounds(actors, programs);
}

/* -------------------- Test utilities -------------------- */
export const simulateScore = (score: number) => scoreBus.push(score);

// Podłączenie reakcji jurorów do busa wyników
export function attachScoreReactions(
    actors: PersonControls[],
    opts: ScoreListenerOptions = {},
    rng = Math.random
): () => void {
    return onScore(async (score) => {
        const programs = actors.map(() => reactionForScore(score, rng));
        await runRounds(actors, programs, 80, { score } as RunContext);
    }, opts);
}
