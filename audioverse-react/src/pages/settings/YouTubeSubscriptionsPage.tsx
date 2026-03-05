import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Focusable } from "../../components/common/Focusable";
import {
    useYouTubeSubscriptionsQuery,
    useUnsubscribeByChannelMutation,
} from "../../scripts/api/apiYouTube";
import type { YouTubeSubscriptionDto } from "../../scripts/api/apiYouTube";

const YouTubeSubscriptionsPage: React.FC = () => {
    const { t } = useTranslation();
    const [pageToken, setPageToken] = useState<string | null>(null);
    const [pageTokenStack, setPageTokenStack] = useState<(string | null)[]>([]);

    const { data, isLoading, isFetching } = useYouTubeSubscriptionsQuery(50, pageToken);
    const unsubMut = useUnsubscribeByChannelMutation();

    const handleNext = () => {
        if (data?.nextPageToken) {
            setPageTokenStack((prev) => [...prev, pageToken]);
            setPageToken(data.nextPageToken);
        }
    };

    const handlePrev = () => {
        setPageTokenStack((prev) => {
            const copy = [...prev];
            const prevToken = copy.pop() ?? null;
            setPageToken(prevToken);
            return copy;
        });
    };

    const handleUnsubscribe = (sub: YouTubeSubscriptionDto) => {
        if (!confirm(t("youtubeSubs.confirmUnsubscribe", "Unsubscribe from {{title}}?", { title: sub.title }))) {
            return;
        }
        unsubMut.mutate(sub.channelId);
    };

    return (
        <div className="container py-4">
            <h2>📺 {t("youtubeSubs.title", "YouTube Subscriptions")}</h2>
            <p className="text-muted mb-4">
                {t("youtubeSubs.subtitle", "Manage your YouTube channel subscriptions.")}
            </p>

            {isLoading ? (
                <div className="text-center py-5">
                    <div className="spinner-border" />
                </div>
            ) : !data || data.items.length === 0 ? (
                <p className="text-muted">
                    {t("youtubeSubs.empty", "No subscriptions found. Make sure your YouTube account is linked.")}
                </p>
            ) : (
                <>
                    {data.totalResults != null && (
                        <p className="text-muted mb-3">
                            {t("youtubeSubs.total", "Total subscriptions: {{count}}", {
                                count: data.totalResults,
                            })}
                        </p>
                    )}

                    <div className="row g-3">
                        {data.items.map((sub) => (
                            <div key={sub.subscriptionId} className="col-12 col-sm-6 col-lg-4">
                                <div className="card h-100">
                                    <div className="card-body d-flex">
                                        {sub.thumbnailUrl && (
                                            <img
                                                src={sub.thumbnailUrl}
                                                alt={sub.title || t('youtube.channelAvatar', 'Channel avatar')}
                                                className="rounded-circle me-3 flex-shrink-0"
                                                style={{ width: 48, height: 48, objectFit: "cover" }}
                                            />
                                        )}
                                        <div className="flex-grow-1 overflow-hidden">
                                            <h6 className="mb-1 text-truncate">
                                                <a
                                                    href={`https://www.youtube.com/channel/${sub.channelId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    {sub.title}
                                                </a>
                                            </h6>
                                            {sub.description && (
                                                <p
                                                    className="small text-muted mb-1"
                                                    style={{
                                                        display: "-webkit-box",
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: "vertical",
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    {sub.description}
                                                </p>
                                            )}
                                            <Focusable id={`yt-unsub-${sub.channelId}`}>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleUnsubscribe(sub)}
                                                    disabled={unsubMut.isPending}
                                                >
                                                    {t("youtubeSubs.unsubscribe", "Unsubscribe")}
                                                </button>
                                            </Focusable>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="d-flex justify-content-center gap-3 mt-4">
                        <Focusable id="yt-subs-prev">
                            <button
                                className="btn btn-outline-secondary"
                                disabled={pageTokenStack.length === 0}
                                onClick={handlePrev}
                            >
                                ‹ {t("news.prev", "Previous")}
                            </button>
                        </Focusable>
                        <Focusable id="yt-subs-next">
                            <button
                                className="btn btn-outline-secondary"
                                disabled={!data.nextPageToken}
                                onClick={handleNext}
                            >
                                {t("news.next", "Next")} ›
                            </button>
                        </Focusable>
                    </div>

                    {isFetching && !isLoading && (
                        <div className="text-center mt-2">
                            <small className="text-muted">{t("common.loading", "Loading…")}</small>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default YouTubeSubscriptionsPage;
