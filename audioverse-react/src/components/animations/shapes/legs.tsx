import React from "react";
import { pick } from "../characterTypes";

/// Props for leg renderer (static; do pełnego rig używasz RigBody).
export type LegProps = {
    /// Palette: [skin/pants, accent, stroke]
    colors: string[];
    /// Side: -1 = left, +1 = right.
    side?: -1 | 1;
    /// Variant: bare/pants/shorts/skirt/boot.
    variant?: "bare" | "pants" | "shorts" | "skirt" | "boot";
    /// Transform.
    transform?: string;
    /// Scale.
    scale?: number;
    /// Stroke width.
    strokeWidth?: number;
};

function pal(c: string[]) {
    return {
        base: pick(c, 0, "#3B82F6"),
        accent: pick(c, 1, "#2563EB"),
        stroke: pick(c, 2, "#111"),
        skin: "#FFD2B3",
    };
}

export const Leg: React.FC<LegProps> = ({
                                            colors,
                                            side = 1,
                                            variant = "pants",
                                            transform,
                                            scale = 1,
                                            strokeWidth = 1.4,
                                        }) => {
    const { base, accent, stroke, skin } = pal(colors);
    const s = side;

    const thigh = (fill: string) => <rect x={-8 * s} y={-2} width={16 * s} height={28} rx={7} fill={fill} stroke={stroke} />;
    const shin = (fill: string) => <rect x={-7 * s} y={26} width={14 * s} height={26} rx={6} fill={fill} stroke={stroke} />;

    return (
        <g transform={`${transform ?? ""} scale(${scale})`} strokeWidth={strokeWidth}>
            {variant === "bare" ? thigh(skin) : thigh(base)}
            {variant === "bare" ? shin(skin) : shin(base)}
            {variant === "shorts" && <rect x={-10 * s} y={-2} width={20 * s} height={14} rx={4} fill={accent} stroke={stroke} />}
            {variant === "skirt" && <path d={`M${-16 * s} 8 l${32 * s} 0 l${-6 * s} 18 l${-20 * s} 0 z`} fill={accent} stroke={stroke} />}
            {variant === "boot" && <rect x={-10 * s} y={44} width={20 * s} height={12} rx={3} fill="#222" stroke={stroke} />}
        </g>
    );
};
