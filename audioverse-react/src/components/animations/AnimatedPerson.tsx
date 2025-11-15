// components/animations/AnimatedPerson.tsx
import React, { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
    usePersonControls,
    type PersonControls,
    type PersonPose,
    playPose,
} from "./animationHelper";
import type { CharacterConfig, FeatureConfig } from "./characterTypes";
import { DEFAULT_CHARACTER, pick } from "./characterTypes";
import BodyRenderer from "./BodyRenderer.tsx";

export type AnimatedPersonProps = {
    id?: string;
    name?: string;
    size?: number;            // (opcjonalne) – lepiej użyć character.size
    score?: number | string;  // tekst na kartce
    startPose?: PersonPose;
    onReady?: (controls: PersonControls) => void;
    character?: CharacterConfig; // pełna konfiguracja cech
};

const AnimatedPerson: React.FC<AnimatedPersonProps> = ({
                                                           id,
                                                           name,
                                                           size,
                                                           score = 10,
                                                           startPose = "idle",
                                                           onReady,
                                                           character,
                                                       }) => {
    const fx = usePersonControls();

    const cfg: CharacterConfig = useMemo(
        () => ({ ...DEFAULT_CHARACTER, ...(character ?? {}) }),
        [character]
    );

    useEffect(() => {
        onReady?.(fx);
        void playPose(fx, startPose, {});
    }, [fx, onReady, startPose]);

    const W = cfg.size ?? size ?? DEFAULT_CHARACTER.size ?? 180;

    return (

        <motion.div
            id={id}
            style={{ width: W, height: W * 1.25, overflow: "visible" }}
            animate={fx.root}
        >
            <BodyRenderer character={cfg} size={cfg.size} />
            <svg
                viewBox="0 0 180 220"
                width="100%"
                height="100%"
                role="img"
                aria-label={cfg.name ?? name ?? "Juror"}
            >
                {/* BODY / OUTFIT */}
                <motion.g animate={fx.body}>{renderOutfit(cfg.outfit)}</motion.g>

                {/* HEAD */}
                <motion.g animate={fx.head}>
                    {renderHairBack(cfg.hair)}
                    {renderFace(cfg.face)}
                    <motion.g animate={fx.eyes}>{renderEyes(cfg.eyes)}</motion.g>
                    {renderNose(cfg.nose)}
                    <motion.g animate={fx.mouth}>{renderMouth(cfg.mouth)}</motion.g>
                    {renderHeadwear(cfg.headwear)}
                </motion.g>

                {/* LEFT ARM */}
                <motion.g
                    animate={fx.leftArm}
                    style={{ transformOrigin: `60px 105px` }}
                >
                    <rect
                        x="40"
                        y="105"
                        width="20"
                        height="50"
                        rx="8"
                        fill={pick(cfg.face.colors, 0, "#FFD2B3")}
                    />
                </motion.g>

                {/* RIGHT ARM + CARD + PROP */}
                <motion.g
                    animate={fx.rightArm}
                    style={{ transformOrigin: `120px 105px` }}
                >
                    <rect
                        x="120"
                        y="105"
                        width="20"
                        height="50"
                        rx="8"
                        fill={pick(cfg.face.colors, 0, "#FFD2B3")}
                    />

                    {/* kartka z oceną */}
                    <motion.g animate={fx.card}>
                        <rect x="122" y="52" width="46" height="34" rx="4" fill="#fff" stroke="#111" />
                        <text x="145" y="74" textAnchor="middle" fontSize="18" fontWeight={700} fill="#111">
                            {String(score)}
                        </text>
                    </motion.g>

                    {/* rekwizyt */}
                    {renderProp(cfg.prop)}
                </motion.g>

                {/* Dymek przekleństw */}
                <motion.g animate={fx.curse} initial={{ opacity: 0 }}>
                    <rect x="62" y="18" width="56" height="22" rx="6" fill="#111" />
                    <text x="90" y="34" textAnchor="middle" fontSize="12" fill="#fff">
                        #!%&*
                    </text>
                </motion.g>

                {/* LEGS */}
                <rect x="62" y="178" width="16" height="34" rx="6" fill="#333" />
                <rect x="102" y="178" width="16" height="34" rx="6" fill="#333" />
            </svg>
        </motion.div>
    );
};

export default AnimatedPerson;

/* ---------------- RENDERERS ---------------- */

function renderOutfit(cfg: FeatureConfig) {
    const base = pick(cfg.colors, 0, "#3B82F6");
    const accent = pick(cfg.colors, 1, base);
    const stroke = pick(cfg.colors, 2, "#111");
    switch (cfg.variant) {
        case "hoodie":
            return (
                <g>
                    <rect x="50" y="100" width="80" height="80" rx="14" fill={base} stroke={stroke} strokeWidth={1} />
                    <path d="M50 110 Q90 70 130 110" fill={accent} opacity={0.25} />
                </g>
            );
        case "suit":
            return (
                <g>
                    <rect x="50" y="100" width="80" height="80" rx="10" fill={base} stroke={stroke} strokeWidth={1} />
                    <path d="M90 100 L70 130 L90 120 L110 130 Z" fill={accent} opacity={0.8} />
                    <rect x="88" y="120" width="4" height="60" fill="#fff" opacity={0.9} />
                </g>
            );
        case "dress":
            return (
                <g>
                    <rect x="50" y="100" width="80" height="70" rx="12" fill={base} stroke={stroke} strokeWidth={1} />
                    <path d="M50 170 L130 170 L140 190 L40 190 Z" fill={accent} />
                </g>
            );
        case "tee":
        default:
            return <rect x="50" y="100" width="80" height="80" rx="12" fill={base} stroke={stroke} strokeWidth={1} />;
    }
}

function renderHairBack(cfg: FeatureConfig) {
    const base = pick(cfg.colors, 0, "#1F2937");
    const hi = pick(cfg.colors, 1, base);
    switch (cfg.variant) {
        case "long":
            return (
                <g>
                    <path d="M62 54 Q90 30 118 54 L118 86 Q90 100 62 86 Z" fill={base} />
                    <path d="M90 54 Q92 64 100 70" stroke={hi} strokeWidth={3} opacity={0.4} />
                </g>
            );
        case "curly":
            return <path d="M68 48 q10 -16 22 0 q10 -16 22 0 l0 10 q-32 14 -64 0 Z" fill={base} />;
        case "mohawk":
            return <path d="M84 36 L96 36 L98 60 L82 60 Z" fill={base} />;
        case "short":
            return <path d="M70 55 C80 30, 100 30, 110 55 L70 55 Z" fill={base} />;
        case "none":
        default:
            return null;
    }
}

function renderFace(cfg: FeatureConfig) {
    const skin = pick(cfg.colors, 0, "#FFD2B3");
    const shadow = pick(cfg.colors, 1, skin);
    const stroke = pick(cfg.colors, 2, "#111");
    switch (cfg.variant) {
        case "oval":
            return (
                <g>
                    <ellipse cx="90" cy="72" rx="24" ry="26" fill={skin} stroke={stroke} strokeWidth={1} />
                    <ellipse cx="90" cy="84" rx="16" ry="6" fill={shadow} opacity={0.1} />
                </g>
            );
        case "square":
            return (
                <g>
                    <rect x="66" y="48" width="48" height="48" rx="10" fill={skin} stroke={stroke} strokeWidth={1} />
                    <ellipse cx="90" cy="84" rx="16" ry="6" fill={shadow} opacity={0.1} />
                </g>
            );
        case "heart":
            return (
                <g>
                    <path d="M90 46 q-16 10 -16 24 q0 14 16 24 q16 -10 16 -24 q0 -14 -16 -24 Z" fill={skin} stroke={stroke} strokeWidth={1} />
                    <ellipse cx="90" cy="84" rx="16" ry="6" fill={shadow} opacity={0.1} />
                </g>
            );
        case "round":
        default:
            return (
                <g>
                    <circle cx="90" cy="70" r="24" fill={skin} stroke={stroke} strokeWidth={1} />
                    <ellipse cx="90" cy="84" rx="16" ry="6" fill={shadow} opacity={0.1} />
                </g>
            );
    }
}

function renderEyes(cfg: FeatureConfig) {
    const base = pick(cfg.colors, 0, "#111");
    switch (cfg.variant) {
        case "oval":
            return (
                <>
                    <ellipse cx="82" cy="68" rx="4" ry="3" fill={base} />
                    <ellipse cx="98" cy="68" rx="4" ry="3" fill={base} />
                </>
            );
        case "laugh":
            return (
                <>
                    <path d="M78 68 q4 -4 8 0" stroke={base} strokeWidth={3} fill="none" />
                    <path d="M94 68 q4 -4 8 0" stroke={base} strokeWidth={3} fill="none" />
                </>
            );
        case "wink":
            return (
                <>
                    <circle cx="82" cy="68" r="3" fill={base} />
                    <rect x="95" y="67" width="8" height="2" rx="1" fill={base} />
                </>
            );
        case "sleepy":
            return (
                <>
                    <rect x="78" y="67" width="8" height="2" rx="1" fill={base} />
                    <rect x="94" y="67" width="8" height="2" rx="1" fill={base} />
                </>
            );
        case "dot":
        default:
            return (
                <>
                    <circle cx="82" cy="68" r="3" fill={base} />
                    <circle cx="98" cy="68" r="3" fill={base} />
                </>
            );
    }
}

function renderNose(cfg: FeatureConfig) {
    const base = pick(cfg.colors, 0, "#111");
    switch (cfg.variant) {
        case "triangle":
            return <path d="M90 72 l-4 8 h8 Z" fill={base} />;
        case "round":
            return <circle cx="90" cy="76" r="3" fill={base} opacity={0.8} />;
        case "line":
        default:
            return <rect x="89" y="72" width="2" height="8" fill={base} rx="1" />;
    }
}

function renderMouth(cfg: FeatureConfig) {
    const base = pick(cfg.colors, 0, "#111");
    const tooth = pick(cfg.colors, 1, "#fff");
    switch (cfg.variant) {
        case "frown":
            return <path d="M80 86 q10 -6 20 0" stroke={base} strokeWidth={3} fill="none" />;
        case "open":
            return <ellipse cx="90" cy="86" rx="8" ry="5" fill={base} />;
        case "flat":
            return <rect x="82" y="85" width="16" height="2.5" rx="1" fill={base} />;
        case "o":
            return <circle cx="90" cy="86" r="4" fill={base} />;
        case "teeth":
            return (
                <g>
                    <rect x="82" y="84" width="16" height="6" rx="2" fill={base} />
                    <rect x="84" y="85" width="12" height="3" fill={tooth} />
                </g>
            );
        case "smile":
        default:
            return <path d="M80 86 q10 8 20 0" stroke={base} strokeWidth={3} fill="none" />;
    }
}

function renderHeadwear(cfg: FeatureConfig) {
    const base = pick(cfg.colors, 0, "#111");
    const accent = pick(cfg.colors, 1, base);
    switch (cfg.variant) {
        case "cap":
            return <path d="M70 55 q20 -16 40 0 l-10 4 q-20 -8 -20 0 Z" fill={base} />;
        case "headphones":
            return (
                <g>
                    <path d="M68 68 q0 -22 22 -22 q22 0 22 22" stroke={base} strokeWidth={6} fill="none" />
                    <rect x="62" y="64" width="10" height="16" rx="3" fill={accent} />
                    <rect x="108" y="64" width="10" height="16" rx="3" fill={accent} />
                </g>
            );
        case "hat":
            return <path d="M64 58 h52 v8 h-52 Z M72 50 h36 v8 h-36 Z" fill={base} />;
        case "crown":
            return <path d="M70 54 l8 10 l7 -10 l7 10 l8 -10 v10 h-30 Z" fill={base} />;
        case "none":
        default:
            return null;
    }
}

function renderProp(cfg: FeatureConfig) {
    const base = pick(cfg.colors, 0, "#111");
    const accent = pick(cfg.colors, 1, "#666");
    const light = pick(cfg.colors, 2, "#CCC");
    switch (cfg.variant) {
        case "mic":
            return (
                <g transform="translate(136,96)">
                    <rect x="0" y="0" width="4" height="16" rx="2" fill={accent} />
                    <circle cx="2" cy="-2" r="6" fill={base} stroke={light} strokeWidth={1} />
                </g>
            );
        case "clipboard":
            return (
                <g transform="translate(136,92)">
                    <rect x="-6" y="-2" width="20" height="26" rx="3" fill={light} stroke={base} />
                    <rect x="0" y="-6" width="8" height="6" rx="2" fill={base} />
                </g>
            );
        case "star":
            return (
                <g transform="translate(136,92)">
                    <path d="M8 0 L10 6 L16 6 L11 10 L13 16 L8 12 L3 16 L5 10 L0 6 L6 6 Z" fill={accent} stroke={base} />
                </g>
            );
        case "none":
        default:
            return null;
    }
}
