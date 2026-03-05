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
    | "waveHand"    // waving the right hand
    | "facepalm"    // hand to face
    | "shrug"       // wzruszenie ramionami
    | "nodYes"      // potakiwanie
    | "shakeNo"     // przeczenie
    | "pointRight"  // pointing (right to the side)
    | "leanBack"    // leaning back
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

async function baseReset(fx: PersonControls) {
    const spring = { type: "spring" as const, stiffness: 180, damping: 18, mass: 0.8 };
    await Promise.all([
        fx.root.start({ x: 0, y: 0, rotate: 0, scale: 1, transition: spring }),
        fx.body.start({ rotate: 0, transition: spring }),
        fx.head.start({ rotate: 0, y: 0, transition: spring }),
        fx.eyes.start({ scaleY: 1, y: 0, transition: { duration: 0.15 } }),
        fx.mouth.start({ scaleY: 1, scaleX: 1, y: 0, transition: spring }),
        fx.leftArm.start({ rotate: 8, transition: spring }),
        fx.rightArm.start({ rotate: -8, transition: spring }),
        fx.card.start({ y: 0, rotate: 0, opacity: 0, transition: { duration: 0.15 } }),
        fx.curse.start({ opacity: 0, y: -40, transition: { duration: 0.15 } }),
    ]);
}

/* -------------------- Pose engine -------------------- */

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
            // Organic breathing: gentle body sway + head bob + arm float
            void fx.body.start({
                rotate: [0, 0.8, 0, -0.8, 0],
                transition: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            });
            void fx.head.start({
                y: [0, -1, 0, -0.5, 0],
                rotate: [0, 0.5, 0, -0.5, 0],
                transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            });
            void fx.leftArm.start({
                rotate: [8, 6, 8, 10, 8],
                transition: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            });
            void fx.rightArm.start({
                rotate: [-8, -10, -8, -6, -8],
                transition: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
            });
            // Blink cycle — longer gaps between blinks, varied timing
            void fx.eyes.start({
                scaleY: [1, 1, 1, 0.08, 1, 1, 1, 1, 0.08, 1],
                transition: { duration: 6, repeat: Infinity, times: [0, 0.4, 0.42, 0.44, 0.46, 0.7, 0.85, 0.87, 0.89, 0.91] },
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
            const spring = { type: "spring" as const, stiffness: 200, damping: 14 };
            await Promise.all([
                fx.head.start({ y: [-2, -10, -2], transition: { ...spring, duration: d } }),
                fx.mouth.start({ scaleY: 0.4, scaleX: 1.4, y: 2, transition: spring }),
                fx.leftArm.start({ rotate: [10, -5, 10], transition: { ...spring, duration: d } }),
                fx.rightArm.start({ rotate: [-10, -25, -10], transition: { ...spring, duration: d } }),
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
            const sp = { type: "spring" as const, stiffness: 160, damping: 12, mass: 0.7 };
            await Promise.all([
                fx.root.start({ y: [0, -14, 0, -10, 0], transition: { ...sp, duration: 1.4 } }),
                fx.leftArm.start({ rotate: [8, 45, 8, 35, 8], transition: { ...sp, duration: 1.4 } }),
                fx.rightArm.start({ rotate: [-8, -40, -8, -30, -8], transition: { ...sp, duration: 1.4 } }),
                fx.head.start({ rotate: [0, 3, -3, 2, 0], transition: { ...sp, duration: 1.4 } }),
            ]);
            return;
        }

        case "danceB": {
            const sp = { type: "spring" as const, stiffness: 170, damping: 14 };
            await Promise.all([
                fx.root.start({ rotate: [0, 7, -7, 0], y: [0, -4, 0, -3, 0], transition: { ...sp, duration: 1.1 } }),
                fx.head.start({ rotate: [0, -9, 9, 0], transition: { ...sp, duration: 1.1 } }),
                fx.leftArm.start({ rotate: [8, 20, 8], transition: { ...sp, duration: 1.1 } }),
                fx.rightArm.start({ rotate: [-8, -20, -8], transition: { ...sp, duration: 1.1 } }),
            ]);
            return;
        }

        case "danceC": {
            const sp = { type: "spring" as const, stiffness: 150, damping: 12, mass: 0.8 };
            await Promise.all([
                fx.root.start({ x: [0, 16, -16, 0], transition: { ...sp, duration: 1.2 } }),
                fx.body.start({ rotate: [0, -6, 6, 0], transition: { ...sp, duration: 1.2 } }),
                fx.head.start({ rotate: [0, 4, -4, 0], transition: { ...sp, duration: 1.2 } }),
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
            await fx.root.start({ x: 0, transition: { type: "spring", stiffness: 120, damping: 18, mass: 1 } });
            return;
        }

        case "enterFromRight": {
            await fx.root.start({ x: screenW, y: 0, transition: { duration: 0 } });
            await fx.root.start({ x: 0, transition: { type: "spring", stiffness: 120, damping: 18, mass: 1 } });
            return;
        }

        /* ----------- NOWE 10 ----------- */

        case "waveHand": {
            const sp = { type: "spring" as const, stiffness: 200, damping: 10 };
            await Promise.all([
                fx.rightArm.start({ rotate: [-8, -50, -8, -50, -8], transition: { ...sp, duration: 1.4 } }),
                fx.head.start({ rotate: [0, 3, -3, 0], transition: { ...sp, duration: 1.4 } }),
                fx.card.start({ opacity: 0, transition: { duration: 0.2 } }),
            ]);
            return;
        }

        case "facepalm": {
            // prawa ręka do twarzy, lekki opad głowy
            const sp = { type: "spring" as const, stiffness: 120, damping: 16 };
            await Promise.all([
                fx.rightArm.start({ rotate: -110, transition: sp }),
                fx.head.start({ y: 5, rotate: 10, transition: sp }),
                fx.body.start({ rotate: 3, transition: sp }),
                fx.card.start({ opacity: 0, transition: { duration: 0.2 } }),
            ]);
            return;
        }

        case "shrug": {
            const sp = { type: "spring" as const, stiffness: 180, damping: 12 };
            await Promise.all([
                fx.leftArm.start({ rotate: [-5, -45, -5], transition: { ...sp, duration: d } }),
                fx.rightArm.start({ rotate: [-8, -55, -8], transition: { ...sp, duration: d } }),
                fx.head.start({ rotate: [0, -7, 0, 7, 0], transition: { ...sp, duration: d } }),
                fx.root.start({ y: [0, -3, 0], transition: { ...sp, duration: d * 0.6 } }),
            ]);
            return;
        }

        case "nodYes": {
            await fx.head.start({ rotate: [0, -10, 10, -7, 7, 0], transition: { type: "spring", stiffness: 200, damping: 14, duration: 1.0 } });
            return;
        }

        case "shakeNo": {
            await fx.head.start({ rotate: [0, 12, -12, 10, -10, 0], transition: { type: "spring", stiffness: 220, damping: 12, duration: 0.9 } });
            return;
        }

        case "pointRight": {
            const sp = { type: "spring" as const, stiffness: 180, damping: 14 };
            await Promise.all([
                fx.rightArm.start({ rotate: -35, transition: sp }),
                fx.body.start({ rotate: -5, transition: sp }),
                fx.head.start({ rotate: -4, transition: sp }),
                fx.card.start({ opacity: 0, transition: { duration: 0.2 } }),
            ]);
            return;
        }

        case "leanBack": {
            const sp = { type: "spring" as const, stiffness: 140, damping: 16 };
            await Promise.all([
                fx.body.start({ rotate: -10, transition: sp }),
                fx.head.start({ y: -3, rotate: -3, transition: sp }),
            ]);
            return;
        }

        case "jump": {
            await fx.root.start({ y: [0, -30, 0], transition: { type: "spring", stiffness: 300, damping: 10 } });
            return;
        }

        case "spin": {
            await fx.root.start({ rotate: [0, 360], y: [0, -8, 0], transition: { duration: 0.8, ease: "easeInOut" } });
            return;
        }

        case "celebrate": {
            const spring = { type: "spring" as const, stiffness: 220, damping: 12 };
            await Promise.all([
                fx.leftArm.start({ rotate: [-30, -60, -30], transition: { ...spring, duration: d } }),
                fx.rightArm.start({ rotate: [-30, -70, -30], transition: { ...spring, duration: d } }),
                fx.root.start({ y: [0, -20, 0, -14, 0], transition: { ...spring, duration: 1.2 } }),
                fx.head.start({ y: [0, -4, 0], transition: { ...spring, duration: 0.6 } }),
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
