import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";

/* ────────────────────────────────────────────────────────────────
   ExternalMediaLookup — generic debounced autocomplete component
   Works for every media type: books, movies, TV, sports, etc.
   Mirrors the proven pattern from BoardGameCollectionPage.
   ──────────────────────────────────────────────────────────────── */

export interface MediaLookupSource<T> {
    /** Unique key for this source (e.g. "openlibrary", "tmdb") */
    key: string;
    /** Label shown on the toggle button */
    label: string;
    /** Async search function — receives trimmed query, returns results */
    searchFn: (query: string) => Promise<T[]>;
}

export interface ExternalMediaLookupProps<T> {
    /** One or more search sources. When multiple — a toggle bar is shown. */
    sources: MediaLookupSource<T>[];
    /** Render a single suggestion row */
    renderSuggestion: (item: T, sourceKey: string) => React.ReactNode;
    /** Triggered when user picks a suggestion */
    onSelect: (item: T, sourceKey: string) => void;
    /** Placeholder text for the search input */
    placeholder?: string;
    /** Minimum characters before searching (default: 2) */
    minChars?: number;
    /** Debounce delay in ms (default: 300) */
    debounceMs?: number;
    /** Max suggestions to show (default: 6) */
    maxResults?: number;
    /** Whether the lookup is visible / active (default: true) */
    enabled?: boolean;
}

const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    top: "100%",
    zIndex: 50,
    background: "var(--card-bg, #23272f)",
    border: "1px solid var(--border-color, #444)",
    borderRadius: "0 0 8px 8px",
    maxHeight: 340,
    overflowY: "auto",
};

const suggestionRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    cursor: "pointer",
    borderBottom: "1px solid var(--border-color, #333)",
    transition: "background .12s",
};

export function ExternalMediaLookup<T>({
    sources,
    renderSuggestion,
    onSelect,
    placeholder,
    minChars = 2,
    debounceMs = 300,
    maxResults = 6,
    enabled = true,
}: ExternalMediaLookupProps<T>) {
    const { t } = useTranslation();
    const [query, setQuery] = useState("");
    const [activeSource, setActiveSource] = useState(sources[0]?.key ?? "");
    const [suggestions, setSuggestions] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Debounced search
    useEffect(() => {
        if (!enabled) return;
        const trimmed = query.trim();
        if (trimmed.length < minChars) {
            setSuggestions([]);
            setLoading(false);
            return;
        }

        const source = sources.find((s) => s.key === activeSource);
        if (!source) return;

        setLoading(true);
        const timeout = window.setTimeout(async () => {
            try {
                const results = await source.searchFn(trimmed);
                setSuggestions((results ?? []).slice(0, maxResults));
                setOpen(true);
            } catch {
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        }, debounceMs);

        return () => window.clearTimeout(timeout);
    }, [query, activeSource, enabled, minChars, debounceMs, maxResults, sources]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleSelect = useCallback(
        (item: T) => {
            onSelect(item, activeSource);
            setQuery("");
            setSuggestions([]);
            setOpen(false);
        },
        [onSelect, activeSource],
    );

    if (!enabled) return null;

    return (
        <div ref={containerRef} style={{ position: "relative" }}>
            {/* Source toggle (only when >1 source) */}
            {sources.length > 1 && (
                <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                    {sources.map((src) => (
                        <button
                            key={src.key}
                            type="button"
                            onClick={() => {
                                setActiveSource(src.key);
                                setSuggestions([]);
                            }}
                            style={{
                                padding: "3px 10px",
                                fontSize: "0.75rem",
                                borderRadius: 6,
                                border: `1px solid ${activeSource === src.key ? "var(--accent, #5865F2)" : "var(--border-color, #555)"}`,
                                background: activeSource === src.key ? "var(--accent, #5865F2)" : "transparent",
                                color: activeSource === src.key ? "#fff" : "var(--text-primary, #ccc)",
                                cursor: "pointer",
                            }}
                        >
                            {src.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Search input */}
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setOpen(true)}
                placeholder={placeholder ?? t("common.searchExternal", "Search external...")}
                className="form-control form-control-sm"
                style={{ borderRadius: open && suggestions.length > 0 ? "8px 8px 0 0" : 8 }}
            />

            {/* Loading indicator */}
            {loading && (
                <span
                    style={{
                        position: "absolute",
                        right: 10,
                        top: sources.length > 1 ? 36 : 8,
                        fontSize: 12,
                        opacity: 0.5,
                    }}
                >
                    ⏳
                </span>
            )}

            {/* Suggestions dropdown */}
            {open && suggestions.length > 0 && (
                <div style={dropdownStyle}>
                    {suggestions.map((item, idx) => (
                        <div
                            key={idx}
                            style={suggestionRowStyle}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLDivElement).style.background =
                                    "var(--surface-bg, #2a2e35)";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLDivElement).style.background = "transparent";
                            }}
                        >
                            {renderSuggestion(item, activeSource)}
                        </div>
                    ))}
                </div>
            )}

            {/* No results */}
            {open && !loading && query.trim().length >= minChars && suggestions.length === 0 && (
                <div style={{ ...dropdownStyle, padding: "10px 14px", fontSize: 13, opacity: 0.5 }}>
                    {t("common.noResults", "No results")}
                </div>
            )}
        </div>
    );
}

export default ExternalMediaLookup;
