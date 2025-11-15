// apiTidalAuth.ts
import { useMutation, useQuery, UseQueryOptions, QueryKey } from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import {
    BuildUrlResponse,
    SetTokenRequest,
    RefreshRequest,
    TidalAuthTokens,
} from "../../models/modelsAuth";

export const AUTH_BASE = "/api/auth";

export const AUTH_QK = {
    tidalAuthorizeUrl: (params: {
        redirectUri: string;
        scopes?: string[] | undefined;
        state?: string | undefined;
        codeChallenge?: string | undefined;
        codeChallengeMethod?: "S256" | "plain" | string | undefined;
    }) => ["auth", "tidal", "authorize-url", params] as const,
};

// ---- Low-level API ----
export const fetchTidalAuthorizeUrl = async (params: {
    redirectUri: string;
    scopes?: string[];
    state?: string;
    codeChallenge?: string;
    codeChallengeMethod?: "S256" | "plain";
}): Promise<BuildUrlResponse> => {
    const { redirectUri, scopes, state, codeChallenge, codeChallengeMethod } = params;
    const search = new URLSearchParams();
    search.set("redirectUri", redirectUri);
    if (scopes && scopes.length) scopes.forEach(s => search.append("scopes", s));
    if (state) search.set("state", state);
    if (codeChallenge) search.set("codeChallenge", codeChallenge);
    if (codeChallengeMethod) search.set("codeChallengeMethod", codeChallengeMethod);

    const res = await apiClient.get<BuildUrlResponse>(apiPath(AUTH_BASE, `/tidal/url?${search.toString()}`));
    return res.data;
};

export const getTidalCallback = async (code: string, redirectUri: string): Promise<TidalAuthTokens> => {
    const search = new URLSearchParams();
    search.set("code", code);
    search.set("redirectUri", redirectUri);
    const res = await apiClient.get<TidalAuthTokens>(apiPath(AUTH_BASE, `/tidal/callback?${search.toString()}`));
    return res.data;
};

export const postTidalRefresh = async (refreshToken: string): Promise<TidalAuthTokens> => {
    const res = await apiClient.post<TidalAuthTokens>(apiPath(AUTH_BASE, "/tidal/refresh"), {
        refreshToken,
    } as RefreshRequest);
    return res.data;
};

export const postTidalSetAccessToken = async (accessToken: string): Promise<void> => {
    await apiClient.post(apiPath(AUTH_BASE, "/tidal/set-token"), {
        accessToken,
    } as SetTokenRequest);
};

// ---- Hooks ----
export const useTidalAuthorizeUrlQuery = (
    params: {
        redirectUri?: string;
        scopes?: string[];
        state?: string;
        codeChallenge?: string;
        codeChallengeMethod?: "S256" | "plain";
    },
    options?: Partial<UseQueryOptions<BuildUrlResponse, unknown, BuildUrlResponse, QueryKey>>
) => {
    const enabled = !!params.redirectUri;
    return useQuery({
        queryKey: AUTH_QK.tidalAuthorizeUrl(params as any),
        queryFn: () => fetchTidalAuthorizeUrl(params as { redirectUri: string }),
        enabled,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        ...options,
    });
};

export const useTidalAuthenticateMutation = () => useMutation({
    mutationFn: ({ code, redirectUri }: { code: string; redirectUri: string }) => getTidalCallback(code, redirectUri),
});

export const useTidalRefreshMutation = () => useMutation({
    mutationFn: (refreshToken: string) => postTidalRefresh(refreshToken),
});

export const useTidalSetAccessTokenMutation = () => useMutation({
    mutationFn: (accessToken: string) => postTidalSetAccessToken(accessToken),
});
