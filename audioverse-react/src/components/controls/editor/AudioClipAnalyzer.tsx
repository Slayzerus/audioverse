import React, { useMemo, useState } from "react";
import {
    postTranscribe,
    postAnalyze,
    postRhythm,
    postPitch,
    postVad,
    postTags,
    postSeparate,
    bufferToBlobUrl,
    Mime,
} from "../../../scripts/api/apiLibraryAiAudio";

// pretty print
const pretty = (obj: unknown) =>
    typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);

export type AudioClipAnalyzerProps = {
    file: File;
    className?: string;
};

const AudioClipAnalyzer: React.FC<AudioClipAnalyzerProps> = ({ file, className }) => {
    const [logs, setLogs] = useState<string>("");
    const [busy, setBusy] = useState<string | null>(null);

    const fileInfo = useMemo(
        () => `${file.name} (${Math.round(file.size / 1024)} kB)`,
        [file]
    );

    const log = (label: string, data: unknown, isError = false) => {
        const ts = new Date().toLocaleTimeString();
        setLogs((prev) =>
            `${prev}${prev ? "\n\n" : ""}[${ts}] ${isError ? "❌ " : ""}${label}:\n${pretty(data)}`
        );
    };

    const getErrMsg = (e: unknown) =>
        typeof e === "object" && e && "message" in e
            ? String((e as { message?: unknown }).message)
            : String(e);

    const wrap = async (label: string, fn: () => Promise<unknown>) => {
        if (busy) return;
        try {
            setBusy(label);
            const res = await fn();
            log(label, res);
        } catch (err: unknown) {
            log(label, getErrMsg(err), true);
        } finally {
            setBusy(null);
        }
    };

    const onTranscribe = () =>
        wrap("ASR /asr", async () => await postTranscribe(file));

    const onAnalyze = () =>
        wrap("Analyze /analyze", async () => await postAnalyze(file));

    const onRhythm = () =>
        wrap("Rhythm /rhythm", async () => await postRhythm(file));

    const onPitch = () =>
        wrap("Pitch /pitch", async () => await postPitch(file));

    const onVad = () =>
        wrap("VAD /vad?aggressiveness=2", async () => await postVad(file, 2));

    const onTags = () =>
        wrap("Tags /tags", async () => await postTags(file));

    const onSeparate = () =>
        wrap("Separate /separate?stems=2 (ZIP)", async () => {
            const zip = await postSeparate(file, 2);
            const url = bufferToBlobUrl(zip, Mime.zip);
            return { downloadUrl: url, note: "Kliknij link poniżej aby pobrać ZIP ze stemami." };
        });

    return (
        <div className={"w-full max-w-3xl mx-auto p-4 space-y-4 " + (className ?? "")}>
            <div className="rounded-2xl border p-4 shadow-sm bg-white/50">
                <div className="text-sm text-gray-500">Wybrany plik</div>
                <div className="font-medium">{fileInfo}</div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                    className="inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm bg-white hover:bg-gray-50 shadow-sm"
                    disabled={!!busy}
                    onClick={onTranscribe}
                >
                    ASR
                </button>
                <button className="inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm bg-white hover:bg-gray-50 shadow-sm" disabled={!!busy} onClick={onAnalyze}>
                    Analyze
                </button>
                <button className="inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm bg-white hover:bg-gray-50 shadow-sm" disabled={!!busy} onClick={onRhythm}>
                    Rhythm
                </button>
                <button className="inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm bg-white hover:bg-gray-50 shadow-sm" disabled={!!busy} onClick={onPitch}>
                    Pitch
                </button>
                <button className="inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm bg-white hover:bg-gray-50 shadow-sm" disabled={!!busy} onClick={onVad}>
                    VAD
                </button>
                <button className="inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm bg-white hover:bg-gray-50 shadow-sm" disabled={!!busy} onClick={onTags}>
                    Tags
                </button>
                <button className="inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm bg-white hover:bg-gray-50 shadow-sm" disabled={!!busy} onClick={onSeparate}>
                    Separate
                </button>
            </div>

            {busy && <div className="text-sm text-blue-600">⏳ Trwa: {busy}…</div>}

            <div className="rounded-2xl border p-3 shadow-inner bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">Log</div>
                    <button
                        className="text-xs text-gray-500 hover:text-gray-700"
                        onClick={() => setLogs("")}
                    >
                        wyczyść
                    </button>
                </div>
                <pre className="text-xs whitespace-pre-wrap break-words max-h-96 overflow-auto">
          {logs || "(brak wpisów)"}
        </pre>
            </div>

            {logs.includes("downloadUrl") && <DownloadFromLog logs={logs} />}
        </div>
    );
};

// Wyciąga downloadUrl z logu (ostatniego wpisu)
const DownloadFromLog: React.FC<{ logs: string }> = ({ logs }) => {
    const url = useMemo(() => {
        const match = /"downloadUrl":\s*"([^"]+)/.exec(logs);
        return match?.[1];
    }, [logs]);

    if (!url) return null;
    return (
        <div className="p-3 rounded-xl bg-blue-50 border text-sm">
            <a className="underline" href={url} download>
                Pobierz ZIP ze stemami
            </a>
            <span className="ml-2 text-gray-600">
        (pamiętaj o zwolnieniu URL.revokeObjectURL po pobraniu)
      </span>
        </div>
    );
};

export default AudioClipAnalyzer;
