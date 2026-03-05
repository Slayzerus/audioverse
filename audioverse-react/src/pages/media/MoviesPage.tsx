import React, { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    useMoviesQuery,
    useCreateMovieMutation,
    useDeleteMovieMutation,
    useImportTmdbMovieMutation,
    searchTmdbMovies,
    type Movie,
    type ExternalMovieResult,
} from "../../scripts/api/apiMediaMovies";
import ExternalMediaLookup, { type MediaLookupSource } from "../../components/common/ExternalMediaLookup";

const cardStyle: React.CSSProperties = {
    background: "var(--card-bg, #23272f)",
    border: "1px solid var(--border-color, #333)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
};

const MoviesPage: React.FC = () => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [newMovie, setNewMovie] = useState<Partial<Movie>>({});

    const moviesQuery = useMoviesQuery();
    const createMutation = useCreateMovieMutation();
    const deleteMutation = useDeleteMovieMutation();
    const importTmdb = useImportTmdbMovieMutation();

    const filteredMovies = (moviesQuery.data ?? []).filter(m =>
        !searchQuery || (m.title ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.director ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreate = async () => {
        if (!newMovie.title?.trim()) return;
        await createMutation.mutateAsync(newMovie);
        setNewMovie({});
        setShowCreate(false);
    };

    // Universal lookup
    const lookupSources: MediaLookupSource<ExternalMovieResult>[] = useMemo(() => [
        { key: "tmdb", label: "TMDb", searchFn: searchTmdbMovies },
    ], []);

    const handleLookupSelect = useCallback((item: ExternalMovieResult) => {
        setNewMovie(prev => ({
            ...prev,
            title: item.title ?? prev.title,
            director: prev.director,
            releaseDate: item.releaseDate ?? prev.releaseDate,
            description: item.overview ?? prev.description,
            posterUrl: item.posterUrl ?? prev.posterUrl,
        }));
        if (item.externalId) importTmdb.mutate(item.externalId);
    }, [importTmdb]);

    const renderMovieSuggestion = useCallback((item: ExternalMovieResult) => (
        <>
            {item.posterUrl && <img src={item.posterUrl} alt={item.title || 'Movie poster'} style={{ width: 36, height: 54, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{item.title}</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>
                    {item.releaseDate}{item.rating ? ` · ★ ${item.rating}` : ""}
                </div>
                {item.overview && <div style={{ fontSize: 11, opacity: 0.4, maxHeight: 28, overflow: "hidden" }}>{item.overview}</div>}
            </div>
            <span style={{ fontSize: 11, opacity: 0.4, flexShrink: 0 }}>⬇ import</span>
        </>
    ), []);

    return (
        <div className="container mt-4" style={{ maxWidth: 1100 }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 style={{ fontWeight: 700 }}>🎬 {t("media.movies.title", "Movies")}</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(s => !s)}>
                    <i className="fa fa-plus me-1" /> {t("common.add", "Add")}
                </button>
            </div>

            {showCreate && (
                <div style={cardStyle}>
                    <h5>{t("media.movies.createTitle", "Add Movie")}</h5>

                    {/* Universal lookup — inline autocomplete */}
                    <div style={{ marginBottom: 10 }}>
                        <ExternalMediaLookup<ExternalMovieResult>
                            sources={lookupSources}
                            onSelect={handleLookupSelect}
                            renderSuggestion={renderMovieSuggestion}
                            placeholder={t("media.movies.lookupPlaceholder", "Search TMDb to auto-fill...")}
                        />
                    </div>

                    <div className="row g-2">
                        <div className="col-md-5">
                            <input className="form-control form-control-sm" placeholder={t("media.movies.titleField", "Title")}
                                value={newMovie.title ?? ""} onChange={e => setNewMovie(p => ({ ...p, title: e.target.value }))} />
                        </div>
                        <div className="col-md-4">
                            <input className="form-control form-control-sm" placeholder={t("media.movies.director", "Director")}
                                value={newMovie.director ?? ""} onChange={e => setNewMovie(p => ({ ...p, director: e.target.value }))} />
                        </div>
                        <div className="col-md-3">
                            <input className="form-control form-control-sm" placeholder={t("media.movies.releaseDate", "Release date")}
                                value={newMovie.releaseDate ?? ""} onChange={e => setNewMovie(p => ({ ...p, releaseDate: e.target.value }))} />
                        </div>
                        <div className="col-12">
                            <textarea className="form-control form-control-sm" rows={2} placeholder={t("media.movies.description", "Description")}
                                value={newMovie.description ?? ""} onChange={e => setNewMovie(p => ({ ...p, description: e.target.value }))} />
                        </div>
                    </div>
                    <button className="btn btn-success btn-sm mt-2" onClick={handleCreate} disabled={createMutation.isPending}>
                        {createMutation.isPending ? t("common.saving", "Saving...") : t("common.save", "Save")}
                    </button>
                </div>
            )}

            <input className="form-control form-control-sm mb-3" placeholder={t("media.movies.search", "Search your movies...")}
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />

            {moviesQuery.isLoading && <p className="text-muted">{t("common.loading", "Loading...")}</p>}
            <div className="row g-3 mb-4">
                {filteredMovies.map(movie => (
                    <div key={movie.id} className="col-md-4 col-lg-3">
                        <div style={{ ...cardStyle, height: "100%", display: "flex", flexDirection: "column" }}>
                            {movie.posterUrl && <img src={movie.posterUrl} alt={movie.title ?? ""} style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 8, marginBottom: 8 }} />}
                            <strong style={{ fontSize: 14 }}>{movie.title}</strong>
                            <small className="text-muted">{movie.director}</small>
                            {movie.releaseDate && <small className="text-muted">{movie.releaseDate}</small>}
                            {movie.rating != null && <small className="text-warning">★ {movie.rating.toFixed(1)}</small>}
                            <div className="mt-auto pt-2">
                                <button className="btn btn-outline-danger btn-sm" onClick={() => deleteMutation.mutate(movie.id)}>
                                    <i className="fa fa-trash" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {!moviesQuery.isLoading && filteredMovies.length === 0 && (
                    <div className="col-12 text-center text-muted py-4">{t("media.movies.empty", "No movies yet. Use the lookup above to import from TMDb.")}</div>
                )}
            </div>
        </div>
    );
};

export default MoviesPage;
