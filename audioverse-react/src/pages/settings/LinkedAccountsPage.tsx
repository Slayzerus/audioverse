import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Focusable } from "../../components/common/Focusable";
import {
    useLinkedAccountsQuery,
    useUnlinkPlatformMutation,
    useSpotifyAuthUrlQuery,
    useTidalAuthUrlQuery,
} from "../../scripts/api/apiPlatforms";
import type { ExternalAccountDto, PlatformName } from "../../models/modelsPlatforms";

/** Icons per platform (emoji fallback) */
const platformIcons: Record<string, string> = {
    spotify: "🟢",
    tidal: "🔵",
    youtube: "🔴",
    twitch: "🟣",
    google: "🔷",
    microsoft: "🟦",
    discord: "💬",
};

const LinkedAccountsPage: React.FC = () => {
    const { t } = useTranslation();
    const { data: accounts, isLoading, error } = useLinkedAccountsQuery();
    const unlinkMutation = useUnlinkPlatformMutation();

    // Build redirect URIs for OAuth flows
    const spotifyRedirect = `${window.location.origin}/spotifyCallback`;
    const tidalRedirect = `${window.location.origin}/tidalCallback`;

    const { data: spotifyAuth } = useSpotifyAuthUrlQuery(spotifyRedirect);
    const { data: tidalAuth } = useTidalAuthUrlQuery(tidalRedirect);

    const handleLink = useCallback((platform: PlatformName) => {
        if (platform === "spotify" && spotifyAuth?.url) {
            window.location.href = spotifyAuth.url;
        } else if (platform === "tidal" && tidalAuth?.url) {
            window.location.href = tidalAuth.url;
        }
    }, [spotifyAuth, tidalAuth]);

    const handleUnlink = useCallback((platform: PlatformName) => {
        if (window.confirm(t("linkedAccounts.unlinkConfirm", { platform }))) {
            unlinkMutation.mutate(platform);
        }
    }, [unlinkMutation, t]);

    const isLinked = (platform: PlatformName): ExternalAccountDto | undefined =>
        accounts?.find(a => a.platform === platform);

    const linkablePlatforms: PlatformName[] = ["spotify", "tidal"];

    return (
        <div style={{ maxWidth: 720, margin: "32px auto", padding: "0 16px" }}>
            <h1 style={{ textAlign: "center" }}>
                {t("linkedAccounts.title", "Linked Accounts")}
            </h1>
            <p className="text-muted text-center mb-4">
                {t("linkedAccounts.subtitle", "Connect your music streaming accounts for integrated playback.")}
            </p>

            {isLoading && <p className="text-center">{t("common.loading", "Loading…")}</p>}
            {error && (
                <div className="alert alert-danger">
                    {t("linkedAccounts.loadError", "Failed to load linked accounts.")}
                </div>
            )}

            {/* ── Linkable platforms ─────────────────────────────── */}
            <div className="d-flex flex-column gap-3">
                {linkablePlatforms.map(platform => {
                    const account = isLinked(platform);
                    return (
                        <Focusable key={platform} id={`linked-${platform}`} highlightMode="glow">
                            <div className="card" style={{ borderLeft: account ? "4px solid var(--bs-success)" : "4px solid var(--bs-secondary)" }}>
                                <div className="card-body d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center gap-3">
                                        <span style={{ fontSize: 28 }}>{platformIcons[platform] ?? "🔗"}</span>
                                        <div>
                                            <h5 className="mb-0" style={{ textTransform: "capitalize" }}>{platform}</h5>
                                            {account ? (
                                                <small className="text-muted">
                                                    {account.displayName ?? account.email ?? account.externalId}
                                                    {account.linkedAt && (
                                                        <> · {t("linkedAccounts.linkedAt", "Linked")} {new Date(account.linkedAt).toLocaleDateString()}</>
                                                    )}
                                                </small>
                                            ) : (
                                                <small className="text-muted">
                                                    {t("linkedAccounts.notLinked", "Not connected")}
                                                </small>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        {account ? (
                                            <Focusable id={`unlink-${platform}`} highlightMode="glow">
                                                <button
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={() => handleUnlink(platform)}
                                                    disabled={unlinkMutation.isPending}
                                                >
                                                    {t("linkedAccounts.unlink", "Unlink")}
                                                </button>
                                            </Focusable>
                                        ) : (
                                            <Focusable id={`link-${platform}`} highlightMode="glow">
                                                <button
                                                    className="btn btn-outline-primary btn-sm"
                                                    onClick={() => handleLink(platform)}
                                                >
                                                    {t("linkedAccounts.link", "Connect")}
                                                </button>
                                            </Focusable>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Focusable>
                    );
                })}
            </div>

            {/* ── Other linked accounts (read-only) ──────────────── */}
            {accounts && accounts.filter(a => !linkablePlatforms.includes(a.platform)).length > 0 && (
                <div className="mt-4">
                    <h5>{t("linkedAccounts.otherAccounts", "Other Accounts")}</h5>
                    <div className="d-flex flex-column gap-2">
                        {accounts
                            .filter(a => !linkablePlatforms.includes(a.platform))
                            .map(account => (
                                <div key={account.platform} className="card">
                                    <div className="card-body d-flex align-items-center gap-3 py-2">
                                        <span style={{ fontSize: 22 }}>{platformIcons[account.platform] ?? "🔗"}</span>
                                        <div>
                                            <strong style={{ textTransform: "capitalize" }}>{account.platform}</strong>
                                            <small className="ms-2 text-muted">
                                                {account.displayName ?? account.email ?? account.externalId}
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LinkedAccountsPage;
