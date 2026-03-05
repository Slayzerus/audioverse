import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Focusable } from "../../components/common/Focusable";

const CARDS: { id: string; icon: string; to: string; color: string }[] = [
    { id: "parties", icon: "🎉", to: "/parties", color: "var(--nav-parties, #7c4dff)" },
    { id: "join", icon: "📱", to: "/join", color: "var(--nav-join, #9c27b0)" },
    { id: "songs", icon: "🎵", to: "/songs", color: "var(--nav-songs, #00bcd4)" },
    { id: "rounds", icon: "🎤", to: "/rounds", color: "var(--nav-rounds, #ff5722)" },
    { id: "karaokePlaylists", icon: "📋", to: "/karaoke-playlists", color: "var(--nav-karaoke-playlists, #ffc107)" },
    { id: "dance", icon: "💃", to: "/dance", color: "var(--nav-dance, #e91e63)" },
    { id: "hitThatNote", icon: "🎯", to: "/hit-that-note", color: "var(--nav-hitThatNote, #ff6b6b)" },
    { id: "songMiniGames", icon: "🧩", to: "/mini-games/song", color: "var(--nav-songMiniGames, #26c6da)" },
    { id: "jamSession", icon: "🥁", to: "/jam-session", color: "var(--nav-jamSession, #ff9800)" },
    { id: "features", icon: "⭐", to: "/features", color: "var(--nav-features, #4caf50)" },
];

const cardStyle = (color: string): React.CSSProperties => ({
    background: `linear-gradient(135deg, var(--card-bg1, ${color}22), var(--card-bg2, ${color}44))`,
    border: `1.5px solid var(--card-border, ${color}88)`,
    borderRadius: 16,
    padding: "28px 24px",
    textDecoration: "none",
    color: "var(--text-primary)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    transition: "transform 0.15s, box-shadow 0.15s",
    cursor: "pointer",
    minHeight: 140,
});

const PlayPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 16px" }}>
            <h1 style={{ textAlign: "center", marginBottom: 8, fontSize: 36, fontWeight: 700 }}>
                <span style={{ color: "var(--accent, #3b82f6)" }}>{t("nav.play")}</span> {t("playHub.hub")}
            </h1>
            <p style={{ textAlign: "center", color: "var(--text-secondary)", marginBottom: 32, fontSize: 16 }}>
                {t("playHub.subtitle")}
            </p>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: 20,
                }}
            >
                {CARDS.map((card) => (
                    <Focusable key={card.to} id={`play-card-${card.id}`} highlightMode="glow">
                    <Link
                        to={card.to}
                        style={{
                            ...cardStyle(card.color),
                            '--card-bg1': `var(--card-${card.id}-bg1, ${card.color}22)`,
                            '--card-bg2': `var(--card-${card.id}-bg2, ${card.color}44)`,
                            '--card-border': `var(--card-${card.id}-border, ${card.color}88)`,
                            '--card-color': `var(--card-${card.id}-color, ${card.color})`,
                        } as React.CSSProperties}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                            (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px var(--card-border)';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.transform = "";
                            (e.currentTarget as HTMLElement).style.boxShadow = "";
                        }}
                    >
                        <span style={{ fontSize: 36 }}>{card.icon}</span>
                        <span style={{ fontSize: 20, fontWeight: 600 }}>{t(`playHub.cards.${card.id}.title`)}</span>
                        <span style={{ fontSize: 13, opacity: 0.8 }}>{t(`playHub.cards.${card.id}.description`)}</span>
                    </Link>
                    </Focusable>
                ))}
            </div>
        </div>
    );
};

export default PlayPage;
