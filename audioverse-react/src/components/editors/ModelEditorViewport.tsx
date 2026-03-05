/**
 * ModelEditorViewport — 3D viewport with overlays, shading selector,
 * drop zone, and right-click context menu.
 */
import React from "react";
import styles from "./ModelEditor.module.css";
import type { ModelEditorAPI } from "./useModelEditor";
import type { ShadingMode } from "./modelEditorTypes";

interface Props {
  api: ModelEditorAPI;
}

const ModelEditorViewport: React.FC<Props> = React.memo(({ api }) => {
  const {
    mountRef,
    dragOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleViewportClick,
    handleContextMenu,
    editorMode,
    polyCount,
    meshCount,
    boneCount,
    shadingMode,
    setShadingMode,
    gizmoSpace,
    setGizmoSpace,
    contextMenu,
    closeContextMenu,
    addPrimitive,
    addSceneLight,
    duplicateSelected,
    deleteSelected,
    selectedNode,
    rootObjectRef,
    focusOnObject,
    snapEnabled,
    setSnapEnabled,
  } = api;

  return (
    <>
      {/* 3D Viewport */}
      <div
        ref={mountRef}
        className={`${styles.viewportContainer} ${dragOver ? styles.dragOver : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleViewportClick}
        onContextMenu={handleContextMenu}
      >
        <div className={styles.viewportOverlay}>
          <span className={styles.viewportBadge}>
            {editorMode.toUpperCase()} MODE
          </span>
          <span className={styles.viewportBadge}>
            {polyCount.toLocaleString()} tris · {meshCount} meshes · {boneCount} bones
          </span>
        </div>
        {/* Viewport Shading selector — top-right */}
        <div className={styles.viewportShadingBar}>
          {(["wireframe", "solid", "material", "rendered"] as ShadingMode[]).map((m) => (
            <button
              key={m}
              className={`${styles.shadingBtn} ${shadingMode === m ? styles.shadingBtnActive : ""}`}
              onClick={(e) => { e.stopPropagation(); setShadingMode(m); }}
              title={m.charAt(0).toUpperCase() + m.slice(1)}
            >
              {m === "wireframe" ? "◇" : m === "solid" ? "◆" : m === "material" ? "🎨" : "☀"}
            </button>
          ))}
        </div>
        {/* Gizmo orientation indicator — top-right below shading */}
        <div className={styles.viewportGizmoInfo}>
          <button
            className={styles.shadingBtn}
            onClick={(e) => {
              e.stopPropagation();
              setGizmoSpace((s) => (s === "local" ? "world" : "local"));
            }}
            title={`Orientation: ${gizmoSpace}`}
          >
            {gizmoSpace === "local" ? "🔶 Local" : "🌐 World"}
          </button>
        </div>
        {dragOver && (
          <div className={styles.viewportDropZone}>
            <span>Drop 3D files here</span>
          </div>
        )}
      </div>

      {/* Context menu (right-click) */}
      {contextMenu && (
        <div
          className={styles.contextMenu}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={closeContextMenu}
        >
          <div className={styles.contextItem} onClick={() => addPrimitive("cube")}>
            <span>Add Cube</span>
            <span className={styles.contextKey}>Shift+A</span>
          </div>
          <div className={styles.contextItem} onClick={() => addPrimitive("sphere")}>
            <span>Add Sphere</span>
          </div>
          <div className={styles.contextItem} onClick={() => addSceneLight("point")}>
            <span>Add Point Light</span>
          </div>
          <div className={styles.contextSep} />
          <div
            className={styles.contextItem}
            onClick={duplicateSelected}
            style={!selectedNode ? { opacity: 0.4, pointerEvents: "none" } : {}}
          >
            <span>Duplicate</span>
            <span className={styles.contextKey}>Shift+D</span>
          </div>
          <div
            className={styles.contextItem}
            onClick={deleteSelected}
            style={!selectedNode ? { opacity: 0.4, pointerEvents: "none" } : {}}
          >
            <span>Delete</span>
            <span className={styles.contextKey}>Del</span>
          </div>
          <div className={styles.contextSep} />
          <div className={styles.contextItem} onClick={() => {
            if (rootObjectRef.current) focusOnObject(rootObjectRef.current);
          }}>
            <span>Focus Camera</span>
            <span className={styles.contextKey}>F</span>
          </div>
          <div className={styles.contextItem} onClick={() => setSnapEnabled((v) => !v)}>
            <span>{snapEnabled ? "✓ " : ""}Snap to Grid</span>
          </div>
        </div>
      )}
    </>
  );
});

ModelEditorViewport.displayName = "ModelEditorViewport";
export default ModelEditorViewport;
