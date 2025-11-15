import React, { useEffect } from "react";
import YouTube, { YouTubeEvent, YouTubePlayer } from "react-youtube";
import type HlsJs from "hls.js";
import { isM3U8 } from "../../../scripts/musicPlayer/musicPlayerUtils";
import type { PlayerTrack } from "../../../models/modelsAudio";
import GenericPlayerStageVisualizer from "./visualizer/StageVisualizer";
import type { VisualizerMode } from "./visualizer/types";

type Props = {
    height: number;
    autoPlay: boolean;
    track?: PlayerTrack;
    source?: PlayerTrack["sources"][number] | null;
    ytRef: React.MutableRefObject<YouTubePlayer | null>;
    audioRef: React.MutableRefObject<HTMLAudioElement | null>;
    hlsRef: React.MutableRefObject<HlsJs | null>;
    setVol: (v: number) => void;
    onEnd: () => void;
    volume: number;
    extractVideoId: (url?: string) => string | undefined;
};

const GenericPlayerStage: React.FC<Props> = ({
                                                 height,
                                                 autoPlay,
                                                 track,
                                                 source,
                                                 ytRef,
                                                 audioRef,
                                                 hlsRef,
                                                 setVol,
                                                 onEnd,
                                                 volume,
                                                 extractVideoId
                                             }) => {

    // init audio/hls source
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.volume = volume;
        audio.crossOrigin = source?.withCredentials ? "use-credentials" : "anonymous";

        // HLS
        if (source?.kind === "hls" && isM3U8(source.url)) {
            const attachNative = () => {
                audio.src = source.url!;
                audio.load();
                if (autoPlay) audio.play().catch(() => {});
            };

            if (audio.canPlayType("application/vnd.apple.mpegurl")) {
                attachNative();
                return;
            }

            (async () => {
                const mod = await import("hls.js");
                const Hls = mod.default;
                if (Hls.isSupported()) {
                    const hls = new Hls({
                        xhrSetup: (xhr: XMLHttpRequest) => {
                            if (source?.withCredentials) xhr.withCredentials = true;
                            if (source?.headers) {
                                for (const [k, v] of Object.entries(source.headers)) xhr.setRequestHeader(k, String(v));
                            }
                        }
                    });
                    hlsRef.current = hls;
                    hls.loadSource(source.url!);
                    hls.attachMedia(audio);
                    hls.on(Hls.Events.MANIFEST_PARSED, () => autoPlay && audio.play().catch(() => {}));
                } else {
                    attachNative();
                }
            })();
        }

        // plain audio
        if (source?.kind === "audio" && source.url) {
            audio.src = source.url;
            audio.load();
            if (autoPlay) audio.play().catch(() => {});
        }
    }, [source?.url, source?.kind, source?.withCredentials, volume, autoPlay]);

    const hasVideo = source?.kind === "youtube";

    // wybór domyślnego trybu (persist w localStorage realizuje wizualizator)
    const defaultMode: VisualizerMode = hasVideo ? "video" : "cover";

    const storageKey = `gp-stage:mode:${source?.kind ?? "none"}`;

    return (
        <div
            className="gp-stage"
            style={{
                width: "100%",
                height,
                background: hasVideo ? "transparent" : "#0f172a",
                borderRadius: 8,
                overflow: "hidden",
                position: "relative",
                display: "grid",
                placeItems: "center",
            }}
        >
            {/* RENDER ŹRÓDŁA */}
            {source?.kind === "youtube" && (
                <YouTube
                    videoId={source.videoId ?? extractVideoId(source.url)}
                    onReady={(ev: YouTubeEvent) => {
                        ytRef.current = ev.target as YouTubePlayer;
                        setVol(volume);
                        if (autoPlay) ev.target.playVideo();
                    }}
                    onEnd={onEnd}
                    opts={{
                        width: "100%",
                        height: "100%",
                        playerVars: { autoplay: autoPlay ? 1 : 0, controls: 0, modestbranding: 1, rel: 0, showinfo: 0, fs: 0, disablekb: 1, iv_load_policy: 3 },
                    }}
                    style={{ width: "100%", height: "100%" }}
                />
            )}

            {(source?.kind === "audio" || source?.kind === "hls") && (
                <>
                    {/* placeholder / okładka — teraz przykrywana przez wizualizator gdy tryb != "video" */}
                    <div style={{ textAlign: "center", color: "#e2e8f0" }}>
                        {track?.coverUrl ? (
                            <img alt="cover" src={track.coverUrl} style={{ height: height - 24, objectFit: "contain" }} />
                        ) : (
                            <div style={{ opacity: 0.8 }}>
                                <div style={{ fontSize: 18, fontWeight: 600 }}>{track?.artist} — {track?.title}</div>
                                <div style={{ marginTop: 8, fontSize: 12, color: "#94a3b8" }}>
                                    {source?.label ?? `${source?.codec ?? ""} ${source?.quality ?? ""}`.trim()}
                                </div>
                            </div>
                        )}
                    </div>

                    <audio
                        ref={audioRef}
                        onEnded={onEnd}
                        onLoadedMetadata={() => {/* duration łapie hook w komponencie nadrzędnym */}}
                        crossOrigin={source?.withCredentials ? "use-credentials" : "anonymous"}
                        style={{ display: "none" }}
                    />
                </>
            )}

            {/* OVERLAY: przełącznik trybów + wizualizacje + VU meter (persist w localStorage) */}
            <GenericPlayerStageVisualizer
                key={`vis-${storageKey}`}
                kind={source?.kind === "hls" ? "hls" : (source?.kind ?? "audio")}
                audioRef={audioRef}
                hlsRef={hlsRef}
                height={height}
                coverUrl={track?.coverUrl}
                title={track?.title}
                subtitle={track?.artist}
                label={source?.label ?? `${source?.codec ?? ""} ${source?.quality ?? ""}`.trim()}
                defaultMode={defaultMode}
                storageKey={storageKey}
            />
        </div>
    );
};

export default GenericPlayerStage;
