import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import DOMPurify from "dompurify";
import {
    fetchSearchPlaces,
    fetchAutocomplete,
    fetchReverseGeocode,
    fetchNearbyEvents,
    fetchDirections,
    fetchTimezone,
    fetchPlaceDetails,
    type GeocodeResult,
    type NearbyEvent,
    type DirectionsResult,
    type TimezoneResult,
    type PlaceDetails,
    type TravelMode,
} from "../../scripts/api/apiLocations";
import GoogleMapEmbed, { type MapMarker, type MapRoute } from "../../components/maps/GoogleMapEmbed";
import css from './LocationExplorerPage.module.css';

// ── Helpers ────────────────────────────────────────────────────────
function useDebounce(value: string, delayMs = 350) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setDebouncedValue(value), delayMs);
        return () => clearTimeout(id);
    }, [value, delayMs]);
    return debouncedValue;
}

// ── Component ──────────────────────────────────────────────────────
const LocationExplorerPage: React.FC = () => {
    const { t } = useTranslation();

    // ── Search / Autocomplete ──────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
    const [autoResults, setAutoResults] = useState<GeocodeResult[]>([]);
    const [searchBusy, setSearchBusy] = useState(false);

    const debouncedSearch = useDebounce(searchQuery);

    // Autocomplete as user types
    useEffect(() => {
        if (debouncedSearch.length < 2) {
            setAutoResults([]);
            return;
        }
        let cancelled = false;
        fetchAutocomplete(debouncedSearch).then((res) => {
            if (!cancelled) setAutoResults(res);
        }).catch(() => { /* Expected: autocomplete API may fail; UI shows empty results */ });
        return () => { cancelled = true; };
    }, [debouncedSearch]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearchBusy(true);
        try {
            const res = await fetchSearchPlaces(searchQuery);
            setSearchResults(res);
            setAutoResults([]);
        } catch { /* Expected: search API may fail; UI shows empty results */ }
        setSearchBusy(false);
    };

    // ── Selected location ──────────────────────────────────────────
    const [selectedPlace, setSelectedPlace] = useState<GeocodeResult | null>(null);
    const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
    const [timezone, setTimezone] = useState<TimezoneResult | null>(null);

    const handleSelectPlace = useCallback(async (place: GeocodeResult) => {
        setSelectedPlace(place);
        setPlaceDetails(null);
        setTimezone(null);

        // Load extra details in parallel
        const promises: Promise<void>[] = [];
        if (place.placeId) {
            promises.push(
                fetchPlaceDetails(place.placeId)
                    .then(setPlaceDetails)
                    .catch(() => { /* Expected: place details fetch is non-critical */ }),
            );
        }
        if (place.latitude && place.longitude) {
            promises.push(
                fetchTimezone(place.latitude, place.longitude)
                    .then(setTimezone)
                    .catch(() => { /* Expected: timezone fetch is non-critical */ }),
            );
        }
        await Promise.all(promises);
    }, []);

    // ── Nearby Events ──────────────────────────────────────────────
    const [nearbyLat, setNearbyLat] = useState("");
    const [nearbyLng, setNearbyLng] = useState("");
    const [nearbyRadius, setNearbyRadius] = useState("10");
    const [nearbyEvents, setNearbyEvents] = useState<NearbyEvent[]>([]);
    const [nearbyBusy, setNearbyBusy] = useState(false);

    const handleFindNearby = async () => {
        const lat = parseFloat(nearbyLat);
        const lng = parseFloat(nearbyLng);
        if (isNaN(lat) || isNaN(lng)) return;
        setNearbyBusy(true);
        try {
            const res = await fetchNearbyEvents(lat, lng, parseFloat(nearbyRadius) || 10);
            setNearbyEvents(res);
        } catch { /* Expected: nearby events API may fail; UI shows empty results */ }
        setNearbyBusy(false);
    };

    // Fill nearby coords from selected place
    const fillNearbyFromSelected = () => {
        if (!selectedPlace) return;
        setNearbyLat(String(selectedPlace.latitude));
        setNearbyLng(String(selectedPlace.longitude));
    };

    // ── Directions ─────────────────────────────────────────────────
    const [dirOriginLat, setDirOriginLat] = useState("");
    const [dirOriginLng, setDirOriginLng] = useState("");
    const [dirDestLat, setDirDestLat] = useState("");
    const [dirDestLng, setDirDestLng] = useState("");
    const [dirMode, setDirMode] = useState<TravelMode>("driving");
    const [directions, setDirections] = useState<DirectionsResult | null>(null);
    const [dirBusy, setDirBusy] = useState(false);

    const handleGetDirections = async () => {
        const oLat = parseFloat(dirOriginLat);
        const oLng = parseFloat(dirOriginLng);
        const dLat = parseFloat(dirDestLat);
        const dLng = parseFloat(dirDestLng);
        if ([oLat, oLng, dLat, dLng].some(isNaN)) return;
        setDirBusy(true);
        try {
            const res = await fetchDirections(oLat, oLng, dLat, dLng, dirMode);
            setDirections(res);
        } catch { /* Expected: directions API may fail; UI shows no route */ }
        setDirBusy(false);
    };

    // ── Reverse Geocode ────────────────────────────────────────────
    const [revLat, setRevLat] = useState("");
    const [revLng, setRevLng] = useState("");
    const [reverseResult, setReverseResult] = useState<GeocodeResult | null>(null);
    const [revBusy, setRevBusy] = useState(false);

    const handleReverse = async () => {
        const lat = parseFloat(revLat);
        const lng = parseFloat(revLng);
        if (isNaN(lat) || isNaN(lng)) return;
        setRevBusy(true);
        try {
            const res = await fetchReverseGeocode(lat, lng);
            setReverseResult(res);
        } catch { /* Expected: reverse geocode API may fail; UI shows no result */ }
        setRevBusy(false);
    };

    // ── Geolocation (browser) ──────────────────────────────────────
    const handleGeolocate = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude.toFixed(6);
                const lng = pos.coords.longitude.toFixed(6);
                setNearbyLat(lat);
                setNearbyLng(lng);
                setRevLat(lat);
                setRevLng(lng);
            },
            () => {},
        );
    };

    // ── Map data ────────────────────────────────────────────────────
    const mapMarkers = useMemo<MapMarker[]>(() => {
        const pins: MapMarker[] = [];
        if (selectedPlace) {
            pins.push({ lat: selectedPlace.latitude, lng: selectedPlace.longitude, label: selectedPlace.name || "Selected" });
        }
        nearbyEvents.forEach((ev) => {
            if (ev.latitude && ev.longitude) {
                pins.push({ lat: ev.latitude, lng: ev.longitude, label: ev.title || `Event #${ev.id}` });
            }
        });
        searchResults.forEach((r) => {
            if (!selectedPlace || r.placeId !== selectedPlace.placeId) {
                pins.push({ lat: r.latitude, lng: r.longitude, label: r.name || r.address });
            }
        });
        return pins;
    }, [selectedPlace, nearbyEvents, searchResults]);

    const mapRoute = useMemo<MapRoute | null>(() => {
        if (!directions) return null;
        const oLat = parseFloat(dirOriginLat);
        const oLng = parseFloat(dirOriginLng);
        const dLat = parseFloat(dirDestLat);
        const dLng = parseFloat(dirDestLng);
        if ([oLat, oLng, dLat, dLng].some(isNaN)) return null;
        return { originLat: oLat, originLng: oLng, destLat: dLat, destLng: dLng, travelMode: dirMode };
    }, [directions, dirOriginLat, dirOriginLng, dirDestLat, dirDestLng, dirMode]);

    const mapCenter = useMemo(() => {
        if (selectedPlace) return { lat: selectedPlace.latitude, lng: selectedPlace.longitude };
        if (nearbyLat && nearbyLng) return { lat: parseFloat(nearbyLat), lng: parseFloat(nearbyLng) };
        return { lat: 52.2297, lng: 21.0122 };
    }, [selectedPlace, nearbyLat, nearbyLng]);

    // ── Render ─────────────────────────────────────────────────────
    return (
        <div className={css.page}>
            <div className={css.headerRow}>
                <h1 className={css.noMargin}>
                    <i className="fa-solid fa-location-dot" />{" "}{t("locations.title", "Lokalizacje i mapa")}
                </h1>
                <button type="button" onClick={handleGeolocate} className={css.btnSecondary} title={t("locations.useGps", "Use GPS")}>
                    🧭 {t("locations.myLocation", "Moja lokalizacja")}
                </button>
            </div>

            {/* ═══ Interactive Map ═══ */}
            <div className={css.card}>
                <h2 className={css.noMargin}>🗺️ {t("locations.mapTitle", "Mapa interaktywna")}</h2>
                <GoogleMapEmbed
                    lat={mapCenter.lat}
                    lng={mapCenter.lng}
                    zoom={selectedPlace ? 15 : 13}
                    height={420}
                    markers={mapMarkers}
                    route={mapRoute}
                />
                {mapMarkers.length > 0 && (
                    <span className={css.pinCount}>
                        <i className="fa-solid fa-thumbtack" />{" "}{mapMarkers.length} {t("locations.pinsOnMap", "pinezek na mapie")}
                    </span>
                )}
            </div>

            <div className={css.sectionGrid}>
                {/* ═══ Search / Autocomplete ═══ */}
                <div className={css.card}>
                    <h2 className={css.noMargin}><i className="fa-solid fa-magnifying-glass" />{" "}{t("locations.searchTitle", "Search for a place")}</h2>
                    <div className={css.searchRow}>
                        <input
                            type="text"
                            placeholder={t("locations.searchPlaceholder", "Restauracja, klub, adres…")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            className={css.input}
                        />
                        <button type="button" onClick={handleSearch} disabled={searchBusy} className={css.btn}>
                            {searchBusy ? "…" : t("locations.search", "Search")}
                        </button>
                    </div>

                    {/* Autocomplete dropdown */}
                    {autoResults.length > 0 && (
                        <div className={css.autocompleteDropdown}>
                            {autoResults.map((r, i) => (
                                <div
                                    key={i}
                                    className={css.autocompleteItem}
                                    onClick={() => {
                                        handleSelectPlace(r);
                                        setSearchQuery(r.name || r.address);
                                        setAutoResults([]);
                                    }}
                                >
                                    <strong>{r.name}</strong>{r.address ? ` — ${r.address}` : ""}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Search results */}
                    {searchResults.length > 0 && (
                        <div className={css.resultsList}>
                            <span className={css.label}>{t("locations.results", "Wyniki")} ({searchResults.length})</span>
                            {searchResults.map((r, i) => (
                                <div key={i} className={css.resultCard}>
                                    <strong>{r.name}</strong>
                                    <span className={css.textSmallMuted}>{r.address}</span>
                                    <span className={css.textSmall}>
                                        {r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleSelectPlace(r)}
                                        className={css.selectBtn}
                                    >
                                        {t("locations.selectPlace", "Select")}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ═══ Selected Place Details ═══ */}
                <div className={css.card}>
                    <h2 className={css.noMargin}><i className="fa-solid fa-thumbtack" />{" "}{t("locations.placeDetails", "Place details")}</h2>
                    {!selectedPlace ? (
                        <p className={css.placeholderText}>
                            {t("locations.noSelection", "Select a place from the search or enter coordinates.")}
                        </p>
                    ) : (
                        <>
                            <div className={css.resultCard}>
                                <strong>{selectedPlace.name}</strong>
                                <span className={css.textMedium}>{selectedPlace.address}</span>
                                <span className={css.textSmallMuted}>
                                    <i className="fa-solid fa-location-dot" />{" "}{selectedPlace.latitude.toFixed(5)}, {selectedPlace.longitude.toFixed(5)}
                                </span>
                                {selectedPlace.placeId && (
                                    <span className={css.textTinyMuted}>
                                        Place ID: {selectedPlace.placeId}
                                    </span>
                                )}
                            </div>

                            {placeDetails && (
                                <div className={css.resultCard}>
                                    <span className={css.label}>{t("locations.detailsFromGoogle", "Google Places data")}</span>
                                    {placeDetails.phone && <span>📞 {placeDetails.phone}</span>}
                                    {placeDetails.website && (
                                        <a href={placeDetails.website} target="_blank" rel="noreferrer" className={css.websiteLink}>
                                            🌐 {placeDetails.website}
                                        </a>
                                    )}
                                    {placeDetails.rating != null && <span>⭐ {placeDetails.rating}/5</span>}
                                    {placeDetails.openingHours && placeDetails.openingHours.length > 0 && (
                                        <div className={css.hoursBlock}>
                                            <strong>🕐 {t("locations.hours", "Hours")}:</strong>
                                            <ul className={css.hoursList}>
                                                {placeDetails.openingHours.map((h, j) => (
                                                    <li key={j}>{h}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {placeDetails.types && placeDetails.types.length > 0 && (
                                        <div>
                                            {placeDetails.types.map((tp) => (
                                                <span key={tp} className={css.tag}>{tp}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {timezone && (
                                <div className={css.resultCard}>
                                    <span className={css.label}>🕐 {t("locations.timezone", "Time zone")}</span>
                                    <span>{timezone.timeZoneName} ({timezone.timeZoneId})</span>
                                    <span className={css.textSmallMuted}>
                                        UTC {timezone.utcOffset >= 0 ? "+" : ""}{timezone.utcOffset}h
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className={css.sectionGrid}>
                {/* ═══ Nearby Events ═══ */}
                <div className={css.card}>
                    <h2 className={css.noMargin}><i className="fa-solid fa-bullseye" />{" "}{t("locations.nearbyTitle", "Nearby events")}</h2>
                    <div className={css.inputRow}>
                        <div className={css.fieldGroup}>
                            <label className={css.label}>Lat</label>
                            <input type="number" step="any" value={nearbyLat} onChange={(e) => setNearbyLat(e.target.value)} className={css.input} />
                        </div>
                        <div className={css.fieldGroup}>
                            <label className={css.label}>Lng</label>
                            <input type="number" step="any" value={nearbyLng} onChange={(e) => setNearbyLng(e.target.value)} className={css.input} />
                        </div>
                        <div className={css.fieldGroupSmall}>
                            <label className={css.label}>Radius (km)</label>
                            <input type="number" step="1" min="1" max="100" value={nearbyRadius} onChange={(e) => setNearbyRadius(e.target.value)} className={css.input} />
                        </div>
                        <button type="button" onClick={handleFindNearby} disabled={nearbyBusy} className={css.btn}>
                            {nearbyBusy ? "…" : t("locations.findNearby", "Search")}
                        </button>
                        {selectedPlace && (
                            <button type="button" onClick={fillNearbyFromSelected} className={css.btnSecondary} title={t("locations.useSelectedPlace", "Use selected place")}>
                                ← {t("locations.useSelected", "Use selected")}
                            </button>
                        )}
                    </div>

                    {nearbyEvents.length > 0 && (
                        <div className={css.resultsList}>
                            {nearbyEvents.map((ev) => (
                                <div key={ev.id} className={css.resultCard}>
                                    <strong>{ev.title}</strong>
                                    {ev.locationName && (
                                        <span className={css.textSmallMuted}><i className="fa-solid fa-location-dot" />{" "}{ev.locationName}</span>
                                    )}
                                    <span className={css.textSmall}>
                                        {ev.distanceKm.toFixed(1)} km
                                        {ev.startTime && ` · ${new Date(ev.startTime).toLocaleString()}`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                    {nearbyEvents.length === 0 && !nearbyBusy && nearbyLat && nearbyLng && (
                        <p className={css.placeholderText}>
                            {t("locations.noNearby", "No events within the given radius.")}
                        </p>
                    )}
                </div>

                {/* ═══ Reverse Geocode ═══ */}
                <div className={css.card}>
                    <h2 className={css.noMargin}><i className="fa-solid fa-rotate" />{" "}{t("locations.reverseTitle", "Reverse geocoding")}</h2>
                    <p className={css.placeholderText}>
                        {t("locations.reverseDesc", "Enter coordinates → get an address.")}
                    </p>
                    <div className={css.inputRow}>
                        <div className={css.fieldGroupMed}>
                            <label className={css.label}>Lat</label>
                            <input type="number" step="any" value={revLat} onChange={(e) => setRevLat(e.target.value)} className={css.input} />
                        </div>
                        <div className={css.fieldGroupMed}>
                            <label className={css.label}>Lng</label>
                            <input type="number" step="any" value={revLng} onChange={(e) => setRevLng(e.target.value)} className={css.input} />
                        </div>
                        <button type="button" onClick={handleReverse} disabled={revBusy} className={css.btn}>
                            {revBusy ? "…" : t("locations.reverse", "Find address")}
                        </button>
                    </div>

                    {reverseResult && (
                        <div className={css.resultCard}>
                            <strong>{reverseResult.name}</strong>
                            <span className={css.textMedium}>{reverseResult.address}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ Directions ═══ */}
            <div className={css.card}>
                <h2 className={css.noMargin}>🗺️ {t("locations.directionsTitle", "Route A → B")}</h2>
                <div className={css.directionsColumns}>
                    <div className={css.directionColumn}>
                        <span className={css.label}>{t("locations.origin", "Point A (origin)")}</span>
                        <div className={css.coordRow}>
                            <input type="number" step="any" placeholder="Lat" value={dirOriginLat} onChange={(e) => setDirOriginLat(e.target.value)} className={css.input} />
                            <input type="number" step="any" placeholder="Lng" value={dirOriginLng} onChange={(e) => setDirOriginLng(e.target.value)} className={css.input} />
                        </div>
                    </div>
                    <div className={css.directionColumn}>
                        <span className={css.label}>{t("locations.destination", "Point B (destination)")}</span>
                        <div className={css.coordRow}>
                            <input type="number" step="any" placeholder="Lat" value={dirDestLat} onChange={(e) => setDirDestLat(e.target.value)} className={css.input} />
                            <input type="number" step="any" placeholder="Lng" value={dirDestLng} onChange={(e) => setDirDestLng(e.target.value)} className={css.input} />
                        </div>
                    </div>
                </div>
                <div className={css.travelModeRow}>
                    <span className={css.label}>{t("locations.travelMode", "Travel mode")}:</span>
                    {(["driving", "walking", "bicycling", "transit"] as TravelMode[]).map((m) => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => setDirMode(m)}
                            className={css.travelModeBtn}
                            style={{
                                backgroundColor: dirMode === m ? "var(--accent, #5865F2)" : "transparent",
                                color: dirMode === m ? "#fff" : "inherit",
                            }}
                        >
                            {m === "driving" && "🚗"}
                            {m === "walking" && "🚶"}
                            {m === "bicycling" && "🚲"}
                            {m === "transit" && "🚌"}
                            {" "}{m}
                        </button>
                    ))}
                    <button type="button" onClick={handleGetDirections} disabled={dirBusy} className={css.btn}>
                        {dirBusy ? "…" : t("locations.getDirections", "Get directions")}
                    </button>
                </div>

                {directions && (
                    <div className={css.resultCard}>
                        <div className={css.directionsSummary}>
                            <span><strong>📏 {t("locations.distance", "Distance")}:</strong> {directions.distanceKm.toFixed(1)} km</span>
                            <span><strong>⏱️ {t("locations.duration", "Duration")}:</strong> {directions.durationMin.toFixed(0)} min</span>
                        </div>
                        {directions.steps && directions.steps.length > 0 && (
                            <details className={css.stepsDetails}>
                                <summary className={css.stepsSummary}>
                                    {t("locations.steps", "Navigation steps")} ({directions.steps.length})
                                </summary>
                                <ol className={css.stepsList}>
                                    {directions.steps.map((s, i) => (
                                        <li key={i} className={css.stepItem}>
                                            <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(s.instruction) }} />
                                            <span className={css.mutedText}> — {s.distanceKm.toFixed(2)} km</span>
                                        </li>
                                    ))}
                                </ol>
                            </details>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LocationExplorerPage;
