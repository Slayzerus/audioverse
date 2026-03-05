/**
 * PixelEditorStatusBar — bottom status bar showing
 * canvas info, cursor position, tool, brush, pressure, layer, frame.
 */
import React from "react";
import styles from "./PixelEditor.module.css";
import { inB } from "./pixelEditorTypes";
import type { PixelEditorAPI } from "./usePixelEditor";

interface Props {
  api: PixelEditorAPI;
}

const PixelEditorStatusBar: React.FC<Props> = React.memo(({ api }) => (
  <div className={styles.statusBar}>
    <span>{api.dw}×{api.dh}</span>
    <span>Zoom {Math.round(api.zoom * 100)}%</span>
    {api.cursor && inB(api.cursor.x, api.cursor.y, api.dw, api.dh) && (
      <span>({api.cursor.x}, {api.cursor.y})</span>
    )}
    <span>{api.tool}</span>
    <span>Brush: {api.brush.size}px {api.brush.shape}</span>
    <span>Pressure: {Math.round(api.pressure * 100)}%</span>
    <span>Layer: {api.layers[api.aLi]?.name}</span>
    <span>Frame {api.afi + 1}/{api.fc}</span>
    {api.symmetry !== "none" && <span>Sym: {api.symmetry}</span>}
    {api.shapeFilled && <span>Filled</span>}
    {api.sel && <span>Sel: {api.sel.w}×{api.sel.h}</span>}
  </div>
));

PixelEditorStatusBar.displayName = "PixelEditorStatusBar";
export default PixelEditorStatusBar;
