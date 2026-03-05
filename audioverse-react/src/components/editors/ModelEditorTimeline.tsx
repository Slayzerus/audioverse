/**
 * ModelEditorTimeline — bottom animation timeline panel with
 * transport controls, clip list, scrubber, and ruler.
 */
import React from "react";
import styles from "./ModelEditor.module.css";
import type { ModelEditorAPI } from "./useModelEditor";
import { fmtTime } from "./modelEditorTypes";

interface Props {
  api: ModelEditorAPI;
}

const ModelEditorTimeline: React.FC<Props> = React.memo(({ api }) => {
  const {
    bottomCollapsed, setBottomCollapsed,
    animations,
    activeAnimIdx,
    isPlaying,
    animTime,
    animDuration,
    animSpeed, setAnimSpeed,
    loopAnim, setLoopAnim,
    seekAnim,
    togglePlay,
    stopAnim,
    playClip,
    mergeInputRef,
  } = api;

  return (
    <div
      className={`${styles.bottomPanel} ${bottomCollapsed ? styles.bottomPanelCollapsed : ""}`}
    >
      <div className={styles.bottomPanelHeader}>
        <span
          className={styles.bottomToggle}
          onClick={() => setBottomCollapsed((c) => !c)}
        >
          {bottomCollapsed ? "▶" : "▼"}
        </span>
        <span
          className={styles.bottomPanelTitle}
          onClick={() => setBottomCollapsed((c) => !c)}
        >
          Animation ({animations.length} clip{animations.length !== 1 ? "s" : ""})
        </span>
        <div className={styles.menuSep} />
        <div className={styles.transportBar}>
          <button
            className={styles.transportBtn}
            onClick={() => seekAnim(0)}
            title="Go to start"
          >
            ⏮
          </button>
          <button
            className={`${styles.transportBtn} ${isPlaying ? styles.transportBtnActive : ""}`}
            onClick={togglePlay}
            title="Play/Pause (Space)"
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button className={styles.transportBtn} onClick={stopAnim} title="Stop">
            ⏹
          </button>
          <button
            className={`${styles.transportBtn} ${loopAnim ? styles.transportBtnActive : ""}`}
            onClick={() => setLoopAnim((v) => !v)}
            title="Loop"
          >
            🔁
          </button>
        </div>
        <span className={styles.transportTime}>
          {fmtTime(animTime)} / {fmtTime(animDuration)}
        </span>
        <div className={styles.menuSep} />
        <label className={styles.menuLabel}>Speed</label>
        <input
          type="range"
          min={0.1}
          max={3}
          step={0.1}
          value={animSpeed}
          onChange={(e) => setAnimSpeed(parseFloat(e.target.value))}
          style={{ width: 60, accentColor: "#5566cc" }}
        />
        <span className={styles.menuLabel}>{animSpeed.toFixed(1)}×</span>
      </div>

      {!bottomCollapsed && (
        <div className={styles.animListArea}>
          {/* Animation list */}
          <div className={styles.animList}>
            {animations.length === 0 && (
              <div style={{ color: "#666", fontSize: 10, padding: 8 }}>
                No animations loaded
              </div>
            )}
            {animations.map((anim, i) => (
              <div
                key={`${anim.name}-${i}`}
                className={`${styles.animItem} ${i === activeAnimIdx ? styles.animItemActive : ""}`}
                onClick={() => playClip(i)}
              >
                <span>{anim.name}</span>
                <span className={styles.animDuration}>
                  {anim.duration.toFixed(1)}s
                </span>
              </div>
            ))}
            <div style={{ padding: "4px 8px" }}>
              <button
                className={styles.btnSecondary}
                style={{ width: "100%", fontSize: 10 }}
                onClick={() => mergeInputRef.current?.click()}
              >
                + Add Animation File
              </button>
            </div>
          </div>

          {/* Timeline area */}
          <div className={styles.timelineArea}>
            <div className={styles.timelineRuler}>
              {animDuration > 0 &&
                Array.from({ length: Math.ceil(animDuration) + 1 }, (_, i) => {
                  const pct = (i / animDuration) * 100;
                  return (
                    <React.Fragment key={i}>
                      <div
                        className={styles.rulerTick}
                        style={{ left: `${pct}%` }}
                      />
                      <span
                        className={styles.rulerLabel}
                        style={{ left: `${pct}%` }}
                      >
                        {i}s
                      </span>
                    </React.Fragment>
                  );
                })}
              {/* Playhead */}
              {animDuration > 0 && (
                <div
                  className={styles.playhead}
                  style={{
                    left: `${(animTime / animDuration) * 100}%`,
                    height: "100%",
                  }}
                >
                  <div className={styles.playheadHandle} />
                </div>
              )}
            </div>
            {/* Scrub area */}
            <div
              className={styles.timelineTracks}
              style={{ height: 140, cursor: "pointer" }}
              onClick={(e) => {
                if (animDuration <= 0) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                seekAnim(Math.max(0, Math.min(animDuration, pct * animDuration)));
              }}
            >
              {/* Playhead line across tracks */}
              {animDuration > 0 && (
                <div
                  className={styles.playhead}
                  style={{
                    left: `${(animTime / animDuration) * 100}%`,
                    height: "100%",
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ModelEditorTimeline.displayName = "ModelEditorTimeline";
export default ModelEditorTimeline;
