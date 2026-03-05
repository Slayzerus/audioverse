import React from "react";
import type { ClipRegion, ClipId } from "../../../../models/editor/audioTypes";

// ── Advanced Editing Panel ──

interface AdvancedEditingPanelProps {
    selectedClips: Set<string>;
    clearSelection: () => void;
    rippleMode: boolean;
    setRippleMode: (v: boolean) => void;
    quantizeSelectedClips: () => void;
    deleteSelectedClips: () => void;
    applyTimeStretch: (factor: number) => void;
}

export const AdvancedEditingPanel: React.FC<AdvancedEditingPanelProps> = ({
    selectedClips,
    clearSelection,
    rippleMode,
    setRippleMode,
    quantizeSelectedClips,
    deleteSelectedClips,
    applyTimeStretch,
}) => (
    <div className="card p-2 mb-3" style={{ maxWidth: 820 }}>
        <div className="d-flex align-items-center justify-content-between mb-2">
            <span style={{ fontSize: 13, fontWeight: 600 }}>Advanced Editing</span>
            <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: 11, color: "#666" }}>
                    {selectedClips.size > 0 ? `${selectedClips.size} clip(s) selected` : "No clips selected"}
                </span>
                {selectedClips.size > 0 && (
                    <button className="btn btn-sm btn-outline-secondary" style={{ fontSize: 11, padding: "2px 8px" }} onClick={clearSelection}>
                        Clear Selection
                    </button>
                )}
            </div>
        </div>
        <div className="d-flex align-items-center flex-wrap gap-2">
            <div className="form-check form-switch">
                <input className="form-check-input" type="checkbox" id="rippleModeToggle" checked={rippleMode} onChange={(e) => setRippleMode(e.target.checked)} />
                <label className="form-check-label" htmlFor="rippleModeToggle" style={{ fontSize: 12 }}>
                    Ripple Mode {rippleMode && "✓"}
                </label>
            </div>
            <div className="vr" />
            <button className="btn btn-sm btn-primary" onClick={quantizeSelectedClips} disabled={selectedClips.size === 0} title="Quantize: align selected clips to grid (Q)">
                <i className="fa-solid fa-bolt" /> Quantize
            </button>
            <button className="btn btn-sm btn-danger" onClick={deleteSelectedClips} disabled={selectedClips.size === 0} title="Delete selected clips">
                <i className="fa-solid fa-trash" /> Delete Selected
            </button>
            <div className="vr" />
            <div className="d-flex align-items-center gap-2">
                <label style={{ fontSize: 11 }}>Time Stretch:</label>
                {[0.5, 0.75, 1.0, 1.5, 2.0].map((factor) => (
                    <button
                        key={factor}
                        className="btn btn-sm btn-outline-info"
                        onClick={() => applyTimeStretch(factor)}
                        disabled={selectedClips.size === 0}
                        title={`${factor}x speed`}
                        style={{ fontSize: 11, padding: "2px 8px" }}
                    >
                        {factor}x
                    </button>
                ))}
            </div>
            <div className="vr" />
            <span style={{ fontSize: 11, color: "#666" }}>💡 Tip: Ctrl+Click to multi-select clips | Del to delete | Q to quantize</span>
        </div>
    </div>
);

// ── Clip Operations Panel ──

interface ClipOperationsPanelProps {
    selectedClip: { layerId: number; clipId: ClipId } | null;
    clipboardClip: ClipRegion | null;
    activeLayerId: number | undefined;
    layerClips: Record<number, ClipRegion[]>;
    handleSplitClip: () => void;
    handleDeleteClip: () => void;
    handleCopyClip: () => void;
    handlePasteClip: () => void;
    handleToggleReverse: () => void;
    handleFadeChange: (type: "in" | "out", value: number) => void;
}

export const ClipOperationsPanel: React.FC<ClipOperationsPanelProps> = ({
    selectedClip,
    clipboardClip,
    activeLayerId,
    layerClips,
    handleSplitClip,
    handleDeleteClip,
    handleCopyClip,
    handlePasteClip,
    handleToggleReverse,
    handleFadeChange,
}) => {
    const currentClip = selectedClip ? (layerClips[selectedClip.layerId] || []).find((c) => c.id === selectedClip.clipId) : null;
    return (
        <div className="card p-2 mb-3" style={{ maxWidth: 820 }}>
            <div className="d-flex align-items-center flex-wrap gap-2">
                <span style={{ fontSize: 12, color: "#555" }}>
                    {selectedClip ? "Clip selected" : "No clip selected"}
                </span>
                <button className="btn btn-sm btn-outline-secondary" onClick={handleSplitClip} disabled={!selectedClip}>
                    Split (at playhead)
                </button>
                <button className="btn btn-sm btn-outline-danger" onClick={handleDeleteClip} disabled={!selectedClip}>
                    Cut/Delete
                </button>
                <button className="btn btn-sm btn-outline-secondary" onClick={handleCopyClip} disabled={!selectedClip}>
                    Copy
                </button>
                <button className="btn btn-sm btn-outline-secondary" onClick={handlePasteClip} disabled={!clipboardClip || activeLayerId == null}>
                    Paste → active layer
                </button>
                <button className="btn btn-sm btn-outline-secondary" onClick={handleToggleReverse} disabled={!selectedClip}>
                    Reverse
                </button>
                <div className="d-flex align-items-center gap-1">
                    <span style={{ fontSize: 12 }}>Fade In</span>
                    <input
                        type="number"
                        min="0"
                        step="0.1"
                        className="form-control form-control-sm"
                        style={{ width: 70 }}
                        value={currentClip?.fadeIn ?? 0}
                        onChange={(e) => handleFadeChange("in", Number(e.target.value))}
                        disabled={!selectedClip}
                    />
                </div>
                <div className="d-flex align-items-center gap-1">
                    <span style={{ fontSize: 12 }}>Fade Out</span>
                    <input
                        type="number"
                        min="0"
                        step="0.1"
                        className="form-control form-control-sm"
                        style={{ width: 70 }}
                        value={currentClip?.fadeOut ?? 0}
                        onChange={(e) => handleFadeChange("out", Number(e.target.value))}
                        disabled={!selectedClip}
                    />
                </div>
            </div>
        </div>
    );
};
