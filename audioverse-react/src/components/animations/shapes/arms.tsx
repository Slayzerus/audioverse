import React from "react";
import { pick } from "../characterTypes";

/// Props for arm renderer (static limb segment under/outside outfit).
export type ArmProps = {
    /// Palette: [skin, sleeve?, stroke]
    colors: string[];
    /// Side: -1 = left, +1 = right.
    side?: -1 | 1;
    /// Style variant thickness/cut.
    variant?: "bareThin" | "bare" | "bareThick" | "sleeveShort" | "sleeveLong" | "glove";
    /// Transform.
    transform?: string;
    /// Scale.
    scale?: number;
    /// Stroke width.
    strokeWidth?: number;
};

function pal(c: string[]) {
    return {
        skin: pick(c, 0, "#FFD2B3"),
        sleeve: pick(c, 1, "#3B82F6"),
        stroke: pick(c, 2, "#111"),
    };
}

export const Arm: React.FC<ArmProps> = ({
                                            colors,
                                            side = 1,
                                            variant = "bare",
                                            transform,
                                            scale = 1,
                                            strokeWidth = 1.4,
                                        }) => {
    const { skin, sleeve, stroke } = pal(colors);
    const s = side;
    const base = (
        <>
            <rect x={-6 * s} y={-30} width={12 * s} height={30} rx={6} fill={skin} />
            <circle cx={0} cy={2} r={5} fill={skin} />
        </>
    );
    const sleeveShort = <rect x={-8 * s} y={-30} width={16 * s} height={14} rx={4} fill={sleeve} stroke={stroke} />;
    const sleeveLong = <rect x={-8 * s} y={-30} width={16 * s} height={24} rx={5} fill={sleeve} stroke={stroke} />;
    const glove = <circle cx={0} cy={2} r={5} fill={sleeve} stroke={stroke} />;

    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={stroke} strokeWidth={strokeWidth}>
            {base}
            {variant === "sleeveShort" ? sleeveShort : null}
            {variant === "sleeveLong" ? sleeveLong : null}
            {variant === "glove" ? glove : null}
            {variant === "bareThin" && <rect x={-5 * s} y={-30} width={10 * s} height={28} rx={5} fill={skin} />}
            {variant === "bareThick" && <rect x={-7 * s} y={-30} width={14 * s} height={30} rx={7} fill={skin} />}
        </g>
    );
};
