/**
 * ModelEditorToolbar — vertical toolbar for transform, snap,
 * camera presets, and quick actions.
 */
import React from "react";
import styles from "./ModelEditor.module.css";
import type { ModelEditorAPI } from "./useModelEditor";

interface Props {
  api: ModelEditorAPI;
}

const ModelEditorToolbar: React.FC<Props> = React.memo(({ api }) => {
  const {
    transformMode, setTransformMode,
    snapEnabled, setSnapEnabled,
    gizmoSpace, setGizmoSpace,
    rootObjectRef,
    focusOnObject,
    setCameraPreset,
    deleteSelected,
    duplicateSelected,
    selectedNode,
  } = api;

  return (
    <div className={styles.toolbar}>
      <button
        className={`${styles.toolBtn} ${transformMode === "translate" ? styles.toolBtnActive : ""}`}
        onClick={() => setTransformMode("translate")}
        title="Translate (G)"
      >
        ✥
      </button>
      <button
        className={`${styles.toolBtn} ${transformMode === "rotate" ? styles.toolBtnActive : ""}`}
        onClick={() => setTransformMode("rotate")}
        title="Rotate (R)"
      >
        ↻
      </button>
      <button
        className={`${styles.toolBtn} ${transformMode === "scale" ? styles.toolBtnActive : ""}`}
        onClick={() => setTransformMode("scale")}
        title="Scale (S)"
      >
        ⬡
      </button>
      <div className={styles.toolSep} />
      {/* Snap */}
      <button
        className={`${styles.toolBtn} ${snapEnabled ? styles.toolBtnActive : ""}`}
        onClick={() => setSnapEnabled((v) => !v)}
        title={`Snap to Grid (${snapEnabled ? "ON" : "OFF"})`}
      >
        🧲
      </button>
      {/* Gizmo orientation */}
      <button
        className={styles.toolBtn}
        onClick={() => setGizmoSpace((s) => (s === "local" ? "world" : "local"))}
        title={`Orientation: ${gizmoSpace}`}
      >
        {gizmoSpace === "local" ? "🔶" : "🌐"}
      </button>
      <div className={styles.toolSep} />
      {/* Camera views */}
      <button
        className={styles.toolBtn}
        onClick={() => rootObjectRef.current && focusOnObject(rootObjectRef.current)}
        title="Focus (F)"
      >
        ◎
      </button>
      <button
        className={styles.toolBtn}
        onClick={() => setCameraPreset("front")}
        title="Front view (Numpad 1)"
      >
        1
      </button>
      <button
        className={styles.toolBtn}
        onClick={() => setCameraPreset("right")}
        title="Right view (Numpad 3)"
      >
        3
      </button>
      <button
        className={styles.toolBtn}
        onClick={() => setCameraPreset("top")}
        title="Top view (Numpad 7)"
      >
        7
      </button>
      <div className={styles.toolSep} />
      <button
        className={styles.toolBtn}
        onClick={deleteSelected}
        title="Delete selected (Del)"
      >
        🗑
      </button>
      <button
        className={styles.toolBtn}
        onClick={duplicateSelected}
        title="Duplicate (Shift+D)"
        disabled={!selectedNode}
      >
        📋
      </button>
    </div>
  );
});

ModelEditorToolbar.displayName = "ModelEditorToolbar";
export default ModelEditorToolbar;
