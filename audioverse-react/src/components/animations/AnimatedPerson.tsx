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
    const skin = pick(cfg.face.colors, 0, "var(--anim-skin, #FFD2B3)");

    return (
        <motion.div
            id={id}
            style={{ width: W, height: W * 1.35, overflow: "visible" }}
            animate={fx.root}
        >
            <svg
                viewBox="0 0 180 240"
                width="100%"
                height="100%"
                role="img"
                aria-label={cfg.name ?? name ?? "Juror"}
            >
                {/* LEGS — subtle sway with body */}
                <motion.g animate={fx.body}>
                    {/* left leg */}
                      <rect x="68" y="158" width="14" height="46" rx="6"
                          fill={pick(cfg.outfit.colors, 1, "var(--anim-outfit-leg, #334155)")} />
                      <ellipse cx="75" cy="204" rx="10" ry="5"
                             fill={pick(cfg.outfit.colors, 1, "var(--anim-outfit-leg-shadow, #1E293B)")} />
                    {/* right leg */}
                      <rect x="98" y="158" width="14" height="46" rx="6"
                          fill={pick(cfg.outfit.colors, 1, "var(--anim-outfit-leg, #334155)")} />
                      <ellipse cx="105" cy="204" rx="10" ry="5"
                             fill={pick(cfg.outfit.colors, 1, "var(--anim-outfit-leg-shadow, #1E293B)")} />
                </motion.g>

                {/* BODY / OUTFIT */}
                <motion.g animate={fx.body}>{renderOutfit(cfg.outfit)}</motion.g>

                {/* NECK */}
                <rect x="84" y="82" width="12" height="12" rx="4" fill={skin} />

                {/* LEFT ARM */}
                <motion.g
                    animate={fx.leftArm}
                    style={{ transformOrigin: "64px 96px" }}
                >
                    {/* upper arm */}
                    <rect x="36" y="96" width="16" height="36" rx="7" fill={skin} />
                    {/* hand */}
                    <circle cx="44" cy="136" r="7" fill={skin} />
                </motion.g>

                {/* RIGHT ARM + CARD + PROP */}
                <motion.g
                    animate={fx.rightArm}
                    style={{ transformOrigin: "116px 96px" }}
                >
                    {/* upper arm */}
                    <rect x="128" y="96" width="16" height="36" rx="7" fill={skin} />
                    {/* hand */}
                    <circle cx="136" cy="136" r="7" fill={skin} />

                    {/* scorecard */}
                    <motion.g animate={fx.card}>
                        <rect x="126" y="50" width="42" height="30" rx="4"
                            fill="var(--surface-bg, #fff)" stroke="var(--text-primary, #111)" strokeWidth={1.2} />
                        <text x="147" y="70" textAnchor="middle" fontSize="16"
                            fontWeight={700} fill="var(--text-primary, #111)">
                            {String(score)}
                        </text>
                    </motion.g>

                    {/* rekwizyt */}
                    {renderProp(cfg.prop)}
                </motion.g>

                {/* HEAD */}
                <motion.g animate={fx.head}>
                    {renderHairBack(cfg.hair)}
                    {renderFace(cfg.face)}
                    <motion.g animate={fx.eyes}>{renderEyes(cfg.eyes)}</motion.g>
                    {renderNose(cfg.nose)}
                    <motion.g animate={fx.mouth}>{renderMouth(cfg.mouth)}</motion.g>
                    {renderHeadwear(cfg.headwear)}
                </motion.g>

                {/* Dymek przekleństw */}
                <motion.g animate={fx.curse} initial={{ opacity: 0 }}>
                    <rect x="62" y="10" width="56" height="22" rx="8" fill="var(--text-primary, #111)" />
                    <text x="90" y="26" textAnchor="middle" fontSize="12" fill="var(--surface-bg, #fff)">
                        #!%&*
                    </text>
                    <path d="M82 32 l4 8 l4 -8" fill="var(--text-primary, #111)" />
                </motion.g>
            </svg>
        </motion.div>
    );
};

export default AnimatedPerson;

/* ---------------- RENDERERS (redesigned proportions) ---------------- */

function renderOutfit(cfg: FeatureConfig) {
    const base = pick(cfg.colors, 0, "var(--anim-shirt, #3B82F6)");
    const accent = pick(cfg.colors, 1, base);
    const stroke = pick(cfg.colors, 2, "var(--anim-stroke, #111)");
    switch (cfg.variant) {
        case "hoodie":
            return (
                <g>
                    <rect x="52" y="92" width="76" height="66" rx="16" fill={base} stroke={stroke} strokeWidth={1} />
                    <path d="M52 102 Q90 72 128 102" fill={accent} opacity={0.2} />
                    {/* hood collar */}
                    <ellipse cx="90" cy="94" rx="18" ry="6" fill={accent} opacity={0.3} />
                </g>
            );
        case "suit":
            return (
                <g>
                    <rect x="52" y="92" width="76" height="66" rx="12" fill={base} stroke={stroke} strokeWidth={1} />
                    {/* lapels */}
                    <path d="M90 92 L72 118 L90 110 L108 118 Z" fill={accent} opacity={0.75} />
                    {/* center line */}
                    <rect x="88" y="110" width="4" height="48" fill={"var(--surface-bg, #fff)"} opacity={0.8} />
                    {/* buttons */}
                    <circle cx="90" cy="120" r="2" fill={stroke} />
                    <circle cx="90" cy="134" r="2" fill={stroke} />
                </g>
            );
        case "dress":
            return (
                <g>
                    <rect x="52" y="92" width="76" height="56" rx="14" fill={base} stroke={stroke} strokeWidth={1} />
                    <path d="M52 148 L128 148 L136 168 L44 168 Z" fill={accent} />
                </g>
            );
        case "tee":
        default:
            return (
                <g>
                    <rect x="52" y="92" width="76" height="66" rx="14" fill={base} stroke={stroke} strokeWidth={1} />
                    {/* collar */}
                    <path d="M82 92 L90 100 L98 92" fill="none" stroke={stroke} strokeWidth={1} opacity={0.4} />
                </g>
            );
    }
}

function renderHairBack(cfg: FeatureConfig) {
    const base = pick(cfg.colors, 0, "var(--anim-hair, #1F2937)");
    const hi = pick(cfg.colors, 1, base);
    switch (cfg.variant) {
        case "long":
            return (
                <g>
                    <path d="M60 46 Q90 22 120 46 L120 76 Q90 92 60 76 Z" fill={base} />
                    <path d="M90 46 Q92 56 102 62" stroke={hi} strokeWidth={2.5} opacity={0.35} />
                </g>
            );
        case "curly":
            return (
                <g>
                    <path d="M66 40 q10 -14 22 0 q10 -14 22 0 l0 12 q-32 12 -64 0 Z" fill={base} />
                    <circle cx="66" cy="44" r="5" fill={base} />
                    <circle cx="114" cy="44" r="5" fill={base} />
                </g>
            );
        case "mohawk":
            return <path d="M82 28 L98 28 L100 50 L80 50 Z" fill={base} />;
        case "short":
            return <path d="M68 47 C78 24, 102 24, 112 47 L68 47 Z" fill={base} />;
        case "none":
        default:
            return null;
    }
}

function renderFace(cfg: FeatureConfig) {
    const skin = pick(cfg.colors, 0, "var(--anim-skin, #FFD2B3)");
    const shadow = pick(cfg.colors, 1, skin);
    const stroke = pick(cfg.colors, 2, "var(--anim-stroke, #111)");
    switch (cfg.variant) {
        case "oval":
            return (
                <g>
                    <ellipse cx="90" cy="60" rx="26" ry="28" fill={skin} stroke={stroke} strokeWidth={1} />
                    <ellipse cx="90" cy="76" rx="16" ry="5" fill={shadow} opacity={0.08} />
                </g>
            );
        case "square":
            return (
                <g>
                    <rect x="64" y="36" width="52" height="48" rx="12" fill={skin} stroke={stroke} strokeWidth={1} />
                    <ellipse cx="90" cy="76" rx="16" ry="5" fill={shadow} opacity={0.08} />
                </g>
            );
        case "heart":
            return (
                <g>
                    <path d="M90 36 q-18 10 -18 26 q0 16 18 26 q18 -10 18 -26 q0 -16 -18 -26 Z"
                          fill={skin} stroke={stroke} strokeWidth={1} />
                    <ellipse cx="90" cy="76" rx="16" ry="5" fill={shadow} opacity={0.08} />
                </g>
            );
        case "round":
        default:
            return (
                <g>
                    <circle cx="90" cy="60" r="26" fill={skin} stroke={stroke} strokeWidth={1} />
                    <ellipse cx="90" cy="76" rx="16" ry="5" fill={shadow} opacity={0.08} />
                </g>
            );
    }
}

function renderEyes(cfg: FeatureConfig) {
    const base = pick(cfg.colors, 0, "var(--anim-eye-base, #111)");
    switch (cfg.variant) {
        case "oval":
            return (
                <>
                    <ellipse cx="80" cy="56" rx="4.5" ry="3.5" fill={base} />
                    <ellipse cx="100" cy="56" rx="4.5" ry="3.5" fill={base} />
                    {/* highlights */}
                    <circle cx="81.5" cy="55" r="1.2" fill={"var(--surface-bg, #fff)"} opacity={0.7} />
                    <circle cx="101.5" cy="55" r="1.2" fill={"var(--surface-bg, #fff)"} opacity={0.7} />
                </>
            );
        case "laugh":
            return (
                <>
                    <path d="M76 56 q4 -4 8 0" stroke={base} strokeWidth={2.5} fill="none" strokeLinecap="round" />
                    <path d="M96 56 q4 -4 8 0" stroke={base} strokeWidth={2.5} fill="none" strokeLinecap="round" />
                </>
            );
        case "wink":
            return (
                <>
                    <circle cx="80" cy="56" r="3.5" fill={base} />
                    <circle cx="81.5" cy="55" r="1" fill={"var(--surface-bg, #fff)"} opacity={0.7} />
                    <path d="M96 56 l8 0" stroke={base} strokeWidth={2.5} strokeLinecap="round" />
                </>
            );
        case "sleepy":
            return (
                <>
                    <path d="M76 56 l8 0" stroke={base} strokeWidth={2.5} strokeLinecap="round" />
                    <path d="M96 56 l8 0" stroke={base} strokeWidth={2.5} strokeLinecap="round" />
                </>
            );
        case "dot":
        default:
            return (
                <>
                    <circle cx="80" cy="56" r="3.5" fill={base} />
                    <circle cx="100" cy="56" r="3.5" fill={base} />
                    {/* highlights */}
                    <circle cx="81.5" cy="55" r="1" fill={"var(--surface-bg, #fff)"} opacity={0.7} />
                    <circle cx="101.5" cy="55" r="1" fill={"var(--surface-bg, #fff)"} opacity={0.7} />
                </>
            );
    }
}

function renderNose(cfg: FeatureConfig) {
    const base = pick(cfg.colors, 0, "var(--anim-nose, #111)");
    switch (cfg.variant) {
        case "triangle":
            return <path d="M90 62 l-4 8 h8 Z" fill={base} opacity={0.6} />;
        case "round":
            return <circle cx="90" cy="66" r="3" fill={base} opacity={0.6} />;
        case "line":
        default:
            return <rect x="89" y="62" width="2" height="8" fill={base} rx="1" opacity={0.5} />;
    }
}

function renderMouth(cfg: FeatureConfig) {
    const base = pick(cfg.colors, 0, "var(--anim-mouth-base, #111)");
    const tooth = pick(cfg.colors, 1, "var(--white, #fff)");
    switch (cfg.variant) {
        case "frown":
            return <path d="M80 76 q10 -6 20 0" stroke={base} strokeWidth={2.5} fill="none" strokeLinecap="round" />;
        case "open":
            return <ellipse cx="90" cy="76" rx="7" ry="5" fill={base} />;
        case "flat":
            return <rect x="82" y="75" width="16" height="2.5" rx="1.25" fill={base} />;
        case "o":
            return <circle cx="90" cy="76" r="4" fill={base} />;
        case "teeth":
            return (
                <g>
                    <rect x="82" y="74" width="16" height="7" rx="3" fill={base} />
                    <rect x="84" y="75" width="12" height="3" rx="1" fill={tooth} />
                </g>
            );
        case "smile":
        default:
            return <path d="M80 76 q10 8 20 0" stroke={base} strokeWidth={2.5} fill="none" strokeLinecap="round" />;
    }
}

function renderHeadwear(cfg: FeatureConfig) {
    const base = pick(cfg.colors, 0, "var(--anim-headwear-base, #111)");
    const accent = pick(cfg.colors, 1, base);
    switch (cfg.variant) {
        case "cap":
            return (
                <g>
                    <path d="M68 44 q22 -18 44 0 l-6 4 q-18 -10 -28 0 Z" fill={base} />
                    <rect x="60" y="44" width="52" height="5" rx="2" fill={base} />
                </g>
            );
        case "headphones":
            return (
                <g>
                    <path d="M66 56 q0 -24 24 -24 q24 0 24 24" stroke={base} strokeWidth={5} fill="none" />
                    <rect x="58" y="52" width="12" height="16" rx="4" fill={accent} />
                    <rect x="110" y="52" width="12" height="16" rx="4" fill={accent} />
                </g>
            );
        case "hat":
            return (
                <g>
                    <rect x="62" y="38" width="56" height="8" rx="3" fill={base} />
                    <rect x="72" y="30" width="36" height="10" rx="3" fill={base} />
                </g>
            );
        case "crown":
            return <path d="M72 42 l6 12 l6 -10 l6 10 l6 -10 l6 12 v6 h-30 Z" fill={base} />;
        case "none":
        default:
            return null;
    }
}

function renderProp(cfg: FeatureConfig) {
    const base = pick(cfg.colors, 0, "var(--anim-prop-base, #111)");
    const accent = pick(cfg.colors, 1, "var(--anim-prop-accent, #666)");
    const light = pick(cfg.colors, 2, "var(--anim-prop-light, #CCC)");
    switch (cfg.variant) {
        case "mic":
            return (
                <g transform="translate(140,90)">
                    <rect x="0" y="0" width="4" height="16" rx="2" fill={accent} />
                    <circle cx="2" cy="-2" r="6" fill={base} stroke={light} strokeWidth={1} />
                </g>
            );
        case "clipboard":
            return (
                <g transform="translate(140,86)">
                    <rect x="-6" y="-2" width="20" height="26" rx="3" fill={light} stroke={base} />
                    <rect x="0" y="-6" width="8" height="6" rx="2" fill={base} />
                </g>
            );
        case "star":
            return (
                <g transform="translate(140,86)">
                    <path d="M8 0 L10 6 L16 6 L11 10 L13 16 L8 12 L3 16 L5 10 L0 6 L6 6 Z"
                          fill={accent} stroke={base} />
                </g>
            );
        case "none":
        default:
            return null;
    }
}
