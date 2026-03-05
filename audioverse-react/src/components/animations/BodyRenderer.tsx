// components/animations/BodyRenderer.tsx
// Static SVG composer for the character. Uses shapes/* wrappers.

import React from "react";
import type { CharacterConfig } from "./characterTypes";
import { DEFAULT_COLORS, pick } from "./characterTypes";
import { Head } from "./shapes/heads";
import { Hair } from "./shapes/hair";
import { Eyes } from "./shapes/eyes";
import { Nose } from "./shapes/noses";
import { Mouth } from "./shapes/mouths";
import { Outfit } from "./shapes/outfits";
import { Torso } from "./shapes/torsos";
import { Arm } from "./shapes/arms";
import { Leg } from "./shapes/legs";
import { Headwear } from "./shapes/headwear";

/// Props for BodyRenderer (pure visual; no animation here).
export type BodyRendererProps = {
    /// Character configuration (features + palettes).
    character: CharacterConfig;
    /// Optional pixel size of the square SVG. Defaults to character.size (or 180).
    size?: number;
};

/// Static character body composed from modular shapes.
export const BodyRenderer: React.FC<BodyRendererProps> = ({ character, size }) => {
    const S = Math.max(120, Math.floor(size ?? character.size ?? 180));
    const k = S / 180; // scale factor for our nominal coordinates

    // basic colors
    const skin = pick(character.face.colors, 0, DEFAULT_COLORS.skin);
    const stroke = pick(character.face.colors, 2, DEFAULT_COLORS.stroke);
    const outfitBase = pick(character.outfit.colors, 0, DEFAULT_COLORS.shirt);

    // sleeves/limbs palettes derived from face/outfit
    const armColors: string[] = [skin, outfitBase, stroke];
    const legColors: string[] = [outfitBase, pick(character.outfit.colors, 1, outfitBase), stroke];

    // We draw with pelvis at (0,0) and up = negative Y. Place whole rig on canvas:
    return (
        <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} role="img">
            <g transform={`translate(${S / 2} ${S * 0.86})`}>
                {/* legs */}
                <Leg colors={legColors} side={-1} variant="pants" scale={k} transform="translate(-16 0)" />
                <Leg colors={legColors} side={+1} variant="pants" scale={k} transform="translate(16 0)" />

                {/* torso base (skin under neck area) */}
                <Torso variant="vShape" colors={[skin, "var(--anim-transparent, #00000000)", stroke]} scale={k} />

                {/* outfit painted over torso */}
                <Outfit variant={character.outfit.variant} colors={character.outfit.colors} scale={k} />

                {/* arms (short sleeves by default) */}
                <Arm colors={armColors} side={-1} variant="sleeveShort" scale={k} transform="translate(-40 -8)" />
                <Arm colors={armColors} side={+1} variant="sleeveShort" scale={k} transform="translate(40 -8)" />

                {/* head group */}
                <g transform="translate(0 -84)">
                    <Head variant={character.face.variant} colors={character.face.colors} scale={k} />
                    <Hair variant={character.hair.variant} colors={character.hair.colors} scale={k} />
                    <Eyes variant={character.eyes.variant} colors={character.eyes.colors} scale={k} />
                    <Nose variant={character.nose.variant} colors={character.nose.colors} scale={k} />
                    <Mouth variant={character.mouth.variant} colors={character.mouth.colors} scale={k} />
                    <Headwear variant={character.headwear.variant} colors={character.headwear.colors} scale={k} />
                </g>
            </g>
        </svg>
    );
};

export default BodyRenderer;
