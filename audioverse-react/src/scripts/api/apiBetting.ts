// apiBetting.ts — Betting API + React Query hooks
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type { BettingMarket, BettingOption, Bet, UserWallet } from "../../models/modelsKaraoke";

export const BETTING_BASE = "/api/betting";

/** @internal  use React Query hooks below */
export const BETTING_QK = {
    markets: (eventId: number) => ["betting", "markets", eventId] as const,
    market: (id: number) => ["betting", "market", id] as const,
    userBets: (userId: number) => ["betting", "user", userId, "bets"] as const,
    wallet: (userId: number) => ["betting", "user", userId, "wallet"] as const,
};

/** @internal GET /api/betting/events/{eventId}/markets — Markets for event */
export const fetchBettingMarketsForEvent = async (eventId: number): Promise<BettingMarket[]> => {
    const { data } = await apiClient.get<BettingMarket[]>(apiPath(BETTING_BASE, `/events/${eventId}/markets`));
    return data ?? [];
};

/** @internal GET /api/betting/markets/{id} — Market details */
export const fetchBettingMarketById = async (id: number): Promise<BettingMarket> => {
    const { data } = await apiClient.get<BettingMarket>(apiPath(BETTING_BASE, `/markets/${id}`));
    return data;
};

/** POST /api/betting/markets — Create market */
export const createBettingMarket = async (payload: Partial<BettingMarket>): Promise<BettingMarket> => {
    const { data } = await apiClient.post<BettingMarket>(apiPath(BETTING_BASE, "/markets"), payload);
    return data;
};

/** POST /api/betting/markets/{id}/options — Add option */
export const addBettingOption = async (id: number, payload: Partial<BettingOption>): Promise<BettingOption> => {
    const { data } = await apiClient.post<BettingOption>(apiPath(BETTING_BASE, `/markets/${id}/options`), payload);
    return data;
};

/** POST /api/betting/markets/{id}/bets — Place bet */
export const placeBet = async (id: number, payload: { optionId: number; amount: number }): Promise<Bet> => {
    const { data } = await apiClient.post<Bet>(apiPath(BETTING_BASE, `/markets/${id}/bets`), payload);
    return data;
};

/** POST /api/betting/markets/{id}/resolve — Resolve market */
export const resolveBettingMarket = async (id: number, payload: { winningOptionId: number }): Promise<void> => {
    await apiClient.post(apiPath(BETTING_BASE, `/markets/${id}/resolve`), payload);
};

/** @internal GET /api/betting/users/{userId}/bets — User bet history */
export const fetchUserBetHistory = async (userId: number): Promise<Bet[]> => {
    const { data } = await apiClient.get<Bet[]>(apiPath(BETTING_BASE, `/users/${userId}/bets`));
    return data ?? [];
};

/** @internal GET /api/betting/users/{userId}/wallet — User wallet */
export const fetchUserWallet = async (userId: number): Promise<UserWallet> => {
    const { data } = await apiClient.get<UserWallet>(apiPath(BETTING_BASE, `/users/${userId}/wallet`));
    return data;
};

// ── React Query Hooks ──

export const useBettingMarketsQuery = (eventId: number) =>
    useQuery({ queryKey: BETTING_QK.markets(eventId), queryFn: () => fetchBettingMarketsForEvent(eventId), enabled: Number.isFinite(eventId) });

export const useBettingMarketQuery = (id: number) =>
    useQuery({ queryKey: BETTING_QK.market(id), queryFn: () => fetchBettingMarketById(id), enabled: Number.isFinite(id) });

export const useUserBetHistoryQuery = (userId: number) =>
    useQuery({ queryKey: BETTING_QK.userBets(userId), queryFn: () => fetchUserBetHistory(userId), enabled: Number.isFinite(userId) });

export const useUserWalletQuery = (userId: number) =>
    useQuery({ queryKey: BETTING_QK.wallet(userId), queryFn: () => fetchUserWallet(userId), enabled: Number.isFinite(userId) });

export const useCreateMarketMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: Partial<BettingMarket>) => createBettingMarket(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["betting"] }),
    });
};

export const useAddOptionMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ marketId, payload }: { marketId: number; payload: Partial<BettingOption> }) => addBettingOption(marketId, payload),
        onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: BETTING_QK.market(vars.marketId) }),
    });
};

export const usePlaceBetMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ marketId, optionId, amount }: { marketId: number; optionId: number; amount: number }) => placeBet(marketId, { optionId, amount }),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: BETTING_QK.market(vars.marketId) });
            qc.invalidateQueries({ queryKey: ["betting", "user"] });
        },
    });
};

export const useResolveMarketMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ marketId, winningOptionId }: { marketId: number; winningOptionId: number }) => resolveBettingMarket(marketId, { winningOptionId }),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: BETTING_QK.market(vars.marketId) });
            qc.invalidateQueries({ queryKey: ["betting"] });
        },
    });
};

