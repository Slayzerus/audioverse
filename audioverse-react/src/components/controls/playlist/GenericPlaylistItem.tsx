import React, { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faYoutube, faSpotify } from "@fortawesome/free-brands-svg-icons";
import { faGem, faMusic, faWaveSquare } from "@fortawesome/free-solid-svg-icons";

/// <summary>
/// Supported external source kinds rendered as small selectable icons.
/// </summary>
export type SourceKind = "youtube" | "tidal" | "spotify" | "hls" | "audio";

/// <summary>
/// Props for a single playlist row component.
/// </summary>
export interface GenericPlaylistItemProps {
    /// <summary>Stable internal id for DnD and updates.</summary>
    id: string;
    /// <summary>Zero-based index in the list.</summary>
    index: number;

    /// <summary>Artist name.</summary>
    artist: string;
    /// <summary>Song title.</summary>
    title: string;
    /// <summary>Optional version/remix tag.</summary>
    version?: string | undefined;

    /// <summary>Controls if "version" input is visible.</summary>
    allowVersion?: boolean;
    /// <summary>Disables all editing and reordering.</summary>
    readOnly?: boolean;

    /// <summary>Patches a subset of fields.</summary>
    onChange: (patch: { artist?: string; title?: string; version?: string | undefined }) => void;
    /// <summary>Removes the row.</summary>
    onRemove: () => void;
    /// <summary>Moves the row up by one.</summary>
    onMoveUp: () => void;
    /// <summary>Moves the row down by one.</summary>
    onMoveDown: () => void;

    /// <summary>Whether moving up is currently possible.</summary>
    canMoveUp?: boolean;
    /// <summary>Whether moving down is currently possible.</summary>
    canMoveDown?: boolean;

    /// <summary>Optional explicit position (1-based). If omitted, derived from index+1.</summary>
    lp?: number;
    /// <summary>Changes the position (1-based) – caller handles reordering.</summary>
    onChangeLp?: (n: number) => void;

    /// <summary>Available sources to render as icons.</summary>
    sourcesAvailable?: SourceKind[];
    /// <summary>Currently selected source (highlighted).</summary>
    activeSource?: SourceKind;
    /// <summary>Click on an icon to select a source.</summary>
    onSelectSource?: (kind: SourceKind) => void;

    /// <summary>
    /// Optional drag handle props if you want a dedicated handle inside the row.
    /// Not required when the outer container is already draggable.
    /// </summary>
    dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

/// <summary>
/// A single editable playlist row with optional source icons and actions.
/// </summary>
export const GenericPlaylistItem: React.FC<GenericPlaylistItemProps> = ({
                                                                            id,
                                                                            index,
                                                                            artist,
                                                                            title,
                                                                            version,
                                                                            allowVersion = true,
                                                                            readOnly = false,
                                                                            onChange,
                                                                            onRemove,
                                                                            onMoveUp,
                                                                            onMoveDown,
                                                                            canMoveUp = true,
                                                                            canMoveDown = true,
                                                                            lp,
                                                                            onChangeLp,
                                                                            sourcesAvailable = [],
                                                                            activeSource,
                                                                            onSelectSource,
                                                                            dragHandleProps,
                                                                        }) => {
    const artistRef = useRef<HTMLInputElement | null>(null);

    // Autofocus on first empty artist field (newly added row).
    useEffect(() => {
        if (!artist && artistRef.current) {
            artistRef.current.focus();
        }
    }, [artist]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (readOnly) return;
        if (e.key === "Enter") {
            const form = (e.target as HTMLElement).closest("div.gpi-row");
            const inputs = form?.querySelectorAll<HTMLInputElement>("input[data-role='field']");
            if (!inputs || inputs.length === 0) return;
            const idx = Array.from(inputs).indexOf(e.target as HTMLInputElement);
            const next = inputs[idx + 1] ?? inputs[0];
            next?.focus();
        }
    };

    // Render single source icon button.
    const renderSourceIcon = (kind: SourceKind) => {
        const available = sourcesAvailable.includes(kind);
        const selected = activeSource === kind;

        const baseStyle: React.CSSProperties = {
            width: 30,
            height: 30,
            display: "grid",
            placeItems: "center",
            borderRadius: 6,
            border: "1px solid #e5e7eb",
            background: selected ? "#eef2ff" : "#fff",
            opacity: available ? 1 : 0.35,
            cursor: available && onSelectSource && !readOnly ? "pointer" : "default",
            transition: "transform .05s ease",
        };

        const color =
            kind === "youtube" ? "#FF0000" :
                kind === "spotify" ? "#1DB954" :
                    kind === "tidal"   ? "#111827" :
                        kind === "hls"     ? "#7C3AED" :
                            "#374151";

        const icon =
            kind === "youtube" ? faYoutube :
                kind === "spotify" ? faSpotify :
                    kind === "tidal"   ? faGem :
                        kind === "hls"     ? faWaveSquare :
                            faMusic;

        const label =
            kind === "youtube" ? "YouTube" :
                kind === "spotify" ? "Spotify" :
                    kind === "tidal"   ? "TIDAL" :
                        kind === "hls"     ? "HLS" :
                            "Audio";

        const onClick = () => {
            if (!available || !onSelectSource || readOnly) return;
            onSelectSource(kind);
        };

        return (
            <button
                key={kind}
                type="button"
                title={label}
                onClick={onClick}
                disabled={!available || readOnly}
                style={baseStyle}
                aria-pressed={selected}
                aria-label={`Źródło: ${label}${selected ? " (wybrane)" : ""}`}
            >
                <FontAwesomeIcon icon={icon} style={{ color }} />
            </button>
        );
    };

    const ICON_ORDER: SourceKind[] = ["youtube", "tidal", "spotify", "hls", "audio"];

    const lpValue = typeof lp === "number" ? lp : index + 1;

    return (
        <div
            className="gpi-row"
            role="group"
            aria-label={`Utwór ${index + 1}`}
            style={{
                display: "grid",
                gridTemplateColumns: allowVersion
                    ? "56px 1fr 1fr 1fr auto auto"
                    : "56px 1fr 1fr auto auto",
                gap: 8,
                alignItems: "center",
            }}
        >
            {/* Lp (1-based position) */}
            <input
                type="number"
                min={1}
                value={lpValue}
                onChange={(e) => onChangeLp?.(Number(e.target.value))}
                disabled={readOnly || !onChangeLp}
                aria-label="Lp"
                title="Pozycja na liście"
                style={lpInputStyle}
            />

            <input
                ref={artistRef}
                data-role="field"
                type="text"
                value={artist}
                onChange={(e) => onChange({ artist: e.target.value })}
                placeholder="Artist"
                onKeyDown={handleKeyDown}
                disabled={readOnly}
                aria-label="Artist"
                className="gpi-input"
                style={inputStyle}
            />
            <input
                data-role="field"
                type="text"
                value={title}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder="Title"
                onKeyDown={handleKeyDown}
                disabled={readOnly}
                aria-label="Title"
                className="gpi-input"
                style={inputStyle}
            />
            {allowVersion && (
                <input
                    data-role="field"
                    type="text"
                    value={version ?? ""}
                    onChange={(e) => onChange({ version: e.target.value || undefined })}
                    placeholder="Version (optional)"
                    onKeyDown={handleKeyDown}
                    disabled={readOnly}
                    aria-label="Version"
                    className="gpi-input"
                    style={inputStyle}
                />
            )}

            {/* Source icons (if provided) */}
            <div
                className="gpi-sources"
                style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}
                aria-label="Dostępne źródła"
            >
                {ICON_ORDER.map(renderSourceIcon)}
            </div>

            {/* Row actions */}
            <div className="gpi-actions" style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                {/* Optional drag handle (inactive if no dragHandleProps passed) */}
                {dragHandleProps && (
                    <button
                        type="button"
                        {...dragHandleProps}
                        draggable
                        aria-label="Przenieś (przeciągnij)"
                        title="Przenieś (przeciągnij)"
                        style={iconBtnStyle}
                    >
                        ≡
                    </button>
                )}
                <button
                    type="button"
                    onClick={onMoveUp}
                    disabled={!canMoveUp || readOnly}
                    aria-label="Przesuń w górę"
                    title="W górę"
                    style={iconBtnStyle}
                >
                    ↑
                </button>
                <button
                    type="button"
                    onClick={onMoveDown}
                    disabled={!canMoveDown || readOnly}
                    aria-label="Przesuń w dół"
                    title="W dół"
                    style={iconBtnStyle}
                >
                    ↓
                </button>
                <button
                    type="button"
                    onClick={onRemove}
                    disabled={readOnly}
                    aria-label="Usuń"
                    title="Usuń"
                    style={{ ...iconBtnStyle, color: "#b91c1c" }}
                >
                    ✕
                </button>
            </div>
        </div>
    );
};

const lpInputStyle: React.CSSProperties = {
    width: 48,
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    padding: "8px 6px",
    fontSize: 14,
    textAlign: "center",
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    padding: "8px 10px",
    fontSize: 14,
};

const iconBtnStyle: React.CSSProperties = {
    border: "1px solid #d1d5db",
    background: "#fff",
    padding: "6px 8px",
    borderRadius: 6,
    cursor: "pointer",
};
