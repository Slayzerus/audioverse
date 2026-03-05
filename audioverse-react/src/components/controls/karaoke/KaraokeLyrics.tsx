import React, { useMemo } from "react";
import { KaraokeSongFile } from "../../../models/modelsKaraoke";
import { parseVersesWithSyllables, KaraokeSyllableVerse } from "../../../scripts/karaoke/karaokeLyrics";

interface KaraokeLyricsProps {
    song: KaraokeSongFile;
    currentTime: number;
}

/** Gradient colors for the sung-portion sweep (theme tokens with fallbacks) */
const SUNG_GRADIENT = "var(--karaoke-sung-gradient, linear-gradient(90deg, #00e5ff 0%, #ffe600 60%, #ffab00 100%))";
// Split gold glow into parts so the code can reference the first shadow like before
const GOLD_GLOW_FIRST = "var(--karaoke-gold-glow-first, 0 0 12px #FFD700)";
const ACTIVE_GLOW = "var(--karaoke-active-glow, 0 0 10px rgba(0,229,255,0.6), 0 0 4px rgba(255,230,0,0.4))";
const ACTIVE_DROP_FIRST = "var(--karaoke-active-drop-first, 0 0 6px rgba(0,229,255,0.5))";

const KaraokeLyrics: React.FC<KaraokeLyricsProps> = ({ song, currentTime }) => {
    // Parse syllables once when song changes
    const verses = useMemo<KaraokeSyllableVerse[]>(() => {
        if (!song || !song.notes.length) return [];
        return parseVersesWithSyllables(song.notes.map(n => n.noteLine), song.bpm ?? undefined);
    }, [song]);

    const adjustedTime = currentTime - (song.gap ?? 0) / 1000;

    // Find current active line index
    let activeLineIdx = -1;
    for (let i = 0; i < verses.length; i++) {
        const vStart = verses[i].timestamp;
        const vEnd = i + 1 < verses.length ? verses[i + 1].timestamp : vStart + 30;
        if (adjustedTime >= vStart && adjustedTime < vEnd) {
            activeLineIdx = i;
            break;
        }
    }

    const currentVerse = activeLineIdx >= 0 ? verses[activeLineIdx] : null;
    const nextVerse = activeLineIdx >= 0 && activeLineIdx + 1 < verses.length ? verses[activeLineIdx + 1] : null;

    return (
        <div className="karaoke-lyrics" style={{
            textAlign: "center", fontSize: "28px", marginTop: "20px", minHeight: "80px",
            textShadow: "var(--karaoke-outline, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000)",
            fontWeight: 700, fontStyle: "italic",
            fontFamily: "var(--karaoke-font-family, Arial)",
        }}>
            {currentVerse ? (
                <>
                    <p style={{
                        color: "var(--karaoke-primary-text, #fff)", margin: "5px 0", lineHeight: 1.4,
                        textShadow: ACTIVE_GLOW,
                        background: "var(--karaoke-active-bg, linear-gradient(90deg, transparent 0%, rgba(0,229,255,0.08) 20%, rgba(255,230,0,0.06) 80%, transparent 100%))",
                        borderRadius: 8,
                        padding: "2px 10px",
                        transition: "text-shadow 0.3s ease, background 0.3s ease",
                    }}>
                        {currentVerse.syllables.map((syl, sidx) => {
                            // Compute sweep progress 0..1 within this syllable
                            let progress = 0;
                            if (adjustedTime >= syl.endTime) {
                                progress = 1; // fully sung
                            } else if (adjustedTime > syl.startTime) {
                                progress = (adjustedTime - syl.startTime) / (syl.endTime - syl.startTime);
                            }
                            const pct = Math.round(progress * 100);

                            const text = syl.text + (syl.hasTrailingSpace ? " " : "");
                            const isActive = progress > 0 && progress < 1;
                            const isGold = syl.isGolden;

                            if (progress <= 0) {
                                // Not yet reached — plain white, dimmed slightly
                                return (
                                    <span key={sidx} style={{
                                        color: "var(--karaoke-syllable-dim, rgba(255,255,255,0.85))",
                                        transition: "color 0.15s ease",
                                    }}>
                                        {text}
                                    </span>
                                );
                            }
                            if (progress >= 1) {
                                // Fully sung — gradient text (golden for gold notes, yellow for normal)
                                return (
                                    <span key={sidx} style={{
                                        background: isGold
                                            ? "var(--karaoke-gold-gradient, linear-gradient(90deg, #FFD700, #FFA000, #FFD700))"
                                            : SUNG_GRADIENT,
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                        backgroundClip: "text",
                                        filter: isGold ? `drop-shadow(${GOLD_GLOW_FIRST})` : "none",
                                        transition: "filter 0.2s ease",
                                    } as React.CSSProperties}>
                                        {text}
                                    </span>
                                );
                            }

                            // Active syllable — gradient sweep with glow
                            return (
                                <span
                                    key={sidx}
                                    style={{
                                        position: "relative",
                                        display: "inline",
                                        filter: isActive
                                            ? (isGold ? `drop-shadow(${GOLD_GLOW_FIRST})` : `drop-shadow(${ACTIVE_DROP_FIRST})`)
                                            : "none",
                                        transition: "filter 0.15s ease",
                                    } as React.CSSProperties}
                                >
                                    <span style={{ color: "var(--karaoke-syllable-dim, rgba(255,255,255,0.85))", visibility: "visible" }}>{text}</span>
                                    <span
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            top: 0,
                                            background: isGold
                                                ? "var(--karaoke-gold-gradient, linear-gradient(90deg, #FFD700, #FFA000, #FFD700))"
                                                : SUNG_GRADIENT,
                                            WebkitBackgroundClip: "text",
                                            WebkitTextFillColor: "transparent",
                                            backgroundClip: "text",
                                            clipPath: `inset(0 ${100 - pct}% 0 0)`,
                                            pointerEvents: "none",
                                        } as React.CSSProperties}
                                    >
                                        {text}
                                    </span>
                                </span>
                            );
                        })}
                    </p>
                    {nextVerse && (
                        <p style={{ color: "var(--karaoke-next-text, #666)", margin: "5px 0", lineHeight: 1.4, fontSize: "22px", transition: "opacity 0.3s ease" }}>
                            {nextVerse.syllables.map((syl, sidx) => (
                                <span key={sidx} style={{
                                    color: syl.isGolden ? "var(--karaoke-golden-next, rgba(255,215,0,0.5))" : "var(--karaoke-next-dim, #777)",
                                }}>
                                    {syl.text + (syl.hasTrailingSpace ? " " : "")}
                                </span>
                            ))}
                        </p>
                    )}
                </>
            ) : verses.length > 0 ? (
                <p style={{ color: "var(--karaoke-waiting-text, #999)" }}>🎵</p>
            ) : (
                <p style={{ color: "var(--karaoke-waiting-text, #999)" }}>🎤 Waiting for lyrics...</p>
            )}
        </div>
    );
};

export default React.memo(KaraokeLyrics);
