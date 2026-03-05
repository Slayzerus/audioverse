import React, { useRef, useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
// type MidiCCEvent removed (not used)
import type { UseCCAutomation } from "../../../../hooks/useCCAutomation";
import { applyDrawTool, type DrawMode, type DrawPoint } from "../../../../utils/drawTool";
import { sampleLFOToCCEvents, createDefaultLFO, type LFOConfig } from "../../../../utils/lfoEngine";

const LANE_HEIGHT = 140;
const LANE_PADDING = 24;

/** Common CC presets */
const CC_PRESETS = [
  { cc: 1, label: "Mod Wheel" },
  { cc: 7, label: "Volume" },
  { cc: 10, label: "Pan" },
  { cc: 11, label: "Expression" },
  { cc: 64, label: "Sustain" },
  { cc: 74, label: "Brightness" },
];

interface Props {
  /** Layer ID for the active layer */
  layerId: number;
  /** CC number being edited */
  ccNumber: number;
  /** Duration of the project in seconds */
  duration: number;
  /** Zoom level */
  zoom: number;
  /** The CC automation hook */
  automation: UseCCAutomation;
  /** Change the active CC number */
  onChangeCCNumber: (cc: number) => void;
}

const CCAutomationLaneEditor: React.FC<Props> = ({
  layerId,
  ccNumber,
  duration,
  zoom,
  automation,
  onChangeCCNumber,
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawMode, setDrawMode] = useState<DrawMode>("pencil");
  const [isDrawing, setIsDrawing] = useState(false);
  const drawPointsRef = useRef<DrawPoint[]>([]);
  const [hoveredEvent, setHoveredEvent] = useState<number | null>(null);
  const [showLFO, setShowLFO] = useState(false);
  const [lfoConfig, setLfoConfig] = useState<LFOConfig>(createDefaultLFO());
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const events = automation.getEvents(layerId);
  const ccEvents = events.filter(e => e.cc === ccNumber);

  const canvasWidth = Math.max(400, duration * 30 * zoom);

  // Convert canvas coordinates to time/value
  const xToTime = useCallback((x: number) => (x / canvasWidth) * duration, [canvasWidth, duration]);
  const yToValue = useCallback((y: number) => Math.round(Math.max(0, Math.min(127, 127 - ((y - LANE_PADDING) / LANE_HEIGHT) * 127))), []);
  const timeToX = useCallback((time: number) => (time / duration) * canvasWidth, [canvasWidth, duration]);
  const valueToY = useCallback((value: number) => LANE_PADDING + ((127 - value) / 127) * LANE_HEIGHT, []);

  // Draw the CC lane
  const drawLane = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, w, h);

    // Grid lines (value axis)
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let v = 0; v <= 127; v += 16) {
      const y = valueToY(v);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Grid labels
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "10px monospace";
    ctx.textBaseline = "middle";
    for (const v of [0, 32, 64, 96, 127]) {
      ctx.fillText(String(v), 2, valueToY(v));
    }

    // Time grid (every second)
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    for (let s = 0; s <= duration; s++) {
      const x = timeToX(s);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // CC events — sorted by time
    const sorted = [...ccEvents].sort((a, b) => a.time - b.time);

    if (sorted.length > 0) {
      // Draw fill area
      ctx.beginPath();
      ctx.moveTo(timeToX(sorted[0].time), h - LANE_PADDING);
      for (const ev of sorted) {
        ctx.lineTo(timeToX(ev.time), valueToY(ev.value));
      }
      ctx.lineTo(timeToX(sorted[sorted.length - 1].time), h - LANE_PADDING);
      ctx.closePath();
      ctx.fillStyle = "rgba(59, 130, 246, 0.15)";
      ctx.fill();

      // Draw lines between events
      ctx.beginPath();
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      for (let i = 0; i < sorted.length; i++) {
        const x = timeToX(sorted[i].time);
        const y = valueToY(sorted[i].value);
        if (i === 0) ctx.moveTo(x, y);
        else {
          const handleType = sorted[i].handleType ?? "linear";
          if (handleType === "step") {
            ctx.lineTo(x, valueToY(sorted[i - 1].value));
            ctx.lineTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();

      // Draw event dots
      for (const ev of sorted) {
        const x = timeToX(ev.time);
        const y = valueToY(ev.value);
        const isHovered = hoveredEvent === ev.id;
        ctx.beginPath();
        ctx.arc(x, y, isHovered ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? "#60a5fa" : "#3b82f6";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // Zero line
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    const zeroY = valueToY(0);
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(w, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [ccEvents, duration, canvasWidth, timeToX, valueToY, hoveredEvent]);

  useEffect(() => { drawLane(); }, [drawLane]);

  // Mouse handlers for drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (drawMode === "pencil") {
      setIsDrawing(true);
      drawPointsRef.current = [{ time: xToTime(x), value: yToValue(y) }];
    } else {
      // For line/curve/step/ramp: collect start point
      setIsDrawing(true);
      drawPointsRef.current = [{ time: xToTime(x), value: yToValue(y) }];
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDrawing) {
      drawPointsRef.current.push({ time: xToTime(x), value: yToValue(y) });
    }

    // Check hover for event dots
    const sorted = [...ccEvents].sort((a, b) => a.time - b.time);
    let foundHover: number | null = null;
    for (const ev of sorted) {
      const ex = timeToX(ev.time);
      const ey = valueToY(ev.value);
      if (Math.abs(x - ex) < 8 && Math.abs(y - ey) < 8) {
        foundHover = ev.id;
        break;
      }
    }
    setHoveredEvent(foundHover);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const points = drawPointsRef.current;
    if (points.length === 0) return;

    const newEvents = applyDrawTool({
      mode: drawMode,
      cc: ccNumber,
      resolution: 0.02,
      smoothing: drawMode === "pencil" ? 0.3 : 0,
      snap: false,
      snapDivisions: 16,
    }, points);

    if (newEvents.length > 0) {
      automation.setEvents(layerId, [...events, ...newEvents]);
    }
    drawPointsRef.current = [];
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on existing event — remove it
    for (const ev of ccEvents) {
      const ex = timeToX(ev.time);
      const ey = valueToY(ev.value);
      if (Math.abs(x - ex) < 8 && Math.abs(y - ey) < 8) {
        automation.removeEvent(layerId, ev.id);
        return;
      }
    }

    // Otherwise add new event at click position
    automation.addEvent(layerId, {
      id: Date.now() + Math.floor(Math.random() * 10000),
      cc: ccNumber,
      value: yToValue(y),
      time: xToTime(x),
    });
  };

  const handleApplyLFO = () => {
    const raw = sampleLFOToCCEvents(
      lfoConfig,
      0,
      duration,
      ccNumber,
      Math.ceil(duration * 20),
      120,
    );
    const lfoEvents = raw.map((ev, idx) => ({ ...ev, id: Date.now() + idx }));
    automation.setEvents(layerId, [...events, ...lfoEvents]);
    setShowLFO(false);
  };

  const handleExport = () => {
    const json = automation.exportLane(layerId);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cc-lane-${ccNumber}-layer-${layerId}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(json => {
      automation.importLane(layerId, json);
    });
    if (importInputRef.current) importInputRef.current.value = "";
  };

  return (
    <div className="card p-3 mb-3" style={{ background: "#0d1117", color: "#e6edf3", borderRadius: 8 }}>
      <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
        <h6 className="mb-0" style={{ color: "#58a6ff" }}>
          {t("ccLane.title", "CC Automation Lane")}
        </h6>

        {/* CC selector */}
        <select
          className="form-select form-select-sm"
          style={{ width: 160, background: "#161b22", color: "#e6edf3", border: "1px solid #30363d" }}
          value={ccNumber}
          onChange={e => onChangeCCNumber(Number(e.target.value))}
        >
          {CC_PRESETS.map(p => (
            <option key={p.cc} value={p.cc}>{p.label} (CC{p.cc})</option>
          ))}
        </select>

        {/* Draw mode */}
        <div className="btn-group btn-group-sm">
          {(["pencil", "line", "curve", "step", "ramp"] as DrawMode[]).map(mode => (
            <button
              key={mode}
              className={`btn ${drawMode === mode ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setDrawMode(mode)}
              style={{ fontSize: 11, textTransform: "capitalize" }}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Undo/Redo */}
        <div className="btn-group btn-group-sm">
          <button className="btn btn-outline-secondary" onClick={automation.undo} disabled={!automation.canUndo} title="Undo">
            ↩
          </button>
          <button className="btn btn-outline-secondary" onClick={automation.redo} disabled={!automation.canRedo} title="Redo">
            ↪
          </button>
        </div>

        {/* Actions */}
        <button className="btn btn-sm btn-outline-info" onClick={() => setShowLFO(!showLFO)} title="Apply LFO modulation">
          LFO
        </button>
        <button className="btn btn-sm btn-outline-warning" onClick={handleExport} title="Export CC lane as JSON">
          Export
        </button>
        <button className="btn btn-sm btn-outline-success" onClick={() => importInputRef.current?.click()} title="Import CC lane from JSON">
          Import
        </button>
        <input ref={importInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} />
        <button
          className="btn btn-sm btn-outline-danger"
          onClick={() => automation.setEvents(layerId, events.filter(e => e.cc !== ccNumber))}
          title="Clear all CC events for this lane"
        >
          Clear
        </button>
        <span style={{ fontSize: 11, color: "#8b949e", marginLeft: "auto" }}>
          {ccEvents.length} {t("ccLane.events", "events")}
        </span>
      </div>

      {/* LFO config panel */}
      {showLFO && (
        <div className="mb-2 p-2" style={{ background: "#161b22", borderRadius: 6, border: "1px solid #30363d" }}>
          <div className="d-flex gap-2 flex-wrap align-items-center mb-2">
            <label style={{ fontSize: 12 }}>
              Wave:
              <select
                className="form-select form-select-sm ms-1"
                style={{ width: 110, display: "inline-block", background: "#0d1117", color: "#e6edf3", border: "1px solid #30363d" }}
                value={lfoConfig.waveform}
                onChange={e => setLfoConfig(c => ({ ...c, waveform: e.target.value as LFOConfig["waveform"] }))}
              >
                {(["sine", "triangle", "sawtooth", "square", "random", "sample-hold"] as const).map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: 12 }}>
              Rate:
              <input type="number" className="form-control form-control-sm ms-1" style={{ width: 70, display: "inline-block", background: "#0d1117", color: "#e6edf3", border: "1px solid #30363d" }}
                min={0.01} max={20} step={0.1} value={lfoConfig.rate} onChange={e => setLfoConfig(c => ({ ...c, rate: Number(e.target.value) }))} />
            </label>
            <label style={{ fontSize: 12 }}>
              Depth:
              <input type="range" min={0} max={1} step={0.01} value={lfoConfig.depth} onChange={e => setLfoConfig(c => ({ ...c, depth: Number(e.target.value) }))} style={{ width: 80 }} />
              <span style={{ fontSize: 11, marginLeft: 4 }}>{lfoConfig.depth.toFixed(2)}</span>
            </label>
            <label style={{ fontSize: 12 }}>
              Center:
              <input type="range" min={0} max={1} step={0.01} value={lfoConfig.center} onChange={e => setLfoConfig(c => ({ ...c, center: Number(e.target.value) }))} style={{ width: 80 }} />
              <span style={{ fontSize: 11, marginLeft: 4 }}>{lfoConfig.center.toFixed(2)}</span>
            </label>
            <button className="btn btn-sm btn-primary" onClick={handleApplyLFO}>Apply LFO</button>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowLFO(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div style={{ overflowX: "auto", borderRadius: 6 }}>
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={LANE_HEIGHT + LANE_PADDING * 2}
          style={{ cursor: isDrawing ? "crosshair" : hoveredEvent ? "pointer" : "crosshair", display: "block", borderRadius: 6 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { if (isDrawing) handleMouseUp(); }}
          onDoubleClick={handleDoubleClick}
          role="img"
          aria-label="CC automation lane editor canvas"
        />
      </div>

      <div style={{ fontSize: 11, color: "#8b949e", marginTop: 4 }}>
        {t("ccLane.hint", "Click to draw. Double-click to add/remove points. Drag to draw curves.")}
      </div>
    </div>
  );
};

export default CCAutomationLaneEditor;
