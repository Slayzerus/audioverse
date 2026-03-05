// apiPlatforms.ts — External platform accounts, OAuth linking, and streaming
import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type {
    ExternalAccountDto,
    AuthUrlResponse,
    PlatformLinkRequest,
    PlatformName,
    SpotifyPlayRequest,
    TidalPlayResponse,
} from "../../models/modelsPlatforms";

// === Base path ===
export const PLATFORMS_BASE = "/api/platforms";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const PLATFORMS_QK = {
    accounts: () => ["platforms", "accounts"] as const,
    platform: (p: PlatformName) => ["platforms", p] as const,
    spotifyAuthUrl: (redirectUri: string) => ["platforms", "spotify", "auth-url", redirectUri] as const,
    spotifyToken: () => ["platforms", "spotify", "token"] as const,
    tidalAuthUrl: (redirectUri: string) => ["platforms", "tidal", "auth-url", redirectUri] as const,
    tidalPlay: (trackId: string) => ["platforms", "tidal", "play", trackId] as const,
};

// ── Accounts ──────────────────────────────────────────────────────

/** @internal GET /api/platforms/accounts — list all linked external accounts */
export const fetchLinkedAccounts = async (): Promise<ExternalAccountDto[]> => {
    const { data } = await apiClient.get<ExternalAccountDto[]>(apiPath(PLATFORMS_BASE, "/accounts"));
    return data ?? [];
};

/** @internal GET /api/platforms/{platform} — details for one platform */
export const fetchPlatformDetails = async (platform: PlatformName): Promise<ExternalAccountDto> => {
    const { data } = await apiClient.get<ExternalAccountDto>(
        apiPath(PLATFORMS_BASE, `/${encodeURIComponent(platform)}`),
    );
    return data;
};

/** @internal DELETE /api/platforms/{platform} — unlink a platform */
export const deletePlatformLink = async (platform: PlatformName): Promise<void> => {
    await apiClient.delete(apiPath(PLATFORMS_BASE, `/${encodeURIComponent(platform)}`));
};

// ── Spotify OAuth & Playback ──────────────────────────────────────

/** @internal GET /api/platforms/spotify/auth-url?redirectUri=... */
export const fetchSpotifyAuthUrl = async (redirectUri: string): Promise<AuthUrlResponse> => {
    const { data } = await apiClient.get<AuthUrlResponse>(apiPath(PLATFORMS_BASE, "/spotify/auth-url"), {
        params: { redirectUri },
    });
    return data;
};

/** @internal POST /api/platforms/spotify/link — exchange code for linked account */
export const postSpotifyLink = async (body: PlatformLinkRequest): Promise<void> => {
    await apiClient.post(apiPath(PLATFORMS_BASE, "/spotify/link"), body);
};

/** @internal POST /api/platforms/spotify/refresh — refresh Spotify access token */
export const postSpotifyRefresh = async (): Promise<void> => {
    await apiClient.post(apiPath(PLATFORMS_BASE, "/spotify/refresh"));
};

/** @internal GET /api/platforms/spotify/token — get fresh access token for Web Playback SDK */
export const fetchSpotifyToken = async (): Promise<string> => {
    const { data } = await apiClient.get<string>(apiPath(PLATFORMS_BASE, "/spotify/token"));
    return data;
};

/** @internal POST /api/platforms/spotify/play — start playback via Spotify Connect */
export const postSpotifyPlay = async (body: SpotifyPlayRequest): Promise<void> => {
    await apiClient.post(apiPath(PLATFORMS_BASE, "/spotify/play"), body);
};

// ── Tidal OAuth & Streaming ──────────────────────────────────────

/** @internal GET /api/platforms/tidal/auth-url?redirectUri=... */
export const fetchTidalAuthUrl = async (redirectUri: string): Promise<AuthUrlResponse> => {
    const { data } = await apiClient.get<AuthUrlResponse>(apiPath(PLATFORMS_BASE, "/tidal/auth-url"), {
        params: { redirectUri },
    });
    return data;
};

/** @internal POST /api/platforms/tidal/link — exchange code for linked account */
export const postTidalLink = async (body: PlatformLinkRequest): Promise<void> => {
    await apiClient.post(apiPath(PLATFORMS_BASE, "/tidal/link"), body);
};

/** @internal POST /api/platforms/tidal/refresh — refresh Tidal access token */
export const postTidalRefresh = async (): Promise<void> => {
    await apiClient.post(apiPath(PLATFORMS_BASE, "/tidal/refresh"));
};

/** @internal GET /api/platforms/tidal/play?trackId=... — get HLS stream URL */
export const fetchTidalPlayUrl = async (trackId: string): Promise<TidalPlayResponse> => {
    const { data } = await apiClient.get<TidalPlayResponse>(apiPath(PLATFORMS_BASE, "/tidal/play"), {
        params: { trackId },
    });
    return data;
};

// === React Query Hooks ===

export const useLinkedAccountsQuery = () =>
    useQuery({
        queryKey: PLATFORMS_QK.accounts(),
        queryFn: fetchLinkedAccounts,
    });

export const usePlatformDetailsQuery = (platform: PlatformName) =>
    useQuery({
        queryKey: PLATFORMS_QK.platform(platform),
        queryFn: () => fetchPlatformDetails(platform),
        enabled: !!platform,
    });

export const useSpotifyAuthUrlQuery = (redirectUri: string, enabled = true) =>
    useQuery({
        queryKey: PLATFORMS_QK.spotifyAuthUrl(redirectUri),
        queryFn: () => fetchSpotifyAuthUrl(redirectUri),
        enabled: !!redirectUri && enabled,
        staleTime: 5 * 60 * 1000, // state is valid ~5 min
    });

export const useSpotifyTokenQuery = (enabled = true) =>
    useQuery({
        queryKey: PLATFORMS_QK.spotifyToken(),
        queryFn: fetchSpotifyToken,
        enabled,
        staleTime: 50 * 60 * 1000, // Spotify tokens last 60 min
        refetchInterval: 50 * 60 * 1000,
    });

export const useTidalAuthUrlQuery = (redirectUri: string, enabled = true) =>
    useQuery({
        queryKey: PLATFORMS_QK.tidalAuthUrl(redirectUri),
        queryFn: () => fetchTidalAuthUrl(redirectUri),
        enabled: !!redirectUri && enabled,
        staleTime: 5 * 60 * 1000,
    });

export const useTidalPlayUrlQuery = (trackId: string, enabled = true) =>
    useQuery({
        queryKey: PLATFORMS_QK.tidalPlay(trackId),
        queryFn: () => fetchTidalPlayUrl(trackId),
        enabled: !!trackId && enabled,
    });

// ── Mutations ─────────────────────────────────────────────────────

export const useSpotifyLinkMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: PlatformLinkRequest) => postSpotifyLink(body),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: PLATFORMS_QK.accounts() });
        },
    });
};

export const useTidalLinkMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: PlatformLinkRequest) => postTidalLink(body),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: PLATFORMS_QK.accounts() });
        },
    });
};

export const useUnlinkPlatformMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (platform: PlatformName) => deletePlatformLink(platform),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: PLATFORMS_QK.accounts() });
        },
    });
};

export const useSpotifyPlayMutation = () =>
    useMutation({
        mutationFn: (body: SpotifyPlayRequest) => postSpotifyPlay(body),
    });

export const useSpotifyRefreshMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => postSpotifyRefresh(),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: PLATFORMS_QK.spotifyToken() });
        },
    });
};

export const useTidalRefreshMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => postTidalRefresh(),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: PLATFORMS_QK.accounts() });
        },
    });
};

export default {
    fetchLinkedAccounts,
    fetchPlatformDetails,
    deletePlatformLink,
    fetchSpotifyAuthUrl,
    postSpotifyLink,
    postSpotifyRefresh,
    fetchSpotifyToken,
    postSpotifyPlay,
    fetchTidalAuthUrl,
    postTidalLink,
    postTidalRefresh,
    fetchTidalPlayUrl,
};
