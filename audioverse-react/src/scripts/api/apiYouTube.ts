// apiYouTube.ts — YouTube subscriptions management
import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";

// === Types ===

/** YouTube subscription item */
export interface YouTubeSubscriptionDto {
    subscriptionId: string;
    channelId: string;
    title: string;
    description: string | null;
    thumbnailUrl: string | null;
    publishedAt: string | null;
}

/** Paginated YouTube subscriptions response */
export interface YouTubeSubscriptionsResponse {
    items: YouTubeSubscriptionDto[];
    nextPageToken: string | null;
    totalResults: number | null;
}

// === Base path ===
export const YOUTUBE_BASE = "/api/platforms/youtube";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const YOUTUBE_QK = {
    subscriptions: (pageToken?: string | null, maxResults?: number) =>
        ["youtube", "subscriptions", { pageToken, maxResults }] as const,
};

// ── Endpoints ──────────────────────────────────────────────────────

/** @internal GET /api/platforms/youtube/subscriptions?maxResults=&pageToken= */
export const fetchSubscriptions = async (
    maxResults = 50,
    pageToken?: string | null,
): Promise<YouTubeSubscriptionsResponse> => {
    const { data } = await apiClient.get<YouTubeSubscriptionsResponse>(
        apiPath(YOUTUBE_BASE, "/subscriptions"),
        { params: { maxResults, pageToken: pageToken ?? undefined } },
    );
    return data;
};

/** @internal DELETE /api/platforms/youtube/subscriptions/by-channel/{channelId} */
export const deleteSubscriptionByChannel = async (channelId: string): Promise<boolean> => {
    const resp = await apiClient.delete(
        apiPath(YOUTUBE_BASE, `/subscriptions/by-channel/${encodeURIComponent(channelId)}`),
        { validateStatus: (s) => s === 204 || s === 404 },
    );
    return resp.status === 204;
};

// === React Query Hooks ===

export const useYouTubeSubscriptionsQuery = (
    maxResults = 50,
    pageToken?: string | null,
    enabled = true,
) =>
    useQuery({
        queryKey: YOUTUBE_QK.subscriptions(pageToken, maxResults),
        queryFn: () => fetchSubscriptions(maxResults, pageToken),
        enabled,
        placeholderData: keepPreviousData,
    });

// ── Mutations ─────────────────────────────────────────────────────

export const useUnsubscribeByChannelMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (channelId: string) => deleteSubscriptionByChannel(channelId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["youtube", "subscriptions"] }),
    });
};

export default {
    fetchSubscriptions,
    deleteSubscriptionByChannel,
};
