/**
 * PixelEditorCanvas — the main canvas element with pointer and wheel handlers.
 */
import React from "react";
import styles from "./PixelEditor.module.css";
import type { PixelEditorAPI } from "./usePixelEditor";

interface Props {
  api: PixelEditorAPI;
}

const PixelEditorCanvas: React.FC<Props> = React.memo(({ api }) => (
  <div ref={api.boxRef} className={styles.canvasContainer}>
    <canvas
      ref={api.cvRef}
      onPointerDown={api.onDown}
      onPointerMove={api.onMove}
      onPointerUp={api.onUp}
      onPointerLeave={() => {
        api.drawing.current = false;
        api.panning.current = false;
        api.setCursor(null);
      }}
      onWheel={api.onWheel}
      onContextMenu={(e) => e.preventDefault()}
      style={{ inset: 0, width: "100%", height: "100%", touchAction: "none" }}
      aria-label="Pixel editor canvas"
    />
  </div>
));

PixelEditorCanvas.displayName = "PixelEditorCanvas";
export default PixelEditorCanvas;
