import React from "react";
import { pick } from "../characterTypes";

/// Props for nose renderers.
export type NoseProps = {
    /// Palette: [stroke/base, accent?, outline?] – zwykle tylko stroke.
    colors: string[];
    /// Position y.
    y?: number;
    /// Scale.
    scale?: number;
    /// Transform.
    transform?: string;
    /// Stroke width.
    strokeWidth?: number;
};

function strokeCol(c: string[]) {
    return pick(c, 0, "#111");
}

export const NoseLine: React.FC<NoseProps> = ({ colors, y = 0, scale = 1, transform, strokeWidth = 1.6 }) => (
    <g transform={`${transform ?? ""} translate(0 ${y}) scale(${scale})`} stroke={strokeCol(colors)} strokeWidth={strokeWidth} strokeLinecap="round">
        <path d="M0 -4 q-2 4 0 8" fill="none" />
    </g>
);

export const NoseTriangle: React.FC<NoseProps> = ({ colors, y = 0, scale = 1, transform, strokeWidth = 1.4 }) => (
    <g transform={`${transform ?? ""} translate(0 ${y}) scale(${scale})`} stroke={strokeCol(colors)} strokeWidth={strokeWidth} strokeLinejoin="round">
        <path d="M0 -6 l6 8 h-12 z" fill="none" />
    </g>
);

export const NoseRound: React.FC<NoseProps> = ({ colors, y = 0, scale = 1, transform, strokeWidth = 1.6 }) => (
    <g transform={`${transform ?? ""} translate(0 ${y}) scale(${scale})`} stroke={strokeCol(colors)} strokeWidth={strokeWidth} strokeLinecap="round">
        <circle cx={0} cy={0} r={2.4} fill="none" />
    </g>
);

export const NoseButton: React.FC<NoseProps> = ({ colors, y = 0, scale = 1, transform, strokeWidth = 1.4 }) => (
    <g transform={`${transform ?? ""} translate(0 ${y}) scale(${scale})`} stroke={strokeCol(colors)} strokeWidth={strokeWidth} strokeLinecap="round">
        <path d="M-2 0 a2 2 0 0 0 4 0" />
    </g>
);

export const NoseHook: React.FC<NoseProps> = ({ colors, y = 0, scale = 1, transform, strokeWidth = 1.4 }) => (
    <g transform={`${transform ?? ""} translate(0 ${y}) scale(${scale})`} stroke={strokeCol(colors)} strokeWidth={strokeWidth} strokeLinecap="round">
        <path d="M0 -6 q-2 4 0 8 q-2 2 -4 0" />
    </g>
);

export const NoseFlat: React.FC<NoseProps> = ({ colors, y = 0, scale = 1, transform, strokeWidth = 1.4 }) => (
    <g transform={`${transform ?? ""} translate(0 ${y}) scale(${scale})`} stroke={strokeCol(colors)} strokeWidth={strokeWidth} strokeLinecap="round">
        <path d="M-4 0 h8" />
    </g>
);

export const NoseWide: React.FC<NoseProps> = ({ colors, y = 0, scale = 1, transform, strokeWidth = 1.4 }) => (
    <g transform={`${transform ?? ""} translate(0 ${y}) scale(${scale})`} stroke={strokeCol(colors)} strokeWidth={strokeWidth}>
        <path d="M-4 0 q4 -6 8 0" fill="none" />
    </g>
);

export const NoseTiny: React.FC<NoseProps> = ({ colors, y = 0, scale = 1, transform }) => (
    <g transform={`${transform ?? ""} translate(0 ${y}) scale(${scale})`} stroke={strokeCol(colors)} strokeWidth={1.2}><circle cx={0} cy={0} r={1} /></g>
);
export const NosePointy: React.FC<NoseProps> = ({ colors, y = 0, scale = 1, transform }) => (
    <g transform={`${transform ?? ""} translate(0 ${y}) scale(${scale})`} stroke={strokeCol(colors)} strokeWidth={1.4}><path d="M-2 -2 l4 4" /></g>
);
export const NoseRoman: typeof NoseHook = NoseHook;
export const NoseNone: React.FC<NoseProps> = () => null;

/// Registry.
export const NOSE_RENDERERS = {
    line: NoseLine,
    triangle: NoseTriangle,
    round: NoseRound,
    button: NoseButton,
    hook: NoseHook,
    flat: NoseFlat,
    wide: NoseWide,
    tiny: NoseTiny,
    pointy: NosePointy,
    roman: NoseRoman,
    none: NoseNone,
};

/// Wrapper.
export const Nose: React.FC<NoseProps & { /// Variant name to render.
    variant: keyof typeof NOSE_RENDERERS | string;
}> = ({ variant, ...rest }) => {
    const Comp = (NOSE_RENDERERS as Record<string, React.FC<NoseProps>>)[variant] ?? NoseLine;
    return <Comp {...rest} />;
};
