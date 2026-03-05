// LibraryCatalogPage.tsx — Library Catalog Explorer: Songs, Albums, Artists, Files, Scan
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    useLibrarySongsQuery, useCreateLibrarySongMutation, useUpdateLibrarySongMutation, useDeleteLibrarySongMutation, useAutoTagSongMutation,
    useLibraryAlbumsQuery, useCreateLibraryAlbumMutation, useUpdateLibraryAlbumMutation, useDeleteLibraryAlbumMutation,
    useLibraryArtistsQuery, useCreateLibraryArtistMutation, useUpdateLibraryArtistMutation, useDeleteLibraryArtistMutation,
    useAudioFilesQuery, useDeleteAudioFileMutation,
    useLibraryScanImportMutation,
} from "../../scripts/api/apiLibraryCatalog";
import type { Song, Album, Artist } from "../../models/modelsLibrary";
import s from "./LibraryCatalogPage.module.css";

type Tab = "songs" | "albums" | "artists" | "files" | "scan";

const LibraryCatalogPage: React.FC = () => {
    const { t } = useTranslation();
    const [tab, setTab] = useState<Tab>("songs");
    const [search, setSearch] = useState("");

    // ── Debounced search (300 ms) ──
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    return (
        <div className={s.page}>
            <h2 className={s.pageTitle}>
                📀 {t("library.catalogTitle", "Library Catalog")}
            </h2>
            <p className={s.pageDesc}>
                {t("library.catalogDesc", "Manage songs, albums, artists, audio files, and folder scan/import.")}
            </p>

            <div className={s.tabRow}>
                {(["songs", "albums", "artists", "files", "scan"] as Tab[]).map((t2) => (
                    <button key={t2} className={tab === t2 ? s.tabBtnActive : s.tabBtn} onClick={() => { setTab(t2); setSearch(""); }}>
                        {{ songs: <><i className="fa-solid fa-music" />{" "}Songs</>, albums: <><i className="fa-solid fa-compact-disc" />{" "}Albums</>, artists: <><i className="fa-solid fa-microphone" />{" "}Artists</>, files: <><i className="fa-solid fa-folder" />{" "}Files</>, scan: <><i className="fa-solid fa-magnifying-glass" />{" "}Scan</> }[t2]}
                    </button>
                ))}
                {tab !== "scan" && (
                    <>
                        <div className={s.flex1} />
                        <input className={s.inputSearch} placeholder={t("library.search", "Search…")} value={search} onChange={(e) => setSearch(e.target.value)} />
                    </>
                )}
            </div>

            {tab === "songs" && <SongsTab search={debouncedSearch} />}
            {tab === "albums" && <AlbumsTab search={debouncedSearch} />}
            {tab === "artists" && <ArtistsTab search={debouncedSearch} />}
            {tab === "files" && <FilesTab />}
            {tab === "scan" && <ScanTab />}
        </div>
    );
};

// ══════════════ SONGS TAB ══════════════
const SongsTab: React.FC<{ search: string }> = ({ search }) => {
    const { t } = useTranslation();
    const { data: songs = [], isLoading } = useLibrarySongsQuery(search || undefined);
    const createMut = useCreateLibrarySongMutation();
    const updateMut = useUpdateLibrarySongMutation();
    const deleteMut = useDeleteLibrarySongMutation();
    const autoTagMut = useAutoTagSongMutation();

    const [editing, setEditing] = useState<Partial<Song> | null>(null);
    const [editId, setEditId] = useState<number | null>(null);

    const save = () => {
        if (!editing?.title?.trim()) return;
        if (editId) {
            updateMut.mutate({ id: editId, song: editing }, { onSuccess: () => { setEditing(null); setEditId(null); } });
        } else {
            createMut.mutate(editing, { onSuccess: () => { setEditing(null); } });
        }
    };

    return (
        <div>
            <div className={s.sectionHeader}>
                <span className={s.sectionCount}>{songs.length} songs</span>
                <button className={s.btnPri} onClick={() => { setEditing({ title: "" }); setEditId(null); }}>+ {t("library.addSong", "Add Song")}</button>
            </div>

            {editing && (
                <div className={s.cardEdit}>
                    <div className={s.formGrid2}>
                        <div>
                            <label className={s.label}>Title *</label>
                            <input className={s.input} value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                        </div>
                        <div>
                            <label className={s.label}>ISRC</label>
                            <input className={s.input} value={editing.isrc ?? ""} onChange={(e) => setEditing({ ...editing, isrc: e.target.value })} />
                        </div>
                    </div>
                    <div className={s.formActions}>
                        <button className={s.btnPri} onClick={save}>{editId ? "Save" : "Create"}</button>
                        <button className={s.btnSec} onClick={() => { setEditing(null); setEditId(null); }}>Cancel</button>
                    </div>
                </div>
            )}

            {isLoading ? <p className={s.loadingText}>Loading…</p> : (
                <div className={s.listGrid}>
                    {songs.map((sg) => (
                        <div key={sg.id} className={s.listItem}>
                            <div>
                                <div className={s.itemTitle}>{sg.title ?? `Song #${sg.id}`}</div>
                                <div className={s.itemSubtitle}>
                                    {sg.primaryArtist?.name && <span><i className="fa-solid fa-microphone" />{" "}{sg.primaryArtist.name} · </span>}
                                    {sg.album?.title && <span><i className="fa-solid fa-compact-disc" />{" "}{sg.album.title} · </span>}
                                    {sg.isrc && <span>ISRC: {sg.isrc}</span>}
                                </div>
                            </div>
                            <div className={s.itemActions}>
                                <button className={s.btnSuc} title="Auto-tag with AI" onClick={() => autoTagMut.mutate(sg.id!)}>🤖</button>
                                <button className={s.btnSec} onClick={() => { setEditing({ ...sg }); setEditId(sg.id!); }}>✏️</button>
                                <button className={s.btnDan} onClick={() => { if (confirm(`Delete "${sg.title}"?`)) deleteMut.mutate(sg.id!); }}>✖</button>
                            </div>
                        </div>
                    ))}
                    {songs.length === 0 && <p className={s.emptyState}>No songs found.</p>}
                </div>
            )}
        </div>
    );
};

// ══════════════ ALBUMS TAB ══════════════
const AlbumsTab: React.FC<{ search: string }> = ({ search }) => {
    const { t } = useTranslation();
    const { data: albums = [], isLoading } = useLibraryAlbumsQuery(search || undefined);
    const createMut = useCreateLibraryAlbumMutation();
    const updateMut = useUpdateLibraryAlbumMutation();
    const deleteMut = useDeleteLibraryAlbumMutation();

    const [editing, setEditing] = useState<Partial<Album> | null>(null);
    const [editId, setEditId] = useState<number | null>(null);

    const save = () => {
        if (!editing?.title?.trim()) return;
        if (editId) {
            updateMut.mutate({ id: editId, album: editing }, { onSuccess: () => { setEditing(null); setEditId(null); } });
        } else {
            createMut.mutate(editing, { onSuccess: () => { setEditing(null); } });
        }
    };

    return (
        <div>
            <div className={s.sectionHeader}>
                <span className={s.sectionCount}>{albums.length} albums</span>
                <button className={s.btnPri} onClick={() => { setEditing({ title: "" }); setEditId(null); }}>+ {t("library.addAlbum", "Add Album")}</button>
            </div>

            {editing && (
                <div className={s.cardEdit}>
                    <div className={s.formGrid3}>
                        <div>
                            <label className={s.label}>Title *</label>
                            <input className={s.input} value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                        </div>
                        <div>
                            <label className={s.label}>Release Year</label>
                            <input className={s.input} type="number" value={editing.releaseYear ?? ""} onChange={(e) => setEditing({ ...editing, releaseYear: e.target.value ? Number(e.target.value) : undefined })} />
                        </div>
                        <div>
                            <label className={s.label}>Cover URL</label>
                            <input className={s.input} value={editing.coverUrl ?? ""} onChange={(e) => setEditing({ ...editing, coverUrl: e.target.value })} />
                        </div>
                    </div>
                    <div className={s.formActions}>
                        <button className={s.btnPri} onClick={save}>{editId ? "Save" : "Create"}</button>
                        <button className={s.btnSec} onClick={() => { setEditing(null); setEditId(null); }}>Cancel</button>
                    </div>
                </div>
            )}

            {isLoading ? <p className={s.loadingText}>Loading…</p> : (
                <div className={s.listGrid}>
                    {albums.map((a) => (
                        <div key={a.id} className={s.listItemAlbum}>
                            {a.coverUrl ? <img src={a.coverUrl} alt={a.title || 'Album cover'} className={s.albumCover} /> : <div className={s.albumCoverPlaceholder}><i className="fa-solid fa-compact-disc" /></div>}
                            <div className={s.flex1}>
                                <div className={s.itemTitle}>{a.title ?? `Album #${a.id}`}</div>
                                <div className={s.itemSubtitle}>
                                    {a.releaseYear && <span>{a.releaseYear} · </span>}
                                    {(a.songs?.length ?? 0) > 0 && <span>{a.songs!.length} songs</span>}
                                </div>
                            </div>
                            <div className={s.itemActions}>
                                <button className={s.btnSec} onClick={() => { setEditing({ ...a }); setEditId(a.id!); }}>✏️</button>
                                <button className={s.btnDan} onClick={() => { if (confirm(`Delete "${a.title}"?`)) deleteMut.mutate(a.id!); }}>✖</button>
                            </div>
                        </div>
                    ))}
                    {albums.length === 0 && <p className={s.emptyState}>No albums found.</p>}
                </div>
            )}
        </div>
    );
};

// ══════════════ ARTISTS TAB ══════════════
const ArtistsTab: React.FC<{ search: string }> = ({ search }) => {
    const { t } = useTranslation();
    const { data: artists = [], isLoading } = useLibraryArtistsQuery(search || undefined);
    const createMut = useCreateLibraryArtistMutation();
    const updateMut = useUpdateLibraryArtistMutation();
    const deleteMut = useDeleteLibraryArtistMutation();

    const [editing, setEditing] = useState<Partial<Artist> | null>(null);
    const [editId, setEditId] = useState<number | null>(null);

    const save = () => {
        if (!editing?.name?.trim()) return;
        if (editId) {
            updateMut.mutate({ id: editId, artist: editing }, { onSuccess: () => { setEditing(null); setEditId(null); } });
        } else {
            createMut.mutate(editing, { onSuccess: () => { setEditing(null); } });
        }
    };

    return (
        <div>
            <div className={s.sectionHeader}>
                <span className={s.sectionCount}>{artists.length} artists</span>
                <button className={s.btnPri} onClick={() => { setEditing({ name: "" }); setEditId(null); }}>+ {t("library.addArtist", "Add Artist")}</button>
            </div>

            {editing && (
                <div className={s.cardEdit}>
                    <div>
                        <label className={s.label}>Name *</label>
                        <input className={s.input} value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                    </div>
                    <div className={s.formActions}>
                        <button className={s.btnPri} onClick={save}>{editId ? "Save" : "Create"}</button>
                        <button className={s.btnSec} onClick={() => { setEditing(null); setEditId(null); }}>Cancel</button>
                    </div>
                </div>
            )}

            {isLoading ? <p className={s.loadingText}>Loading…</p> : (
                <div className={s.listGrid}>
                    {artists.map((a) => (
                        <div key={a.id} className={s.listItem}>
                            <div>
                                <div className={s.itemTitle}>{a.name ?? `Artist #${a.id}`}</div>
                                {a.detail?.country && <span className={s.artistCountry}>🌍 {a.detail.country}</span>}
                                {a.detail?.bio && <p className={s.artistBio}>{a.detail.bio.slice(0, 120)}…</p>}
                            </div>
                            <div className={s.itemActions}>
                                <button className={s.btnSec} onClick={() => { setEditing({ ...a }); setEditId(a.id!); }}>✏️</button>
                                <button className={s.btnDan} onClick={() => { if (confirm(`Delete "${a.name}"?`)) deleteMut.mutate(a.id!); }}>✖</button>
                            </div>
                        </div>
                    ))}
                    {artists.length === 0 && <p className={s.emptyState}>No artists found.</p>}
                </div>
            )}
        </div>
    );
};

// ══════════════ FILES TAB ══════════════
const FilesTab: React.FC = () => {
    const { data: files = [], isLoading } = useAudioFilesQuery();
    const deleteMut = useDeleteAudioFileMutation();

    const formatSize = (b?: number | null) => b ? `${(b / 1024 / 1024).toFixed(1)} MB` : "—";
    const formatDur = (sec?: number | null) => sec ? `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}` : "—";

    return (
        <div>
            <span className={s.sectionCountBlock}>{files.length} audio files</span>
            {isLoading ? <p className={s.loadingText}>Loading…</p> : (
                <div className={s.tableWrap}>
                    <table className={s.table}>
                        <thead>
                            <tr className={s.tableHeaderRow}>
                                {["File", "Song", "Duration", "Format", "Size", "Genre", "Year", ""].map((h) => (
                                    <th key={h} className={s.tableHeaderCell}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {files.map((f) => (
                                <tr key={f.id} className={s.tableRow}>
                                    <td className={s.tableCellPrimary}>{f.fileName ?? f.filePath?.split("/").pop() ?? "—"}</td>
                                    <td className={s.tableCellSecondary}>{f.song?.title ?? "—"}</td>
                                    <td className={s.tableCellSecondary}>{formatDur(f.duration)}</td>
                                    <td className={s.tableCellSecondary}>{f.audioMimeType ?? "—"}</td>
                                    <td className={s.tableCellSecondary}>{formatSize(f.size)}</td>
                                    <td className={s.tableCellSecondary}>{f.genre ?? "—"}</td>
                                    <td className={s.tableCellSecondary}>{f.year ?? "—"}</td>
                                    <td className={s.tableCellAction}>
                                        <button className={s.btnDan} onClick={() => { if (confirm("Delete this file?")) deleteMut.mutate(f.id!); }}>✖</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {files.length === 0 && <p className={s.emptyState}>No audio files found.</p>}
                </div>
            )}
        </div>
    );
};

// ══════════════ SCAN TAB ══════════════
const ScanTab: React.FC = () => {
    const { t } = useTranslation();
    const [folderPath, setFolderPath] = useState("");
    const [recursive, setRecursive] = useState(true);
    const scanMut = useLibraryScanImportMutation();

    return (
        <div className={s.card}>
            <h4 className={s.scanTitle}>
                {t("library.scanTitle", "Scan & Import Folder")}
            </h4>
            <p className={s.scanDesc}>
                {t("library.scanDesc", "Scan a server folder for audio files and auto-import them into the library catalog.")}
            </p>
            <div className={s.scanRow}>
                <div className={s.scanPathWrap}>
                    <label className={s.label}>{t("library.folderPath", "Folder Path")}</label>
                    <input className={s.input} placeholder="/music/collection" value={folderPath} onChange={(e) => setFolderPath(e.target.value)} />
                </div>
                <div className={s.checkboxRow}>
                    <input type="checkbox" id="scanRecursive" checked={recursive} onChange={(e) => setRecursive(e.target.checked)} />
                    <label htmlFor="scanRecursive" className={s.checkboxLabel}>Recursive</label>
                </div>
                <button className={s.btnSuc} disabled={!folderPath.trim() || scanMut.isPending} onClick={() => scanMut.mutate({ folderPath, recursive })}>
                    {scanMut.isPending ? "Scanning…" : t("library.scanBtn", "Scan & Import")}
                </button>
            </div>
            {scanMut.isSuccess && <p className={s.scanSuccess}><i className="fa-solid fa-check" />{" "}{t("library.scanDone", "Scan and import completed!")}</p>}
            {scanMut.isError && <p className={s.scanError}><i className="fa-solid fa-xmark" />{" "}{t("library.scanError", "Scan failed. Check the folder path.")}</p>}
        </div>
    );
};

export default LibraryCatalogPage;