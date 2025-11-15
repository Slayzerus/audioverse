// AudioClipEditor.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Waveform from "../Waveform";
import AudioClipAnalyzer from "../AudioClipAnalyzer";
import AudioClipInfo from "../AudioClipInfo";

export type AudioClipEditorProps = {
    file: File;
    className?: string;
    initialTab?: "waveform" | "info" | "analysis";
};

type TabButtonProps = {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
};

type TabKey = "waveform" | "info" | "analysis";

const formatTime = (sec: number): string => {
    if (!Number.isFinite(sec) || sec < 0) sec = 0;
    const s = Math.floor(sec % 60);
    const m = Math.floor(sec / 60);
    return `${m}:${String(s).padStart(2, "0")}`;
};

const AudioClipEditor: React.FC<AudioClipEditorProps> = ({
                                                             file,
                                                             className,
                                                             initialTab = "waveform",
                                                         }) => {
    const [tab, setTab] = useState<TabKey>(initialTab);

    // odtwarzanie
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [duration, setDuration] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const rafRef = useRef<number | null>(null);

    // zoom (powiększamy szerokość canvasa – Waveform rysuje całość do podanego width)
    const [zoom, setZoom] = useState<number>(1); // 1x, 2x, 4x...
    const canvasWidth = 600 * Math.max(1, Math.min(zoom, 8));

    // wczytanie pliku do <audio> i Waveform
    useEffect(() => {
        const url = URL.createObjectURL(file);
        setBlobUrl(url);
        setAudioBlob(file);
        return () => {
            URL.revokeObjectURL(url);
            setBlobUrl(null);
            setAudioBlob(null);
        };
    }, [file]);

    // podłącz zdarzenia odtwarzacza
    useEffect(() => {
        const el = audioRef.current;
        if (!el) return;

        const onLoaded = () => {
            setDuration(el.duration);
        };
        const onTime = () => {
            setCurrentTime(el.currentTime);
        };
        const onEnded = () => {
            cancelAnim();
            setCurrentTime(el.duration || 0);
        };

        el.addEventListener("loadedmetadata", onLoaded);
        el.addEventListener("timeupdate", onTime);
        el.addEventListener("ended", onEnded);

        return () => {
            el.removeEventListener("loadedmetadata", onLoaded);
            el.removeEventListener("timeupdate", onTime);
            el.removeEventListener("ended", onEnded);
        };
    }, []);

    // ręczny „tick” (gdy przeglądarka nie wywołuje timeupdate zbyt często)
    const tick = () => {
        const el = audioRef.current;
        if (el) setCurrentTime(el.currentTime);
        rafRef.current = requestAnimationFrame(tick);
    };
    const cancelAnim = () => {
        if (rafRef.current != null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    };

    // sterowanie
    const play = () => {
        const el = audioRef.current;
        if (!el) return;
        void el.play();
        if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick);
    };
    const pause = () => {
        audioRef.current?.pause();
        cancelAnim();
    };
    const stop = () => {
        const el = audioRef.current;
        if (!el) return;
        el.pause();
        el.currentTime = 0;
        setCurrentTime(0);
        cancelAnim();
    };
    const seek = (deltaSec: number) => {
        const el = audioRef.current;
        if (!el) return;
        el.currentTime = Math.max(0, Math.min((el.currentTime || 0) + deltaSec, duration || 0));
    };

    const fileInfo = useMemo(
        () => `${file.name} • ${(file.size / 1024 / 1024).toFixed(2)} MB`,
        [file]
    );

    return (
        <div className={"w-full max-w-5xl mx-auto " + (className ?? "")}>
            {/* header */}
            <div className="mb-3 flex items-center justify-between gap-3">
                <div className="font-semibold">{fileInfo}</div>
                <div className="text-sm text-gray-500">
                    {formatTime(currentTime)} / {formatTime(duration)}
                </div>
            </div>

            {/* tabs */}
            <div className="border-b flex gap-2">
                <TabButton active={tab === "waveform"} onClick={() => setTab("waveform")}>
                    Waveform
                </TabButton>
                <TabButton active={tab === "info"} onClick={() => setTab("info")}>
                    Info
                </TabButton>
                <TabButton active={tab === "analysis"} onClick={() => setTab("analysis")}>
                    Analysis
                </TabButton>
            </div>

            {/* content */}
            {tab === "waveform" && (
                <div className="p-3 space-y-3">
                    {/* toolbar */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button className="btn" onClick={play}>▶️ Play</button>
                        <button className="btn" onClick={pause}>⏸ Pause</button>
                        <button className="btn" onClick={stop}>⏹ Stop</button>

                        <span className="mx-2 h-6 w-px bg-gray-300" />

                        <button className="btn" onClick={() => seek(-5)}>⏪ -5s</button>
                        <button className="btn" onClick={() => seek(5)}>⏩ +5s</button>

                        <span className="mx-2 h-6 w-px bg-gray-300" />

                        <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-600">Zoom</span>
                            <button className="btn" onClick={() => setZoom((z) => Math.max(1, z / 2))}>-</button>
                            <span className="text-sm tabular-nums w-10 text-center">{zoom}×</span>
                            <button className="btn" onClick={() => setZoom((z) => Math.min(8, z * 2))}>+</button>
                        </div>
                    </div>

                    {/* waveform */}
                    <div className="overflow-auto rounded border bg-white p-2">
                        <div style={{ width: canvasWidth }}>
                            <Waveform
                                audioBlob={audioBlob}
                                currentTime={currentTime}
                                duration={duration}
                            />
                        </div>
                    </div>

                    {/* ukryty odtwarzacz */}
                    <audio ref={audioRef} src={blobUrl ?? undefined} preload="metadata" />
                </div>
            )}

            {tab === "info" && (
                <div className="p-3">
                    {/* Prosty komponent informacyjny – jeśli masz własny, podmień propsy */}
                    <AudioClipInfo file={file} duration={duration} />
                </div>
            )}

            {tab === "analysis" && (
                <div className="p-3">
                    <AudioClipAnalyzer file={file} />
                </div>
            )}

            {/* style helpers */}
            <style>{`
        .btn {
          display:inline-flex; align-items:center; justify-content:center;
          padding: 0.35rem 0.6rem; font-size: 0.875rem;
          border: 1px solid #e5e7eb; border-radius: 0.75rem;
          background: white;
        }
        .btn:hover { background: #f9fafb; }
      `}</style>
        </div>
    );
};

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, children }) => (
    <button
        className={
            "px-3 py-2 -mb-px border-b-2 text-sm " +
            (active
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-800")
        }
        onClick={onClick}
    >
        {children}
    </button>
);

export default AudioClipEditor;
