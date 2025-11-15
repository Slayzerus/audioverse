// src/pages/enjoy/MusicPlayerPage.tsx
import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import GenericPlayer from "../../components/controls/player/GenericPlayer";
//import { GenericPlaylist } from "../../components/controls/playlist/GenericPlaylist";
import type { SongDescriptorDto } from "../../models/modelsPlaylists";
import type { PlayerTrack, PlayerSource } from "../../models/modelsAudio";
import { apiClient, apiPath, API_ROOT, AUTH_BASE, PLAYLIST_BASE, LIBRARY_BASE } from "../../scripts/api/libraryApiClient";
import {
    useAudioRecordsQuery,
    buildStreamUrl,
} from "../../scripts/api/apiLibraryStream";

/// <summary>
/// Page that resolves sources for a playlist and plays them using GenericPlayer.
/// </summary>
const MusicPlayerPage: React.FC = () => {
    type PreferredPlatform = "Auto" | "Tidal" | "YouTube" | "Spotify" | "Library";
    const BACKEND_ORIGIN = new URL(API_ROOT, window.location.href).origin;

    type TidalAuthStatus = { isAuthenticated: boolean; userName?: string };
    type TidalStreamInfo = { url: string; mime?: string; quality?: string; codec?: string; bitrateKbps?: number; note?: string };
    type PerRequestTidalStreams = { request: SongDescriptorDto; streams: TidalStreamInfo[]; notes?: string };
    type GetTidalStreamsResult = { items: PerRequestTidalStreams[]; missingCount: number };

    const fetchTidalAuthStatus = async (): Promise<TidalAuthStatus> => {
        const res = await apiClient.get<TidalAuthStatus>(apiPath(AUTH_BASE, "/tidal/status"));
        return res.data;
    };

    const postGetTidalStreams = async (songs: SongDescriptorDto[]): Promise<GetTidalStreamsResult> => {
        const res = await apiClient.post<GetTidalStreamsResult>(apiPath(PLAYLIST_BASE, "/tidal/streams"), songs);
        return res.data;
    };

    /// <summary>
    /// Searches YouTube by artist and title via Library API and returns a videoId or null.
    /// </summary>
    const searchYouTubeByArtistTitle = async (artist: string, title: string): Promise<string | null> => {
        const res = await apiClient.get<{ videoId: string | null }>(
            apiPath(LIBRARY_BASE, "/youtube/search"),
            { params: { artist, title } }
        );
        return res.data?.videoId ?? null;
    };

    /// <summary>
    /// Opens a centered popup window.
    /// </summary>
    function openCenteredPopup(url: string, name: string, w = 520, h = 720): Window | null {
        const dualScreenLeft = window.screenLeft ?? window.screenX ?? 0;
        const dualScreenTop = window.screenTop ?? window.screenY ?? 0;
        const width = window.innerWidth ?? document.documentElement.clientWidth ?? screen.width;
        const height = window.innerHeight ?? document.documentElement.clientHeight ?? screen.height;
        const systemZoom = width / window.screen.availWidth;
        const left = (width - w) / 2 / systemZoom + dualScreenLeft;
        const top = (height - h) / 2 / systemZoom + dualScreenTop;
        const features = `scrollbars=yes,width=${w},height=${h},top=${top},left=${left},resizable=yes,noopener,noreferrer`;
        return window.open(url, name, features);
    }

    /// <summary>
    /// Initiates TIDAL login in a popup and refetches status on completion.
    /// </summary>
    const loginTidalWithPopup = (onDone?: () => void) => {
        const loginPath = apiPath(AUTH_BASE, "/tidal/login?mode=popup");
        const loginUrl = `${API_ROOT.replace(/\/$/, "")}${loginPath}`;
        const popup = openCenteredPopup(loginUrl, "tidal-auth");

        if (!popup) { window.location.href = loginUrl; return; }

        const onMessage = (ev: MessageEvent) => {
            if (ev.origin !== BACKEND_ORIGIN) return;
            const payload = ev.data;
            if (payload?.type === "tidal:auth") {
                window.removeEventListener("message", onMessage);
                try { popup.close(); } catch { void 0; }
                onDone?.();
            }
        };
        window.addEventListener("message", onMessage);

        const poll = window.setInterval(() => {
            if (popup.closed) {
                window.removeEventListener("message", onMessage);
                window.clearInterval(poll);
                onDone?.();
            }
        }, 800);
    };

    /// <summary>
    /// Logs out from TIDAL.
    /// </summary>
    const logoutTidal = async () => {
        await apiClient.post(apiPath(AUTH_BASE, "/tidal/logout"), {});
    };

    const [preferred, setPreferred] = useState<PreferredPlatform>("Auto");
    const [playlist, setPlaylist] = useState<SongDescriptorDto[]>([]);
    const normalize = (arr: SongDescriptorDto[]): SongDescriptorDto[] =>
        arr.map(({ artist, title, version }) => ({ artist, title, version: version ?? undefined }));
    const [tracks, setTracks] = useState<PlayerTrack[]>([]);
    const [building, setBuilding] = useState(false);
    const library = useAudioRecordsQuery({ staleTime: 60_000 });

    const tidalAuth = useQuery({
        queryKey: ["tidal", "auth-status"],
        queryFn: fetchTidalAuthStatus,
        staleTime: 30_000,
    });

    const norm = (s: string) =>
        (s || "")
            .toLowerCase()
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, " ")
            .trim();

    /// <summary>
    /// Finds a local library record by fuzzy artist/title match.
    /// </summary>
    const findLocalRecord = (artist: string, title: string) => {
        const recs = library.data ?? [];
        const na = norm(artist);
        const nt = norm(title);
        let hit = recs.find(r =>
            (r.artists?.some(a => norm(a) === na) || norm(r.artists?.join(" ") || "") === na) &&
            norm(r.title) === nt
        );
        if (hit) return hit;
        hit = recs.find(r => norm(r.title).includes(nt) && (r.artists?.some(a => norm(a).includes(na)) ?? false));
        return hit;
    };

    /// <summary>
    /// Builds the player tracks with resolved sources for each song in playlist.
    /// </summary>
    const buildPlayerQueue = async () => {
        if (!playlist.length) return;
        setBuilding(true);
        try {
            const mapped: PlayerTrack[] = [];
            let tidalMap: Map<string, TidalStreamInfo[]> | null = null;

            if (preferred === "Tidal" || preferred === "Auto") {
                try {
                    const resp = await postGetTidalStreams(playlist);
                    tidalMap = new Map<string, TidalStreamInfo[]>();
                    for (const it of resp.items ?? []) {
                        const key = `${it.request.artist}|||${it.request.title}|||${it.request.version ?? ""}`;
                        tidalMap.set(key, it.streams ?? []);
                    }
                } catch {
                    tidalMap = null;
                }
            }

            for (const s of playlist) {
                const id = `${s.artist} - ${s.title} (${s.version ?? ""})`;
                const sources: PlayerSource[] = [];

                if (preferred === "Library" || preferred === "Auto") {
                    const rec = findLocalRecord(s.artist, s.title);
                    if (rec?.id) {
                        sources.push({
                            kind: "audio",
                            url: buildStreamUrl(rec.id),
                            label: "Library",
                            codec: rec.codecDescription,
                            quality: rec.bitsPerSample ? `${rec.sampleRateHz / 1000} kHz / ${rec.bitsPerSample}-bit` : undefined,
                            withCredentials: true,
                        });
                    }
                }

                if ((preferred === "Tidal" || preferred === "Auto") && tidalMap) {
                    const k = `${s.artist}|||${s.title}|||${s.version ?? ""}`;
                    const streams = tidalMap.get(k) ?? [];
                    for (const st of streams) {
                        if (st.url?.includes(".m3u8")) {
                            sources.push({
                                kind: "hls",
                                url: st.url,
                                label: st.quality ?? "TIDAL",
                                quality: st.quality,
                                codec: st.codec,
                            });
                        } else if (st.url) {
                            sources.push({ kind: "audio", url: st.url, label: st.quality ?? "TIDAL" });
                        }
                    }
                }

                if (preferred === "YouTube" || preferred === "Auto") {
                    const yt = await searchYouTubeByArtistTitle(s.artist, s.title);
                    if (yt) sources.push({ kind: "youtube", videoId: yt, label: "YouTube" });
                }

                mapped.push({ id, title: s.title, artist: s.artist, sources });
            }

            setTracks(mapped);
        } finally {
            setBuilding(false);
        }
    };

    const canResolve = useMemo(() => playlist.length > 0 && !building, [playlist.length, building]);

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 16, padding: 16 }}>
            {/* prawa kolumna – player */}
            <div style={{ display: "grid", gap: 12 }}>
                <h2 style={{ margin: 0 }}>Player</h2>
                {/* ✅ usunięto nieistniejący prop onReplaceTracks */}
                <GenericPlayer tracks={tracks} autoPlay height={420} />
                {tracks.length > 0 && (
                    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, background: "#fff" }}>
                        <div style={{ fontWeight: 600, marginBottom: 6 }}>Źródła znalezione dla utworów:</div>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {tracks.map((t) => (
                                <li key={t.id} style={{ marginBottom: 6 }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{t.artist} — {t.title}</span>{" "}
                                        <span style={{ color: "#6b7280" }}>
                                            [{t.sources.length ? t.sources.map((s: PlayerSource) => s.kind.toUpperCase()).join(", ") : "brak"}]
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MusicPlayerPage;
