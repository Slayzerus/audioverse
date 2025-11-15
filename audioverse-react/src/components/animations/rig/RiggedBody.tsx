import React from "react";
import type { CharacterConfig } from "../characterTypes";
import { DEFAULT_RIG, DEFAULT_POSE, type RigConfig, type RigPose } from "./rigTypes";
import { solveFK } from "./rigMath";

/// Props for the rigged body renderer (pure SVG).
export type RiggedBodyProps = {
    /// Character visuals (colors).
    character: CharacterConfig;
    /// Rig proportions; defaults to DEFAULT_RIG.
    rig?: RigConfig;
    /// Angles (deg) for each bone; defaults to DEFAULT_POSE.
    pose?: RigPose;
    /// Pixel size (falls back to character.size or 180).
    size?: number;
    /// Draw joints overlay.
    debug?: boolean;
};

/// Render a multi-bone body (arms: 3, legs: 3, torso: 3, neck+head).
const RiggedBody: React.FC<RiggedBodyProps> = ({ character, rig, pose, size, debug }) => {
    const S = Math.max(140, Math.floor(size ?? character.size ?? 180));
    const r = rig ?? DEFAULT_RIG;
    const p = { ...DEFAULT_POSE, ...(pose ?? {}) };
    const fk = solveFK(r, p, S);

    const stroke = character.face?.colors?.[2] ?? "#111";
    const skin = character.face?.colors?.[0] ?? "#FFD2B3";
    const cloth = character.outfit?.colors?.[0] ?? "#3B82F6";

    const sw = Math.max(2, S * 0.015);
    const seg = (a: keyof typeof fk, color: string) => (
        <line x1={fk[a].x} y1={fk[a].y} x2={fk[a].x2} y2={fk[a].y2} stroke={color} strokeWidth={sw} strokeLinecap="round" />
    );

    const torsoPath = `
    M ${fk.pelvis.x - S * 0.09} ${fk.pelvis.y}
    L ${fk.pelvis.x + S * 0.09} ${fk.pelvis.y}
    L ${fk.spineUpper.x + S * 0.10} ${fk.spineUpper.y}
    L ${fk.spineUpper.x - S * 0.10} ${fk.spineUpper.y} Z
  `;
    const headR = S * 0.11;

    return (
        <svg width={S} height={S * 1.25} viewBox={`0 0 ${S} ${S * 1.25}`}>
            {/* legs */}
            {seg("lThigh", cloth)}{seg("lShin", cloth)}{seg("lFoot", cloth)}
            {seg("rThigh", cloth)}{seg("rShin", cloth)}{seg("rFoot", cloth)}

            {/* torso */}
            <path d={torsoPath} fill={character.outfit?.colors?.[1] ?? "#2563EB"} stroke={stroke} strokeWidth={sw * 0.8} />
            {seg("pelvis", stroke)}{seg("spineLower", stroke)}{seg("spineUpper", stroke)}{seg("neck", stroke)}

            {/* arms */}
            {seg("lUpperArm", skin)}{seg("lForearm", skin)}{seg("lHand", skin)}
            {seg("rUpperArm", skin)}{seg("rForearm", skin)}{seg("rHand", skin)}

            {/* head */}
            <circle cx={fk.head.x2} cy={fk.head.y2} r={headR} fill={skin} stroke={stroke} strokeWidth={sw * 0.7} />

            {/* debug joints */}
            {debug && (
                <g opacity={0.65} fill={stroke}>
                    {Object.values(fk).map((b, i) => <circle key={i} cx={b.x} cy={b.y} r={sw * 0.55} />)}
                </g>
            )}
        </svg>
    );
};

export default RiggedBody;
