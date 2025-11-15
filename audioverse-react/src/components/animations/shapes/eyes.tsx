import React from "react";
import { pick } from "../characterTypes";

/// Props for eye renderers (pair).
export type EyesProps = {
    /// Palette: [sclera, iris, pupil/outline]
    colors: string[];
    /// Distance from face center to each eye.
    spread?: number;
    /// Vertical offset of eyes on head coords.
    y?: number;
    /// Uniform scale.
    scale?: number;
    /// Transform on root group.
    transform?: string;
    /// Optional draw eyebrows.
    eyebrows?: boolean;
};

function pal(c: string[]) {
    return {
        sclera: pick(c, 0, "#FFFFFF"),
        iris: pick(c, 1, "#2563EB"),
        pupil: pick(c, 2, "#111"),
        highlight: "#FFF",
    };
}

/// Base helper to draw one eye (round).
function RoundEye({ x, y, rSclera, rIris, rPupil, colors }: { x: number; y: number; rSclera: number; rIris: number; rPupil: number; colors: ReturnType<typeof pal> }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <circle cx={0} cy={0} r={rSclera} fill={colors.sclera} />
            <circle cx={0} cy={0} r={rIris} fill={colors.iris} />
            <circle cx={0} cy={0} r={rPupil} fill={colors.pupil} />
            <circle cx={-rIris * 0.3} cy={-rIris * 0.3} r={rIris * 0.25} fill={colors.highlight} opacity={0.9} />
        </g>
    );
}

/// Classic round eyes.
export const EyesClassic: React.FC<EyesProps> = ({ colors, spread = 16, y = -6, scale = 1, transform, eyebrows = true }) => {
    const c = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={c.pupil} strokeWidth={1.2} strokeLinecap="round">
            <RoundEye x={-spread} y={y} rSclera={7} rIris={4.5} rPupil={2.2} colors={c} />
            <RoundEye x={spread} y={y} rSclera={7} rIris={4.5} rPupil={2.2} colors={c} />
            {eyebrows && (<>
                <path d={`M${-spread - 8} ${y - 8} q8 -6 16 0`} />
                <path d={`M${spread - 8} ${y - 8} q8 -6 16 0`} />
            </>)}
        </g>
    );
};

/// Big anime eyes.
export const EyesAnime: React.FC<EyesProps> = ({ colors, spread = 18, y = -6, scale = 1, transform, eyebrows = true }) => {
    const c = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={c.pupil} strokeWidth={1.2}>
            <g transform={`translate(${-spread} ${y})`}>
                <ellipse cx={0} cy={0} rx={8} ry={10} fill={c.sclera} />
                <ellipse cx={-1} cy={-1} rx={5} ry={6.5} fill={c.iris} />
                <ellipse cx={-1} cy={-1} rx={2.6} ry={3.2} fill={c.pupil} />
                <circle cx={-3} cy={-4} r={2} fill="#fff" />
            </g>
            <g transform={`translate(${spread} ${y})`}>
                <ellipse cx={0} cy={0} rx={8} ry={10} fill={c.sclera} />
                <ellipse cx={1} cy={-1} rx={5} ry={6.5} fill={c.iris} />
                <ellipse cx={1} cy={-1} rx={2.6} ry={3.2} fill={c.pupil} />
                <circle cx={3} cy={-4} r={2} fill="#fff" />
            </g>
            {eyebrows && (<>
                <path d={`M${-spread - 10} ${y - 10} q10 -8 20 0`} />
                <path d={`M${spread - 10} ${y - 10} q10 -8 20 0`} />
            </>)}
        </g>
    );
};

/// Sleepy eyes (half lids).
export const EyesSleepy: React.FC<EyesProps> = ({ colors, spread = 16, y = -6, scale = 1, transform }) => {
    const c = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={c.pupil} strokeWidth={1.2}>
            <RoundEye x={-spread} y={y} rSclera={7} rIris={4} rPupil={2} colors={c} />
            <RoundEye x={spread} y={y} rSclera={7} rIris={4} rPupil={2} colors={c} />
            <path d={`M${-spread - 8} ${y} q8 -4 16 0`} />
            <path d={`M${spread - 8} ${y} q8 -4 16 0`} />
        </g>
    );
};

/// Angry eyes (tilted brows).
export const EyesAngry: React.FC<EyesProps> = ({ colors, spread = 16, y = -6, scale = 1, transform }) => {
    const c = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={c.pupil} strokeWidth={1.6} strokeLinecap="round">
            <RoundEye x={-spread} y={y} rSclera={6.5} rIris={4} rPupil={2.2} colors={c} />
            <RoundEye x={spread} y={y} rSclera={6.5} rIris={4} rPupil={2.2} colors={c} />
            <path d={`M${-spread - 8} ${y - 8} q10 -8 18 0`} />
            <path d={`M${spread - 10} ${y - 8} q10 8 18 0`} />
        </g>
    );
};

/// Surprised (big pupils).
export const EyesSurprised: React.FC<EyesProps> = ({ colors, spread = 16, y = -6, scale = 1, transform }) => {
    const c = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`}>
            <RoundEye x={-spread} y={y} rSclera={8} rIris={5} rPupil={3.2} colors={c} />
            <RoundEye x={spread} y={y} rSclera={8} rIris={5} rPupil={3.2} colors={c} />
        </g>
    );
};

/// Winks.
export const EyesWinkLeft: React.FC<EyesProps> = ({ colors, spread = 16, y = -6, scale = 1, transform }) => {
    const c = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={c.pupil} strokeWidth={1.8} strokeLinecap="round">
            <path d={`M${-spread - 6} ${y} q6 4 12 0`} />
            <RoundEye x={spread} y={y} rSclera={7} rIris={4.5} rPupil={2.2} colors={c} />
        </g>
    );
};
export const EyesWinkRight: React.FC<EyesProps> = ({ colors, spread = 16, y = -6, scale = 1, transform }) => {
    const c = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={c.pupil} strokeWidth={1.8} strokeLinecap="round">
            <RoundEye x={-spread} y={y} rSclera={7} rIris={4.5} rPupil={2.2} colors={c} />
            <path d={`M${spread - 6} ${y} q6 4 12 0`} />
        </g>
    );
};

/// Happy-smile eyes (upturned).
export const EyesSmile: React.FC<EyesProps> = ({ colors, spread = 16, y = -6, scale = 1, transform }) => {
    const c = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={c.pupil} strokeWidth={1.8} strokeLinecap="round">
            <path d={`M${-spread - 8} ${y - 2} q8 8 16 0`} />
            <path d={`M${spread - 8} ${y - 2} q8 8 16 0`} />
        </g>
    );
};

/// Stylish oval, upturned, downturned, lashes, sparkle/heart/star/sad/focused
export const EyesOval: React.FC<EyesProps> = ({ colors, spread = 16, y = -6, scale = 1, transform, eyebrows }) => {
    const c = pal(colors);
    return (
        <g transform={`${transform ?? ""} scale(${scale})`} stroke={c.pupil} strokeWidth={1.2}>
            <ellipse cx={-spread} cy={y} rx={8} ry={5} fill={c.sclera} />
            <ellipse cx={-spread - 1} cy={y - 1} rx={3.5} ry={3} fill={c.iris} />
            <circle cx={-spread - 1} cy={y - 1} r={1.8} fill={c.pupil} />
            <ellipse cx={spread} cy={y} rx={8} ry={5} fill={c.sclera} />
            <ellipse cx={spread + 1} cy={y - 1} rx={3.5} ry={3} fill={c.iris} />
            <circle cx={spread + 1} cy={y - 1} r={1.8} fill={c.pupil} />
            {eyebrows && <>
                <path d={`M${-spread - 8} ${y - 8} q8 -6 16 0`} />
                <path d={`M${spread - 8} ${y - 8} q8 -6 16 0`} />
            </>}
        </g>
    );
};
export const EyesUpturned: typeof EyesSmile = EyesSmile;
export const EyesDownturned: React.FC<EyesProps> = ({ colors, spread = 16, y = -6, scale = 1, transform }) => {
    const c = pal(colors);
    return <g transform={`${transform ?? ""} scale(${scale})`} stroke={c.pupil} strokeWidth={1.8} strokeLinecap="round">
        <path d={`M${-spread - 8} ${y + 2} q8 -8 16 0`} />
        <path d={`M${spread - 8} ${y + 2} q8 -8 16 0`} />
    </g>;
};
export const EyesLashes: React.FC<EyesProps> = ({ colors, spread = 16, y = -6, scale = 1, transform }) => {
    const c = pal(colors);
    return <g transform={`${transform ?? ""} scale(${scale})`} stroke={c.pupil} strokeWidth={1.2} strokeLinecap="round">
        <RoundEye x={-spread} y={y} rSclera={7} rIris={4} rPupil={2} colors={c} />
        <RoundEye x={spread} y={y} rSclera={7} rIris={4} rPupil={2} colors={c} />
        {[ -spread -6, -spread, -spread +6 ].map((x,i)=><path key={i} d={`M${x} ${y-6} l0 -5`} />)}
        {[ spread -6, spread, spread +6 ].map((x,i)=><path key={i} d={`M${x} ${y-6} l0 -5`} />)}
    </g>;
};
export const EyesSparkle: React.FC<EyesProps> = ({ colors, spread=16, y=-6, scale=1, transform })=>{
    const c = pal(colors);
    const Star = ({x}:{x:number}) => <g transform={`translate(${x} ${y}) scale(0.7)`}><path d="M0 -6 L2 0 L8 2 L2 4 L0 10 L-2 4 L-8 2 L-2 0 Z" fill={c.iris}/><circle cx={0} cy={0} r={1.6} fill={c.pupil}/></g>;
    return <g transform={`${transform??""} scale(${scale})`}><Star x={-spread}/><Star x={spread}/></g>;
};
export const EyesHeart: React.FC<EyesProps> = ({ colors, spread=16, y=-6, scale=1, transform })=>{
    const c=pal(colors);
    const Heart = ({x}:{x:number}) => <g transform={`translate(${x} ${y}) scale(0.9)`}><path d="M0 -4 c2 -4,8 -3,8 2 c0 4,-6 6,-8 10 c-2 -4,-8 -6,-8 -10 c0 -5,6 -6,8 -2 z" fill={c.iris} stroke={c.pupil}/></g>;
    return <g transform={`${transform??""} scale(${scale})`}><Heart x={-spread}/><Heart x={spread}/></g>;
};
export const EyesStar = EyesSparkle;
export const EyesSad: React.FC<EyesProps> = ({ colors, spread=16, y=-6, scale=1, transform })=>{
    const c=pal(colors);
    return <g transform={`${transform??""} scale(${scale})`} stroke={c.pupil} strokeWidth={1.2}><RoundEye x={-spread} y={y} rSclera={6.5} rIris={3.5} rPupil={1.8} colors={c}/><RoundEye x={spread} y={y} rSclera={6.5} rIris={3.5} rPupil={1.8} colors={c}/><path d={`M${-spread-8} ${y-8} q8 6 16 0`}/><path d={`M${spread-8} ${y-8} q8 6 16 0`}/></g>;
};
export const EyesFocused: React.FC<EyesProps> = ({ colors, spread=16, y=-6, scale=1, transform })=>{
    const c=pal(colors);
    return <g transform={`${transform??""} scale(${scale})`}><RoundEye x={-spread} y={y} rSclera={6} rIris={2.8} rPupil={2.6} colors={c}/><RoundEye x={spread} y={y} rSclera={6} rIris={2.8} rPupil={2.6} colors={c}/></g>;
};

/// Registry.
export const EYE_RENDERERS = {
    classic: EyesClassic,
    big: EyesAnime,
    anime: EyesAnime,
    sleepy: EyesSleepy,
    angry: EyesAngry,
    surprised: EyesSurprised,
    winkLeft: EyesWinkLeft,
    winkRight: EyesWinkRight,
    smile: EyesSmile,
    oval: EyesOval,
    upturned: EyesUpturned,
    downturned: EyesDownturned,
    lashes: EyesLashes,
    sparkle: EyesSparkle,
    heart: EyesHeart,
    star: EyesStar,
    sad: EyesSad,
    focused: EyesFocused,
    dot: EyesFocused, // fallback for old config
};

/// Wrapper to render eyes by variant.
export const Eyes: React.FC<EyesProps & { /// Variant to render.
    variant: keyof typeof EYE_RENDERERS | string;
}> = ({ variant, ...rest }) => {
    const Comp = (EYE_RENDERERS as Record<string, React.FC<EyesProps>>)[variant] ?? EyesClassic;
    return <Comp {...rest} />;
};
