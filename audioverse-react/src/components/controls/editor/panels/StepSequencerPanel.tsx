import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { UseStepSequencerResult } from "../../../../hooks/useStepSequencer";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[midi % 12]}${octave}`;
}

interface Props {
  seq: UseStepSequencerResult;
}

const StepSequencerPanel: React.FC<Props> = ({ seq }) => {
  const { t } = useTranslation();
  const { pattern, currentStep, playing } = seq;

  const visibleSteps = useMemo(() => pattern.steps.slice(0, pattern.length), [pattern]);

  return (
    <div className="card p-3 mb-3" style={{ background: "#0d1117", color: "#e6edf3", borderRadius: 8 }}>
      <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
        <h6 className="mb-0" style={{ color: "#58a6ff" }}>
          {t("stepSeq.title", "Step Sequencer")}
        </h6>

        {/* Transport */}
        <button
          className={`btn btn-sm ${playing ? "btn-danger" : "btn-success"}`}
          onClick={seq.togglePlayback}
          style={{ minWidth: 60 }}
        >
          {playing ? "■ Stop" : "▶ Play"}
        </button>

        {/* BPM */}
        <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
          BPM:
          <input
            type="number"
            className="form-control form-control-sm"
            style={{ width: 70, background: "#161b22", color: "#e6edf3", border: "1px solid #30363d" }}
            min={20}
            max={300}
            value={pattern.bpm}
            onChange={e => seq.setBpm(Number(e.target.value))}
          />
        </label>

        {/* Swing */}
        <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
          Swing:
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={pattern.swing}
            onChange={e => seq.setSwing(Number(e.target.value))}
            style={{ width: 60 }}
          />
          <span style={{ fontSize: 11, minWidth: 28 }}>{Math.round(pattern.swing * 100)}%</span>
        </label>

        {/* Length */}
        <div className="btn-group btn-group-sm">
          {([16, 32, 64] as const).map(len => (
            <button
              key={len}
              className={`btn ${pattern.length === len ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => seq.setLength(len)}
              style={{ fontSize: 11 }}
            >
              {len}
            </button>
          ))}
        </div>
      </div>

      {/* Pattern operations */}
      <div className="d-flex gap-1 mb-2 flex-wrap">
        <button className="btn btn-sm btn-outline-secondary" onClick={() => seq.transpose(1)} aria-label="Transpose up one semitone">+1</button>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => seq.transpose(-1)} aria-label="Transpose down one semitone">-1</button>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => seq.transpose(12)}>+Oct</button>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => seq.transpose(-12)}>-Oct</button>
        <button className="btn btn-sm btn-outline-secondary" onClick={seq.reverse}>Reverse</button>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => seq.shift(1)}>Shift →</button>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => seq.shift(-1)}>← Shift</button>
        <button className="btn btn-sm btn-outline-info" onClick={() => seq.randomizeVel()}>Rnd Vel</button>
        <button className="btn btn-sm btn-outline-danger" onClick={seq.clear}>Clear</button>
      </div>

      {/* Step grid */}
      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "flex", gap: 2, minWidth: pattern.length * 36 }}>
          {visibleSteps.map((step, i) => {
            const isActive = step.active;
            const isCurrent = currentStep === i;
            const isBeat = i % 4 === 0;

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  minWidth: 34,
                }}
              >
                {/* Step number */}
                <span style={{ fontSize: 9, color: isBeat ? "#8b949e" : "#30363d" }}>
                  {i + 1}
                </span>

                {/* Main step button */}
                <button
                  onClick={() => seq.toggle(i)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 4,
                    border: isCurrent ? "2px solid #f0c040" : "1px solid #30363d",
                    background: isActive
                      ? `hsl(${210 + (step.velocity / 127) * 40}, 80%, ${35 + (step.velocity / 127) * 20}%)`
                      : isBeat
                        ? "#21262d"
                        : "#161b22",
                    cursor: "pointer",
                    padding: 0,
                    color: isActive ? "#fff" : "#484f58",
                    fontSize: 8,
                    fontWeight: 600,
                    transition: "background 0.1s",
                  }}
                >
                  {isActive ? midiToNoteName(step.note) : ""}
                </button>

                {/* Velocity bar */}
                <div style={{ width: 32, height: 20, background: "#161b22", borderRadius: 2, position: "relative", overflow: "hidden" }}>
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      width: "100%",
                      height: `${(step.velocity / 127) * 100}%`,
                      background: isActive ? "rgba(59, 130, 246, 0.6)" : "rgba(59, 130, 246, 0.15)",
                      borderRadius: 2,
                      cursor: "ns-resize",
                    }}
                    title={`Vel: ${step.velocity}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const rect = (e.target as HTMLElement).parentElement!.getBoundingClientRect();
                      const handleMove = (ev: MouseEvent) => {
                        const y = ev.clientY - rect.top;
                        const vel = Math.round(Math.max(1, Math.min(127, (1 - y / rect.height) * 127)));
                        seq.setVelocity(i, vel);
                      };
                      const handleUp = () => {
                        document.removeEventListener("mousemove", handleMove);
                        document.removeEventListener("mouseup", handleUp);
                      };
                      document.addEventListener("mousemove", handleMove);
                      document.addEventListener("mouseup", handleUp);
                    }}
                  />
                </div>

                {/* Probability indicator */}
                {isActive && step.probability < 1 && (
                  <span style={{ fontSize: 8, color: "#f0c040" }}>{Math.round(step.probability * 100)}%</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ fontSize: 11, color: "#8b949e", marginTop: 6 }}>
        {t("stepSeq.hint", "Click steps to toggle. Drag velocity bars vertically.")}
      </div>
    </div>
  );
};

export default StepSequencerPanel;
