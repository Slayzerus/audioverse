// src/pages/party/KaraokeSongBrowser.tsx
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSongs } from "../../scripts/api/apiKaraoke.ts";
import "bootstrap/dist/css/bootstrap.min.css";

/// <summary>
/// Simple browser for karaoke songs with client-side filters.
/// </summary>
const KaraokeSongBrowser: React.FC = () => {
    /// <summary>Local filter state.</summary>
    const [filters, setFilters] = useState({
        title: "",
        artist: "",
        genre: "",
        language: "",
        year: undefined as number | undefined,
    });

    // ✅ getSongs przyjmuje max 1 argument — przekaż obiekt filtrów
    const { data: songs = [], isLoading, error } = useQuery({
        queryKey: ["songs", filters],
        queryFn: () =>
            getSongs({
                title: filters.title || undefined,
                artist: filters.artist || undefined,
                genre: filters.genre || undefined,
                language: filters.language || undefined,
                year: filters.year,
            }),
    });

    /// <summary>
    /// Maps filePath to a cover image endpoint.
    /// </summary>
    const getCoverPath = (filePath: string | null | undefined) => {
        if (!filePath) return "https://via.placeholder.com/100";
        return `http://localhost:5000/api/karaoke/get-cover?filePath=${encodeURIComponent(filePath)}`;
    };

    return (
        <div className="container mt-4">
            <h1 className="mb-4">Song Browser</h1>

            {/* Formularz filtrów */}
            <div className="mb-4 d-flex gap-2 flex-wrap">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Title"
                    value={filters.title}
                    onChange={(e) => setFilters({ ...filters, title: e.target.value })}
                />
                <input
                    type="text"
                    className="form-control"
                    placeholder="Artist"
                    value={filters.artist}
                    onChange={(e) => setFilters({ ...filters, artist: e.target.value })}
                />
                <input
                    type="text"
                    className="form-control"
                    placeholder="Genre"
                    value={filters.genre}
                    onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
                />
                <input
                    type="text"
                    className="form-control"
                    placeholder="Language"
                    value={filters.language}
                    onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                />
                <input
                    type="number"
                    className="form-control"
                    placeholder="Year"
                    value={filters.year || ""}
                    onChange={(e) => setFilters({ ...filters, year: e.target.value ? Number(e.target.value) : undefined })}
                />
            </div>

            {isLoading && <p className="text-center">Loading songs...</p>}
            {error && <p className="text-danger">Error loading songs.</p>}

            <ul className="list-group">
                {songs.map((song: any) => (
                    <li key={song.id} className="list-group-item">
                        <div className="d-flex align-items-center">
                            <img
                                src={getCoverPath(song.filePath)}
                                alt="Cover"
                                className="me-3"
                                style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }}
                            />
                            <div className="flex-grow-1">
                                <h5 className="mb-1">{song.artist} - {song.title}</h5>
                                <small className="text-muted">({song.year || "Unknown Year"})</small>
                                <div className="d-flex gap-2 mt-2">
                                    <span className="badge bg-dark text-white px-3 py-2">{song.genre || "Unknown Genre"}</span>
                                    <span className="badge bg-primary text-white px-3 py-2">{song.language || "Unknown Language"}</span>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default KaraokeSongBrowser;
