import React from "react";
import { pick } from "../characterTypes";

/// Props for mouth renderers.
export type MouthProps = {
    /// Palette: [lip, inner/teeth, stroke]
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

function pal(c: string[]) {
    return {
        lip: pick(c, 0, "#E11D48"),
        inner: pick(c, 1, "#FEE2E2"),
        stroke: pick(c, 2, "#111"),
    };
}

export const MouthSmile: React.FC<MouthProps> = ({ colors, y = 12, scale = 1, transform, strokeWidth = 1.6 }) => {
    const { lip, stroke } = pal(colors);
    return <g transform={`${transform ?? ""} translate(0 ${y}) scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round"><path d="M-10 0 q10 8 20 0" fill="none" stroke={lip} /></g>;
};

export const MouthFrown: React.FC<MouthProps> = ({ colors, y = 12, scale = 1, transform, strokeWidth = 1.6 }) => {
    const { lip } = pal(colors);
    return <g transform={`${transform ?? ""} translate(0 ${y}) scale(${scale})`} stroke={lip} strokeWidth={strokeWidth} strokeLinecap="round"><path d="M-10 4 q10 -8 20 0" fill="none" /></g>;
};

export const MouthOpen: React.FC<MouthProps> = ({ colors, y = 12, scale = 1, transform, strokeWidth = 1.4 }) => {
    const { lip, inner, stroke } = pal(colors);
    return <g transform={`${transform ?? ""} translate(0 ${y}) scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth}><ellipse cx={0} cy={0} rx={8} ry={5} fill={inner}/><path d="M-10 0 q10 10 20 0" fill="none" stroke={lip}/></g>;
};

export const MouthFlat: React.FC<MouthProps> = ({ colors, y = 12, scale = 1, transform, strokeWidth = 1.6 }) => {
    const { stroke } = pal(colors);
    return <g transform={`${transform ?? ""} translate(0 ${y}) scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round"><path d="M-10 0 h20" /></g>;
};

export const MouthO: React.FC<MouthProps> = ({ colors, y = 12, scale = 1, transform, strokeWidth = 1.4 }) => {
    const { inner, stroke } = pal(colors);
    return <g transform={`${transform ?? ""} translate(0 ${y}) scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth}><circle cx={0} cy={0} r={4} fill={inner}/></g>;
};

export const MouthGrin: React.FC<MouthProps> = ({ colors, y = 12, scale = 1, transform, strokeWidth = 1.4 }) => {
    const { lip, inner, stroke } = pal(colors);
    return (
        <g transform={`${transform ?? ""} translate(0 ${y}) scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round">
            <path d="M-12 0 q12 10 24 0" stroke={lip} fill="none" />
            <path d="M-10 0 q10 6 20 0" stroke={inner} />
        </g>
    );
};

export const MouthTeeth: React.FC<MouthProps> = ({ colors, y = 12, scale = 1, transform, strokeWidth = 1.3 }) => {
    const { lip, inner, stroke } = pal(colors);
    return <g transform={`${transform ?? ""} translate(0 ${y}) scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth}><rect x={-10} y={-3} width={20} height={6} rx={3} fill={inner}/><path d="M-10 0 h20" stroke={lip}/></g>;
};

export const MouthSmirk: React.FC<MouthProps> = ({ colors, y = 12, scale = 1, transform }) => {
    const { lip } = pal(colors);
    return <g transform={`${transform ?? ""} translate(0 ${y}) scale(${scale})`} stroke={lip} strokeWidth={1.6}><path d="M-6 2 q8 -4 12 0" fill="none"/></g>;
};

export const MouthWow: typeof MouthO = MouthO;
export const MouthTongue: React.FC<MouthProps> = ({ colors, y = 12, scale = 1, transform }) => {
    const { lip, inner } = pal(colors);
    return <g transform={`${transform ?? ""} translate(0 ${y}) scale(${scale})`}><path d="M-10 0 q10 10 20 0" stroke={lip} strokeWidth={1.6} fill="none"/><path d="M-6 0 q6 6 12 0" fill="#f87171" /></g>;
};
export const MouthLaugh: React.FC<MouthProps> = ({ colors, y = 12, scale = 1, transform }) => {
    const { inner, lip } = pal(colors);
    return <g transform={`${transform ?? ""} translate(0 ${y}) scale(${scale})`}><path d="M-12 0 q12 14 24 0" fill={inner} stroke={lip} strokeWidth={1.6}/></g>;
};

export const MouthSad: typeof MouthFrown = MouthFrown;
export const MouthAngry: React.FC<MouthProps> = ({ colors, y=12, scale=1, transform }) => {
    const { lip } = pal(colors);
    return <g transform={`${transform??""} translate(0 ${y}) scale(${scale})`} stroke={lip} strokeWidth={1.6}><path d="M-10 2 q10 -10 20 0" fill="none"/></g>;
};
export const MouthKiss: typeof MouthO = MouthO;
export const MouthGrimace: React.FC<MouthProps> = ({ colors, y=12, scale=1, transform }) => {
    const { inner, lip } = pal(colors);
    return <g transform={`${transform??""} translate(0 ${y}) scale(${scale})`} stroke={lip} strokeWidth={1.5}><rect x={-12} y={-4} width={24} height={8} rx={2} fill={inner}/><path d="M-10 -2 h20 M-10 0 h20 M-10 2 h20"/></g>;
};

/// Registry.
export const MOUTH_RENDERERS = {
    smile: MouthSmile,
    frown: MouthFrown,
    open: MouthOpen,
    flat: MouthFlat,
    o: MouthO,
    grin: MouthGrin,
    teeth: MouthTeeth,
    smirk: MouthSmirk,
    wow: MouthWow,
    tongue: MouthTongue,
    laugh: MouthLaugh,
    sad: MouthSad,
    angry: MouthAngry,
    kiss: MouthKiss,
    grimace: MouthGrimace,
};

/// Wrapper.
export const Mouth: React.FC<MouthProps & { /// Variant to render.
    variant: keyof typeof MOUTH_RENDERERS | string;
}> = ({ variant, ...rest }) => {
    const Comp = (MOUTH_RENDERERS as Record<string, React.FC<MouthProps>>)[variant] ?? MouthSmile;
    return <Comp {...rest} />;
};
