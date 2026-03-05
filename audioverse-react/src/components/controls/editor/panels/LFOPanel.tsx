import React, { useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  type LFOConfig,
  type LFOWaveform,
  type LFOSyncDivision,
  createDefaultLFO,
  sampleLFOForDisplay,
} from "../../../../utils/lfoEngine";

const WAVEFORMS: LFOWaveform[] = ["sine", "triangle", "sawtooth", "square", "random", "sample-hold"];
const SYNC_DIVISIONS: LFOSyncDivision[] = ["1/1", "1/2", "1/4", "1/8", "1/16", "1/32"];

const PREVIEW_W = 200;
const PREVIEW_H = 48;

interface Props {
  config: LFOConfig;
  onChange: (config: LFOConfig) => void;
  /** Index label */
  index?: number;
  onRemove?: () => void;
}

const LFOPanel: React.FC<Props> = ({ config, onChange, index, onRemove }) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const update = (partial: Partial<LFOConfig>) => onChange({ ...config, ...partial });

  // Draw waveform preview
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, PREVIEW_W, PREVIEW_H);
    ctx.fillStyle = "#161b22";
    ctx.fillRect(0, 0, PREVIEW_W, PREVIEW_H);

    // Center line
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, PREVIEW_H / 2);
    ctx.lineTo(PREVIEW_W, PREVIEW_H / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Sample LFO for display (returns {x,y} points)
    const points = sampleLFOForDisplay(config, PREVIEW_W, PREVIEW_H);

    if (points.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = config.enabled ? "#3b82f6" : "#484f58";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < points.length; i++) {
        const x = points[i].x;
        const y = points[i].y;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }, [config]);

  useEffect(() => { drawPreview(); }, [drawPreview]);

  return (
    <div className="card p-2 mb-2" style={{ background: "#0d1117", color: "#e6edf3", borderRadius: 8, opacity: config.enabled ? 1 : 0.5 }}>
      <div className="d-flex align-items-center gap-2 mb-2">
        <h6 className="mb-0" style={{ color: "#58a6ff", fontSize: 13 }}>
          {t("lfo.title", "LFO")} {index !== undefined ? `#${index + 1}` : ""}
        </h6>
        <button
          className={`btn btn-sm ${config.enabled ? "btn-success" : "btn-outline-secondary"}`}
          onClick={() => update({ enabled: !config.enabled })}
          style={{ fontSize: 11, padding: "1px 8px" }}
        >
          {config.enabled ? "ON" : "OFF"}
        </button>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => onChange(createDefaultLFO())}
          style={{ fontSize: 11, padding: "1px 8px" }}
          title="Reset to defaults"
        >
          Reset
        </button>
        {onRemove && (
          <button
            className="btn btn-sm btn-outline-danger ms-auto"
            onClick={onRemove}
            style={{ fontSize: 11, padding: "1px 8px" }}
          >
            ✕
          </button>
        )}
      </div>

      <div className="d-flex gap-2 flex-wrap align-items-start">
        {/* Waveform preview canvas */}
        <canvas
          ref={canvasRef}
          width={PREVIEW_W}
          height={PREVIEW_H}
          style={{ borderRadius: 4, border: "1px solid #30363d", flexShrink: 0 }}
          role="img"
          aria-label="LFO waveform preview canvas"
        />

        <div className="flex-grow-1">
          {/* Waveform */}
          <div className="mb-1">
            <div className="btn-group btn-group-sm w-100">
              {WAVEFORMS.map(w => (
                <button
                  key={w}
                  className={`btn ${config.waveform === w ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => update({ waveform: w })}
                  style={{ fontSize: 10, textTransform: "capitalize", padding: "1px 4px" }}
                >
                  {w === "sample-hold" ? "S&H" : w.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="row g-1">
            {/* Rate */}
            <div className="col-6">
              <label style={{ fontSize: 10 }}>
                Rate: {config.rate.toFixed(1)} Hz
              </label>
              <input
                type="range"
                className="form-range"
                min={0.01}
                max={20}
                step={0.1}
                value={config.rate}
                onChange={e => update({ rate: Number(e.target.value) })}
                style={{ height: 16 }}
              />
            </div>

            {/* Depth */}
            <div className="col-6">
              <label style={{ fontSize: 10 }}>
                Depth: {Math.round(config.depth * 100)}%
              </label>
              <input
                type="range"
                className="form-range"
                min={0}
                max={1}
                step={0.01}
                value={config.depth}
                onChange={e => update({ depth: Number(e.target.value) })}
                style={{ height: 16 }}
              />
            </div>

            {/* Center */}
            <div className="col-6">
              <label style={{ fontSize: 10 }}>
                Center: {Math.round(config.center * 100)}%
              </label>
              <input
                type="range"
                className="form-range"
                min={0}
                max={1}
                step={0.01}
                value={config.center}
                onChange={e => update({ center: Number(e.target.value) })}
                style={{ height: 16 }}
              />
            </div>

            {/* Phase */}
            <div className="col-6">
              <label style={{ fontSize: 10 }}>
                Phase: {Math.round(config.phase)}°
              </label>
              <input
                type="range"
                className="form-range"
                min={0}
                max={360}
                step={1}
                value={config.phase}
                onChange={e => update({ phase: Number(e.target.value) })}
                style={{ height: 16 }}
              />
            </div>
          </div>

          {/* BPM Sync */}
          <div className="d-flex align-items-center gap-2 mt-1">
            <label style={{ fontSize: 10 }}>
              <input
                type="checkbox"
                checked={config.syncToBpm}
                onChange={e => update({ syncToBpm: e.target.checked })}
                className="form-check-input me-1"
                style={{ marginTop: 0, width: 12, height: 12 }}
              />
              BPM Sync
            </label>
            {config.syncToBpm && (
              <select
                className="form-select form-select-sm"
                style={{ width: 80, background: "#161b22", color: "#e6edf3", border: "1px solid #30363d", fontSize: 11 }}
                value={config.syncDivision ?? "1/4"}
                onChange={e => update({ syncDivision: e.target.value as LFOSyncDivision })}
              >
                {SYNC_DIVISIONS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}

            {/* Target CC */}
            <label style={{ fontSize: 10 }}>
              CC:
              <input
                type="number"
                className="form-control form-control-sm ms-1"
                style={{ width: 55, display: "inline-block", background: "#161b22", color: "#e6edf3", border: "1px solid #30363d", fontSize: 11 }}
                min={0}
                max={127}
                value={config.targetCC ?? 1}
                onChange={e => update({ targetCC: Number(e.target.value) })}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LFOPanel;
