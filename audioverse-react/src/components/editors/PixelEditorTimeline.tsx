/**
 * PixelEditorTimeline — bottom panel with frame management,
 * playback controls, onion skin toggle and frame thumbnails.
 */
import React from "react";
import styles from "./PixelEditor.module.css";
import type { PixelEditorAPI } from "./usePixelEditor";

interface Props {
  api: PixelEditorAPI;
}

const PixelEditorTimeline: React.FC<Props> = React.memo(({ api }) => (
  <div className={styles.bottomPanel}>
    <div className={styles.timelineControls}>
      <button onClick={api.addFrame}>+ Frame</button>
      <button onClick={api.dupFrame} aria-label="Duplicate frame">Dup</button>
      <button onClick={api.rmFrame} aria-label="Remove frame">− Frame</button>
      <div className={styles.menuSep} />
      <button onClick={() => api.setPlaying((p) => !p)}>
        {api.playing ? "⏸" : "▶"}
      </button>
      <label>FPS:</label>
      <input type="number" min={1} max={60} value={api.fps}
        onChange={(e) => api.setFps(+e.target.value || 8)}
        aria-label="Frames per second" />
      <div className={styles.menuSep} />
      <label>
        <input type="checkbox" checked={api.onion}
          onChange={(e) => api.setOnion(e.target.checked)} />
        {" "}Onion
      </label>
      <div style={{ flex: 1 }} />
      <span>{api.fc} frame{api.fc !== 1 ? "s" : ""}</span>
    </div>
    <div className={styles.timelineFrames}>
      {Array.from({ length: api.fc }, (_, fi) => (
        <div key={fi}
          className={`${styles.frameThumb} ${fi === api.afi ? styles.frameThumbActive : ""}`}
          onClick={() => api.setAfi(fi)}>
          {api.thumbs[fi] && (
            <img src={api.thumbs[fi]} alt={`Frame ${fi + 1}`}
              style={{ width: 36, height: 36, imageRendering: "pixelated", objectFit: "contain" }} />
          )}
          <span className={styles.frameNum}>{fi + 1}</span>
        </div>
      ))}
    </div>
  </div>
));

PixelEditorTimeline.displayName = "PixelEditorTimeline";
export default PixelEditorTimeline;
