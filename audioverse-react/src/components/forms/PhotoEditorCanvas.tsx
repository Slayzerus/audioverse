/**
 * PhotoEditorCanvas.tsx — Canvas viewport for the PhotoEditor.
 *
 * Shows either:
 *  - Compare mode (before / after with a slider)
 *  - Regular mode (main canvas + optional crop overlay)
 */

import React from "react";
import type { PhotoEditorAPI } from "./usePhotoEditor";
import cs from "./PhotoEditor.module.css";

interface Props {
    api: PhotoEditorAPI;
}

// ── Crop Overlay (rule-of-thirds + 8 handles + size indicator) ──

const CropOverlay: React.FC<{ api: PhotoEditorAPI }> = ({ api }) => {
    const { cropMode, cropRect, mainCanvasRef, accent, handleCropMouseDown } = api;
    if (!cropMode || !cropRect || !mainCanvasRef.current) return null;

    const canvasEl = mainCanvasRef.current;
    const cw = canvasEl.width;
    const ch = canvasEl.height;
    const left = (cropRect.x / cw) * 100;
    const top = (cropRect.y / ch) * 100;
    const width = (cropRect.w / cw) * 100;
    const height = (cropRect.h / ch) * 100;

    const handleStyle = (cursor: string): React.CSSProperties => ({
        position: "absolute", width: 14, height: 14,
        background: accent, border: "2px solid #fff",
        borderRadius: 3, cursor, zIndex: 3,
    });

    return (
        <div className={cs.cropOverlay}>
            {/* Darkened areas outside crop */}
            <div className={cs.cropDarkBg} />
            {/* Clear window */}
            <div
                style={{
                    position: "absolute",
                    left: `${left}%`, top: `${top}%`,
                    width: `${width}%`, height: `${height}%`,
                    background: "transparent",
                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
                    border: `2px solid ${accent}`,
                    pointerEvents: "auto",
                    cursor: "move",
                }}
                onMouseDown={(e) => handleCropMouseDown(e, "move")}
            >
                {/* Rule of thirds grid */}
                <div className={cs.cropGridContainer}>
                    {[1, 2].map(i => (
                        <div key={`h${i}`} style={{
                            position: "absolute", left: 0, right: 0,
                            top: `${(i / 3) * 100}%`, height: 1,
                            background: "rgba(255,255,255,0.3)",
                        }} />
                    ))}
                    {[1, 2].map(i => (
                        <div key={`v${i}`} style={{
                            position: "absolute", top: 0, bottom: 0,
                            left: `${(i / 3) * 100}%`, width: 1,
                            background: "rgba(255,255,255,0.3)",
                        }} />
                    ))}
                </div>
                {/* Corner handles */}
                <div style={{ ...handleStyle("nw-resize"), top: -7, left: -7 }} onMouseDown={e => handleCropMouseDown(e, "nw")} />
                <div style={{ ...handleStyle("ne-resize"), top: -7, right: -7 }} onMouseDown={e => handleCropMouseDown(e, "ne")} />
                <div style={{ ...handleStyle("sw-resize"), bottom: -7, left: -7 }} onMouseDown={e => handleCropMouseDown(e, "sw")} />
                <div style={{ ...handleStyle("se-resize"), bottom: -7, right: -7 }} onMouseDown={e => handleCropMouseDown(e, "se")} />
                {/* Edge handles */}
                <div style={{ ...handleStyle("n-resize"), top: -7, left: "50%", transform: "translateX(-50%)" }} onMouseDown={e => handleCropMouseDown(e, "n")} />
                <div style={{ ...handleStyle("s-resize"), bottom: -7, left: "50%", transform: "translateX(-50%)" }} onMouseDown={e => handleCropMouseDown(e, "s")} />
                <div style={{ ...handleStyle("w-resize"), top: "50%", left: -7, transform: "translateY(-50%)" }} onMouseDown={e => handleCropMouseDown(e, "w")} />
                <div style={{ ...handleStyle("e-resize"), top: "50%", right: -7, transform: "translateY(-50%)" }} onMouseDown={e => handleCropMouseDown(e, "e")} />
                {/* Size indicator */}
                <div className={cs.cropSizeLabel}>
                    {Math.round(cropRect.w)} × {Math.round(cropRect.h)}
                </div>
            </div>
        </div>
    );
};

// ── Canvas Viewport ──

const PhotoEditorCanvas: React.FC<Props> = React.memo(({ api }) => {
    const {
        containerRef, activeTab, zoom, accent,
        showCompare, comparePosition, setCompareDragging,
        mainCanvasRef, compareCanvasRef,
        handleCanvasMouseDown, handleCanvasMouseMove, handleCanvasMouseUp,
    } = api;

    return (
        <div
            ref={containerRef}
            className={cs.canvasViewport}
            style={{ cursor: activeTab === "draw" ? "crosshair" : undefined }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
        >
            <div className={cs.zoomWrap} style={{ transform: `scale(${zoom})` }}>
                {showCompare ? (
                    // ── Before / After comparison ──
                    <div
                        className={cs.compareWrap}
                        onMouseDown={() => setCompareDragging(true)}
                    >
                        {/* "Before" (original) */}
                        <canvas
                            ref={compareCanvasRef}
                            className={cs.canvasOriginal}
                            role="img"
                            aria-label="Photo editor original preview canvas"
                        />
                        {/* "After" (edited) clipped */}
                        <div className={cs.compareClip} style={{ width: `${comparePosition}%` }}>
                            <canvas
                                ref={mainCanvasRef}
                                className={cs.canvasEdited}
                                role="img"
                                aria-label="Photo editor edited preview canvas"
                            />
                        </div>
                        {/* Slider line */}
                        <div
                            className={cs.compareSlider}
                            style={{
                                left: `${comparePosition}%`,
                                background: accent,
                                boxShadow: `0 0 8px ${accent}`,
                            }}
                        >
                            <div className={cs.compareSliderKnob} style={{ background: accent }}>
                                <i className={`fa fa-arrows-h ${cs.compareSliderIcon}`} />
                            </div>
                        </div>
                        {/* Labels */}
                        <div className={cs.compareLabelOriginal}>Original</div>
                        <div className={cs.compareLabelEdited} style={{ background: `${accent}cc` }}>Edited</div>
                    </div>
                ) : (
                    // ── Regular canvas view ──
                    <div className={cs.regularWrap}>
                        <canvas
                            ref={mainCanvasRef}
                            className={cs.canvasRegular}
                            role="img"
                            aria-label="Photo editor canvas"
                        />
                        <CropOverlay api={api} />
                    </div>
                )}
            </div>
        </div>
    );
});

PhotoEditorCanvas.displayName = "PhotoEditorCanvas";
export default PhotoEditorCanvas;