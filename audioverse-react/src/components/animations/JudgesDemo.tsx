import { useRef, useEffect } from "react";
import AnimatedPerson from "./AnimatedPerson";
import type { PersonControls } from "./animationHelper";
import { seq, runWave, runCannon, runRounds } from "./choreoDSL";
import {
    playIntro,
    attachScoreReactions,
    simulateScore,
    reactionForScore,
} from "./karaokeIntegration";
import { DEFAULT_CHARACTER, type CharacterConfig } from "./characterTypes";

// 4 profile jurorów (przykładowe – zamiast dawnego `shirt`)
const J1: CharacterConfig = {
    ...DEFAULT_CHARACTER,
    name: "J1",
    outfit: { variant: "hoodie", colors: ["var(--anim-outfit-j1-1, #e11d48)", "var(--anim-outfit-j1-2, #be123c)", "var(--anim-stroke, #111)"] },
    hair: { variant: "curly", colors: ["var(--anim-hair-j1-1, #2d3142)", "var(--anim-hair-j1-2, #4f5d75)"] },
    headwear: { variant: "headphones", colors: ["var(--anim-stroke, #111)", "var(--anim-headwear-1, #6b7280)"] },
    prop: { variant: "mic", colors: ["var(--anim-stroke, #111)", "var(--anim-prop-2, #666)", "var(--anim-prop-3, #ccc)"] },
};

const J2: CharacterConfig = {
    ...DEFAULT_CHARACTER,
    name: "J2",
    outfit: { variant: "suit", colors: ["var(--anim-outfit-j2-1, #10b981)", "var(--anim-outfit-j2-2, #059669)", "var(--anim-stroke, #111)"] },
    hair: { variant: "short", colors: ["var(--anim-hair-j2-1, #111827)", "var(--anim-hair-j2-2, #374151)"] },
};

const J3: CharacterConfig = {
    ...DEFAULT_CHARACTER,
    name: "J3",
    outfit: { variant: "tee", colors: ["var(--anim-outfit-j3-1, #f59e0b)", "var(--anim-outfit-j3-2, #d97706)", "var(--anim-stroke, #111)"] },
    hair: { variant: "long", colors: ["var(--anim-hair-j3-1, #78350f)", "var(--anim-hair-j3-2, #a16207)"] },
};

const J4: CharacterConfig = {
    ...DEFAULT_CHARACTER,
    name: "J4",
    outfit: { variant: "dress", colors: ["var(--anim-outfit-j4-1, #6366f1)", "var(--anim-outfit-j4-2, #4338ca)", "var(--anim-stroke, #111)"] },
    hair: { variant: "mohawk", colors: ["var(--anim-hair-j4-1, #4c1d95)", "var(--anim-hair-j4-2, #7c3aed)"] },
};

// Jeden juror – pełny showcase (demo)
const showcaseAll = () =>
    seq()
        .enterFromRight(0.5)
        .idle(250)
        .happy()
        .angry()
        .disappointed()
        .swearing()
        .shouting()
        .rock()
        .danceA()
        .danceB()
        .danceC()
        .waveHand()
        .facepalm()
        .shrug()
        .nodYes()
        .shakeNo()
        .pointRight()
        .leanBack()
        .jump()
        .spin()
        .celebrate()
        .raiseCard(10, 900, 0.6)
        .exitRight(0.6);

export default function JudgesDemo() {
    const p1 = useRef<PersonControls | null>(null);
    const p2 = useRef<PersonControls | null>(null);
    const p3 = useRef<PersonControls | null>(null);
    const p4 = useRef<PersonControls | null>(null);

    const actors = () =>
        [p1.current!, p2.current!, p3.current!, p4.current!].filter(Boolean);

    // Intro na start (każdy inaczej i z innych stron). J4 = showcase
    const startShow = async () => {
        const a = actors();
        if (a.length !== 4) return;
        await playIntro(a.slice(0, 3));
        await runRounds([a[3]], [showcaseAll()]);
    };

    // Auto-reakcje na wyniki – podpinamy bus z anty-spamem
    useEffect(() => {
        const a = actors();
        if (a.length === 0) return;
        const detach = attachScoreReactions(a, {
            minIntervalMs: 400,
            dedupeWindowMs: 800,
            roundTo: 1,
        });
        return () => detach();
    }, []);

    // Ręczna reakcja na punktację
    const reactToScore = async (score: number) => {
        const a = actors();
        if (!a.length) return;
        const programs = a.map(() => reactionForScore(score));
        await runRounds(a, programs, 80, { score });
    };

    // Przykładowe efekty dla wszystkich
    const waveAll = async () => {
        const a = actors();
        if (a.length) await runWave(a, seq().waveHand(600), 180);
    };
    const cannonAll = async () => {
        const a = actors();
        if (a.length) await runCannon(a, seq().jump(400), 160);
    };

    return (
        <div>
            <div style={{ display: "flex", gap: 24 }}>
                <AnimatedPerson onReady={(fx) => { p1.current = fx; }} character={J1} score={9} />
                <AnimatedPerson onReady={(fx) => { p2.current = fx; }} character={J2} score={10} />
                <AnimatedPerson onReady={(fx) => { p3.current = fx; }} character={J3} score={4} />
                <AnimatedPerson onReady={(fx) => { p4.current = fx; }} character={J4} score={7} />
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
                <button onClick={startShow}>Intro (różne wejścia)</button>
                <button onClick={() => reactToScore(9.2)}>Score 9.2</button>
                <button onClick={() => reactToScore(6.3)}>Score 6.3</button>
                <button onClick={() => reactToScore(3.1)}>Score 3.1</button>
                <button onClick={() => simulateScore(8.8)}>Emit bus: 8.8</button>
                <button onClick={() => simulateScore(4.2)}>Emit bus: 4.2</button>
                <button onClick={waveAll}>Wave (fala)</button>
                <button onClick={cannonAll}>Cannon</button>
            </div>
        </div>
    );
}
