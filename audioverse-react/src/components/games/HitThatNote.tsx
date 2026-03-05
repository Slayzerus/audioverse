import React, { useCallback, useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { HitThatNoteGame, type HitThatNoteConfig } from "../../scripts/games/hitThatNote";

interface Props {
    bpm?: number;
    bars?: number;
    difficulty?: number;
    seed?: number;
}

const HitThatNoteGameComponent: React.FC<Props> = ({
    bpm = 120,
    bars = 16,
    difficulty = 3,
    seed,
}) => {
    const gameRef = useRef<Phaser.Game | null>(null);
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const [lastResult, setLastResult] = useState<{
        score: number;
        max: number;
        combo: number;
    } | null>(null);

    const onGameEnd = useCallback(
        (score: number, maxScore: number, combo: number) => {
            setLastResult({ score, max: maxScore, combo });
        },
        []
    );

    useEffect(() => {
        if (gameContainerRef.current && !gameRef.current) {
            const { clientWidth, clientHeight } = gameContainerRef.current;

            const cfg: HitThatNoteConfig = {
                bpm,
                bars,
                difficulty,
                seed: seed ?? Date.now(),
                onGameEnd,
            };

            const scene = new HitThatNoteGame();

            gameRef.current = new Phaser.Game({
                type: Phaser.AUTO,
                width: clientWidth,
                height: Math.max(400, clientHeight),
                parent: gameContainerRef.current,
                scene: scene,
                scale: {
                    mode: Phaser.Scale.RESIZE,
                    autoCenter: Phaser.Scale.CENTER_BOTH,
                },
                callbacks: {
                    postBoot: (game) => {
                        game.scene.start("HitThatNoteGame", cfg);
                    },
                },
            });
        }

        return () => {
            gameRef.current?.destroy(true);
            gameRef.current = null;
        };
        // Mount-only: Phaser game instance created once
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div style={{ width: "100%", height: "100vh", background: "var(--card-elevated, #0a0a1a)", position: "relative" }}>
            <div ref={gameContainerRef} style={{ width: "100%", height: "100%" }} />
            {lastResult && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 16,
                        left: 16,
                        background: "var(--overlay-bg, rgba(0,0,0,0.7))",
                        color: "var(--text-primary, #fff)",
                        padding: "8px 16px",
                        borderRadius: 8,
                        fontSize: 14,
                    }}
                >
                    Ostatni wynik: {lastResult.score}/{lastResult.max} | Combo: {lastResult.combo}x
                </div>
            )}
        </div>
    );
};

export default HitThatNoteGameComponent;
