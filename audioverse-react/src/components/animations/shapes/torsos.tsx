import React from "react";
import { pick } from "../characterTypes";

/// Props for torso (geometry pod outfit).
export type TorsoProps = {
    /// Palette: [skinBase, shadow?, stroke?]
    colors: string[];
    /// Scale.
    scale?: number;
    /// Transform.
    transform?: string;
    /// Stroke width.
    strokeWidth?: number;
};

function pal(c: string[]) {
    return {
        skin: pick(c, 0, "#FFD2B3"),
        shade: pick(c, 1, "#F2C4A9"),
        stroke: pick(c, 2, "#111"),
    };
}

/// Slim torso.
export const TorsoSlim: React.FC<TorsoProps> = ({ colors, scale = 1, transform, strokeWidth = 1.4 }) => {
    const { skin, stroke } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth}>
            <path d="M-28 0 L28 0 L22 -52 L-22 -52 Z" fill={skin} />
        </g>
    );
};

/// Wide/V shape.
export const TorsoV: React.FC<TorsoProps> = ({ colors, scale = 1, transform, strokeWidth = 1.4 }) => {
    const { skin, stroke } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth}>
            <path d="M-36 0 L36 0 L26 -54 L-26 -54 Z" fill={skin} />
        </g>
    );
};

/// Round.
export const TorsoRound: React.FC<TorsoProps> = ({ colors, scale = 1, transform, strokeWidth = 1.4 }) => {
    const { skin, stroke } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth}>
            <path d="M-34 0 L34 0 Q28 -34 0 -50 Q-28 -34 -34 0 Z" fill={skin} />
        </g>
    );
};

/// Registry.
export const TORSO_RENDERERS = {
    slim: TorsoSlim,
    vShape: TorsoV,
    round: TorsoRound,
};

/// Wrapper.
export const Torso: React.FC<TorsoProps & { /// Variant to render.
    variant: keyof typeof TORSO_RENDERERS | string;
}> = ({ variant, ...rest }) => {
    const Comp = (TORSO_RENDERERS as Record<string, React.FC<TorsoProps>>)[variant] ?? TorsoSlim;
    return <Comp {...rest} />;
};
