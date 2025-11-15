import React from "react";
import type { PlayerTrack } from "../../../models/modelsAudio";

type Props = {
    tracks: PlayerTrack[];
    activeIndex: number;
    onSelect: (i: number) => void;
};

const GenericPlayerTrackList: React.FC<Props> = ({ tracks, activeIndex, onSelect }) => {
    if (!tracks.length) return null;
    return (
        <div className="gp-list" style={{ display: "grid", gap: 4 }}>
            {tracks.map((t, i) => (
                <button
                    key={t.id}
                    onClick={() => onSelect(i)}
                    style={{
                        textAlign: "left",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        padding: "8px 10px",
                        background: i === activeIndex ? "#eef2ff" : "#fff",
                        cursor: "pointer",
                    }}
                    title={t.sources.map(s => s.kind).join(", ")}
                >
                    <div style={{ fontWeight: 600 }}>{t.title}</div>
                    <div style={{ color: "#64748b", fontSize: 12 }}>{t.artist}</div>
                </button>
            ))}
        </div>
    );
};

export default GenericPlayerTrackList;
