import React, { useEffect, useImperativeHandle, useMemo, useRef, forwardRef } from "react";
import AnimatedPerson from "./AnimatedPerson";
import type { PersonControls } from "./animationHelper";
import { seq, runWave, runCannon, runRounds, type ChoreoBuilder } from "./choreoDSL";
import { playIntro, attachScoreReactions, reactionForScore } from "./karaokeIntegration";
import { DEFAULT_CHARACTER, type CharacterConfig } from "./characterTypes";

export type JurorsProps = {
    /** Exactly 4 character configs. If fewer – fills with default. */
    characters?: CharacterConfig[];
    /** Auto-attach reactions to scoreBus (throttle + dedupe). */
    autoReact?: boolean;
    /** Play intro after mounting. */
    playIntroOnMount?: boolean;
    /** Delay between jurors for group effects. */
    staggerMs?: number;
    className?: string;
    style?: React.CSSProperties;
};

export type JurorsHandle = {
    /** List of framer-motion controllers for each juror (in order). */
    getActors(): PersonControls[];
    /** Initial entrance — different sides/gestures. */
    playIntro(): Promise<void>;
    /** Reakcja wszystkich na wynik (losowa w odpowiednim zakresie). */
    reactToScore(score: number): Promise<void>;
    /** Wave: 1→4 with delay. */
    wave(program?: ChoreoBuilder, staggerMs?: number): Promise<void>;
    /** Cannon: 1→4 a potem 4→1. */
    cannon(program?: ChoreoBuilder, staggerMs?: number): Promise<void>;
    /** Individual programs for each (lengths may repeat). */
    run(programs: Array<ChoreoBuilder>): Promise<void>;
};

const fillTo4 = (arr: CharacterConfig[] | undefined): CharacterConfig[] => {
    const base = arr && arr.length ? arr.slice(0, 4) : [];
    while (base.length < 4) base.push({ ...DEFAULT_CHARACTER, name: `J${base.length + 1}` });
    return base as CharacterConfig[];
};

const Jurors = forwardRef<JurorsHandle, JurorsProps>((props, ref) => {
    const { characters, autoReact = true, playIntroOnMount = false, staggerMs = 220, className, style } = props;

    const cfg = useMemo(() => fillTo4(characters), [characters]);

    const p1 = useRef<PersonControls | null>(null);
    const p2 = useRef<PersonControls | null>(null);
    const p3 = useRef<PersonControls | null>(null);
    const p4 = useRef<PersonControls | null>(null);

    const actors = () => [p1.current!, p2.current!, p3.current!, p4.current!].filter(Boolean);

    useEffect(() => {
        if (playIntroOnMount) {
            const a = actors();
            if (a.length === 4) playIntro(a);
        }
    }, [playIntroOnMount]);

    useEffect(() => {
        if (!autoReact) return;
        const a = actors();
        if (a.length === 0) return;
        const detach = attachScoreReactions(a, { minIntervalMs: 400, dedupeWindowMs: 800, roundTo: 1 });
        return () => detach();
    }, [autoReact]);

    useImperativeHandle(ref, (): JurorsHandle => ({
        getActors: () => actors(),
        playIntro: async () => { const a = actors(); if (a.length === 4) await playIntro(a); },
        reactToScore: async (score: number) => {
            const a = actors();
            if (!a.length) return;
            const programs = a.map(() => reactionForScore(score));
            await runRounds(a, programs, 80, { score });
        },
        wave: async (program = seq().waveHand(600), st = staggerMs) => {
            const a = actors(); if (a.length) await runWave(a, program, st);
        },
        cannon: async (program = seq().jump(400), st = staggerMs) => {
            const a = actors(); if (a.length) await runCannon(a, program, st);
        },
        run: async (programs: Array<ChoreoBuilder>) => {
            const a = actors(); if (a.length) await runRounds(a, programs, 0);
        },
    }), [staggerMs]);

    return (
        <div className={className} style={style}>
            <div style={{ display: "flex", gap: 24 }}>
                <AnimatedPerson onReady={(fx) => (p1.current = fx)} character={cfg[0]} />
                <AnimatedPerson onReady={(fx) => (p2.current = fx)} character={cfg[1]} />
                <AnimatedPerson onReady={(fx) => (p3.current = fx)} character={cfg[2]} />
                <AnimatedPerson onReady={(fx) => (p4.current = fx)} character={cfg[3]} />
            </div>
        </div>
    );
});

export default Jurors;
