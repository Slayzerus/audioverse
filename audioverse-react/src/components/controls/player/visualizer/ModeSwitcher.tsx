import React from "react";
import type { VisualizerMode } from "./types";

type Props = {
    modes: VisualizerMode[];
    active: VisualizerMode;
    setActive: (m: VisualizerMode) => void;
    /** How many rows (default 2) */
    rows?: number;
};

/// <summary>
/// Small button used inside the visualizer mode switcher.
/// </summary>
const ModeButton: React.FC<{
    /// <summary>Whether the button is currently active.</summary>
    active: boolean;
    /// <summary>Click handler.</summary>
    onClick: () => void;
    /// <summary>Accessible title attribute.</summary>
    title: string;
    /// <summary>Button label.</summary>
    children?: React.ReactNode;
}> = ({ active, onClick, title, children }) => (
    <button
        type="button"
        onClick={onClick}
        title={title}
        aria-pressed={active}
        style={{
            padding: "4px 8px",
            borderRadius: 6,
            fontSize: 12,
            border: `1px solid ${active ? "#6366f1" : "#334155"}`,
            background: active ? "rgba(99,102,241,.12)" : "rgba(15,23,42,.6)",
            color: active ? "#e2e8f0" : "#cbd5e1",
            cursor: "pointer",
            whiteSpace: "nowrap",
            lineHeight: 1.2,
        }}
    >
        {children}
    </button>
);

export const ModeSwitcher: React.FC<Props> = ({
                                                  modes,
                                                  active,
                                                  setActive,
                                                  rows = 2,
                                              }) => {
    const r = Math.max(1, rows);
    return (
        <div
            style={{
                position: "absolute",
                top: 10,
                right: 10,
                pointerEvents: "auto", // must be, so you can click above the YouTube iframe
                zIndex: 9999,
            }}
        >
            <div
                style={{
                    display: "grid",
                    // <-- key: fill by columns, not by rows
                    gridAutoFlow: "column",
                    // <-- exactly r rows
                    gridTemplateRows: `repeat(${r}, auto)`,
                    // don't let the column stretch — each custom-fit
                    gridAutoColumns: "max-content",
                    gap: 6,
                    background: "rgba(2,6,23,.5)",
                    padding: 6,
                    borderRadius: 10,
                    border: "1px solid #334155",
                    backdropFilter: "blur(2px)",
                    // zachowaj panel przy prawej krawędzi
                    justifyItems: "end",
                    alignItems: "start",
                }}
            >
                {modes.map((m) => (
                    <ModeButton
                        key={m}
                        active={active === m}
                        onClick={() => setActive(m)}
                        title={`Tryb: ${m}`}
                    >
                        {m}
                    </ModeButton>
                ))}
            </div>
        </div>
    );
};

export default ModeSwitcher;
