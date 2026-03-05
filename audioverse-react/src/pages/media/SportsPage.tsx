import React, { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    useSportsQuery,
    useCreateSportMutation,
    useDeleteSportMutation,
    useSportsLeaguesQuery,
    useUpcomingEventsQuery,
    searchTheSportsDb,
    type SportActivity,
    type ExternalSportResult,
} from "../../scripts/api/apiMediaSports";
import ExternalMediaLookup, { type MediaLookupSource } from "../../components/common/ExternalMediaLookup";

const cardStyle: React.CSSProperties = {
    background: "var(--card-bg, #23272f)",
    border: "1px solid var(--border-color, #333)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
};

const SportsPage: React.FC = () => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLeague, setSelectedLeague] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [newSport, setNewSport] = useState<Partial<SportActivity>>({});

    const sportsQuery = useSportsQuery();
    const createMutation = useCreateSportMutation();
    const deleteMutation = useDeleteSportMutation();
    const leaguesQuery = useSportsLeaguesQuery();
    const upcomingQuery = useUpcomingEventsQuery(selectedLeague);

    const filteredSports = (sportsQuery.data ?? []).filter(s =>
        !searchQuery || (s.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.sport ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreate = async () => {
        if (!newSport.name?.trim()) return;
        await createMutation.mutateAsync(newSport);
        setNewSport({});
        setShowCreate(false);
    };

    // Universal lookup
    const lookupSources: MediaLookupSource<ExternalSportResult>[] = useMemo(() => [
        { key: "thesportsdb", label: "TheSportsDB", searchFn: searchTheSportsDb },
    ], []);

    const handleLookupSelect = useCallback((item: ExternalSportResult) => {
        setNewSport(prev => ({
            ...prev,
            name: item.name ?? prev.name,
            sport: item.sport ?? prev.sport,
            league: item.league ?? prev.league,
            homeTeam: item.homeTeam ?? prev.homeTeam,
            awayTeam: item.awayTeam ?? prev.awayTeam,
            imageUrl: item.imageUrl ?? prev.imageUrl,
        }));
    }, []);

    const renderSportSuggestion = useCallback((item: ExternalSportResult) => (
        <>
            {item.imageUrl && <img src={item.imageUrl} alt={item.name || 'Sports event'} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>
                    {item.sport}{item.league ? ` · ${item.league}` : ""}
                </div>
                {item.homeTeam && item.awayTeam && (
                    <div style={{ fontSize: 11, opacity: 0.5 }}>{item.homeTeam} vs {item.awayTeam}</div>
                )}
            </div>
            <span style={{ fontSize: 11, opacity: 0.4, flexShrink: 0 }}>⬇ fill</span>
        </>
    ), []);

    return (
        <div className="container mt-4" style={{ maxWidth: 1100 }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 style={{ fontWeight: 700 }}>⚽ {t("media.sports.title", "Sports")}</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(s => !s)}>
                    <i className="fa fa-plus me-1" /> {t("common.add", "Add")}
                </button>
            </div>

            {showCreate && (
                <div style={cardStyle}>
                    <h5>{t("media.sports.createTitle", "Add Sport Activity")}</h5>

                    {/* Universal lookup — inline autocomplete */}
                    <div style={{ marginBottom: 10 }}>
                        <ExternalMediaLookup<ExternalSportResult>
                            sources={lookupSources}
                            onSelect={handleLookupSelect}
                            renderSuggestion={renderSportSuggestion}
                            placeholder={t("media.sports.lookupPlaceholder", "Search TheSportsDB to auto-fill...")}
                        />
                    </div>

                    <div className="row g-2">
                        <div className="col-md-4">
                            <input className="form-control form-control-sm" placeholder={t("media.sports.name", "Event name")}
                                value={newSport.name ?? ""} onChange={e => setNewSport(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div className="col-md-3">
                            <input className="form-control form-control-sm" placeholder={t("media.sports.sport", "Sport")}
                                value={newSport.sport ?? ""} onChange={e => setNewSport(p => ({ ...p, sport: e.target.value }))} />
                        </div>
                        <div className="col-md-3">
                            <input className="form-control form-control-sm" placeholder={t("media.sports.league", "League")}
                                value={newSport.league ?? ""} onChange={e => setNewSport(p => ({ ...p, league: e.target.value }))} />
                        </div>
                        <div className="col-md-2">
                            <input className="form-control form-control-sm" type="date" value={newSport.date ?? ""}
                                onChange={e => setNewSport(p => ({ ...p, date: e.target.value }))} />
                        </div>
                        <div className="col-md-4">
                            <input className="form-control form-control-sm" placeholder={t("media.sports.homeTeam", "Home team")}
                                value={newSport.homeTeam ?? ""} onChange={e => setNewSport(p => ({ ...p, homeTeam: e.target.value }))} />
                        </div>
                        <div className="col-md-4">
                            <input className="form-control form-control-sm" placeholder={t("media.sports.awayTeam", "Away team")}
                                value={newSport.awayTeam ?? ""} onChange={e => setNewSport(p => ({ ...p, awayTeam: e.target.value }))} />
                        </div>
                        <div className="col-md-4">
                            <input className="form-control form-control-sm" placeholder={t("media.sports.venue", "Venue")}
                                value={newSport.venue ?? ""} onChange={e => setNewSport(p => ({ ...p, venue: e.target.value }))} />
                        </div>
                    </div>
                    <button className="btn btn-success btn-sm mt-2" onClick={handleCreate} disabled={createMutation.isPending}>
                        {createMutation.isPending ? t("common.saving", "Saving...") : t("common.save", "Save")}
                    </button>
                </div>
            )}

            <input className="form-control form-control-sm mb-3" placeholder={t("media.sports.search", "Search your sport activities...")}
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />

            {sportsQuery.isLoading && <p className="text-muted">{t("common.loading", "Loading...")}</p>}
            <div className="row g-3 mb-4">
                {filteredSports.map(sport => (
                    <div key={sport.id} className="col-md-4 col-lg-3">
                        <div style={{ ...cardStyle, height: "100%" }}>
                            {sport.imageUrl && <img src={sport.imageUrl} alt={sport.name ?? ""} style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 8, marginBottom: 8 }} />}
                            <strong style={{ fontSize: 14 }}>{sport.name}</strong>
                            <div className="text-muted" style={{ fontSize: 12 }}>{sport.sport} — {sport.league}</div>
                            {sport.homeTeam && sport.awayTeam && (
                                <div style={{ fontSize: 13, marginTop: 4 }}>
                                    {sport.homeTeam} vs {sport.awayTeam}
                                    {sport.homeScore != null && sport.awayScore != null && (
                                        <span className="ms-2 fw-bold">{sport.homeScore} : {sport.awayScore}</span>
                                    )}
                                </div>
                            )}
                            {sport.date && <small className="text-muted">{new Date(sport.date).toLocaleDateString()}</small>}
                            <div className="mt-2">
                                <button className="btn btn-outline-danger btn-sm" onClick={() => deleteMutation.mutate(sport.id)}>
                                    <i className="fa fa-trash" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {!sportsQuery.isLoading && filteredSports.length === 0 && (
                    <div className="col-12 text-center text-muted py-4">{t("media.sports.empty", "No sport activities yet. Use the lookup above to search TheSportsDB.")}</div>
                )}
            </div>

            {/* Leagues + upcoming events — kept separate */}
            <div style={cardStyle}>
                <h5>{t("media.sports.leagues", "Leagues & Upcoming Events")}</h5>
                <select className="form-select form-select-sm mb-2" value={selectedLeague} onChange={e => setSelectedLeague(e.target.value)}>
                    <option value="">{t("media.sports.selectLeague", "Select a league...")}</option>
                    {(leaguesQuery.data ?? []).map(l => (
                        <option key={l.id} value={l.id ?? ""}>{l.name} ({l.sport} — {l.country})</option>
                    ))}
                </select>
                {upcomingQuery.isFetching && <p className="text-muted small">{t("common.loading", "Loading...")}</p>}
                {selectedLeague && (
                    <div className="row g-2">
                        {(upcomingQuery.data ?? []).map((ev, i) => (
                            <div key={`${ev.eventId}-${i}`} className="col-md-4">
                                <div style={{ ...cardStyle, marginBottom: 4, textAlign: "center" }}>
                                    <strong style={{ fontSize: 13 }}>{ev.homeTeam} vs {ev.awayTeam}</strong>
                                    <div className="text-muted" style={{ fontSize: 12 }}>{ev.date ? new Date(ev.date).toLocaleDateString() : ""}</div>
                                    <div style={{ fontSize: 11 }}>{ev.venue}</div>
                                </div>
                            </div>
                        ))}
                        {!upcomingQuery.isFetching && (upcomingQuery.data ?? []).length === 0 && (
                            <div className="text-muted small">{t("media.sports.noUpcoming", "No upcoming events for this league.")}</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SportsPage;
