import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { unzipSync } from "fflate";
import { postSeparate } from "../../scripts/api/apiLibraryAiAudio";

/** Stem names used by Demucs for 2/4/5-stem models */
const STEM_LABELS: Record<string, string> = {
  vocals: "Vocals",
  accompaniment: "Accompaniment",
  drums: "Drums",
  bass: "Bass",
  other: "Other",
  piano: "Piano",
  guitar: "Guitar",
  no_vocals: "No Vocals (Karaoke)",
};

/** Infer display label from ZIP entry filename, e.g. "vocals.wav" → "Vocals" */
function stemLabel(filename: string): string {
  const base = filename.replace(/^.*[\\/]/, "").replace(/\.[^.]+$/, "").toLowerCase();
  return STEM_LABELS[base] ?? base;
}

/** One extracted stem ready for preview / selection */
export interface StemTrack {
  /** Original filename inside ZIP */
  filename: string;
  /** Human-readable label */
  label: string;
  /** Blob URL for <audio> preview */
  blobUrl: string;
  /** The underlying File object (can be passed to analysis) */
  file: File;
}

interface Props {
  /** The original audio file to separate */
  sourceFile: File;
  /** Called when the user picks a stem to use for analysis */
  onSelectStem: (stem: StemTrack) => void;
  /** Called when user wants to go back and use original file */
  onUseOriginal: () => void;
}

type SepStatus = "idle" | "separating" | "done" | "error";

const StemSeparator: React.FC<Props> = ({ sourceFile, onSelectStem, onUseOriginal }) => {
  const { t } = useTranslation();
  const [stemCount, setStemCount] = useState<number>(2);
  const [status, setStatus] = useState<SepStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stems, setStems] = useState<StemTrack[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);

  // cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      stems.forEach((s) => URL.revokeObjectURL(s.blobUrl));
    };
  }, [stems]);

  const handleSeparate = useCallback(async () => {
    setStatus("separating");
    setErrorMsg(null);
    setStems((prev) => { prev.forEach((s) => URL.revokeObjectURL(s.blobUrl)); return []; });
    setSelectedIdx(null);

    try {
      const zipBuffer = await postSeparate(sourceFile, stemCount);
      const zipData = new Uint8Array(zipBuffer);
      const entries = unzipSync(zipData);

      const tracks: StemTrack[] = [];
      for (const [name, data] of Object.entries(entries)) {
        // skip directories or non-audio entries
        if (name.endsWith("/") || data.length === 0) continue;
        // determine MIME from extension
        const ext = name.split(".").pop()?.toLowerCase() ?? "wav";
        const mime = ext === "mp3" ? "audio/mpeg" : ext === "ogg" ? "audio/ogg" : ext === "flac" ? "audio/flac" : "audio/wav";
        const blob = new Blob([data], { type: mime });
        const file = new File([blob], name, { type: mime });
        tracks.push({
          filename: name,
          label: stemLabel(name),
          blobUrl: URL.createObjectURL(blob),
          file,
        });
      }

      if (tracks.length === 0) {
        setErrorMsg(t("stemSep.noTracksInZip", "Separation returned no audio tracks."));
        setStatus("error");
        return;
      }

      setStems(tracks);
      // auto-select vocals if present, otherwise first
      const vocIdx = tracks.findIndex((tr) => tr.label === "Vocals");
      setSelectedIdx(vocIdx >= 0 ? vocIdx : 0);
      setStatus("done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setStatus("error");
    }
  }, [sourceFile, stemCount, t]);

  const handlePlayPause = (idx: number) => {
    const el = audioRefs.current[idx];
    if (!el) return;
    if (playingIdx === idx && !el.paused) {
      el.pause();
      setPlayingIdx(null);
    } else {
      // stop any other playing
      audioRefs.current.forEach((a, i) => { if (a && i !== idx) { a.pause(); a.currentTime = 0; } });
      el.play();
      setPlayingIdx(idx);
    }
  };

  const handleConfirm = () => {
    if (selectedIdx !== null && stems[selectedIdx]) {
      onSelectStem(stems[selectedIdx]);
    }
  };

  return (
    <div style={{
      marginTop: 12,
      padding: 16,
      border: "1px solid var(--border-color, #d1d5db)",
      borderRadius: 8,
      background: "var(--card-bg-alt, #f8fafc)",
    }}>
      <h4 style={{ marginTop: 0, marginBottom: 8 }}>
        {t("stemSep.title", "Audio Stem Separation (Demucs)")}
      </h4>

      <p style={{ color: "var(--text-secondary, #64748b)", fontSize: 13, marginBottom: 12 }}>
        {t("stemSep.description", "Separate the uploaded audio into individual stems (vocals, drums, bass, etc.) using AI. You can then preview each stem and choose which one to analyze for pitch detection.")}
      </p>

      {/* Controls row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {t("stemSep.stemCount", "Stems:")}
          <select
            value={stemCount}
            onChange={(e) => setStemCount(Number(e.target.value))}
            disabled={status === "separating"}
            style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid var(--border-color, #d1d5db)" }}
          >
            <option value={2}>2 (Vocals + Accompaniment)</option>
            <option value={4}>4 (Vocals + Drums + Bass + Other)</option>
            <option value={5}>5 (Vocals + Drums + Bass + Piano + Other)</option>
          </select>
        </label>

        <button
          onClick={handleSeparate}
          disabled={status === "separating"}
          style={{
            padding: "6px 16px",
            borderRadius: 6,
            border: "none",
            background: status === "separating" ? "var(--btn-disabled, #94a3b8)" : "var(--accent, #3b82f6)",
            color: "var(--btn-text, #fff)",
            cursor: status === "separating" ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          {status === "separating"
            ? t("stemSep.separating", "Separating…")
            : t("stemSep.separateBtn", "Separate Tracks")}
        </button>

        <button
          onClick={onUseOriginal}
          style={{
            padding: "6px 14px",
            borderRadius: 6,
            border: "1px solid var(--border-color, #d1d5db)",
            background: "var(--card-bg, #fff)",
            cursor: "pointer",
          }}
        >
          {t("stemSep.useOriginal", "Use Original File")}
        </button>
      </div>

      {/* Separating spinner */}
      {status === "separating" && (
        <div style={{ padding: 16, textAlign: "center", color: "var(--text-secondary, #64748b)" }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
          <div>{t("stemSep.processingMsg", "Processing with Demucs — this can take 1-3 minutes depending on file length…")}</div>
        </div>
      )}

      {/* Error */}
      {status === "error" && errorMsg && (
        <div style={{ padding: 12, background: "#3b0d0d", color: "#ffdede", borderRadius: 6, marginBottom: 12 }}>
          <div style={{ fontWeight: 600 }}>{t("stemSep.errorTitle", "Separation Error")}</div>
          <div style={{ marginTop: 4 }}>{errorMsg}</div>
          <button onClick={() => { setStatus("idle"); setErrorMsg(null); }} style={{ marginTop: 8 }}>
            {t("stemSep.retry", "Try Again")}
          </button>
        </div>
      )}

      {/* Stem tracks list */}
      {status === "done" && stems.length > 0 && (
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            {t("stemSep.selectTrack", "Select track to analyze:")}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {stems.map((stem, idx) => (
              <div
                key={stem.filename}
                onClick={() => setSelectedIdx(idx)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: selectedIdx === idx
                    ? "2px solid var(--accent-primary, #3b82f6)"
                    : "1px solid var(--border-subtle, #e2e8f0)",
                  background: selectedIdx === idx
                    ? "var(--accent-light, #eff6ff)"
                    : "var(--card-bg, #fff)",
                  cursor: "pointer",
                  transition: "border-color 0.15s, background 0.15s",
                }}
              >
                {/* Radio indicator */}
                <div style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: selectedIdx === idx
                    ? "2px solid var(--accent-primary, #3b82f6)"
                    : "2px solid var(--border-color, #d1d5db)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {selectedIdx === idx && (
                    <div style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "var(--accent-primary, #3b82f6)",
                    }} />
                  )}
                </div>

                {/* Label */}
                <span style={{ fontWeight: 600, minWidth: 120 }}>{stem.label}</span>

                {/* Play / Pause button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handlePlayPause(idx); }}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 4,
                    border: "1px solid var(--border-color, #d1d5db)",
                    background: "var(--card-bg, #fff)",
                    cursor: "pointer",
                    fontSize: 13,
                    minWidth: 60,
                  }}
                >
                  {playingIdx === idx ? "⏸ Pause" : "▶ Play"}
                </button>

                {/* Hidden audio element */}
                <audio
                  ref={(el) => { audioRefs.current[idx] = el; }}
                  src={stem.blobUrl}
                  onEnded={() => setPlayingIdx(null)}
                  preload="metadata"
                  style={{ display: "none" }}
                />

                {/* Filename */}
                <span style={{ color: "var(--text-secondary, #94a3b8)", fontSize: 12 }}>
                  {stem.filename}
                </span>
              </div>
            ))}
          </div>

          {/* Confirm selection */}
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button
              onClick={handleConfirm}
              disabled={selectedIdx === null}
              style={{
                padding: "8px 20px",
                borderRadius: 6,
                border: "none",
                background: selectedIdx !== null ? "var(--accent, #3b82f6)" : "var(--btn-disabled, #94a3b8)",
                color: "var(--btn-text, #fff)",
                cursor: selectedIdx !== null ? "pointer" : "not-allowed",
                fontWeight: 600,
              }}
            >
              {t("stemSep.useSelected", "Use Selected Stem for Analysis")}
            </button>
            <button
              onClick={onUseOriginal}
              style={{
                padding: "8px 14px",
                borderRadius: 6,
                border: "1px solid var(--border-color, #d1d5db)",
                background: "var(--card-bg, #fff)",
                cursor: "pointer",
              }}
            >
              {t("stemSep.useOriginal", "Use Original File")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StemSeparator;
