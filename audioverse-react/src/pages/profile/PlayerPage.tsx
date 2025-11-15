import { useEffect, useState } from "react";
import { getAllPlayers, createPlayer } from "../../scripts/api/apiKaraoke.ts";
import { KaraokePlayer } from "../../models/modelsKaraoke.ts";

/// <summary>
/// Lists karaoke players and allows creating a new one.
/// </summary>
const PlayerPage = () => {
    /// <summary>Players list state.</summary>
    const [players, setPlayers] = useState<KaraokePlayer[]>([]);
    /// <summary>Form state for creating a new player.</summary>
    const [newPlayer, setNewPlayer] = useState<KaraokePlayer>({ id: 0, name: "" });

    useEffect(() => {
        fetchPlayers();
    }, []);

    /// <summary>
    /// Loads players from API and updates local state.
    /// </summary>
    const fetchPlayers = async (): Promise<void> => {
        try {
            const data = await getAllPlayers(); // getAllPlayers returns KaraokePlayer[]
            setPlayers(data);
        } catch (error) {
            console.error("Error fetching players:", error);
        }
    };

    /// <summary>
    /// Creates a new player using API and refreshes the list.
    /// </summary>
    const handleCreatePlayer = async (): Promise<void> => {
        try {
            await createPlayer(newPlayer);
            setNewPlayer({ id: 0, name: "" });
            fetchPlayers();
        } catch (error) {
            console.error("Error creating player:", error);
        }
    };

    return (
        <div>
            <h1>Karaoke Players</h1>
            <ul>
                {players.map((player) => (
                    <li key={player.id}>{player.name}</li>
                ))}
            </ul>

            <h2>Create New Player</h2>
            <input
                type="text"
                placeholder="Player Name"
                value={newPlayer.name}
                onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
            />
            <button onClick={handleCreatePlayer}>Create</button>
        </div>
    );
};

export default PlayerPage;
