import React, { useImperativeHandle, useRef } from "react";
import type { CharacterConfig } from "./characterTypes";
import type { ChoreoStep } from "./animationHelper";
import RigPlayer, { type RigPlayerHandle } from "./rig/RigPlayer";

/// Props compatible with AnimatedPerson where sensible.
export type AnimatedPersonRigProps = {
    /// Character visual config.
    character: CharacterConfig;
    /// Start pose hint.
    startPose?: "idle" | "enterFromLeft" | "enterFromRight";
    /// Initial score overlay (optional).
    score?: number;
    /// Called when internal API is ready.
    onReady?: (api: { play: (steps: ChoreoStep[]) => Promise<void>; raiseCard: (s?: number) => Promise<void>; }) => void;
    /// Pixel size override.
    size?: number;
    /// Show debug joints.
    debug?: boolean;
};

/// Rig-driven person exposing minimal API similar to PersonControls.
const AnimatedPersonRig = React.forwardRef<unknown, AnimatedPersonRigProps>(
    ({ character, startPose = "idle", score, onReady, size, debug }, _fwdRef) => {
        const rigRef = useRef<RigPlayerHandle>(null);

        useImperativeHandle(_fwdRef, () => ({}), []);

        React.useEffect(() => {
            if (!rigRef.current) return;
            onReady?.({
                play: (steps) => rigRef.current!.playChoreo(steps),
                raiseCard: (s?: number) => rigRef.current!.raiseCardIK(s),
            });
            if (startPose === "enterFromLeft") rigRef.current.tweenTo({ pelvis: 90, lThigh: 120, rThigh: 60 }, 300);
            if (startPose === "enterFromRight") rigRef.current.tweenTo({ pelvis: 90, lThigh: 60, rThigh: 120 }, 300);
        }, [startPose, onReady]);

        return (
            <div className="relative inline-block">
                <RigPlayer ref={rigRef} character={character} size={size ?? character.size} debug={debug} />
                {typeof score === "number" && (
                    <div className="absolute left-1/2 top-2 -translate-x-1/2 text-xs bg-white/80 rounded px-1 py-0.5 border">
                        {score}
                    </div>
                )}
            </div>
        );
    }
);

export default AnimatedPersonRig;
