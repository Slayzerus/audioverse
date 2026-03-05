// apiLeagues.ts — Leagues API + React Query hooks
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type { League, LeagueParticipant } from "../../models/modelsKaraoke";

export const LEAGUES_BASE = "/api/leagues";

/** @internal  use React Query hooks below */
export const LEAGUE_QK = {
    all: ["leagues"] as const,
    detail: (id: number) => ["leagues", id] as const,
    standings: (id: number) => ["leagues", id, "standings"] as const,
};

/** @internal GET /api/leagues — List leagues */
export const fetchLeagues = async (): Promise<League[]> => {
    const { data } = await apiClient.get<League[]>(apiPath(LEAGUES_BASE, ""));
    return data ?? [];
};

/** @internal GET /api/leagues/{id} — League details */
export const fetchLeagueById = async (id: number): Promise<League> => {
    const { data } = await apiClient.get<League>(apiPath(LEAGUES_BASE, `/${id}`));
    return data;
};

/** POST /api/leagues — Create league */
export const createLeague = async (payload: Partial<League>): Promise<League> => {
    const { data } = await apiClient.post<League>(apiPath(LEAGUES_BASE, ""), payload);
    return data;
};

/** PUT /api/leagues/{id} — Update league */
export const updateLeague = async (id: number, payload: Partial<League>): Promise<League> => {
    const { data } = await apiClient.put<League>(apiPath(LEAGUES_BASE, `/${id}`), payload);
    return data;
};

/** @internal DELETE /api/leagues/{id} — Delete league */
export const deleteLeague = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(LEAGUES_BASE, `/${id}`));
};

/** POST /api/leagues/{id}/generate-schedule — Generate schedule */
export const generateLeagueSchedule = async (id: number): Promise<void> => {
    await apiClient.post(apiPath(LEAGUES_BASE, `/${id}/generate-schedule`));
};

/** @internal GET /api/leagues/{id}/standings — League standings */
export const fetchLeagueStandings = async (id: number): Promise<LeagueParticipant[]> => {
    const { data } = await apiClient.get<LeagueParticipant[]>(apiPath(LEAGUES_BASE, `/${id}/standings`));
    return data ?? [];
};

/** POST /api/leagues/{id}/participants — Add participant */
export const addLeagueParticipant = async (id: number, payload: Partial<LeagueParticipant>): Promise<LeagueParticipant> => {
    const { data } = await apiClient.post<LeagueParticipant>(apiPath(LEAGUES_BASE, `/${id}/participants`), payload);
    return data;
};

// ── React Query Hooks ──

export const useLeaguesQuery = () =>
    useQuery({ queryKey: LEAGUE_QK.all, queryFn: fetchLeagues });

export const useLeagueQuery = (id: number) =>
    useQuery({ queryKey: LEAGUE_QK.detail(id), queryFn: () => fetchLeagueById(id), enabled: Number.isFinite(id) });

export const useLeagueStandingsQuery = (id: number) =>
    useQuery({ queryKey: LEAGUE_QK.standings(id), queryFn: () => fetchLeagueStandings(id), enabled: Number.isFinite(id) });

export const useCreateLeagueMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: Partial<League>) => createLeague(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: LEAGUE_QK.all }),
    });
};

export const useUpdateLeagueMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Partial<League> }) => updateLeague(id, payload),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: LEAGUE_QK.all });
            qc.invalidateQueries({ queryKey: LEAGUE_QK.detail(vars.id) });
        },
    });
};

export const useDeleteLeagueMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteLeague(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: LEAGUE_QK.all }),
    });
};

export const useGenerateScheduleMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => generateLeagueSchedule(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: LEAGUE_QK.all }),
    });
};

export const useAddParticipantMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Partial<LeagueParticipant> }) => addLeagueParticipant(id, payload),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: LEAGUE_QK.detail(vars.id) });
            qc.invalidateQueries({ queryKey: LEAGUE_QK.standings(vars.id) });
        },
    });
};
