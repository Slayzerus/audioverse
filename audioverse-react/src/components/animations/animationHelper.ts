// components/animations/animationHelper.ts
import React from "react";
import {
    useAnimationControls,
    AnimationControls,
} from "framer-motion";

/* -------------------- Typy -------------------- */

export type PersonControls = {
    root: AnimationControls;
    body: AnimationControls;
    head: AnimationControls;
    eyes: AnimationControls;
    mouth: AnimationControls;
    leftArm: AnimationControls;
    rightArm: AnimationControls;
    card: AnimationControls;
    curse: AnimationControls;
};

export function usePersonControls(): PersonControls {
    const root     = useAnimationControls();
    const body     = useAnimationControls();
    const head     = useAnimationControls();
    const eyes     = useAnimationControls();
    const mouth    = useAnimationControls();
    const leftArm  = useAnimationControls();
    const rightArm = useAnimationControls();
    const card     = useAnimationControls();
    const curse    = useAnimationControls();

    return React.useMemo(
        () => ({ root, body, head, eyes, mouth, leftArm, rightArm, card, curse }),
        [root, body, head, eyes, mouth, leftArm, rightArm, card, curse]
    );
}

/** Dotychczasowe pozy + 10 nowych */
export type PersonPose =
    | "idle"
    | "raiseCard"
    | "happy"
    | "angry"
    | "disappointed"
    | "swearing"
    | "shouting"
    | "rock"
    | "danceA"
    | "danceB"
    | "danceC"
    | "hideDown"
    | "exitLeft"
    | "exitRight"
    | "enterFromLeft"
    | "enterFromRight"
    // ---- NOWE 10 ----
    | "waveHand"    // machanie prawą ręką
    | "facepalm"    // ręka do twarzy
    | "shrug"       // wzruszenie ramionami
    | "nodYes"      // potakiwanie
    | "shakeNo"     // przeczenie
    | "pointRight"  // wskazanie (prawa w bok)
    | "leanBack"    // odchylenie do tyłu
    | "jump"        // podskok
    | "spin"        // obrót
    | "celebrate";  // oba ramiona w górę + podskok

export type PoseOptions = {
    duration?: number;
    score?: number | string;
    screenW?: number;
    screenH?: number;
};

export type ChoreoStep = { pose: PersonPose; holdMs?: number; options?: PoseOptions };

/* -------------------- Helpers -------------------- */

const isBrowser = typeof window !== "undefined";
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

async function baseReset(fx: PersonControls) {
    await Promise.all([
        fx.root.start({ x: 0, y: 0, rotate: 0, scale: 1, transition: { duration: 0.2 } }),
        fx.body.start({ rotate: 0, transition: { duration: 0.2 } }),
        fx.head.start({ rotate: 0, y: 0, transition: { duration: 0.2 } }),
        fx.eyes.start({ scaleY: 1, y: 0, transition: { duration: 0.2 } }),
        fx.mouth.start({ scaleY: 1, scaleX: 1, y: 0, transition: { duration: 0.2 } }),
        fx.leftArm.start({ rotate: 10, transition: { duration: 0.2 } }),
        fx.rightArm.start({ rotate: -10, transition: { duration: 0.2 } }),
        fx.card.start({ y: 0, rotate: 0, opacity: 0, transition: { duration: 0.2 } }),
        fx.curse.start({ opacity: 0, y: -40, transition: { duration: 0.2 } }),
    ]);
}

/* -------------------- Silnik póz -------------------- */

export async function playPose(
    fx: PersonControls,
    pose: PersonPose,
    opts: PoseOptions = {}
): Promise<void> {
    const screenW = Math.max(1, opts.screenW ?? (isBrowser ? window.innerWidth : 1920));
    const screenH = Math.max(1, opts.screenH ?? (isBrowser ? window.innerHeight : 1080));
    const d = opts.duration ?? 0.8;

    switch (pose) {
        case "idle": {
            await baseReset(fx);
            await fx.body.start({
                rotate: [0, 1.5, 0, -1.5, 0],
                transition: { duration: 3.5 },
            });
            return;
        }

        case "raiseCard": {
            await Promise.all([
                fx.rightArm.start({ rotate: -75, transition: { duration: d } }),
                fx.card.start({ opacity: 1, y: -70, rotate: -5, transition: { duration: d } }),
                fx.head.start({ y: -4, transition: { duration: d * 0.6 } }),
            ]);
            return;
        }

        case "happy": {
            await Promise.all([
                fx.head.start({ y: [-2, -10, -2], transition: { duration: d } }),
                fx.mouth.start({ scaleY: 0.4, scaleX: 1.4, y: 2, transition: { duration: d } }),
                fx.leftArm.start({ rotate: [10, -5, 10], transition: { duration: d } }),
                fx.rightArm.start({ rotate: [-10, -25, -10], transition: { duration: d } }),
            ]);
            return;
        }

        case "angry": {
            await Promise.all([
                fx.head.start({ rotate: [-6, 6, -6, 0], transition: { duration: d } }),
                fx.mouth.start({ scaleY: 1.6, scaleX: 0.9, y: 4, transition: { duration: d } }),
                fx.eyes.start({ scaleY: 0.7, transition: { duration: d } }),
                fx.card.start({ opacity: 0, transition: { duration: 0.2 } }),
            ]);
            return;
        }

        case "disappointed": {
            await Promise.all([
                fx.body.start({ rotate: 4, transition: { duration: d } }),
                fx.head.start({ y: 6, rotate: 6, transition: { duration: d } }),
                fx.mouth.start({ scaleY: 0.3, scaleX: 0.9, transition: { duration: d } }),
                fx.eyes.start({ scaleY: 0.5, transition: { duration: d } }),
                fx.card.start({ opacity: 0, transition: { duration: 0.2 } }),
            ]);
            return;
        }

        case "swearing": {
            await Promise.all([
                fx.curse.start({ opacity: [0, 1, 0], y: [-30, -50, -55], transition: { duration: d + 0.5 } }),
                fx.mouth.start({ scaleY: 1.4, y: 3, transition: { duration: d } }),
                fx.card.start({ opacity: 0, transition: { duration: 0.2 } }),
            ]);
            return;
        }

        case "shouting": {
            await Promise.all([
                fx.head.start({ y: -5, transition: { duration: d * 0.6 } }),
                fx.mouth.start({ scaleY: 2, scaleX: 1.1, y: 6, transition: { duration: d } }),
                fx.rightArm.start({ rotate: -25, transition: { duration: d } }),
                fx.card.start({ opacity: 0, transition: { duration: 0.2 } }),
            ]);
            return;
        }

        case "rock": {
            await fx.root.start({
                rotate: [0, -3, 3, -2, 2, 0],
                transition: { duration: 2.2 },
            });
            return;
        }

        case "danceA": {
            await Promise.all([
                fx.root.start({ y: [0, -12, 0, -8, 0], transition: { duration: 1.4 } }),
                fx.leftArm.start({ rotate: [10, 40, 10, 30, 10], transition: { duration: 1.4 } }),
                fx.rightArm.start({ rotate: [-10, -35, -10, -25, -10], transition: { duration: 1.4 } }),
            ]);
            return;
        }

        case "danceB": {
            await Promise.all([
                fx.root.start({ rotate: [0, 6, -6, 0], transition: { duration: 1.1 } }),
                fx.head.start({ rotate: [0, -8, 8, 0], transition: { duration: 1.1 } }),
            ]);
            return;
        }

        case "danceC": {
            await Promise.all([
                fx.root.start({ x: [0, 14, -14, 0], transition: { duration: 1.2 } }),
                fx.body.start({ rotate: [0, -5, 5, 0], transition: { duration: 1.2 } }),
            ]);
            return;
        }

        case "hideDown": {
            await fx.root.start({ y: screenH, transition: { duration: d } });
            return;
        }

        case "exitLeft": {
            await fx.root.start({ x: -screenW, transition: { duration: d } });
            return;
        }

        case "exitRight": {
            await fx.root.start({ x: screenW, transition: { duration: d } });
            return;
        }

        case "enterFromLeft": {
            await fx.root.start({ x: -screenW, y: 0, transition: { duration: 0 } });
            await fx.root.start({ x: 0, transition: { duration: d } });
            return;
        }

        case "enterFromRight": {
            await fx.root.start({ x: screenW, y: 0, transition: { duration: 0 } });
            await fx.root.start({ x: 0, transition: { duration: d } });
            return;
        }

        /* ----------- NOWE 10 ----------- */

        case "waveHand": {
            await Promise.all([
                fx.rightArm.start({ rotate: [-10, -40, -10, -40, -10], transition: { duration: 1.4 } }),
                fx.card.start({ opacity: 0, transition: { duration: 0.2 } }),
            ]);
            return;
        }

        case "facepalm": {
            // prawa ręka do twarzy, lekki opad głowy
            await Promise.all([
                fx.rightArm.start({ rotate: -110, transition: { duration: d } }),
                fx.head.start({ y: 4, rotate: 8, transition: { duration: d } }),
                fx.card.start({ opacity: 0, transition: { duration: 0.2 } }),
            ]);
            return;
        }

        case "shrug": {
            await Promise.all([
                fx.leftArm.start({ rotate: [-5, -40, -5], transition: { duration: d } }),
                fx.rightArm.start({ rotate: [-10, -50, -10], transition: { duration: d } }),
                fx.head.start({ rotate: [0, -6, 0, 6, 0], transition: { duration: d } }),
            ]);
            return;
        }

        case "nodYes": {
            await fx.head.start({ rotate: [0, -8, 8, -6, 6, 0], transition: { duration: 1.0 } });
            return;
        }

        case "shakeNo": {
            await fx.head.start({ rotate: [0, 10, -10, 8, -8, 0], transition: { duration: 0.9 } });
            return;
        }

        case "pointRight": {
            await Promise.all([
                fx.rightArm.start({ rotate: -30, transition: { duration: d } }),
                fx.body.start({ rotate: -4, transition: { duration: d } }),
                fx.card.start({ opacity: 0, transition: { duration: 0.2 } }),
            ]);
            return;
        }

        case "leanBack": {
            await Promise.all([
                fx.body.start({ rotate: -8, transition: { duration: d } }),
                fx.head.start({ y: -2, transition: { duration: d * 0.6 } }),
            ]);
            return;
        }

        case "jump": {
            await fx.root.start({ y: [0, -26, 0], transition: { duration: 0.6 } });
            return;
        }

        case "spin": {
            await fx.root.start({ rotate: [0, 360], transition: { duration: 1.0 } });
            return;
        }

        case "celebrate": {
            await Promise.all([
                fx.leftArm.start({ rotate: [-30, -50, -30], transition: { duration: d } }),
                fx.rightArm.start({ rotate: [-30, -60, -30], transition: { duration: d } }),
                fx.root.start({ y: [0, -16, 0, -12, 0], transition: { duration: 1.2 } }),
                fx.card.start({ opacity: 0, transition: { duration: 0.2 } }),
            ]);
            return;
        }
    }
}

/* -------------------- Choreo runner -------------------- */

export async function runChoreo(fx: PersonControls, steps: ChoreoStep[]): Promise<void> {
    for (const step of steps) {
        await playPose(fx, step.pose, step.options);
        if (step.holdMs && step.holdMs > 0) {
            await new Promise<void>((r) => setTimeout(r, step.holdMs));
        }
    }
}
