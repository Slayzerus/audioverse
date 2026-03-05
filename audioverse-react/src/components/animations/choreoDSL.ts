// components/animations/choreoDSL.ts
import type { ChoreoStep, PersonControls, PersonPose, PoseOptions } from "./animationHelper";
import { runChoreo } from "./animationHelper";

/* ----------------------------------
   Mini-DSL do choreografii
   - seq() builder z .loop(n|Infinity)
   - .label(name) / .goto(name) / .gotoIf(name, predicate)
   - runSeq / runWave / runCannon / runRounds z kontekstem
   - compile(builderOrSteps, ctx) — rozwija warunkowe skoki do czystych kroków
---------------------------------- */

export type RunContext = { score?: number; [k: string]: unknown };

// Kroki wewnętrzne DSL (kompilowane do ChoreoStep[])
type InternalStep =
    | { type: "pose"; pose: PersonPose; holdMs?: number; options?: PoseOptions }
    | { type: "wait"; ms: number }
    | { type: "label"; name: string }
    | { type: "goto"; name: string; when?: (ctx: RunContext) => boolean };

export class ChoreoBuilder {
    private steps: InternalStep[] = [];
    private labels: Record<string, number> = {};
    private loopCount: number | typeof Infinity | undefined;

    pose(pose: PersonPose, holdMs: number = 0, options?: PoseOptions): this {
        this.steps.push({ type: "pose", pose, holdMs, options });
        return this;
    }

    // pauza (zachowuje obecną pozę, implementacja: idle z hold)
    wait(ms: number): this {
        this.steps.push({ type: "wait", ms });
        return this;
    }

    // tempo: przemnaża czasy (hold + options.duration)
    tempo(multiplier: number): this {
        const m = Math.max(0, multiplier);
        this.steps = this.steps.map((s) => {
            if (s.type === "pose") {
                return {
                    ...s,
                    holdMs: typeof s.holdMs === "number" ? Math.round(s.holdMs * m) : s.holdMs,
                    options: s.options
                        ? {
                            ...s.options,
                            duration:
                                typeof s.options.duration === "number"
                                    ? s.options.duration * m
                                    : s.options.duration,
                        }
                        : s.options,
                } as InternalStep;
            }
            if (s.type === "wait") return { ...s, ms: Math.round(s.ms * m) } as InternalStep;
            return s;
        });
        return this;
    }

    // powiel obecną sekwencję N razy (dokleja bez etykiet)
    repeat(times: number): this {
        const t = Math.max(0, Math.floor(times));
        const base = this.steps.slice();
        for (let i = 1; i < t; i++) this.steps.push(...base);
        return this;
    }

    // loop during playback – e.g. .loop(3) or .loop(Infinity)
    loop(times: number | typeof Infinity): this {
        this.loopCount = times;
        return this;
    }

    // znacznik, do którego można wrócić
    label(name: string): this {
        this.labels[name] = this.steps.length;
        this.steps.push({ type: "label", name });
        return this;
    }

    // build-time goto (kopiuje segment od labela na koniec)
    goto(name: string): this {
        this.steps.push({ type: "goto", name });
        return this;
    }

    // warunkowy skok (podczas kompilacji) w oparciu o RunContext
    gotoIf(name: string, when: (ctx: RunContext) => boolean): this {
        this.steps.push({ type: "goto", name, when });
        return this;
    }

    // skróty – wygoda
    idle(ms = 0) { return this.pose("idle", ms); }
    enterFromLeft(duration = 0.6) { return this.pose("enterFromLeft", 0, { duration }); }
    enterFromRight(duration = 0.6) { return this.pose("enterFromRight", 0, { duration }); }
    exitLeft(duration = 0.6) { return this.pose("exitLeft", 0, { duration }); }
    exitRight(duration = 0.6) { return this.pose("exitRight", 0, { duration }); }
    hideDown(duration = 0.6) { return this.pose("hideDown", 0, { duration }); }

    happy(ms = 350) { return this.pose("happy", ms); }
    angry(ms = 350) { return this.pose("angry", ms); }
    disappointed(ms = 350) { return this.pose("disappointed", ms); }
    swearing(ms = 350) { return this.pose("swearing", ms); }
    shouting(ms = 350) { return this.pose("shouting", ms); }
    rock(ms = 500) { return this.pose("rock", ms); }
    danceA(ms = 350) { return this.pose("danceA", ms); }
    danceB(ms = 350) { return this.pose("danceB", ms); }
    danceC(ms = 350) { return this.pose("danceC", ms); }

    waveHand(ms = 600) { return this.pose("waveHand", ms); }
    facepalm(ms = 500) { return this.pose("facepalm", ms); }
    shrug(ms = 450) { return this.pose("shrug", ms); }
    nodYes(ms = 450) { return this.pose("nodYes", ms); }
    shakeNo(ms = 450) { return this.pose("shakeNo", ms); }
    pointRight(ms = 400) { return this.pose("pointRight", ms); }
    leanBack(ms = 400) { return this.pose("leanBack", ms); }
    jump(ms = 450) { return this.pose("jump", ms); }
    spin(ms = 650) { return this.pose("spin", ms); }
    celebrate(ms = 600) { return this.pose("celebrate", ms); }

    raiseCard(score: number | string = 10, holdMs = 800, duration = 0.6) {
        return this.pose("raiseCard", holdMs, { duration, score });
    }

    // build/loop
    build(): InternalStep[] { return this.steps.slice(); }
    getLoop(): number | typeof Infinity | undefined { return this.loopCount; }
}

export const seq = () => new ChoreoBuilder();

/* ---------- Kompilacja (warunkowe goto) ---------- */
export function compile(
    builderOrSteps: ChoreoBuilder | ChoreoStep[] | InternalStep[],
    ctx: RunContext = {}
): ChoreoStep[] {
    const internal: InternalStep[] =
        builderOrSteps instanceof ChoreoBuilder
            ? builderOrSteps.build()
            : (builderOrSteps as InternalStep[]);

    const labelIndex: Record<string, number> = {};
    internal.forEach((s, i) => { if (s.type === "label") labelIndex[s.name] = i; });

    const out: ChoreoStep[] = [];
    for (let pc = 0; pc < internal.length; pc++) {
        const s = internal[pc];
        if (s.type === "pose") out.push({ pose: s.pose, holdMs: s.holdMs, options: s.options });
        else if (s.type === "wait") out.push({ pose: "idle", holdMs: s.ms });
        else if (s.type === "goto") {
            const should = s.when ? !!s.when(ctx) : true;
            if (should) {
                const idx = labelIndex[s.name];
                if (idx !== undefined) pc = idx; // jump (for loop will ++)
            }
        }
        // labels są no-op
    }
    return out;
}

/* ---------- Runnery ---------- */
export async function runSeq(
    fx: PersonControls,
    builderOrSteps: ChoreoBuilder | ChoreoStep[] | InternalStep[],
    ctx: RunContext = {}
): Promise<void> {
    if (builderOrSteps instanceof ChoreoBuilder) {
        const loop = builderOrSteps.getLoop();
        if (loop === Infinity) {
            // infinite loop
            // Intentional infinite loop for unbounded choreography playback
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const steps = compile(builderOrSteps, ctx);
                await runChoreo(fx, steps);
            }
        } else {
            const times = Math.max(1, loop ?? 1);
            for (let i = 0; i < times; i++) {
                const steps = compile(builderOrSteps, ctx);
                await runChoreo(fx, steps);
            }
        }
    } else {
        await runChoreo(fx, compile(builderOrSteps as InternalStep[], ctx));
    }
}

export async function runWave(
    actors: PersonControls[],
    choreo: ChoreoBuilder | ChoreoStep[] | InternalStep[],
    staggerMs = 220,
    ctx: RunContext = {}
): Promise<void> {
    const steps = compile(choreo as ChoreoBuilder | ChoreoStep[] | InternalStep[], ctx);
    await Promise.all(
        actors.map((fx, i) => runChoreoWithDelay(fx, steps, i * Math.max(0, staggerMs)))
    );
}

export async function runCannon(
    actors: PersonControls[],
    choreo: ChoreoBuilder | ChoreoStep[] | InternalStep[],
    staggerMs = 220,
    ctx: RunContext = {}
): Promise<void> {
    await runWave(actors, choreo, staggerMs, ctx);
    const reversed = [...actors].reverse();
    await runWave(reversed, choreo, staggerMs, ctx);
}

export async function runRounds(
    actors: PersonControls[],
    programs: Array<ChoreoBuilder | ChoreoStep[] | InternalStep[]>,
    staggerMs = 0,
    ctx: RunContext = {}
): Promise<void> {
    const jobs = actors.map((fx, i) =>
        runChoreoWithDelay(
            fx,
            compile(programs[i % programs.length] as ChoreoBuilder | ChoreoStep[] | InternalStep[], ctx),
            staggerMs * i
        )
    );
    await Promise.all(jobs);
}

async function runChoreoWithDelay(
    fx: PersonControls,
    steps: ChoreoStep[],
    delayMs: number
): Promise<void> {
    if (delayMs > 0) await new Promise<void>((r) => setTimeout(r, delayMs));
    await runChoreo(fx, steps);
}
