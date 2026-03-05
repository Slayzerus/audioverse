import React from "react";
import { pick } from "../characterTypes";

/// Props for outfit renderers (paint over the torso area).
export type OutfitProps = {
    /// Palette: [base, accent, stroke]
    colors: string[];
    /// Optional transform (torso origin is pelvis area).
    transform?: string;
    /// Uniform scale.
    scale?: number;
    /// Stroke width.
    strokeWidth?: number;
};

/// Internal palette helper.
function pal(c: string[]) {
    return {
        base: pick(c, 0, "var(--anim-outfit-base, #3B82F6)"),
        accent: pick(c, 1, "var(--anim-outfit-accent, #2563EB)"),
        stroke: pick(c, 2, "var(--anim-stroke, #111)"),
    };
}

/// Shared torso path used by all outfits.
const TORSO_PATH = "M-36 0 L36 0 L28 -54 L-28 -54 Z";

/// Basic tee.
export const OutfitTee: React.FC<OutfitProps> = ({ colors, transform, scale = 1, strokeWidth = 1.2 }) => {
    const { base, stroke } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth}>
            <path d={TORSO_PATH} fill={base} />
        </g>
    );
};

/// Hoodie with hood outline.
export const OutfitHoodie: React.FC<OutfitProps> = ({ colors, transform, scale = 1, strokeWidth = 1.2 }) => {
    const { base, accent, stroke } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth}>
            <path d={TORSO_PATH} fill={base} />
            <path d="M-22 -54 q22 -16 44 0 v10 l-8 8 h-28 l-8 -8 z" fill={accent} />
            <path d="M-12 -36 q12 8 24 0" stroke={stroke} opacity={0.6} />
        </g>
    );
};

/// Suit/jacket.
export const OutfitSuit: React.FC<OutfitProps> = ({ colors, transform, scale = 1, strokeWidth = 1.2 }) => {
    const { base, accent, stroke } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round">
            <path d={TORSO_PATH} fill={base} />
            <path d="M-28 -54 l10 18 h-12 z" fill={accent} />
            <path d="M28 -54 l-10 18 h12 z" fill={accent} />
            <rect x={-6} y={-30} width={12} height={10} rx={2} fill={"var(--card-bg, #fff)"} />
        </g>
    );
};

/// Dress-like top.
export const OutfitDress: React.FC<OutfitProps> = ({ colors, transform, scale = 1, strokeWidth = 1.2 }) => {
    const { base, accent, stroke } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth}>
            <path d={TORSO_PATH} fill={base} />
            <path d="M-36 0 l10 10 h52 l10 -10" fill={accent} />
        </g>
    );
};

/// Tank top.
export const OutfitTank: React.FC<OutfitProps> = ({ colors, transform, scale = 1, strokeWidth = 1.2 }) => {
    const { base, stroke } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth}>
            <path d={TORSO_PATH} fill={base} />
            <path d="M-36 0 l8 -24 h12 l-6 24 z M36 0 l-8 -24 h-12 l6 24 z" fill={base} />
        </g>
    );
};

/// Blazer.
export const OutfitBlazer: React.FC<OutfitProps> = ({ colors, transform, scale = 1 }) => {
    const { base, accent } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`}>
            <path d={TORSO_PATH} fill={base} />
            <path d="M-28 -54 l10 16 v16 l-8 6 h-10 z" fill={accent} opacity={0.85} />
            <path d="M28 -54 l-10 16 v16 l8 6 h10 z" fill={accent} opacity={0.85} />
        </g>
    );
};

/// Striped shirt.
export const OutfitStripes: React.FC<OutfitProps> = ({ colors, transform, scale = 1 }) => {
    const { base, accent } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`}>
            <path d={TORSO_PATH} fill={base} />
            {[-48, -42, -36, -30, -24, -18, -12, -6].map((y) => (
                <rect key={y} x={-36} y={y} width={72} height={4} fill={accent} />
            ))}
        </g>
    );
};

/// Checker pattern.
export const OutfitChecker: React.FC<OutfitProps> = ({ colors, transform, scale = 1 }) => {
    const { base, accent } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`}>
            <path d={TORSO_PATH} fill={base} />
            {[-48, -36, -24, -12, 0].map((yy, r) =>
                [-36, -24, -12, 0, 12, 24, 36].map((xx, c) => (
                    <rect
                        key={`${r}-${c}`}
                        x={xx}
                        y={yy}
                        width={12}
                        height={12}
                        fill={r % 2 === c % 2 ? accent : base}
                        opacity={0.9}
                    />
                ))
            )}
        </g>
    );
};

/// Jersey with number stripe.
export const OutfitJersey: React.FC<OutfitProps> = ({ colors, transform, scale = 1 }) => {
    const { base, accent } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`}>
            <path d={TORSO_PATH} fill={base} />
            <rect x={-10} y={-34} width={20} height={16} rx={2} fill={"var(--card-bg, #fff)"} opacity={0.9} />
            <rect x={-36} y={-20} width={72} height={6} fill={accent} />
        </g>
    );
};

/// Tuxedo.
export const OutfitTux: React.FC<OutfitProps> = ({ colors, transform, scale = 1 }) => {
    const { base, accent } = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`}>
            <path d={TORSO_PATH} fill={base} />
            <path d="M-10 -54 l10 18 l10 -18" fill={"var(--card-bg, #fff)"} />
            <circle cx={0} cy={-32} r={1.6} fill={accent} />
            <circle cx={0} cy={-28} r={1.6} fill={accent} />
        </g>
    );
};

/// Aliases for convenience.
export const OutfitKimono: typeof OutfitDress = OutfitDress;
export const OutfitPolo: typeof OutfitTee = OutfitTee;
export const OutfitVest: typeof OutfitBlazer = OutfitBlazer;
export const OutfitJacket: typeof OutfitBlazer = OutfitBlazer;
export const OutfitSweatshirt: typeof OutfitHoodie = OutfitHoodie;
export const OutfitRobe: typeof OutfitDress = OutfitDress;

/// Registry.
export const OUTFIT_RENDERERS = {
    tee: OutfitTee,
    hoodie: OutfitHoodie,
    suit: OutfitSuit,
    dress: OutfitDress,
    tank: OutfitTank,
    jacket: OutfitJacket,
    blazer: OutfitBlazer,
    vest: OutfitVest,
    sweatshirt: OutfitSweatshirt,
    kimono: OutfitKimono,
    polo: OutfitPolo,
    stripes: OutfitStripes,
    checker: OutfitChecker,
    jersey: OutfitJersey,
    tux: OutfitTux,
    robe: OutfitRobe,
};

/// Wrapper to render selected outfit variant.
export const Outfit: React.FC<OutfitProps & {
    /// Variant to render.
    variant: keyof typeof OUTFIT_RENDERERS | string;
}> = ({ variant, ...rest }) => {
    const Comp: React.FC<OutfitProps> =
        (OUTFIT_RENDERERS as Record<string, React.FC<OutfitProps>>)[variant] ?? OutfitTee;
    return <Comp {...rest} />;
};
