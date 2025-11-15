import React from "react";
import { pick } from "../characterTypes";

/// Props for all headwear renderers.
export type HeadwearProps = {
    /// Palette: [base, accent?, stroke?]; missing colors are duplicated.
    colors: string[];
    /// Optional uniform scale (1 = default).
    scale?: number;
    /// Optional transform to apply on the root <g>.
    transform?: string;
    /// Optional stroke width (in SVG units).
    strokeWidth?: number;
};

/// Internal helper to normalize palette + common stroke/fills.
function usePalette(colors: string[]) {
    const base = pick(colors, 0, "#333");
    const accent = pick(colors, 1, base);
    const stroke = pick(colors, 2, "#111");
    return { base, accent, stroke };
}

/* -------------------------------------------------------------------------- */
/*                                Variants                                    */
/* -------------------------------------------------------------------------- */

/// Renders no headwear (placeholder).
export const HeadwearNone: React.FC<HeadwearProps> = () => null;

/// Simple baseball cap with brim.
export const HeadwearCap: React.FC<HeadwearProps> = ({ colors, scale = 1, transform, strokeWidth = 1.5 }) => {
    const { base, accent, stroke } = usePalette(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round">
            <path d="M-25 -38 C -8 -52, 8 -52, 25 -38 Q 10 -35 -10 -35 Z" fill={base} />
            <path d="M-10 -35 C 8 -35, 25 -33, 32 -28 C 18 -27, 6 -27, -8 -30 Z" fill={accent} />
        </g>
    );
};

/// Over-ear headphones with band.
export const HeadwearHeadphones: React.FC<HeadwearProps> = ({ colors, scale = 1, transform, strokeWidth = 1.6 }) => {
    const { base, accent, stroke } = usePalette(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <path d="M-26 -34 C -18 -50, 18 -50, 26 -34" fill="none" />
            <rect x={-36} y={-24} width={10} height={18} rx={4} fill={base} />
            <rect x={26} y={-24} width={10} height={18} rx={4} fill={base} />
            <rect x={-28} y={-22} width={7} height={14} rx={3} fill={accent} />
            <rect x={31} y={-22} width={7} height={14} rx={3} fill={accent} />
        </g>
    );
};

/// Fedora-like hat with a brim.
export const HeadwearHat: React.FC<HeadwearProps> = ({ colors, scale = 1, transform, strokeWidth = 1.4 }) => {
    const { base, accent, stroke } = usePalette(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth}>
            <ellipse cx={0} cy={-34} rx={30} ry={6} fill={accent} />
            <path d="M-18 -48 h36 l-4 12 h-28 z" fill={base} />
        </g>
    );
};

/// Crown with spikes.
export const HeadwearCrown: React.FC<HeadwearProps> = ({ colors, scale = 1, transform, strokeWidth = 1.4 }) => {
    const { base, accent, stroke } = usePalette(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round">
            <path d="M-26 -38 L-14 -50 L0 -38 L14 -50 L26 -38 L26 -34 L-26 -34 Z" fill={base} />
            <circle cx={-14} cy={-49} r={2.5} fill={accent} />
            <circle cx={14} cy={-49} r={2.5} fill={accent} />
            <circle cx={0} cy={-46} r={2.5} fill={accent} />
        </g>
    );
};

/// Knitted beanie.
export const HeadwearBeanie: React.FC<HeadwearProps> = ({ colors, scale = 1, transform, strokeWidth = 1.3 }) => {
    const { base, accent, stroke } = usePalette(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round">
            <path d="M-22 -40 a22 16 0 0 1 44 0 v6 h-44 z" fill={base} />
            <rect x={-24} y={-34} width={48} height={8} rx={3} fill={accent} />
            <path d="M-18 -30 h36 M-10 -30 h20" opacity={0.6} />
        </g>
    );
};

/// Bandana tied to the side.
export const HeadwearBandana: React.FC<HeadwearProps> = ({ colors, scale = 1, transform, strokeWidth = 1.3 }) => {
    const { base, accent, stroke } = usePalette(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round">
            <path d="M-28 -32 C -8 -42, 8 -42, 28 -32 L 24 -27 C 8 -33, -8 -33, -24 -27 Z" fill={base} />
            <path d="M28 -32 l8 6 -7 5" fill={accent} />
        </g>
    );
};

/// Delicate tiara.
export const HeadwearTiara: React.FC<HeadwearProps> = ({ colors, scale = 1, transform, strokeWidth = 1.2 }) => {
    const { base, accent, stroke } = usePalette(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round">
            <path d="M-24 -36 C -8 -44, 8 -44, 24 -36" fill="none" />
            <path d="M-8 -40 Q 0 -48 8 -40" fill="none" />
            <circle cx={0} cy={-46} r={2.2} fill={accent} stroke="none" />
            <path d="M-24 -36 h48" stroke={base} />
        </g>
    );
};

/// Tall top hat.
export const HeadwearTopHat: React.FC<HeadwearProps> = ({ colors, scale = 1, transform, strokeWidth = 1.4 }) => {
    const { base, accent, stroke } = usePalette(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth}>
            <ellipse cx={0} cy={-34} rx={28} ry={5} fill={accent} />
            <rect x={-16} y={-58} width={32} height={20} rx={3} fill={base} />
            <rect x={-16} y={-46} width={32} height={6} fill={accent} />
        </g>
    );
};

/// Sport visor.
export const HeadwearVisor: React.FC<HeadwearProps> = ({ colors, scale = 1, transform, strokeWidth = 1.4 }) => {
    const { base, accent, stroke } = usePalette(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round">
            <path d="M-18 -36 C -10 -44, 10 -44, 18 -36" fill="none" />
            <path d="M-6 -36 C 10 -36, 26 -32, 30 -28 C 20 -28, 6 -30, -6 -33 Z" fill={base} />
            <path d="M-18 -37 h12" stroke={accent} />
        </g>
    );
};

/// Rounded helmet with a small visor.
export const HeadwearHelmet: React.FC<HeadwearProps> = ({ colors, scale = 1, transform, strokeWidth = 1.4 }) => {
    const { base, accent, stroke } = usePalette(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round">
            <path d="M-24 -38 a24 18 0 0 1 48 0 v6 h-48 z" fill={base} />
            <rect x={-6} y={-32} width={24} height={6} rx={2} fill={accent} />
        </g>
    );
};

/// Small beret.
export const HeadwearBeret: React.FC<HeadwearProps> = ({ colors, scale = 1, transform, strokeWidth = 1.2 }) => {
    const { base, accent, stroke } = usePalette(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round">
            <path d="M-22 -38 C -6 -46, 18 -44, 24 -36 C 6 -34, -10 -34, -22 -36 Z" fill={base} />
            <path d="M-10 -42 l6 -6" stroke={accent} />
        </g>
    );
};

/// Ribbon bow on the head.
export const HeadwearBow: React.FC<HeadwearProps> = ({ colors, scale = 1, transform, strokeWidth = 1.2 }) => {
    const { base, accent, stroke } = usePalette(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round">
            <circle cx={0} cy={-40} r={3.5} fill={accent} />
            <path d="M-16 -44 c6 6, 6 10, 0 16 c-4 -4,-8 -10,0 -16 z" fill={base} />
            <path d="M16 -44 c-6 6,-6 10,0 16 c4 -4,8 -10,0 -16 z" fill={base} />
        </g>
    );
};

/* -------------------------------------------------------------------------- */
/*                           Registry + helper API                             */
/* -------------------------------------------------------------------------- */

/// Map of available headwear renderers.
export const HEADWEAR_RENDERERS = {
    none: HeadwearNone,
    cap: HeadwearCap,
    headphones: HeadwearHeadphones,
    hat: HeadwearHat,
    crown: HeadwearCrown,
    beanie: HeadwearBeanie,
    bandana: HeadwearBandana,
    visor: HeadwearVisor,
    tophat: HeadwearTopHat,
    tiara: HeadwearTiara,
    helmet: HeadwearHelmet,
    beret: HeadwearBeret,
    bow: HeadwearBow,
};

/// String union of the supported headwear variants.
export type HeadwearVariant = keyof typeof HEADWEAR_RENDERERS;

/// Convenience wrapper that renders a headwear by variant.
export const Headwear: React.FC<HeadwearProps & { /// Variant name to render.
    variant: HeadwearVariant | string;
}> = ({ variant, ...rest }) => {
    const Comp = (HEADWEAR_RENDERERS as Record<string, React.FC<HeadwearProps>>)[variant] ?? HeadwearNone;
    return <Comp {...rest} />;
};
