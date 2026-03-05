import React, { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    useTvShowsQuery,
    useCreateTvShowMutation,
    useDeleteTvShowMutation,
    useImportTmdbTvShowMutation,
    searchTmdbTvShows,
    type TvShow,
    type ExternalTvShowResult,
} from "../../scripts/api/apiMediaTvShows";
import ExternalMediaLookup, { type MediaLookupSource } from "../../components/common/ExternalMediaLookup";

const cardStyle: React.CSSProperties = {
    background: "var(--card-bg, #23272f)",
    border: "1px solid var(--border-color, #333)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
};

const TvShowsPage: React.FC = () => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [newShow, setNewShow] = useState<Partial<TvShow>>({});

    const showsQuery = useTvShowsQuery();
    const createMutation = useCreateTvShowMutation();
    const deleteMutation = useDeleteTvShowMutation();
    const importTmdb = useImportTmdbTvShowMutation();

    const filteredShows = (showsQuery.data ?? []).filter(s =>
        !searchQuery || (s.title ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.creator ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreate = async () => {
        if (!newShow.title?.trim()) return;
        await createMutation.mutateAsync(newShow);
        setNewShow({});
        setShowCreate(false);
    };

    // Universal lookup
    const lookupSources: MediaLookupSource<ExternalTvShowResult>[] = useMemo(() => [
        { key: "tmdb", label: "TMDb", searchFn: searchTmdbTvShows },
    ], []);

    const handleLookupSelect = useCallback((item: ExternalTvShowResult) => {
        setNewShow(prev => ({
            ...prev,
            title: item.title ?? prev.title,
            firstAirDate: item.firstAirDate ?? prev.firstAirDate,
            description: item.overview ?? prev.description,
            posterUrl: item.posterUrl ?? prev.posterUrl,
        }));
        if (item.externalId) importTmdb.mutate(item.externalId);
    }, [importTmdb]);

    const renderTvSuggestion = useCallback((item: ExternalTvShowResult) => (
        <>
            {item.posterUrl && <img src={item.posterUrl} alt={item.title || 'TV show poster'} style={{ width: 36, height: 54, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{item.title}</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>
                    {item.firstAirDate}{item.rating ? ` · ★ ${item.rating}` : ""}
                </div>
                {item.overview && <div style={{ fontSize: 11, opacity: 0.4, maxHeight: 28, overflow: "hidden" }}>{item.overview}</div>}
            </div>
            <span style={{ fontSize: 11, opacity: 0.4, flexShrink: 0 }}>⬇ import</span>
        </>
    ), []);

    return (
        <div className="container mt-4" style={{ maxWidth: 1100 }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 style={{ fontWeight: 700 }}>📺 {t("media.tv.title", "TV Shows")}</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(s => !s)}>
                    <i className="fa fa-plus me-1" /> {t("common.add", "Add")}
                </button>
            </div>

            {showCreate && (
                <div style={cardStyle}>
                    <h5>{t("media.tv.createTitle", "Add TV Show")}</h5>

                    {/* Universal lookup — inline autocomplete */}
                    <div style={{ marginBottom: 10 }}>
                        <ExternalMediaLookup<ExternalTvShowResult>
                            sources={lookupSources}
                            onSelect={handleLookupSelect}
                            renderSuggestion={renderTvSuggestion}
                            placeholder={t("media.tv.lookupPlaceholder", "Search TMDb to auto-fill...")}
                        />
                    </div>

                    <div className="row g-2">
                        <div className="col-md-5">
                            <input className="form-control form-control-sm" placeholder={t("media.tv.titleField", "Title")}
                                value={newShow.title ?? ""} onChange={e => setNewShow(p => ({ ...p, title: e.target.value }))} />
                        </div>
                        <div className="col-md-4">
                            <input className="form-control form-control-sm" placeholder={t("media.tv.creator", "Creator")}
                                value={newShow.creator ?? ""} onChange={e => setNewShow(p => ({ ...p, creator: e.target.value }))} />
                        </div>
                        <div className="col-md-3">
                            <input className="form-control form-control-sm" placeholder={t("media.tv.firstAirDate", "First air date")}
                                value={newShow.firstAirDate ?? ""} onChange={e => setNewShow(p => ({ ...p, firstAirDate: e.target.value }))} />
                        </div>
                        <div className="col-12">
                            <textarea className="form-control form-control-sm" rows={2} placeholder={t("media.tv.description", "Description")}
                                value={newShow.description ?? ""} onChange={e => setNewShow(p => ({ ...p, description: e.target.value }))} />
                        </div>
                    </div>
                    <button className="btn btn-success btn-sm mt-2" onClick={handleCreate} disabled={createMutation.isPending}>
                        {createMutation.isPending ? t("common.saving", "Saving...") : t("common.save", "Save")}
                    </button>
                </div>
            )}

            <input className="form-control form-control-sm mb-3" placeholder={t("media.tv.search", "Search your TV shows...")}
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />

            {showsQuery.isLoading && <p className="text-muted">{t("common.loading", "Loading...")}</p>}
            <div className="row g-3 mb-4">
                {filteredShows.map(show => (
                    <div key={show.id} className="col-md-4 col-lg-3">
                        <div style={{ ...cardStyle, height: "100%", display: "flex", flexDirection: "column" }}>
                            {show.posterUrl && <img src={show.posterUrl} alt={show.title ?? ""} style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 8, marginBottom: 8 }} />}
                            <strong style={{ fontSize: 14 }}>{show.title}</strong>
                            <small className="text-muted">{show.creator}</small>
                            {show.numberOfSeasons != null && <small className="text-muted">{show.numberOfSeasons} {t("media.tv.seasons", "seasons")}</small>}
                            {show.rating != null && <small className="text-warning">★ {show.rating.toFixed(1)}</small>}
                            <div className="mt-auto pt-2">
                                <button className="btn btn-outline-danger btn-sm" onClick={() => deleteMutation.mutate(show.id)}>
                                    <i className="fa fa-trash" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {!showsQuery.isLoading && filteredShows.length === 0 && (
                    <div className="col-12 text-center text-muted py-4">{t("media.tv.empty", "No TV shows yet. Use the lookup above to import from TMDb.")}</div>
                )}
            </div>
        </div>
    );
};

export default TvShowsPage;
