/**
 * VectorEditor — SVG-based vector drawing editor.
 *
 * Refactored: logic extracted to useVectorEditor hook,
 * UI split into VectorEditorMenuBar, VectorEditorRightPanel, VectorEditorStatusBar.
 *
 * Features:
 *  - Tools: pointer/select, rectangle, rounded rect, ellipse, line, arrow,
 *    polygon, star, pen (polyline), text
 *  - Fill & stroke colour + stroke-width editing per shape
 *  - Opacity per shape, rotation per shape
 *  - Shape list with selection, delete, reorder (bring to front / send to back)
 *  - Copy / Paste / Duplicate
 *  - Flip horizontal / vertical
 *  - Alignment: left, center, right, top, middle, bottom
 *  - Snap to grid toggle
 *  - Multi-format export: SVG, PNG, JPG, WebP, BMP
 *  - SVG import (paste or file)
 *  - Undo / Redo
 *  - Zoom & pan (wheel + middle-click)
 *  - Keyboard shortcuts: Delete, Ctrl+Z, Ctrl+Y, Ctrl+C, Ctrl+V, Ctrl+D,
 *    V, R, U, C, L, A, G, S, P, T
 */

import React from "react";
import styles from "./VectorEditor.module.css";
import { TOOLS } from "./vectorEditorTypes";
import { ShapeRenderer } from "./VectorEditorShapeRenderer";
import { useVectorEditor } from "./useVectorEditor";
import VectorEditorMenuBar from "./VectorEditorMenuBar";
import VectorEditorRightPanel from "./VectorEditorRightPanel";
import VectorEditorStatusBar from "./VectorEditorStatusBar";

/* ─── component ─── */

export interface VectorEditorProps {
  width?: number;
  height?: number;
  className?: string;
  onSaveToLibrary?: (dataUrl: string, name: string, mimeType: string) => void;
}

export const VectorEditor: React.FC<VectorEditorProps> = ({
  width: artW = 512,
  height: artH = 512,
  className,
  onSaveToLibrary,
}) => {
  const api = useVectorEditor({ artW, artH, onSaveToLibrary });

  const {
    shapes, selId, tool, zoom, px, py,
    dlgSvg, svgText, gridSize,
    boxRef, fInp,
    onDown, onMove, onUp, onWheel, onDblClick,
    openFile, switchTool, importSVGString,
    setDlgSvg, setSvgText,
  } = api;

  return (
    <div className={`${styles.root} ${className || ""}`}>
      {/* Hidden file input for SVG import */}
      <input
        ref={fInp}
        type="file"
        accept=".svg"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) openFile(f);
          e.target.value = "";
        }}
      />

      {/* MENU BAR */}
      <VectorEditorMenuBar api={api} hasOnSaveToLibrary={!!onSaveToLibrary} />

      {/* MAIN */}
      <div className={styles.mainArea}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          {TOOLS.map((t) => (
            <button
              key={t.id}
              className={`${styles.toolBtn} ${tool === t.id ? styles.toolBtnActive : ""}`}
              onClick={() => switchTool(t.id)}
              title={`${t.label} (${t.key})`}
            >
              {t.icon}
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div ref={boxRef} className={styles.canvasContainer}>
          <svg
            viewBox={`0 0 ${artW} ${artH}`}
            onMouseDown={onDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onMouseLeave={() => {
              /* handled internally via refs */
            }}
            onDoubleClick={onDblClick}
            onWheel={onWheel}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              transform: `translate(${px}px, ${py}px) scale(${zoom})`,
              transformOrigin: "center center",
              cursor: tool === "pointer" ? "default" : "crosshair",
            }}
          >
            {/* background */}
            <rect x={0} y={0} width={artW} height={artH} fill="#222" />
            {/* grid */}
            {zoom >= 2 && (
              <g opacity={0.08}>
                {Array.from({ length: Math.floor(artW / gridSize) + 1 }, (_, i) => (
                  <line key={`gx${i}`} x1={i * gridSize} y1={0} x2={i * gridSize} y2={artH} stroke="#fff" strokeWidth={1 / zoom} />
                ))}
                {Array.from({ length: Math.floor(artH / gridSize) + 1 }, (_, i) => (
                  <line key={`gy${i}`} x1={0} y1={i * gridSize} x2={artW} y2={i * gridSize} stroke="#fff" strokeWidth={1 / zoom} />
                ))}
              </g>
            )}
            {/* shapes */}
            {shapes.map((s) => (
              <ShapeRenderer key={s.id} shape={s} selected={s.id === selId} zoom={zoom} />
            ))}
          </svg>
        </div>

        {/* Right panel */}
        <VectorEditorRightPanel api={api} />
      </div>

      {/* STATUS BAR */}
      <VectorEditorStatusBar api={api} artW={artW} artH={artH} />

      {/* SVG PASTE DIALOG */}
      {dlgSvg && (
        <div className={styles.dialogOverlay} onClick={() => setDlgSvg(false)}>
          <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <h3>Paste SVG</h3>
            <label>Paste SVG source code below:</label>
            <textarea
              value={svgText}
              onChange={(e) => setSvgText(e.target.value)}
              placeholder='<svg xmlns="http://www.w3.org/2000/svg" ...>'
            />
            <div className={styles.dialogActions}>
              <button className={styles.btnSecondary} onClick={() => setDlgSvg(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={() => importSVGString(svgText)}>Import</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VectorEditor;
