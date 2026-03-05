// KaraokeRankingPage.tsx — Global karaoke leaderboard + personal history + activity chart
import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useRankingQuery, useUserHistoryQuery, useActivityQuery } from "../../scripts/api/apiKaraoke";
import { useUser } from "../../contexts/UserContext";
import css from './KaraokeRankingPage.module.css';

type Tab = "ranking" | "history" | "activity";

const KaraokeRankingPage: React.FC = () => {
    const { t } = useTranslation();
    const { userId: rawUserId } = useUser();
    const userId = rawUserId ?? NaN;

    const [tab, setTab] = useState<Tab>("ranking");
    const [topN, setTopN] = useState(20);
    const [historyTake, setHistoryTake] = useState(20);
    const [activityDays, setActivityDays] = useState(30);

    const { data: ranking = [], isLoading: rankingLoading } = useRankingQuery(topN);
    const { data: history = [], isLoading: historyLoading } = useUserHistoryQuery(userId, historyTake);
    const { data: activity = [], isLoading: activityLoading } = useActivityQuery(activityDays);

    /* ── derived stats ── */
    const myRank = useMemo(() => {
        if (!Number.isFinite(userId)) return null;
        const idx = ranking.findIndex((r) => r.userId === userId);
        return idx >= 0 ? idx + 1 : null;
    }, [ranking, userId]);

    const maxScore = useMemo(() => Math.max(1, ...ranking.map((r) => r.totalScore)), [ranking]);

    const activityMax = useMemo(() => Math.max(1, ...activity.map((a) => a.songsSung)), [activity]);

    return (
        <div className={css.page}>
            <h2 className={css.pageTitle}>
                🏆 {t("ranking.title", "Karaoke Ranking")}
            </h2>
            {myRank && (
                <p className={css.myRank}>
                    {t("ranking.yourRank", "Your rank")}: #{myRank}
                </p>
            )}

            {/* ── Tab bar ── */}
            <div className={css.tabBar}>
                <button className={tab === "ranking" ? css.tabBtnActive : css.tabBtn} onClick={() => setTab("ranking")}>
                    {t("ranking.tabRanking", "Leaderboard")}
                </button>
                <button className={tab === "history" ? css.tabBtnActive : css.tabBtn} onClick={() => setTab("history")}>
                    {t("ranking.tabHistory", "My History")}
                </button>
                <button className={tab === "activity" ? css.tabBtnActive : css.tabBtn} onClick={() => setTab("activity")}>
                    {t("ranking.tabActivity", "Activity")}
                </button>
            </div>

            {/* ════════════════ LEADERBOARD ════════════════ */}
            {tab === "ranking" && (
                <div className={css.card}>
                    <div className={css.sectionHeader}>
                        <h4 className={css.sectionTitle}>
                            {t("ranking.top", "Top {{n}} Singers", { n: topN })}
                        </h4>
                        <select
                            value={topN}
                            onChange={(e) => setTopN(Number(e.target.value))}
                            className={css.select}
                        >
                            {[10, 20, 50, 100].map((n) => (
                                <option key={n} value={n}>Top {n}</option>
                            ))}
                        </select>
                    </div>

                    {rankingLoading ? (
                        <p className={css.emptyMessage}>Loading…</p>
                    ) : ranking.length === 0 ? (
                        <p className={css.emptyMessage}>
                            {t("ranking.noData", "No ranking data yet.")}
                        </p>
                    ) : (
                        <div>
                            {/* Header */}
                            <div className={css.rankingHeader}>
                                <span>#</span>
                                <span>{t("ranking.player", "Player")}</span>
                                <span className={css.textRight}>{t("ranking.totalScore", "Total")}</span>
                                <span className={css.textRight}>{t("ranking.songsSung", "Songs")}</span>
                                <span className={css.textRight}>{t("ranking.bestScore", "Best")}</span>
                                <span></span>
                            </div>
                            {ranking.map((entry, i) => {
                                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
                                const pct = (entry.totalScore / maxScore) * 100;
                                const isMe = Number.isFinite(userId) && entry.userId === userId;
                                return (
                                    <div
                                        key={entry.userId}
                                        className={isMe ? css.rankingRowMe : css.rankingRow}
                                    >
                                        <span className={css.medal} style={{ fontSize: i < 3 ? 20 : 14 }}>{medal}</span>
                                        <span className={isMe ? css.usernameMe : css.username}>
                                            {entry.username}
                                        </span>
                                        <span className={css.scoreCell}>
                                            {entry.totalScore.toLocaleString()}
                                        </span>
                                        <span className={css.statCell}>
                                            {entry.songsSung}
                                        </span>
                                        <span className={css.statCell}>
                                            {entry.bestScore.toLocaleString()}
                                        </span>
                                        <div className={css.progressBar}>
                                            <div style={{
                                                height: "100%",
                                                width: `${pct}%`,
                                                borderRadius: 5,
                                                background: i === 0 ? "#ffa726" : i === 1 ? "#bdbdbd" : i === 2 ? "#cd7f32" : "var(--accent, #5865F2)",
                                                transition: "width .6s ease",
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ════════════════ HISTORY ════════════════ */}
            {tab === "history" && (
                <div className={css.card}>
                    <div className={css.sectionHeader}>
                        <h4 className={css.sectionTitle}>
                            {t("ranking.myHistory", "My Singing History")}
                        </h4>
                        <select
                            value={historyTake}
                            onChange={(e) => setHistoryTake(Number(e.target.value))}
                            className={css.select}
                        >
                            {[10, 20, 50].map((n) => (
                                <option key={n} value={n}>{t("ranking.last", "Last {{n}}", { n })}</option>
                            ))}
                        </select>
                    </div>

                    {!Number.isFinite(userId) ? (
                        <p className={css.emptyMessage}>
                            {t("ranking.loginRequired", "Log in to see your history.")}
                        </p>
                    ) : historyLoading ? (
                        <p className={css.emptyMessage}>Loading…</p>
                    ) : history.length === 0 ? (
                        <p className={css.emptyMessage}>
                            {t("ranking.noHistory", "No singing history yet. Time to sing! 🎤")}
                        </p>
                    ) : (
                        <div>
                            {/* Header */}
                            <div className={css.historyHeader}>
                                <span>{t("ranking.song", "Song")}</span>
                                <span className={css.textRight}>{t("ranking.score", "Score")}</span>
                                <span className={css.textRight}>{t("ranking.date", "Date")}</span>
                            </div>
                            {history.map((h, i) => (
                                <div
                                    key={h.singingId ?? i}
                                    className={css.historyRow}
                                >
                                    <span className={css.songTitle}>🎵 {h.songTitle}</span>
                                    <span className={css.historyScore} style={{ color: h.score >= 8000 ? "#66bb6a" : h.score >= 5000 ? "#ffa726" : "var(--text-primary)" }}>
                                        {h.score.toLocaleString()}
                                    </span>
                                    <span className={css.dateCell}>
                                        {new Date(h.performedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ════════════════ ACTIVITY ════════════════ */}
            {tab === "activity" && (
                <div className={css.card}>
                    <div className={css.sectionHeader}>
                        <h4 className={css.sectionTitle}>
                            {t("ranking.activity", "Singing Activity")}
                        </h4>
                        <select
                            value={activityDays}
                            onChange={(e) => setActivityDays(Number(e.target.value))}
                            className={css.select}
                        >
                            {[7, 14, 30, 60, 90].map((d) => (
                                <option key={d} value={d}>{d} {t("ranking.days", "days")}</option>
                            ))}
                        </select>
                    </div>

                    {!Number.isFinite(userId) ? (
                        <p className={css.emptyMessage}>
                            {t("ranking.loginRequired", "Log in to see your activity.")}
                        </p>
                    ) : activityLoading ? (
                        <p className={css.emptyMessage}>Loading…</p>
                    ) : activity.length === 0 ? (
                        <p className={css.emptyMessage}>
                            {t("ranking.noActivity", "No activity data for this period.")}
                        </p>
                    ) : (
                        <>
                            {/* Simple bar chart */}
                            <div className={css.barChart}>
                                {activity.map((a, i) => {
                                    const h = Math.max(4, (a.songsSung / activityMax) * 150);
                                    const dayLabel = new Date(a.date).toLocaleDateString(undefined, { day: "numeric", month: "short" });
                                    return (
                                        <div
                                            key={i}
                                            title={`${dayLabel}: ${a.songsSung} songs, ${a.totalScore.toLocaleString()} pts`}
                                            className={css.activityBar}
                                            style={{ height: h }}
                                        />
                                    );
                                })}
                            </div>
                            {/* Legend */}
                            <div className={css.legend}>
                                <span>{new Date(activity[0]?.date).toLocaleDateString()}</span>
                                <span>{t("ranking.songsPerDay", "Songs per day")}</span>
                                <span>{new Date(activity[activity.length - 1]?.date).toLocaleDateString()}</span>
                            </div>

                            {/* Summary stats */}
                            <div className={css.statsGrid}>
                                {[
                                    { label: t("ranking.totalSongs", "Total Songs"), value: activity.reduce((s, a) => s + a.songsSung, 0) },
                                    { label: t("ranking.totalPoints", "Total Points"), value: activity.reduce((s, a) => s + a.totalScore, 0) },
                                    { label: t("ranking.avgPerDay", "Avg / Day"), value: Math.round(activity.reduce((s, a) => s + a.songsSung, 0) / Math.max(1, activity.length)) },
                                ].map(({ label, value }) => (
                                    <div key={label} className={css.statCard}>
                                        <div className={css.statValue}>{value.toLocaleString()}</div>
                                        <div className={css.statLabel}>{label}</div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default KaraokeRankingPage;
