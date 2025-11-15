import React from "react";
import { pick } from "../characterTypes";

/// Props for head shape renderers.
export type HeadProps = {
    /// Palette: [skin, shade?, stroke?]
    colors: string[];
    /// Uniform scale.
    scale?: number;
    /// Optional transform for the root group.
    transform?: string;
    /// Stroke width.
    strokeWidth?: number;
};

/// Internal palette helper.
function pal(c: string[]) {
    return {
        skin: pick(c, 0, "#FFD2B3"),
        shade: pick(c, 1, "#F2C4A9"),
        stroke: pick(c, 2, "#111"),
    };
}

/// Round head.
export const HeadRound: React.FC<HeadProps> = ({ colors, scale = 1, transform, strokeWidth = 1.6 }) => {
    const { skin, shade, stroke } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth}>
            <circle cx={0} cy={-8} r={34} fill={skin} />
            <ellipse cx={10} cy={-20} rx={10} ry={6} fill={shade} opacity={0.15} />
        </g>
    );
};

/// Oval head.
export const HeadOval: React.FC<HeadProps> = ({ colors, scale = 1, transform, strokeWidth = 1.6 }) => {
    const { skin, shade, stroke } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth}>
            <ellipse cx={0} cy={-6} rx={30} ry={36} fill={skin} />
            <ellipse cx={-12} cy={-18} rx={8} ry={5} fill={shade} opacity={0.12} />
        </g>
    );
};

/// Square jaw.
export const HeadSquare: React.FC<HeadProps> = ({ colors, scale = 1, transform, strokeWidth = 1.6 }) => {
    const { skin, shade, stroke } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round">
            <path d="M-26 -32 h52 v40 l-14 10 h-24 l-14 -10 z" fill={skin} />
            <rect x={-10} y={-20} width={12} height={6} fill={shade} opacity={0.12} />
        </g>
    );
};

/// Heart shape.
export const HeadHeart: React.FC<HeadProps> = ({ colors, scale = 1, transform, strokeWidth = 1.6 }) => {
    const { skin, stroke } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round">
            <path
                d="M0 -6
           c 14 -22, 38 -10, 30 14
           c -6 18, -20 30, -30 34
           c -10 -4, -24 -16, -30 -34
           c -8 -24, 16 -36, 30 -14 z"
                fill={skin}
            />
        </g>
    );
};

/// Diamond/cheeky.
export const HeadDiamond: React.FC<HeadProps> = ({ colors, scale = 1, transform, strokeWidth = 1.6 }) => {
    const { skin, stroke } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round">
            <path d="M0 -44 L28 -8 L0 28 L-28 -8 Z" fill={skin} />
        </g>
    );
};

/// Long face.
export const HeadLong: React.FC<HeadProps> = ({ colors, scale = 1, transform, strokeWidth = 1.6 }) => {
    const { skin, stroke } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth}>
            <ellipse cx={0} cy={-2} rx={26} ry={40} fill={skin} />
        </g>
    );
};

/// Chubby cheeks.
export const HeadChubby: React.FC<HeadProps> = ({ colors, scale = 1, transform, strokeWidth = 1.6 }) => {
    const { skin, stroke } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth}>
            <path d="M-28 -26 a30 30 0 0 1 56 0 v24 c0 14 -14 22 -28 22 s-28 -8 -28 -22 z" fill={skin} />
        </g>
    );
};

/// Flat-top hero.
export const HeadFlatTop: React.FC<HeadProps> = ({ colors, scale = 1, transform, strokeWidth = 1.6 }) => {
    const { skin, stroke } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round">
            <path d="M-26 -36 h52 v10 a34 34 0 0 1 -52 0 z" fill={skin} />
        </g>
    );
};

/// Egg/Triangular, Hex, Pear, Bean, HeroJaw – lekkie warianty
export const HeadEgg: React.FC<HeadProps> = ({ colors, scale = 1, transform, strokeWidth = 1.6 }) => {
    const { skin, stroke } = pal(colors);
    return <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth}><ellipse cx={0} cy={-6} rx={24} ry={36} fill={skin} /></g>;
};
export const HeadTriangle: React.FC<HeadProps> = ({ colors, scale = 1, transform, strokeWidth = 1.6 }) => {
    const { skin, stroke } = pal(colors);
    return <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round"><path d="M0 -40 L28 16 L-28 16 Z" fill={skin} /></g>;
};
export const HeadHex: React.FC<HeadProps> = ({ colors, scale = 1, transform, strokeWidth = 1.6 }) => {
    const { skin, stroke } = pal(colors);
    return <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round"><path d="M-18 -36 h36 l18 22 -18 22 h-36 l-18 -22 z" fill={skin} /></g>;
};
export const HeadPear: React.FC<HeadProps> = ({ colors, scale = 1, transform, strokeWidth = 1.6 }) => {
    const { skin, stroke } = pal(colors);
    return <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth}><path d="M0 -40 a18 16 0 0 1 18 16 v10 a28 28 0 0 1 -56 0 v-10 a18 16 0 0 1 38 -16 z" fill={skin} /></g>;
};
export const HeadBean: React.FC<HeadProps> = ({ colors, scale = 1, transform, strokeWidth = 1.6 }) => {
    const { skin, stroke } = pal(colors);
    return <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth}><path d="M-22 -34 a24 24 0 0 1 34 6 a30 30 0 0 1 -20 44 a26 26 0 0 1 -22 -26 a24 24 0 0 1 8 -24 z" fill={skin} /></g>;
};
export const HeadHeroJaw: React.FC<HeadProps> = ({ colors, scale = 1, transform, strokeWidth = 1.6 }) => {
    const { skin, stroke } = pal(colors);
    return <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round"><path d="M-26 -34 a26 22 0 0 1 52 0 v24 l-12 10 h-28 l-12 -10 z" fill={skin} /></g>;
};

/// Registry of head shapes.
export const HEAD_RENDERERS = {
    round: HeadRound,
    oval: HeadOval,
    square: HeadSquare,
    heart: HeadHeart,
    diamond: HeadDiamond,
    long: HeadLong,
    chubby: HeadChubby,
    flatTop: HeadFlatTop,
    egg: HeadEgg,
    triangle: HeadTriangle,
    hex: HeadHex,
    pear: HeadPear,
    bean: HeadBean,
    heroJaw: HeadHeroJaw,
};

/// Render head by variant.
export const Head: React.FC<HeadProps & { /// Variant name to render.
    variant: keyof typeof HEAD_RENDERERS | string;
}> = ({ variant, ...rest }) => {
    const Comp = (HEAD_RENDERERS as Record<string, React.FC<HeadProps>>)[variant] ?? HeadRound;
    return <Comp {...rest} />;
};
