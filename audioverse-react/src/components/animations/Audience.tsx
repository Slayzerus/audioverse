import React from "react";
import AnimatedPerson from "./AnimatedPerson";
import type { CharacterConfig, FeatureConfig } from "./characterTypes";
import { DEFAULT_CHARACTER } from "./characterTypes";
import { seq, runRounds } from "./choreoDSL";
import type { PersonControls } from "./animationHelper";

/// Generate hex color.
const rnd = () => `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}`;

function recolor(f: FeatureConfig, n: number): FeatureConfig {
    const colors = new Array(Math.max(1, Math.min(3, n))).fill(0).map(rnd);
    return { ...f, colors };
}

/// Create N random audience characters.
function makeAudience(n: number): CharacterConfig[] {
    const arr: CharacterConfig[] = [];
    for (let i = 0; i < n; i++) {
        arr.push({
            ...DEFAULT_CHARACTER,
            name: `Fan ${i + 1}`,
            size: 150 + Math.round(Math.random() * 40) - 20,
            outfit: recolor(DEFAULT_CHARACTER.outfit, 3),
            hair: recolor(DEFAULT_CHARACTER.hair, 2),
            headwear: Math.random() < 0.3 ? recolor(DEFAULT_CHARACTER.headwear, 2) : { variant: "none", colors: ["var(--anim-stroke, #111)"] },
            prop: Math.random() < 0.25 ? { variant: "star", colors: [rnd(), rnd(), "var(--anim-stroke, #111)"] } : { variant: "none", colors: ["var(--anim-stroke, #111)"] },
        });
    }
    return arr;
}

/// Audience grid with simple controls.
export type AudienceProps = {
    /// Number of people.
    count?: number;
    /// Columns in CSS grid.
    columns?: number;
};

const Audience: React.FC<AudienceProps> = ({ count = 36, columns = 12 }) => {
    const people = React.useMemo(() => makeAudience(count), [count]);
    const refs = React.useRef<Array<PersonControls | null>>([]);
    refs.current = [];

    const actors = () => refs.current.filter(Boolean) as PersonControls[];

    const cheer = async () => {
        const a = actors();
        if (!a.length) return;
        await runRounds(
            a,
            [seq().jump(250).celebrate(500), seq().waveHand(600), seq().danceB(450)],
            60
        );
    };

    const wave = async () => {
        const a = actors();
        if (!a.length) return;
        await Promise.all(
            new Array(Math.ceil(a.length / columns)).fill(0).map((_, row) =>
                runRounds(
                    a.slice(row * columns, row * columns + columns),
                    [seq().waveHand(500)],
                    120 * row
                )
            )
        );
    };

    return (
        <div className="space-y-2">
            <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
                {people.map((c, i) => (
                    <AnimatedPerson
                        key={i}
                        character={c}
                        score={10}
                        startPose="idle"
                        onReady={(fx) => (refs.current[i] = fx)}
                    />
                ))}
            </div>
            <div className="flex gap-2">
                <button className="px-3 py-1 border rounded" onClick={wave}>Wave</button>
                <button className="px-3 py-1 border rounded" onClick={cheer}>Cheer</button>
            </div>
        </div>
    );
};

export default Audience;
