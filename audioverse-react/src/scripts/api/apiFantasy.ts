// apiFantasy.ts — Fantasy API + React Query hooks
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type { FantasyTeam, FantasyTeamPlayer } from "../../models/modelsKaraoke";

export const FANTASY_BASE = "/api/leagues";

/** @internal  use React Query hooks below */
export const FANTASY_QK = {
    teams: (leagueId: number) => ["fantasy", "teams", leagueId] as const,
    leaderboard: (leagueId: number) => ["fantasy", "leaderboard", leagueId] as const,
};

/** @internal GET /api/leagues/{leagueId}/fantasy/teams — List fantasy teams */
export const fetchFantasyTeams = async (leagueId: number): Promise<FantasyTeam[]> => {
    const { data } = await apiClient.get<FantasyTeam[]>(apiPath(FANTASY_BASE, `/${leagueId}/fantasy/teams`));
    return data ?? [];
};

/** POST /api/leagues/{leagueId}/fantasy/teams — Create fantasy team */
export const createFantasyTeam = async (leagueId: number, payload: Partial<FantasyTeam>): Promise<FantasyTeam> => {
    const { data } = await apiClient.post<FantasyTeam>(apiPath(FANTASY_BASE, `/${leagueId}/fantasy/teams`), payload);
    return data;
};

/** POST /api/leagues/{leagueId}/fantasy/teams/{teamId}/players — Add player */
export const addFantasyPlayer = async (leagueId: number, teamId: number, payload: Partial<FantasyTeamPlayer>): Promise<FantasyTeamPlayer> => {
    const { data } = await apiClient.post<FantasyTeamPlayer>(apiPath(FANTASY_BASE, `/${leagueId}/fantasy/teams/${teamId}/players`), payload);
    return data;
};

/** DELETE /api/leagues/{leagueId}/fantasy/teams/{teamId}/players/{playerId} — Remove player */
export const removeFantasyPlayer = async (leagueId: number, teamId: number, playerId: number): Promise<void> => {
    await apiClient.delete(apiPath(FANTASY_BASE, `/${leagueId}/fantasy/teams/${teamId}/players/${playerId}`));
};

/** @internal GET /api/leagues/{leagueId}/fantasy/leaderboard — Fantasy leaderboard */
export const fetchFantasyLeaderboard = async (leagueId: number): Promise<FantasyTeam[]> => {
    const { data } = await apiClient.get<FantasyTeam[]>(apiPath(FANTASY_BASE, `/${leagueId}/fantasy/leaderboard`));
    return data ?? [];
};

// ── React Query Hooks ──

export const useFantasyTeamsQuery = (leagueId: number) =>
    useQuery({ queryKey: FANTASY_QK.teams(leagueId), queryFn: () => fetchFantasyTeams(leagueId), enabled: Number.isFinite(leagueId) });

export const useFantasyLeaderboardQuery = (leagueId: number) =>
    useQuery({ queryKey: FANTASY_QK.leaderboard(leagueId), queryFn: () => fetchFantasyLeaderboard(leagueId), enabled: Number.isFinite(leagueId) });

export const useCreateFantasyTeamMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ leagueId, payload }: { leagueId: number; payload: Partial<FantasyTeam> }) => createFantasyTeam(leagueId, payload),
        onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: FANTASY_QK.teams(vars.leagueId) }),
    });
};

export const useAddFantasyPlayerMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ leagueId, teamId, payload }: { leagueId: number; teamId: number; payload: Partial<FantasyTeamPlayer> }) => addFantasyPlayer(leagueId, teamId, payload),
        onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: FANTASY_QK.teams(vars.leagueId) }),
    });
};

export const useRemoveFantasyPlayerMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ leagueId, teamId, playerId }: { leagueId: number; teamId: number; playerId: number }) => removeFantasyPlayer(leagueId, teamId, playerId),
        onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: FANTASY_QK.teams(vars.leagueId) }),
    });
};

