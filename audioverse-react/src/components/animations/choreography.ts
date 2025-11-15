// components/animations/choreography.ts
import { ChoreoStep } from "./animationHelper";

/** prosta paczka z wcześniejszych przykładów */
export const waveScoreChoreo = (score: number | string): ChoreoStep[] => [
    { pose: "enterFromLeft", options: { duration: 0.6 } },
    { pose: "happy", holdMs: 250 },
    { pose: "raiseCard", options: { duration: 0.6, score }, holdMs: 800 },
    { pose: "rock", holdMs: 150 },
    { pose: "idle", holdMs: 300 },
];

export const booChoreo: ChoreoStep[] = [
    { pose: "angry", holdMs: 350 },
    { pose: "swearing", holdMs: 350 },
    { pose: "disappointed", holdMs: 300 },
    { pose: "hideDown", holdMs: 400 },
];

export const danceParty: ChoreoStep[] = [
    { pose: "danceA", holdMs: 300 },
    { pose: "danceB", holdMs: 300 },
    { pose: "danceC", holdMs: 300 },
    { pose: "danceA", holdMs: 300 },
    { pose: "idle" },
];

/** NOWE: pokaz wszystkich póz (stare + 10 nowych) */
export const showcaseAll: ChoreoStep[] = [
    { pose: "enterFromRight", options: { duration: 0.5 } },
    { pose: "idle", holdMs: 250 },

    // emocje bazowe
    { pose: "happy", holdMs: 350 },
    { pose: "angry", holdMs: 350 },
    { pose: "disappointed", holdMs: 350 },
    { pose: "swearing", holdMs: 400 },
    { pose: "shouting", holdMs: 350 },

    // kłanianie/rock i tańce
    { pose: "rock", holdMs: 500 },
    { pose: "danceA", holdMs: 350 },
    { pose: "danceB", holdMs: 350 },
    { pose: "danceC", holdMs: 350 },

    // 10 NOWYCH
    { pose: "waveHand", holdMs: 600 },
    { pose: "facepalm", holdMs: 500 },
    { pose: "shrug", holdMs: 450 },
    { pose: "nodYes", holdMs: 450 },
    { pose: "shakeNo", holdMs: 450 },
    { pose: "pointRight", holdMs: 400 },
    { pose: "leanBack", holdMs: 400 },
    { pose: "jump", holdMs: 450 },
    { pose: "spin", holdMs: 650 },
    { pose: "celebrate", holdMs: 600 },

    // kartka na koniec i wyjście
    { pose: "raiseCard", holdMs: 1000, options: { duration: 0.6 } },
    { pose: "exitRight", options: { duration: 0.6 } },
];
