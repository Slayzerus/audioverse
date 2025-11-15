import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllParties, createParty, assignPlayerToParty } from "../../scripts/api/apiKaraoke.ts";
import "bootstrap/dist/css/bootstrap.min.css";

const PartyPage: React.FC = () => {
    const queryClient = useQueryClient();

    // Stan formularza do tworzenia imprezy
    const [partyName, setPartyName] = useState("");
    const [partyDescription, setPartyDescription] = useState("");
    const [organizerId, setOrganizerId] = useState("");

    // Pobieranie listy imprez
    const { data: parties = [], isLoading, error } = useQuery({
        queryKey: ["parties"],
        queryFn: getAllParties,
    });

    // Mutacja tworzenia nowej imprezy
    const createPartyMutation = useMutation({
        mutationFn: createParty,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["parties"] }); // ✅ Poprawiona wersja
            setPartyName("");
            setPartyDescription("");
            setOrganizerId("");
        },
    });

    // Mutacja przypisywania gracza do imprezy
    const assignPlayerMutation = useMutation({
        mutationFn: assignPlayerToParty,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["parties"] });
        },
    });

    return (
        <div className="container mt-4">
            <h1 className="mb-4">Karaoke Parties</h1>
            {/* Formularz do tworzenia nowej imprezy */}
            <div className="card mb-4">
                <div className="card-body">
                    <h5 className="card-title">Create a New Party</h5>
                    <div className="mb-3">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Party Name"
                            value={partyName}
                            onChange={(e) => setPartyName(e.target.value)}
                        />
                    </div>
                    <div className="mb-3">
                        <textarea
                            className="form-control"
                            placeholder="Description"
                            value={partyDescription}
                            onChange={(e) => setPartyDescription(e.target.value)}
                        />
                    </div>
                    <div className="mb-3">
                        <input
                            type="number"
                            className="form-control"
                            placeholder="Organizer ID"
                            value={organizerId}
                            onChange={(e) => setOrganizerId(e.target.value)}
                        />
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() =>
                            createPartyMutation.mutate({
                                name: partyName,
                                description: partyDescription,
                                organizerId: parseInt(organizerId),
                            })
                        }
                        disabled={createPartyMutation.isPending}
                    >
                        {createPartyMutation.isPending ? "Creating..." : "Create Party"}
                    </button>
                </div>
            </div>

            {/* Lista istniejących imprez */}
            {isLoading && <p className="text-center">Loading parties...</p>}
            {error && <p className="text-danger">Error loading parties.</p>}

            <ul className="list-group">
                {parties.map((party: any) => (
                    <li key={party.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h5>{party.name}</h5>
                                <p className="text-muted">{party.description}</p>
                            </div>
                            <button
                                className="btn btn-sm btn-success"
                                onClick={() =>
                                    assignPlayerMutation.mutate({
                                        partyId: party.id,
                                        playerId: 1, // 🔧 Domyślnie player ID, można podmienić
                                    })
                                }
                                disabled={assignPlayerMutation.isPending}
                            >
                                Add Player
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PartyPage;
