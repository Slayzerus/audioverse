// apiMediaSports.ts — Media catalog: sports activities CRUD + TheSportsDB search
import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryOptions,
    type QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";

// === Types ===

export interface SportActivity {
    id: number;
    name?: string;
    sport?: string;
    league?: string;
    description?: string;
    imageUrl?: string;
    date?: string;
    venue?: string;
    homeTeam?: string;
    awayTeam?: string;
    homeScore?: number;
    awayScore?: number;
    externalId?: string;
    externalSource?: string;
    createdAt?: string;
    createdByUserId?: number;
}

export interface ExternalSportResult {
    externalId?: string;
    name?: string;
    sport?: string;
    league?: string;
    imageUrl?: string;
    date?: string;
    venue?: string;
    homeTeam?: string;
    awayTeam?: string;
}

export interface SportsLeague {
    id?: string;
    name?: string;
    sport?: string;
    country?: string;
    badgeUrl?: string;
}

export interface UpcomingEvent {
    eventId?: string;
    name?: string;
    date?: string;
    homeTeam?: string;
    awayTeam?: string;
    league?: string;
    venue?: string;
    thumbnailUrl?: string;
}

// === Base path ===
const BASE = "/api/media/sports";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const SPORTS_QK = {
    list: (params?: Record<string, unknown>) => ["media", "sports", params] as const,
    detail: (id: number) => ["media", "sports", id] as const,
    searchExternal: (q: string) => ["media", "sports", "search", q] as const,
    leagues: () => ["media", "sports", "leagues"] as const,
    upcoming: (leagueId: string) => ["media", "sports", "upcoming", leagueId] as const,
};

// ── CRUD ──────────────────────────────────────────────────────

/** @internal GET /api/media/sports */
export const fetchSports = async (params?: Record<string, unknown>): Promise<SportActivity[]> => {
    const { data } = await apiClient.get<SportActivity[]>(apiPath(BASE, ""), { params });
    return data ?? [];
};

/** @internal GET /api/media/sports/{id} */
export const fetchSportById = async (id: number): Promise<SportActivity> => {
    const { data } = await apiClient.get<SportActivity>(apiPath(BASE, `/${id}`));
    return data;
};

/** @internal POST /api/media/sports */
export const postCreateSport = async (sport: Partial<SportActivity>): Promise<SportActivity> => {
    const { data } = await apiClient.post<SportActivity>(apiPath(BASE, ""), sport);
    return data;
};

/** @internal PUT /api/media/sports/{id} */
export const putUpdateSport = async (id: number, sport: Partial<SportActivity>): Promise<void> => {
    await apiClient.put(apiPath(BASE, `/${id}`), sport);
};

/** @internal DELETE /api/media/sports/{id} */
export const deleteSport = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(BASE, `/${id}`));
};

// ── TheSportsDB search ───────────────────────────────────────

/** GET /api/media/sports/thesportsdb/search?query= */
export const searchTheSportsDb = async (query: string): Promise<ExternalSportResult[]> => {
    const { data } = await apiClient.get<ExternalSportResult[]>(apiPath(BASE, "/thesportsdb/search"), { params: { query } });
    return data ?? [];
};

/** @internal GET /api/media/sports/thesportsdb/leagues */
export const fetchSportsLeagues = async (): Promise<SportsLeague[]> => {
    const { data } = await apiClient.get<SportsLeague[]>(apiPath(BASE, "/thesportsdb/leagues"));
    return data ?? [];
};

/** @internal GET /api/media/sports/thesportsdb/upcoming/{leagueId} */
export const fetchUpcomingEvents = async (leagueId: string): Promise<UpcomingEvent[]> => {
    const { data } = await apiClient.get<UpcomingEvent[]>(apiPath(BASE, `/thesportsdb/upcoming/${leagueId}`));
    return data ?? [];
};

// === React Query Hooks ===

export const useSportsQuery = (params?: Record<string, unknown>, options?: Partial<UseQueryOptions<SportActivity[], unknown, SportActivity[], QueryKey>>) =>
    useQuery({ queryKey: SPORTS_QK.list(params), queryFn: () => fetchSports(params), ...options });

export const useSportQuery = (id: number) =>
    useQuery({ queryKey: SPORTS_QK.detail(id), queryFn: () => fetchSportById(id), enabled: Number.isFinite(id) });

export const useSearchSportsDbQuery = (query: string, options?: Partial<UseQueryOptions<ExternalSportResult[], unknown, ExternalSportResult[], QueryKey>>) =>
    useQuery({ queryKey: SPORTS_QK.searchExternal(query), queryFn: () => searchTheSportsDb(query), enabled: query.length > 1, ...options });

export const useSportsLeaguesQuery = (options?: Partial<UseQueryOptions<SportsLeague[], unknown, SportsLeague[], QueryKey>>) =>
    useQuery({ queryKey: SPORTS_QK.leagues(), queryFn: fetchSportsLeagues, ...options });

export const useUpcomingEventsQuery = (leagueId: string, options?: Partial<UseQueryOptions<UpcomingEvent[], unknown, UpcomingEvent[], QueryKey>>) =>
    useQuery({ queryKey: SPORTS_QK.upcoming(leagueId), queryFn: () => fetchUpcomingEvents(leagueId), enabled: !!leagueId, ...options });

export const useCreateSportMutation = () => {
    const qc = useQueryClient();
    return useMutation<SportActivity, unknown, Partial<SportActivity>>({
        mutationFn: postCreateSport,
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["media", "sports"] }); },
    });
};

export const useUpdateSportMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { id: number; sport: Partial<SportActivity> }>({
        mutationFn: ({ id, sport }) => putUpdateSport(id, sport),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: SPORTS_QK.detail(v.id) }); qc.invalidateQueries({ queryKey: ["media", "sports"] }); },
    });
};

export const useDeleteSportMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: deleteSport,
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["media", "sports"] }); },
    });
};
