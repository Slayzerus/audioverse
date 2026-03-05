// contexts/KaraokeGameContext.tsx
// Manages the active KaraokeGame within a party — create, start, end, track scores.
// API-backed when partyId is provided; local-only fallback otherwise.

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { KaraokeGame, KaraokeGameMode, KaraokeGameStatus, KaraokeGameTheme } from "../models/modelsKaraoke";
import {
    useGamesQuery,
    useCreateGameMutation,
    useUpdateGameMutation,
    useDeleteGameMutation,
    useStartGameMutation,
    useEndGameMutation,
    type CreateGameRequest,
} from "../scripts/api/apiKaraoke";

/* ────── Types ────── */

export interface CreateGameInput {
    name: string;
    mode?: KaraokeGameMode;
    maxRounds?: number;
    timeLimitPerRound?: number;
    theme?: KaraokeGameTheme;
}

export interface KaraokeGameState {
    /** All games in the current party */
    games: KaraokeGame[];
    /** Currently active game (in-progress) */
    activeGame: KaraokeGame | null;
    /** Loading flag for API operations */
    loading: boolean;
    /** Last error message */
    error: string | null;
}

export interface KaraokeGameActions {
    /** Create a new game in the party */
    createGame: (partyId: number, input: CreateGameInput) => void;
    /** Set a game as the active game */
    setActiveGame: (gameId: number) => void;
    /** Start the active game (status → active) */
    startGame: (gameId: number) => void;
    /** End the active game (status → finished) */
    endGame: (gameId: number) => void;
    /** Cancel a game (status → cancelled) */
    cancelGame: (gameId: number) => void;
    /** Update game settings (name, theme, mode, etc.) */
    updateGame: (gameId: number, patch: Partial<Pick<KaraokeGame, 'name' | 'mode' | 'maxRounds' | 'timeLimitPerRound' | 'theme'>>) => void;
    /** Remove a game from the list */
    removeGame: (gameId: number) => void;
    /** Reorder games (swap orderIndex) */
    reorderGames: (gameIds: number[]) => void;
    /** Clear error */
    clearError: () => void;
}

export type KaraokeGameContextValue = KaraokeGameState & KaraokeGameActions;

const KaraokeGameContext = createContext<KaraokeGameContextValue | null>(null);

/* ────── Provider ────── */

let nextLocalId = -1; // local IDs are negative until synced with backend

export const KaraokeGameProvider: React.FC<{ partyId?: number; children: React.ReactNode }> = ({ partyId, children }) => {
    // API-backed state (when partyId is provided)
    const gamesQuery = useGamesQuery(partyId ?? 0, { enabled: (partyId ?? 0) > 0 });
    const createMut = useCreateGameMutation(partyId ?? 0);
    const updateMut = useUpdateGameMutation(partyId ?? 0);
    const deleteMut = useDeleteGameMutation(partyId ?? 0);
    const startMut = useStartGameMutation(partyId ?? 0);
    const endMut = useEndGameMutation(partyId ?? 0);

    // Local-only fallback state (when no partyId)
    const [localGames, setLocalGames] = useState<KaraokeGame[]>([]);
    const [activeGameId, setActiveGameId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const isApiMode = (partyId ?? 0) > 0;
    const games = isApiMode ? (gamesQuery.data ?? []) : localGames;
    const loading = isApiMode
        ? (gamesQuery.isLoading || createMut.isPending || updateMut.isPending || deleteMut.isPending || startMut.isPending || endMut.isPending)
        : false;

    const activeGame = useMemo(
        () => games.find(g => g.id === activeGameId) ?? games.find(g => g.status === 'active') ?? null,
        [games, activeGameId],
    );

    const createGame = useCallback((targetPartyId: number, input: CreateGameInput) => {
        if (isApiMode) {
            createMut.mutate(input as CreateGameRequest, {
                onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Failed to create game'),
            });
        } else {
            const game: KaraokeGame = {
                id: nextLocalId--,
                partyId: targetPartyId,
                name: input.name,
                mode: input.mode ?? 'classic',
                status: 'draft',
                maxRounds: input.maxRounds ?? 0,
                timeLimitPerRound: input.timeLimitPerRound ?? 0,
                theme: input.theme ?? null,
                orderIndex: localGames.length,
                createdAt: new Date().toISOString(),
                rounds: [],
            };
            setLocalGames(prev => [...prev, game]);
        }
    }, [isApiMode, createMut, localGames.length]);

    const updateGameStatus = useCallback((gameId: number, status: KaraokeGameStatus, extraFields?: Partial<KaraokeGame>) => {
        setLocalGames(prev => prev.map(g =>
            g.id === gameId ? { ...g, status, ...extraFields } : g
        ));
    }, []);

    const setActiveGameCb = useCallback((gameId: number) => {
        setActiveGameId(gameId);
    }, []);

    const startGame = useCallback((gameId: number) => {
        if (isApiMode) {
            startMut.mutate(gameId, {
                onSuccess: () => setActiveGameId(gameId),
                onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Failed to start game'),
            });
        } else {
            updateGameStatus(gameId, 'active', { startedAt: new Date().toISOString() });
            setActiveGameId(gameId);
        }
    }, [isApiMode, startMut, updateGameStatus]);

    const endGame = useCallback((gameId: number) => {
        if (isApiMode) {
            endMut.mutate(gameId, {
                onSuccess: () => { if (activeGameId === gameId) setActiveGameId(null); },
                onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Failed to end game'),
            });
        } else {
            updateGameStatus(gameId, 'finished', { endedAt: new Date().toISOString() });
            if (activeGameId === gameId) setActiveGameId(null);
        }
    }, [isApiMode, endMut, updateGameStatus, activeGameId]);

    const cancelGame = useCallback((gameId: number) => {
        if (isApiMode) {
            // Use end mutation with cancel semantics (backend handles status)
            endMut.mutate(gameId, {
                onSuccess: () => { if (activeGameId === gameId) setActiveGameId(null); },
                onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Failed to cancel game'),
            });
        } else {
            updateGameStatus(gameId, 'cancelled');
            if (activeGameId === gameId) setActiveGameId(null);
        }
    }, [isApiMode, endMut, updateGameStatus, activeGameId]);

    const updateGame = useCallback((gameId: number, patch: Partial<Pick<KaraokeGame, 'name' | 'mode' | 'maxRounds' | 'timeLimitPerRound' | 'theme'>>) => {
        if (isApiMode) {
            updateMut.mutate({ gameId, patch: patch as Partial<CreateGameRequest> }, {
                onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Failed to update game'),
            });
        } else {
            setLocalGames(prev => prev.map(g =>
                g.id === gameId ? { ...g, ...patch } : g
            ));
        }
    }, [isApiMode, updateMut]);

    const removeGame = useCallback((gameId: number) => {
        if (isApiMode) {
            deleteMut.mutate(gameId, {
                onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Failed to remove game'),
            });
        } else {
            setLocalGames(prev => prev.filter(g => g.id !== gameId));
        }
        if (activeGameId === gameId) setActiveGameId(null);
    }, [isApiMode, deleteMut, activeGameId]);

    const reorderGames = useCallback((gameIds: number[]) => {
        // Local reorder only — could be extended with API PUT for orderIndex
        if (!isApiMode) {
            setLocalGames(prev => {
                const map = new Map(prev.map(g => [g.id, g]));
                return gameIds
                    .map((id, idx) => {
                        const g = map.get(id);
                        return g ? { ...g, orderIndex: idx } : null;
                    })
                    .filter((g): g is KaraokeGame => g !== null);
            });
        }
    }, [isApiMode]);

    const clearError = useCallback(() => setError(null), []);

    const value = useMemo<KaraokeGameContextValue>(() => ({
        games,
        activeGame,
        loading,
        error,
        createGame,
        setActiveGame: setActiveGameCb,
        startGame,
        endGame,
        cancelGame,
        updateGame,
        removeGame,
        reorderGames,
        clearError,
    }), [games, activeGame, loading, error, createGame, setActiveGameCb, startGame, endGame, cancelGame, updateGame, removeGame, reorderGames, clearError]);

    return (
        <KaraokeGameContext.Provider value={value}>
            {children}
        </KaraokeGameContext.Provider>
    );
};

/* ────── Hook ────── */

export function useKaraokeGame(): KaraokeGameContextValue {
    const ctx = useContext(KaraokeGameContext);
    if (!ctx) throw new Error("useKaraokeGame must be used within KaraokeGameProvider");
    return ctx;
}

export default KaraokeGameContext;
