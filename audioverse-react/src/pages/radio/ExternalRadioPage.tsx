import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Focusable } from "../../components/common/Focusable";
import {
    useExternalStationsQuery,
    useExternalCountriesQuery,
} from "../../scripts/api/apiRadioExternal";
import type { ExternalRadioStationDto } from "../../models/modelsRadio";

const ExternalRadioPage: React.FC = () => {
    const { t } = useTranslation();
    const [country, setCountry] = useState<string | undefined>(undefined);
    const [genre, setGenre] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 50;

    const { data: countries } = useExternalCountriesQuery();
    const { data: stationsData, isLoading, isFetching } = useExternalStationsQuery(
        country,
        undefined,
        genre || undefined,
        page,
        pageSize,
    );

    const [playingUrl, setPlayingUrl] = useState<string | null>(null);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    const handlePlay = (station: ExternalRadioStationDto) => {
        if (playingUrl === station.streamUrl) {
            audioRef.current?.pause();
            setPlayingUrl(null);
            return;
        }
        if (audioRef.current) {
            audioRef.current.pause();
        }
        const audio = new Audio(station.streamUrl);
        audio.play().catch(() => { /* Expected: autoplay may be blocked by browser */ });
        audioRef.current = audio;
        setPlayingUrl(station.streamUrl);
    };

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            audioRef.current?.pause();
        };
    }, []);

    const sortedCountries = useMemo(
        () => [...(countries ?? [])].sort((a, b) => a.countryCode.localeCompare(b.countryCode)),
        [countries],
    );

    return (
        <div className="container py-4">
            <h2>🌐 {t("externalRadio.title", "Online Radio Stations")}</h2>
            <p className="text-muted mb-4">
                {t("externalRadio.subtitle", "Browse free internet radio stations from around the world.")}
            </p>

            {/* Filters */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-md-4">
                    <label className="form-label">
                        {t("externalRadio.country", "Country")}
                    </label>
                    <select
                        className="form-select"
                        value={country ?? ""}
                        onChange={(e) => {
                            setCountry(e.target.value || undefined);
                            setPage(1);
                        }}
                    >
                        <option value="">{t("externalRadio.allCountries", "All Countries")}</option>
                        {sortedCountries.map((c) => (
                            <option key={c.countryCode} value={c.countryCode}>
                                {c.countryCode} ({c.stationCount})
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-12 col-md-4">
                    <label className="form-label">
                        {t("externalRadio.genre", "Genre")}
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder={t("externalRadio.genrePlaceholder", "e.g. rock, jazz, news...")}
                        value={genre}
                        onChange={(e) => {
                            setGenre(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>
                <div className="col-12 col-md-4 d-flex align-items-end">
                    <span className="text-muted">
                        {stationsData?.totalCount ?? 0} {t("externalRadio.stationsFound", "stations found")}
                    </span>
                </div>
            </div>

            {/* Stations list */}
            {isLoading ? (
                <div className="text-center py-5">
                    <div className="spinner-border" />
                </div>
            ) : (
                <>
                    <div className="row g-3">
                        {(stationsData?.items ?? []).map((station) => (
                            <div key={station.id} className="col-12 col-sm-6 col-lg-4">
                                <div className="card h-100">
                                    <div className="card-body d-flex flex-column">
                                        <div className="d-flex align-items-center mb-2">
                                            {station.logoUrl && (
                                                <img
                                                    src={station.logoUrl}
                                                    alt={station.name || t('radio.stationLogo', 'Station logo')}
                                                    className="me-2 rounded"
                                                    style={{ width: 40, height: 40, objectFit: "cover" }}
                                                />
                                            )}
                                            <div>
                                                <h6 className="mb-0">{station.name}</h6>
                                                <small className="text-muted">
                                                    🏳️ {station.countryCode}
                                                    {station.genre && ` · ${station.genre}`}
                                                </small>
                                            </div>
                                        </div>
                                        {station.description && (
                                            <p className="small text-muted flex-grow-1" style={{
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                            }}>
                                                {station.description}
                                            </p>
                                        )}
                                        <div className="d-flex gap-2 mt-auto">
                                            <Focusable id={`ext-radio-play-${station.id}`}>
                                                <button
                                                    className={`btn btn-sm ${playingUrl === station.streamUrl ? "btn-danger" : "btn-primary"}`}
                                                    onClick={() => handlePlay(station)}
                                                >
                                                    {playingUrl === station.streamUrl ? "⏹ Stop" : "▶ Play"}
                                                </button>
                                            </Focusable>
                                            {station.websiteUrl && (
                                                <a
                                                    href={station.websiteUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-sm btn-outline-secondary"
                                                >
                                                    🔗 {t("externalRadio.website", "Website")}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {stationsData && stationsData.totalPages > 1 && (
                        <div className="d-flex justify-content-center gap-3 mt-4">
                            <Focusable id="ext-radio-prev-page">
                                <button
                                    className="btn btn-outline-secondary"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => p - 1)}
                                >
                                    ‹ {t("news.prev", "Previous")}
                                </button>
                            </Focusable>
                            <span className="align-self-center">
                                {page} / {stationsData.totalPages}
                            </span>
                            <Focusable id="ext-radio-next-page">
                                <button
                                    className="btn btn-outline-secondary"
                                    disabled={page >= stationsData.totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    {t("news.next", "Next")} ›
                                </button>
                            </Focusable>
                        </div>
                    )}

                    {isFetching && !isLoading && (
                        <div className="text-center mt-2">
                            <small className="text-muted">{t("common.loading", "Loading...")}</small>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ExternalRadioPage;
