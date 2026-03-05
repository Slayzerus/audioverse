// LocationPicker.tsx — Autocomplete address search + saved locations picker
import React, { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { EventLocation } from "../../../models/modelsKaraoke";
import {
    useLocationsQuery,
    useAutocompleteQuery,
    useCreateLocationMutation,
    type GeocodeResult,
    type CreateLocationDto,
} from "../../../scripts/api/apiLocations";

interface Props {
    /** Currently selected location id (if editing existing) */
    value?: number;
    /** Called when user selects / creates a location */
    onChange?: (location: EventLocation) => void;
}

const LocationPicker: React.FC<Props> = ({ value, onChange }) => {
    const { t } = useTranslation();
    const [search, setSearch] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [tab, setTab] = useState<"search" | "saved">("search");
    const wrapRef = useRef<HTMLDivElement>(null);

    const { data: saved = [] } = useLocationsQuery();
    const { data: suggestions = [], isFetching: searching } = useAutocompleteQuery(search);
    const createMut = useCreateLocationMutation();

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleSelectSuggestion = useCallback(
        (s: GeocodeResult) => {
            const dto: CreateLocationDto = {
                name: s.name || s.address,
                address: s.address,
                latitude: s.latitude,
                longitude: s.longitude,
                placeId: s.placeId,
            };
            createMut.mutate(dto, {
                onSuccess: (created) => {
                    onChange?.(created);
                    setShowDropdown(false);
                    setSearch("");
                },
            });
        },
        [createMut, onChange],
    );

    const handleSelectSaved = useCallback(
        (loc: EventLocation) => {
            onChange?.(loc);
            setShowDropdown(false);
        },
        [onChange],
    );

    const selectedName = saved.find((l) => l.id === value)?.name ?? "";

    return (
        <div ref={wrapRef} style={{ position: "relative" }}>
            {/* Display current value */}
            <input
                type="text"
                readOnly
                value={selectedName}
                placeholder={t("locations.selectPlaceholder", "Select a location...")}
                onClick={() => setShowDropdown(true)}
                style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid var(--bs-border-color, #ced4da)",
                    borderRadius: "6px",
                    cursor: "pointer",
                }}
            />

            {showDropdown && (
                <div
                    style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        maxHeight: 340,
                        overflowY: "auto",
                        backgroundColor: "var(--bs-body-bg, #fff)",
                        border: "1px solid var(--bs-border-color, #dee2e6)",
                        borderRadius: "0 0 6px 6px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                        zIndex: 9999,
                    }}
                >
                    {/* Tabs */}
                    <div style={{ display: "flex", borderBottom: "1px solid var(--bs-border-color, #dee2e6)" }}>
                        {(["search", "saved"] as const).map((t2) => (
                            <button
                                key={t2}
                                onClick={() => setTab(t2)}
                                style={{
                                    flex: 1,
                                    padding: "8px",
                                    border: "none",
                                    borderBottom: tab === t2 ? "2px solid #0d6efd" : "2px solid transparent",
                                    background: "none",
                                    cursor: "pointer",
                                    fontWeight: tab === t2 ? 600 : 400,
                                    fontSize: "0.85rem",
                                }}
                            >
                                {t2 === "search"
                                    ? t("locations.searchTab", "Search")
                                    : t("locations.savedTab", "Saved")}
                            </button>
                        ))}
                    </div>

                    {tab === "search" && (
                        <>
                            <div style={{ padding: "8px" }}>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={t("locations.searchPlaceholder", "Type an address...")}
                                    autoFocus
                                    style={{
                                        width: "100%",
                                        padding: "6px 10px",
                                        border: "1px solid var(--bs-border-color, #ced4da)",
                                        borderRadius: "4px",
                                    }}
                                />
                            </div>
                            {searching && (
                                <div style={{ padding: "10px", textAlign: "center", opacity: 0.5, fontSize: "0.85rem" }}>
                                    {t("common.searching", "Searching...")}
                                </div>
                            )}
                            {!searching && suggestions.length === 0 && search.length >= 2 && (
                                <div style={{ padding: "10px", textAlign: "center", opacity: 0.5, fontSize: "0.85rem" }}>
                                    {t("locations.noResults", "No results")}
                                </div>
                            )}
                            {suggestions.map((s, idx) => (
                                <div
                                    key={`${s.placeId ?? idx}`}
                                    onClick={() => handleSelectSuggestion(s)}
                                    style={{
                                        padding: "8px 12px",
                                        cursor: "pointer",
                                        borderBottom: "1px solid var(--bs-border-color, #eee)",
                                    }}
                                    onMouseEnter={(e) => ((e.target as HTMLElement).style.backgroundColor = "var(--bs-secondary-bg, #f8f9fa)")}
                                    onMouseLeave={(e) => ((e.target as HTMLElement).style.backgroundColor = "transparent")}
                                >
                                    <div style={{ fontWeight: 500, fontSize: "0.9rem" }}>{s.name || s.address}</div>
                                    {s.name && s.address && (
                                        <div style={{ fontSize: "0.78rem", opacity: 0.6 }}>{s.address}</div>
                                    )}
                                </div>
                            ))}
                        </>
                    )}

                    {tab === "saved" && (
                        <>
                            {saved.length === 0 ? (
                                <div style={{ padding: "16px", textAlign: "center", opacity: 0.5, fontSize: "0.85rem" }}>
                                    {t("locations.noSaved", "No saved locations")}
                                </div>
                            ) : (
                                saved.map((loc) => (
                                    <div
                                        key={loc.id}
                                        onClick={() => handleSelectSaved(loc)}
                                        style={{
                                            padding: "8px 12px",
                                            cursor: "pointer",
                                            borderBottom: "1px solid var(--bs-border-color, #eee)",
                                            backgroundColor: loc.id === value ? "var(--bs-info-bg-subtle, #e8f4fd)" : "transparent",
                                        }}
                                    >
                                        <div style={{ fontWeight: 500, fontSize: "0.9rem" }}>{loc.name}</div>
                                        {loc.formattedAddress && (
                                            <div style={{ fontSize: "0.78rem", opacity: 0.6 }}>{loc.formattedAddress}</div>
                                        )}
                                    </div>
                                ))
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default LocationPicker;
