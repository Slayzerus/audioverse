import React from "react";
import styles from "./VectorEditor.module.css";
import type { VectorEditorAPI } from "./useVectorEditor";

interface Props {
  api: VectorEditorAPI;
  artW: number;
  artH: number;
}

const VectorEditorStatusBar: React.FC<Props> = ({ api, artW, artH }) => (
  <div className={styles.statusBar}>
    <span>{artW}×{artH}</span>
    <span>Zoom {Math.round(api.zoom * 100)}%</span>
    <span>{api.tool}</span>
    <span>{api.shapes.length} shape(s)</span>
    {api.selId && <span>Selected: {api.selShape?.type}</span>}
    {api.snapGrid && <span>Snap: {api.gridSize}px</span>}
  </div>
);

export default React.memo(VectorEditorStatusBar);
