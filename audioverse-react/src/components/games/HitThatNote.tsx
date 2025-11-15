import React, { useEffect, useRef } from "react";
import Phaser from "phaser";
import { HitThatNoteGame } from "../../scripts/games/hitThatNote";

const HitThatNoteGameComponent: React.FC = () => {
    const gameRef = useRef<Phaser.Game | null>(null);
    const gameContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (gameContainerRef.current && !gameRef.current) {
            const { clientWidth, clientHeight } = gameContainerRef.current;

            gameRef.current = new Phaser.Game({
                type: Phaser.AUTO,
                width: clientWidth,
                height: clientHeight,
                parent: gameContainerRef.current,
                scene: [HitThatNoteGame],
                scale: {
                    mode: Phaser.Scale.RESIZE,
                    autoCenter: Phaser.Scale.CENTER_BOTH,
                },
            });
        }

        return () => {
            gameRef.current?.destroy(true);
            gameRef.current = null;
        };
    }, []);

    return <div ref={gameContainerRef} style={{ width: "100%", height: "100vh" }}></div>;
};

export default HitThatNoteGameComponent;
