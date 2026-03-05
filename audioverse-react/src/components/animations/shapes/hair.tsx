import React from "react";
import { pick } from "../characterTypes";

/// Props for hair renderers.
export type HairProps = {
    /// Palette: [base, accent?, stroke?]
    colors: string[];
    /// Uniform scale.
    scale?: number;
    /// Optional transform.
    transform?: string;
    /// Stroke width.
    strokeWidth?: number;
};

function pal(c: string[]) {
    return {
        base: pick(c, 0, "var(--anim-hair-base, #2C3A4A)"),
        accent: pick(c, 1, "var(--anim-hair-accent, #455166)"),
        stroke: pick(c, 2, "var(--anim-stroke, #111)"),
    };
}

export const HairNone: React.FC<HairProps> = () => null;

export const HairShort: React.FC<HairProps> = ({ colors, scale = 1, transform, strokeWidth = 1.3 }) => {
    const { base, stroke } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth}>
            <path d="M-26 -32 q26 -16 52 0 v10 h-52 z" fill={base} />
        </g>
    );
};

export const HairLong: React.FC<HairProps> = ({ colors, scale = 1, transform, strokeWidth = 1.2 }) => {
    const { base, accent, stroke } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth}>
            <path d="M-26 -34 q26 -16 52 0 v36 q-10 10 -18 10 h-18 q-8 0 -16 -10 z" fill={base} />
            <path d="M-24 -24 q24 -10 48 0" fill="none" stroke={accent} opacity={0.5} />
        </g>
    );
};

export const HairCurly: React.FC<HairProps> = ({ colors, scale = 1, transform, strokeWidth: _strokeWidth = 1.2 }) => {
    const { base, stroke } = pal(colors);
    const curl = (x: number) => <circle key={x} cx={x} cy={-32} r={6} fill={base} stroke={stroke} />;
    return <g transform={`${transform ?? ""} scale(${scale})`}>{[-24,-12,0,12,24].map(curl)}</g>;
};

export const HairWavy: React.FC<HairProps> = ({ colors, scale = 1, transform, strokeWidth = 1.2 }) => {
    const { base, accent, stroke } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth}>
            <path d="M-28 -34 c12 -12, 44 -12, 56 0 v14 c-12 10,-44 10,-56 0 z" fill={base} />
            <path d="M-24 -24 c8 6, 40 6, 48 0" stroke={accent} />
        </g>
    );
};

export const HairMohawk: React.FC<HairProps> = ({ colors, scale = 1, transform }) => {
    const { base, stroke } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke}>
            <path d="M-4 -50 l8 0 l-6 22 h-4 z" fill={base} />
            <path d="M4 -50 l8 0 l-4 20 h-6 z" fill={base} />
            <path d="M-12 -50 l8 0 l-8 24 h-4 z" fill={base} />
        </g>
    );
};

export const HairAfro: React.FC<HairProps> = ({ colors, scale = 1, transform }) => {
    const { base, stroke } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={1.2}>
            <circle cx={0} cy={-44} r={18} fill={base} />
            <circle cx={-16} cy={-40} r={12} fill={base} />
            <circle cx={16} cy={-40} r={12} fill={base} />
        </g>
    );
};

export const HairBunHigh: React.FC<HairProps> = ({ colors, scale = 1, transform }) => {
    const { base, stroke } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke}>
            <circle cx={0} cy={-48} r={7} fill={base} />
            <path d="M-24 -34 q24 -16 48 0 v8 h-48 z" fill={base} />
        </g>
    );
};

export const HairBunLow: React.FC<HairProps> = ({ colors, scale = 1, transform }) => {
    const { base, stroke } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke}>
            <path d="M-26 -32 q26 -16 52 0 v8 h-52 z" fill={base} />
            <circle cx={-20} cy={-20} r={6} fill={base} />
        </g>
    );
};

export const HairBob: React.FC<HairProps> = ({ colors, scale = 1, transform }) => {
    const { base, stroke } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke}>
            <path d="M-28 -32 q28 -16 56 0 v20 q-4 10 -10 14 h-36 q-6 -4 -10 -14 z" fill={base} />
        </g>
    );
};

export const HairPixie: React.FC<HairProps> = ({ colors, scale = 1, transform }) => {
    const { base, stroke } = pal(colors);
    return <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke}><path d="M-26 -32 q26 -16 52 0 v6 l-8 4 h-36 l-8 -4 z" fill={base} /></g>;
};

export const HairSidePart: React.FC<HairProps> = ({ colors, scale = 1, transform }) => {
    const { base, accent, stroke } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke}>
            <path d="M-28 -34 c14 -12, 40 -12, 56 0 v10 h-56 z" fill={base} />
            <path d="M-8 -36 v12" stroke={accent} />
        </g>
    );
};

export const HairUndercut: React.FC<HairProps> = ({ colors, scale = 1, transform }) => {
    const { base, accent, stroke } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke}>
            <path d="M-28 -34 c14 -12, 40 -12, 56 0 v10 h-56 z" fill={base} />
            <rect x={-28} y={-24} width={56} height={6} fill={accent} />
        </g>
    );
};

export const HairSpiky: React.FC<HairProps> = ({ colors, scale = 1, transform }) => {
    const { base, stroke } = pal(colors);
    const spike = (x: number, h: number) => <path key={x} d={`M${x} -34 l6 ${-h} l6 ${h} z`} fill={base} stroke={stroke} />;
    return <g transform={`${transform ?? ""} scale(${scale})`}>{[-24,-12,0,12,24].map((x,i)=>spike(x, 10 + (i%2)*4))}</g>;
};

export const HairBraids: React.FC<HairProps> = ({ colors, scale = 1, transform }) => {
    const { base, accent, stroke } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke}>
            <path d="M-26 -32 q26 -16 52 0 v6 h-52 z" fill={base} />
            <path d="M-22 -26 v18 q4 6 0 10" stroke={accent} />
            <path d="M22 -26 v18 q-4 6 0 10" stroke={accent} />
        </g>
    );
};

export const HairDreads: React.FC<HairProps> = ({ colors, scale = 1, transform }) => {
    const { base, stroke } = pal(colors);
    const dread = (x: number) => <path key={x} d={`M${x} -26 v20 q-2 8 -6 8`} stroke={base} strokeWidth={4} strokeLinecap="round" />;
    return <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke}>{[-18,-10,-2,6,14,22].map(dread)}</g>;
};

export const HairPonytail: React.FC<HairProps> = ({ colors, scale = 1, transform }) => {
    const { base, accent, stroke } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke}>
            <path d="M-26 -32 q26 -16 52 0 v6 h-52 z" fill={base} />
            <circle cx={22} cy={-22} r={3} fill={accent} />
            <path d="M24 -22 q6 14, -10 24" stroke={base} strokeWidth={4} strokeLinecap="round" />
        </g>
    );
};

export const HairTwinTails: React.FC<HairProps> = ({ colors, scale = 1, transform }) => {
    const { base, accent } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`}>
            <path d="M-26 -32 q26 -16 52 0 v6 h-52 z" fill={base} />
            <circle cx={-18} cy={-22} r={3} fill={accent} />
            <circle cx={18} cy={-22} r={3} fill={accent} />
            <path d="M-18 -22 q-10 16, 4 26" stroke={base} strokeWidth={4} strokeLinecap="round" />
            <path d="M18 -22 q10 16, -4 26" stroke={base} strokeWidth={4} strokeLinecap="round" />
        </g>
    );
};

export const HairMullet: React.FC<HairProps> = ({ colors, scale = 1, transform }) => {
    const { base } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`}>
            <path d="M-26 -30 q26 -16 52 0 v8 h-52 z" fill={base} />
            <path d="M-20 -22 v20 q8 8 18 8 h8 q10 0 18 -8 v-20" fill={base} />
        </g>
    );
};

export const HairBalding: React.FC<HairProps> = ({ colors, scale = 1, transform }) => {
    const { base } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`}>
            <path d="M-26 -34 q20 -16 52 0" stroke={base} strokeWidth={3} strokeLinecap="round" />
        </g>
    );
};

export const HairBangs: React.FC<HairProps> = ({ colors, scale = 1, transform }) => {
    const { base, accent } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`}>
            <path d="M-26 -34 q13 6, 0 12 q26 -8, 26 0 q26 -8, 26 0" fill={base} />
            <path d="M-18 -28 q12 -4, 18 0" stroke={accent} />
        </g>
    );
};

/// Registry.
export const HAIR_RENDERERS = {
    none: HairNone,
    short: HairShort,
    long: HairLong,
    curly: HairCurly,
    wavy: HairWavy,
    mohawk: HairMohawk,
    afro: HairAfro,
    bunHigh: HairBunHigh,
    bunLow: HairBunLow,
    bob: HairBob,
    pixie: HairPixie,
    sidePart: HairSidePart,
    undercut: HairUndercut,
    spiky: HairSpiky,
    braids: HairBraids,
    dreadlocks: HairDreads,
    ponytail: HairPonytail,
    twinTails: HairTwinTails,
    mullet: HairMullet,
    balding: HairBalding,
    bangs: HairBangs,
};

/// Wrapper to render hair by variant.
export const Hair: React.FC<HairProps & { /// Variant name to render.
    variant: keyof typeof HAIR_RENDERERS | string;
}> = ({ variant, ...rest }) => {
    const Comp = (HAIR_RENDERERS as Record<string, React.FC<HairProps>>)[variant] ?? HairNone;
    return <Comp {...rest} />;
};
