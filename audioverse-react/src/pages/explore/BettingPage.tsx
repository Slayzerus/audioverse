// BettingPage.tsx — Betting markets, place bets, wallet, history
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    useBettingMarketsQuery,
    useBettingMarketQuery,
    useUserBetHistoryQuery,
    useUserWalletQuery,
    useCreateMarketMutation,
    useAddOptionMutation,
    usePlaceBetMutation,
    useResolveMarketMutation,
} from "../../scripts/api/apiBetting";
import { useUser } from "../../contexts/UserContext";
import type { BettingMarketType } from "../../models/modelsKaraoke";

const cardStyle: React.CSSProperties = { background: "var(--card-bg, #23272f)", borderRadius: 12, padding: 20, border: "1px solid var(--border-primary, rgba(255,255,255,0.08))" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-primary, rgba(255,255,255,0.15))", background: "var(--bg-primary, #1a1d23)", color: "var(--text-primary, #fff)", fontSize: 14 };
const btn = (v: "pri" | "sec" | "dan" | "suc"): React.CSSProperties => ({ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#fff", background: v === "pri" ? "var(--accent, #5865F2)" : v === "dan" ? "#e53935" : v === "suc" ? "#66bb6a" : "var(--bg-secondary, #2c2f36)" });

const MARKET_TYPE: Record<number, string> = { 0: "Win/Lose", 1: "Over/Under", 2: "Prop", 99: "Custom" };

const BettingPage: React.FC = () => {
    const { t } = useTranslation();
    const { userId: rawUserId } = useUser();
    const userId = rawUserId ?? NaN;

    const [eventId, setEventId] = useState(0);
    const [selectedMarketId, setSelectedMarketId] = useState<number | null>(null);
    const [tab, setTab] = useState<"markets" | "history" | "wallet">("markets");
    const [betAmount, setBetAmount] = useState(10);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    const { data: markets = [], isLoading } = useBettingMarketsQuery(eventId);
    const { data: _marketDetail } = useBettingMarketQuery(selectedMarketId ?? NaN);
    const { data: betHistory = [] } = useUserBetHistoryQuery(userId);
    const { data: wallet } = useUserWalletQuery(userId);

    const placeBetMut = usePlaceBetMutation();
    const resolveMut = useResolveMarketMutation();
    const createMut = useCreateMarketMutation();
    const addOptMut = useAddOptionMutation();

    const handlePlaceBet = () => {
        if (selectedMarketId && selectedOption && betAmount > 0) {
            placeBetMut.mutate({ marketId: selectedMarketId, optionId: selectedOption, amount: betAmount });
            setSelectedOption(null);
        }
    };

    const tabBtn = (active: boolean): React.CSSProperties => ({
        padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14,
        background: active ? "var(--accent, #5865F2)" : "var(--bg-secondary, #2c2f36)",
        color: active ? "#fff" : "var(--text-secondary, #aaa)",
    });

    return (
        <div style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h2 style={{ color: "var(--text-primary)", fontWeight: 800, margin: 0 }}>
                    🎰 {t("betting.title", "Betting")}
                </h2>
                {wallet && (
                    <div style={{ ...cardStyle, padding: "8px 16px", display: "flex", gap: 16, fontSize: 13 }}>
                        <span style={{ color: "var(--text-secondary)" }}>{t("betting.balance", "Balance")}:</span>
                        <span style={{ fontWeight: 700, color: "var(--accent)" }}>{wallet.balance?.toLocaleString() ?? 0}</span>
                        <span style={{ color: "var(--text-secondary)" }}>Won: {wallet.totalWon?.toLocaleString() ?? 0}</span>
                    </div>
                )}
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
                <button style={tabBtn(tab === "markets")} onClick={() => setTab("markets")}>{t("betting.markets", "Markets")}</button>
                <button style={tabBtn(tab === "history")} onClick={() => setTab("history")}>{t("betting.history", "My Bets")}</button>
                <button style={tabBtn(tab === "wallet")} onClick={() => setTab("wallet")}>{t("betting.wallet", "Wallet")}</button>
                <div style={{ flex: 1 }} />
                <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Event ID:</label>
                <input style={{ ...inputStyle, width: 80 }} type="number" min={0} value={eventId} onChange={(e) => setEventId(Number(e.target.value))} />
            </div>

            {/* ══════ MARKETS ══════ */}
            {tab === "markets" && (
                <div>
                    {isLoading ? (
                        <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: 20 }}>Loading…</p>
                    ) : markets.length === 0 ? (
                        <div style={{ ...cardStyle, textAlign: "center", padding: 30 }}>
                            <p style={{ color: "var(--text-secondary)" }}>{t("betting.noMarkets", "No betting markets for this event.")}</p>
                            <button style={btn("pri")} onClick={() => {
                                const title = prompt("Market title");
                                if (title) createMut.mutate({ title, eventId, type: 0 as BettingMarketType, isOpen: true });
                            }}>+ {t("betting.createMarket", "Create Market")}</button>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gap: 12 }}>
                            {markets.map((m) => (
                                <div key={m.id} style={{ ...cardStyle, cursor: "pointer", outline: selectedMarketId === m.id ? "2px solid var(--accent)" : undefined }} onClick={() => setSelectedMarketId(m.id)}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>{m.title}</div>
                                            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                                                {MARKET_TYPE[m.type] ?? "?"} · {m.isOpen ? "🟢 Open" : "🔴 Closed"}
                                                {m.resolvedAt && ` · Resolved ${new Date(m.resolvedAt).toLocaleDateString()}`}
                                            </div>
                                        </div>
                                        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{(m.options ?? []).length} options</span>
                                    </div>

                                    {selectedMarketId === m.id && (
                                        <div style={{ marginTop: 16 }}>
                                            {(m.options ?? []).length === 0 ? (
                                                <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>No options yet.</p>
                                            ) : (
                                                <div style={{ display: "grid", gap: 6 }}>
                                                    {(m.options ?? []).map((opt) => (
                                                        <div
                                                            key={opt.id}
                                                            onClick={(e) => { e.stopPropagation(); setSelectedOption(opt.id); }}
                                                            style={{
                                                                padding: "10px 14px", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer",
                                                                background: selectedOption === opt.id ? "rgba(88,101,242,0.15)" : "var(--bg-primary)",
                                                                border: selectedOption === opt.id ? "1px solid var(--accent)" : "1px solid transparent",
                                                            }}
                                                        >
                                                            <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{opt.label}</span>
                                                            <span style={{ fontWeight: 700, color: "var(--accent)", fontSize: 14 }}>×{opt.odds.toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {m.isOpen && selectedOption && (
                                                <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
                                                    <input style={{ ...inputStyle, width: 100 }} type="number" min={1} value={betAmount} onChange={(e) => setBetAmount(Number(e.target.value))} />
                                                    <button style={btn("suc")} onClick={handlePlaceBet} disabled={placeBetMut.isPending}>
                                                        {t("betting.placeBet", "Place Bet")}
                                                    </button>
                                                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                                                        Payout: {(betAmount * ((m.options ?? []).find((o) => o.id === selectedOption)?.odds ?? 1)).toFixed(0)}
                                                    </span>
                                                </div>
                                            )}

                                            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                                                <button style={btn("sec")} onClick={(e) => { e.stopPropagation(); const l = prompt("Option label"); if (l) addOptMut.mutate({ marketId: m.id, payload: { label: l, odds: 2.0 } }); }}>
                                                    + Option
                                                </button>
                                                {m.isOpen && (
                                                    <button style={btn("dan")} onClick={(e) => { e.stopPropagation(); const wId = Number(prompt("Winning option ID")); if (wId) resolveMut.mutate({ marketId: m.id, winningOptionId: wId }); }}>
                                                        Resolve
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ══════ HISTORY ══════ */}
            {tab === "history" && (
                <div style={cardStyle}>
                    <h4 style={{ color: "var(--text-primary)", fontWeight: 700, marginTop: 0 }}>{t("betting.myBets", "My Bet History")}</h4>
                    {!Number.isFinite(userId) ? (
                        <p style={{ color: "var(--text-secondary)" }}>{t("betting.loginRequired", "Log in to see your bets.")}</p>
                    ) : betHistory.length === 0 ? (
                        <p style={{ color: "var(--text-secondary)" }}>{t("betting.noBets", "No bets placed yet.")}</p>
                    ) : (
                        <div>
                            {betHistory.map((b, i) => (
                                <div key={b.id ?? i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center" }}>
                                    <div>
                                        <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>Market #{b.marketId} · Option #{b.optionId}</div>
                                        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{new Date(b.placedAt).toLocaleString()}</div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{b.amount.toLocaleString()} bet</div>
                                        <div style={{ fontSize: 12, color: b.won === true ? "#66bb6a" : b.won === false ? "#e53935" : "var(--text-secondary)" }}>
                                            {b.won === true ? `Won ${b.actualPayout.toLocaleString()}` : b.won === false ? "Lost" : `Pending (${b.potentialPayout.toLocaleString()})`}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ══════ WALLET ══════ */}
            {tab === "wallet" && (
                <div style={cardStyle}>
                    <h4 style={{ color: "var(--text-primary)", fontWeight: 700, marginTop: 0 }}>{t("betting.walletTitle", "My Wallet")}</h4>
                    {!Number.isFinite(userId) || !wallet ? (
                        <p style={{ color: "var(--text-secondary)" }}>{t("betting.loginRequired", "Log in to see your wallet.")}</p>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                            {[
                                { label: t("betting.balance", "Balance"), value: wallet.balance, color: "var(--accent)" },
                                { label: t("betting.totalWagered", "Total Wagered"), value: wallet.totalWagered, color: "var(--text-primary)" },
                                { label: t("betting.totalWon", "Total Won"), value: wallet.totalWon, color: "#66bb6a" },
                            ].map(({ label, value, color }) => (
                                <div key={label} style={{ textAlign: "center", padding: 20, background: "var(--bg-primary)", borderRadius: 8 }}>
                                    <div style={{ fontSize: 28, fontWeight: 800, color }}>{(value ?? 0).toLocaleString()}</div>
                                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>{label}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BettingPage;
