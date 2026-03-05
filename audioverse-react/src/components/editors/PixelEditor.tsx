/**
 * PixelEditor — Aseprite-inspired pixel art editor.
 *
 * Refactored: logic extracted to usePixelEditor hook,
 * UI split into PixelEditorMenuBar, PixelEditorToolbar,
 * PixelEditorCanvas, PixelEditorRightPanel, PixelEditorTimeline,
 * PixelEditorStatusBar.
 */

import React from "react";
import styles from "./PixelEditor.module.css";
import { usePixelEditor } from "./usePixelEditor";
import PixelEditorMenuBar from "./PixelEditorMenuBar";
import PixelEditorToolbar from "./PixelEditorToolbar";
import PixelEditorCanvas from "./PixelEditorCanvas";
import PixelEditorRightPanel from "./PixelEditorRightPanel";
import PixelEditorTimeline from "./PixelEditorTimeline";
import PixelEditorStatusBar from "./PixelEditorStatusBar";

export interface PixelEditorProps {
  initialWidth?: number;
  initialHeight?: number;
  className?: string;
  onSaveToLibrary?: (dataUrl: string, name: string, mimeType: string) => void;
}

export const PixelEditor: React.FC<PixelEditorProps> = ({
  initialWidth = 64,
  initialHeight = 64,
  className,
  onSaveToLibrary,
}) => {
  const api = usePixelEditor({ initialWidth, initialHeight, onSaveToLibrary });

  return (
    <div className={`${styles.root} ${className || ""}`}>
      {/* hidden file input */}
      <input
        ref={api.fInp}
        type="file"
        accept=".ase,.aseprite,.png,.jpg,.jpeg,.gif,.bmp,.webp,.svg,.tga,.ico,.tiff,.tif,.avif"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) api.openFile(f);
          e.target.value = "";
        }}
      />

      <PixelEditorMenuBar api={api} hasOnSaveToLibrary={!!onSaveToLibrary} />

      <div className={styles.mainArea}>
        <PixelEditorToolbar api={api} />
        <PixelEditorCanvas api={api} />
        <PixelEditorRightPanel api={api} />
      </div>

      <PixelEditorTimeline api={api} />
      <PixelEditorStatusBar api={api} />

      {/* New Document Dialog */}
      {api.dlgNew && (
        <div className={styles.dialogOverlay} onClick={() => api.setDlgNew(false)}>
          <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <h3>New Document</h3>
            <label>Width (px)</label>
            <input type="number" min={1} max={4096} value={api.nw}
              onChange={(e) => api.setNw(+e.target.value || 64)}
              aria-label="Document width" />
            <label>Height (px)</label>
            <input type="number" min={1} max={4096} value={api.nh}
              onChange={(e) => api.setNh(+e.target.value || 64)}
              aria-label="Document height" />
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
              {([
                [16, 16], [32, 32], [48, 48], [64, 64], [128, 128],
                [256, 256], [16, 32], [32, 64], [48, 16], [64, 32],
              ] as [number, number][]).map(([w, h]) => (
                <button key={`${w}x${h}`} className={styles.btnSecondary}
                  style={{ fontSize: 10, padding: "2px 6px" }}
                  onClick={() => { api.setNw(w); api.setNh(h); }}>
                  {w}x{h}
                </button>
              ))}
            </div>
            <div className={styles.dialogActions}>
              <button className={styles.btnSecondary} onClick={() => api.setDlgNew(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={() => api.newDoc(api.nw, api.nh)}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PixelEditor;