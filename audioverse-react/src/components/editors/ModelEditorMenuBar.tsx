/**
 * ModelEditorMenuBar — top menu bar for the ModelEditor.
 */
import React from "react";
import styles from "./ModelEditor.module.css";
import type { ModelEditorAPI } from "./useModelEditor";
import type { EditorMode } from "./modelEditorTypes";

interface Props {
  api: ModelEditorAPI;
  hasOnSaveToLibrary: boolean;
}

const ModelEditorMenuBar: React.FC<Props> = React.memo(({ api, hasOnSaveToLibrary }) => {
  const {
    editorMode, setEditorMode,
    fileInputRef, mergeInputRef,
    addMenuOpen, setAddMenuOpen,
    addPrimitive, addSceneLight, addCameraObject, addEmpty,
    selectedNode,
    duplicateSelected, deleteSelected,
    exportGLTF, exportOBJ, exportSTL, exportPLY, exportUSDZ,
    saveToLibrary, clearScene,
    showGrid, setShowGrid,
    showAxes, setShowAxes,
    wireframe, setWireframe,
    showSkeleton, setShowSkeleton,
    showLightHelpers, setShowLightHelpers,
    bgColor, setBgColor,
  } = api;

  return (
    <div className={styles.menuBar}>
      {/* Editor mode selector */}
      <select
        className={styles.modeSelect}
        value={editorMode}
        onChange={(e) => setEditorMode(e.target.value as EditorMode)}
      >
        <option value="object">Object Mode</option>
        <option value="edit">Edit Mode</option>
        <option value="pose">Pose Mode</option>
      </select>
      <div className={styles.menuSep} />
      <button
        className={styles.menuBtn}
        onClick={() => fileInputRef.current?.click()}
      >
        📂 Open
      </button>
      <button
        className={styles.menuBtn}
        onClick={() => mergeInputRef.current?.click()}
        title="Merge animations from FBX/GLTF onto current model"
      >
        ➕ Merge Anim
      </button>
      <div className={styles.menuSep} />

      {/* Add menu */}
      <div className={styles.menuDropdownWrap}>
        <button
          className={styles.menuBtn}
          onClick={() => setAddMenuOpen(addMenuOpen ? null : "mesh")}
        >
          ＋ Add ▾
        </button>
        {addMenuOpen && (
          <div className={styles.dropdownMenu}>
            <div className={styles.dropdownTitle}>Mesh</div>
            {["cube","sphere","cylinder","cone","torus","plane","circle","ring","dodecahedron","icosahedron","octahedron","tetrahedron","torusKnot"].map((t) => (
              <div key={t} className={styles.dropdownItem} onClick={() => addPrimitive(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </div>
            ))}
            <div className={styles.dropdownSep} />
            <div className={styles.dropdownTitle}>Light</div>
            {["point","spot","directional","hemisphere"].map((t) => (
              <div key={t} className={styles.dropdownItem} onClick={() => addSceneLight(t)}>
                💡 {t.charAt(0).toUpperCase() + t.slice(1)}
              </div>
            ))}
            <div className={styles.dropdownSep} />
            <div className={styles.dropdownTitle}>Other</div>
            <div className={styles.dropdownItem} onClick={addCameraObject}>📷 Camera</div>
            <div className={styles.dropdownItem} onClick={() => addEmpty("arrows")}>⊹ Empty (Arrows)</div>
          </div>
        )}
      </div>

      {/* Edit menu */}
      <button
        className={styles.menuBtn}
        onClick={duplicateSelected}
        disabled={!selectedNode}
        title="Duplicate selected (Shift+D)"
      >
        📋 Duplicate
      </button>
      <button
        className={styles.menuBtn}
        onClick={deleteSelected}
        disabled={!selectedNode}
        title="Delete selected (Delete)"
      >
        ✕ Delete
      </button>

      <div className={styles.menuSep} />
      <button className={styles.menuBtn} onClick={() => exportGLTF(true)}>
        💾 Export GLB
      </button>
      <button className={styles.menuBtn} onClick={() => exportGLTF(false)}>
        📄 Export GLTF
      </button>
      <button className={styles.menuBtn} onClick={exportOBJ}>
        📄 Export OBJ
      </button>
      <button className={styles.menuBtn} onClick={() => exportSTL(true)}>
        📄 Export STL
      </button>
      <button className={styles.menuBtn} onClick={() => exportPLY(true)}>
        📄 Export PLY
      </button>
      <button className={styles.menuBtn} onClick={exportUSDZ}>
        📄 Export USDZ
      </button>
      {hasOnSaveToLibrary && (
        <>
          <div className={styles.menuSep} />
          <button className={styles.menuBtn} onClick={saveToLibrary}>
            📦 Save to Library
          </button>
        </>
      )}
      <div className={styles.menuSep} />
      <button className={styles.menuBtn} onClick={clearScene}>
        🗑 Clear
      </button>
      <div className={styles.menuSep} />
      <label className={styles.menuLabel}>Grid</label>
      <input
        type="checkbox"
        checked={showGrid}
        onChange={() => setShowGrid((v) => !v)}
      />
      <label className={styles.menuLabel}>Axes</label>
      <input
        type="checkbox"
        checked={showAxes}
        onChange={() => setShowAxes((v) => !v)}
      />
      <label className={styles.menuLabel}>Wire</label>
      <input
        type="checkbox"
        checked={wireframe}
        onChange={() => setWireframe((v) => !v)}
      />
      <label className={styles.menuLabel}>Skel</label>
      <input
        type="checkbox"
        checked={showSkeleton}
        onChange={() => setShowSkeleton((v) => !v)}
      />
      <label className={styles.menuLabel}>Helpers</label>
      <input
        type="checkbox"
        checked={showLightHelpers}
        onChange={() => setShowLightHelpers((v) => !v)}
      />
      <div className={styles.menuRight}>
        <label className={styles.menuLabel}>BG</label>
        <div className={styles.propColorSwatch} style={{ width: 18, height: 18, background: bgColor }}>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
});

ModelEditorMenuBar.displayName = "ModelEditorMenuBar";
export default ModelEditorMenuBar;
