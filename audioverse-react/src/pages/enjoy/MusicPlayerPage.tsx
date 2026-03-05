// src/pages/enjoy/MusicPlayerPage.tsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import GenericPlayer from "../../components/controls/player/GenericPlayer";
import type { PlayerTrack, PlayerSource } from "../../models/modelsAudio";

/// <summary>
/// Page that resolves sources for a playlist and plays them using GenericPlayer.
/// </summary>
const MusicPlayerPage: React.FC = () => {
    const { t } = useTranslation();

    const [tracks] = useState<PlayerTrack[]>([]);

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 16, padding: 16 }}>
            {/* prawa kolumna – player */}
            <div style={{ display: "grid", gap: 12 }}>
                <h2 style={{ margin: 0 }}>{t('musicPlayer.title')}</h2>
                {/* ✅ removed non-existent prop onReplaceTracks */}
                <GenericPlayer tracks={tracks} autoPlay countdownSeconds={3} height={420} />
                {tracks.length > 0 && (
                    <div style={{ border: "1px solid var(--border-color, #e5e7eb)", borderRadius: 8, padding: 12, background: "var(--card-bg, #fff)" }}>
                        <div style={{ fontWeight: 600, marginBottom: 6 }}>{t('musicPlayer.sourcesFound', 'Sources found for tracks')}:</div>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {tracks.map((tr) => (
                                <li key={tr.id} style={{ marginBottom: 6 }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{tr.artist} — {tr.title}</span>{" "}
                                        <span style={{ color: "var(--text-secondary, #6b7280)" }}>
                                            [{tr.sources.length ? tr.sources.map((s: PlayerSource) => s.kind.toUpperCase()).join(", ") : t('musicPlayer.noSources', 'none')}]
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MusicPlayerPage;
