import { useEffect, useState } from "react";
import { PlayerService } from "../services/PlayerService";
import { useGameContext } from "../contexts/GameContext";
import { KaraokePlayer } from '../models/karaoke';
import { useUser } from "../contexts/UserContext";

export function useAvailablePlayers(currentPlayerId?: number) {
    const { state } = useGameContext();
    const { userId } = useUser();
    const [players, setPlayers] = useState<KaraokePlayer[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            // Wait for user context to be ready
            return;
        }
        setLoading(true);

        PlayerService.getAll(userId)
            .then((all: KaraokePlayer[]) => {
                // Exclude players already assigned except the current one (if editing)
                const assignedIds = state.players.map((p: KaraokePlayer) => p.id).filter(Boolean);
                setPlayers(
                    all.filter((p: KaraokePlayer) => !assignedIds.includes(p.id) || p.id === currentPlayerId)
                );
            })
            .catch(() => setError("Failed to fetch players"))
            .finally(() => setLoading(false));
    }, [state.players, currentPlayerId, userId]);

    return { players, loading, error };
}
