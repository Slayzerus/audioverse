import React, { useCallback, useEffect, useRef, useState } from "react";
import { GenericPlaylistItem } from "./GenericPlaylistItem";
import type { SongDescriptorDto } from "../../../models/modelsPlaylists";

export type PlaylistRow = SongDescriptorDto & { id: string };

export interface GenericPlaylistProps {
    value?: SongDescriptorDto[];
    defaultValue?: SongDescriptorDto[];
    onChange?: (songs: SongDescriptorDto[]) => void;

    allowVersion?: boolean;
    maxItems?: number;

    addButtonLabel?: string;
    emptyState?: React.ReactNode;
    readOnly?: boolean;

    autoFocusNewItem?: boolean;
    enableBulkPaste?: boolean;
}

/// <summary>
/// Generates a short random id string.
/// </summary>
const uid = () => Math.random().toString(36).slice(2, 10);

/// <summary>
/// Maps DTO array to internal rows with local ids.
/// </summary>
const toRows = (arr: SongDescriptorDto[] | undefined): PlaylistRow[] =>
    (arr ?? []).map((x) => ({ id: uid(), ...x }));

/// <summary>
/// Strips local ids, returning DTO array.
/// </summary>
const stripIds = (rows: PlaylistRow[]): SongDescriptorDto[] =>
    rows.map(({ id: _id, ...rest }) => rest);

const defaultEmptyState = (
    <div style={{ padding: "0.75rem", color: "#777", fontStyle: "italic" }}>
        Brak utworów. Dodaj pierwszy poniżej.
    </div>
);

/// <summary>
/// Parses a single line into SongDescriptorDto:
/// "Artist - Title (Version)" / "Artist – Title [Version]" / "Artist;Title;Version".
/// </summary>
export const parseLineToSong = (line: string): SongDescriptorDto | null => {
    const s = line.trim();
    if (!s) return null;

    const split = s.split(/\s[-–]\s/);
    if (split.length < 2) {
        const csv = s.split(/[;|]/).map((x) => x.trim());
        if (csv.length >= 2) return { artist: csv[0], title: csv[1], version: csv[2] || undefined };
        return null;
    }
    const artist = split[0].trim();
    const rest = split.slice(1).join(" - ").trim();

    const m = rest.match(/^(.*?)\s*[([](.+?)[)\]]\s*$/);
    if (m) {
        const title = m[1].trim();
        const version = m[2].trim();
        return { artist, title, version: version || undefined };
    }
    return { artist, title: rest, version: undefined };
};

export const GenericPlaylist: React.FC<GenericPlaylistProps> = ({
                                                                    value,
                                                                    defaultValue,
                                                                    onChange,
                                                                    allowVersion = true,
                                                                    maxItems,
                                                                    addButtonLabel = "Dodaj utwór",
                                                                    emptyState = defaultEmptyState,
                                                                    readOnly = false,
                                                                    autoFocusNewItem = true, // reserved for future autofocus logic
                                                                    enableBulkPaste = true,
                                                                }) => {
    const isControlled = value !== undefined;
    const [rows, setRows] = useState<PlaylistRow[]>(() => (value ? toRows(value) : toRows(defaultValue)));
    const [bulkText, setBulkText] = useState<string>("");

    // DnD
    const dragIdRef = useRef<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    // controlled sync
    useEffect(() => {
        if (isControlled) setRows(toRows(value));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isControlled, JSON.stringify(value)]);

    const emitChange = useCallback((next: PlaylistRow[]) => {
        onChange?.(stripIds(next));
    }, [onChange]);

    const setRowsAndEmit = useCallback((updater: (prev: PlaylistRow[]) => PlaylistRow[]) => {
        if (isControlled) {
            const next = updater(toRows(value));
            emitChange(next);
        } else {
            setRows((prev) => {
                const next = updater(prev);
                emitChange(next);
                return next;
            });
        }
    }, [emitChange, isControlled, value]);

    const canAddMore = maxItems ? rows.length < maxItems : true;

    const addEmptyRow = useCallback(() => {
        if (!canAddMore || readOnly) return;
        setRowsAndEmit((prev) => [...prev, { id: uid(), artist: "", title: "", version: undefined }]);
    }, [canAddMore, readOnly, setRowsAndEmit]);

    const updateRow = useCallback((id: string, patch: Partial<SongDescriptorDto>) => {
        setRowsAndEmit((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    }, [setRowsAndEmit]);

    const removeRow = useCallback((id: string) => {
        if (readOnly) return;
        setRowsAndEmit((prev) => prev.filter((r) => r.id !== id));
    }, [readOnly, setRowsAndEmit]);

    const moveRowBy = useCallback((id: string, dir: -1 | 1) => {
        setRowsAndEmit((prev) => {
            const idx = prev.findIndex((r) => r.id === id);
            if (idx < 0) return prev;
            const to = idx + dir;
            if (to < 0 || to >= prev.length) return prev;
            const copy = [...prev];
            const [item] = copy.splice(idx, 1);
            copy.splice(to, 0, item);
            return copy;
        });
    }, [setRowsAndEmit]);

    /// <summary>
    /// Reorders a row to the requested 1-based position.
    /// </summary>
    const changeLp = useCallback((id: string, newLp: number) => {
        setRowsAndEmit((prev) => {
            const from = prev.findIndex((r) => r.id === id);
            if (from < 0) return prev;
            const to = Math.max(0, Math.min(prev.length - 1, newLp - 1));
            if (from === to) return prev;
            const copy = [...prev];
            const [item] = copy.splice(from, 1);
            copy.splice(to, 0, item);
            return copy;
        });
    }, [setRowsAndEmit]);

    // DnD handlers (outer <li>)
    const onDragStart = (id: string) => (e: React.DragEvent) => {
        if (readOnly) return;
        dragIdRef.current = id;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", id);
    };
    const onDragOver = (id: string) => (e: React.DragEvent) => {
        if (readOnly) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverId(id);
    };
    const onDragLeave = (_id: string) => () => setDragOverId((cur) => (cur === _id ? null : cur));
    const onDrop = (id: string) => (e: React.DragEvent) => {
        if (readOnly) return;
        e.preventDefault();
        const draggedId = dragIdRef.current ?? e.dataTransfer.getData("text/plain");
        setDragOverId(null);
        dragIdRef.current = null;

        if (!draggedId || draggedId === id) return;

        setRowsAndEmit((prev) => {
            const from = prev.findIndex((r) => r.id === draggedId);
            const to = prev.findIndex((r) => r.id === id);
            if (from < 0 || to < 0 || from === to) return prev;
            const copy = [...prev];
            const [item] = copy.splice(from, 1);
            copy.splice(to, 0, item);
            return copy;
        });
    };
    const onDragEnd = () => { dragIdRef.current = null; setDragOverId(null); };

    // bulk add – after manual confirmation
    const addFromBulk = useCallback(() => {
        if (!enableBulkPaste || readOnly) return;
        const lines = bulkText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const parsed = lines.map(parseLineToSong).filter((x): x is SongDescriptorDto => !!x);
        if (parsed.length === 0) return;

        setRowsAndEmit((prev) => {
            const maxToAdd = (maxItems ?? Infinity) - prev.length;
            const toAdd = parsed.slice(0, Math.max(0, maxToAdd)).map((p) => ({ id: uid(), ...p }));
            return [...prev, ...toAdd];
        });
        setBulkText("");
    }, [enableBulkPaste, readOnly, bulkText, maxItems, setRowsAndEmit]);

    useEffect(() => { /* reserved for autofocus */ }, [rows.length, autoFocusNewItem]);

    return (
        <div className="gp-container" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
            <div className="gp-header" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>Playlist</h3>
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    <button
                        type="button"
                        onClick={addEmptyRow}
                        disabled={!canAddMore || readOnly}
                        className="gp-add"
                        style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #d1d5db", background: "#f9fafb" }}
                        aria-label="Dodaj utwór"
                    >
                        + {addButtonLabel}
                    </button>
                </div>
            </div>

            {rows.length === 0 ? (
                <div className="gp-empty">{emptyState}</div>
            ) : (
                <ol className="gp-list" style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
                    {rows.map((row, idx) => {
                        const isOver = dragOverId === row.id;
                        return (
                            <li
                                key={row.id}
                                draggable={!readOnly}
                                onDragStart={onDragStart(row.id)}
                                onDragOver={onDragOver(row.id)}
                                onDragLeave={onDragLeave(row.id)}
                                onDrop={onDrop(row.id)}
                                onDragEnd={onDragEnd}
                                style={{
                                    border: isOver ? "2px dashed #6366f1" : "2px solid transparent",
                                    borderRadius: 8,
                                    padding: isOver ? 4 : 0,
                                }}
                            >
                                <GenericPlaylistItem
                                    id={row.id}
                                    index={idx}
                                    lp={idx + 1}
                                    onChangeLp={(n: number) => changeLp(row.id, n)}
                                    artist={row.artist}
                                    title={row.title}
                                    version={allowVersion ? (row.version ?? undefined) : undefined}
                                    allowVersion={allowVersion}
                                    onChange={(patch) => updateRow(row.id, patch)}
                                    onRemove={() => removeRow(row.id)}
                                    onMoveUp={() => moveRowBy(row.id, -1)}
                                    onMoveDown={() => moveRowBy(row.id, 1)}
                                    canMoveUp={idx > 0}
                                    canMoveDown={idx < rows.length - 1}
                                    readOnly={readOnly}
                                    dragHandleProps={{ onDragStart: onDragStart(row.id) }}
                                />
                            </li>
                        );
                    })}
                </ol>
            )}

            {enableBulkPaste && !readOnly && (
                <div style={{ marginTop: 12 }}>
                    <details>
                        <summary style={{ cursor: "pointer", color: "#374151" }}>Wklej wiele pozycji naraz</summary>
                        <div style={{ marginTop: 6 }}>
              <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`Wklej linie w formacie:\nArtist - Title (Version)\nArtist – Title [Remastered 2011]\nLUB: Artist;Title;Version`}
                  rows={3}
                  style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 6, padding: 8, fontFamily: "inherit" }}
              />
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                                <div style={{ color: "#6b7280", fontSize: 12 }}>
                                    Każda linia zostanie dodana jako osobny utwór.
                                </div>
                                <button
                                    type="button"
                                    onClick={addFromBulk}
                                    disabled={!bulkText.trim()}
                                    style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #d1d5db", background: "#f9fafb" }}
                                >
                                    Dodaj z listy
                                </button>
                            </div>
                        </div>
                    </details>
                </div>
            )}
        </div>
    );
};

export default GenericPlaylist;
