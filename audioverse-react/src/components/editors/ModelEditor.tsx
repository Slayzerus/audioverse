/**
 * ModelEditor — Blender-style 3D model editor powered by Three.js.
 *
 * Refactored: logic extracted to useModelEditor hook,
 * UI split into ModelEditorMenuBar, ModelEditorLeftPanel,
 * ModelEditorToolbar, ModelEditorViewport, ModelEditorRightPanel,
 * ModelEditorTimeline.
 */

import React from "react";
import styles from "./ModelEditor.module.css";
import { SUPPORTED_EXTENSIONS } from "./modelEditorTypes";
import { useModelEditor } from "./useModelEditor";
import ModelEditorMenuBar from "./ModelEditorMenuBar";
import ModelEditorLeftPanel from "./ModelEditorLeftPanel";
import ModelEditorToolbar from "./ModelEditorToolbar";
import ModelEditorViewport from "./ModelEditorViewport";
import ModelEditorRightPanel from "./ModelEditorRightPanel";
import ModelEditorTimeline from "./ModelEditorTimeline";

interface ModelEditorProps {
  className?: string;
  onSaveToLibrary?: (dataUrl: string, name: string, mimeType: string) => void;
}

const ACCEPT = SUPPORTED_EXTENSIONS.map((e) => `.${e}`).join(",");

export const ModelEditor: React.FC<ModelEditorProps> = ({ className, onSaveToLibrary }) => {
  const api = useModelEditor({ onSaveToLibrary });

  return (
    <div className={`${styles.editor} ${className ?? ""}`} tabIndex={0}>
      {/* Hidden file inputs */}
      <input
        ref={api.fileInputRef}
        type="file"
        accept={ACCEPT}
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) api.loadFile(f);
          e.target.value = "";
        }}
      />
      <input
        ref={api.mergeInputRef}
        type="file"
        accept=".fbx"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) api.mergeAnimationFBX(f);
          e.target.value = "";
        }}
      />
      <input
        ref={api.videoInputRef}
        type="file"
        accept="video/*"
        style={{ display: "none" }}
        onChange={api.handleAIVideo}
      />

      {/* Top menu bar */}
      <ModelEditorMenuBar api={api} hasOnSaveToLibrary={!!onSaveToLibrary} />

      {/* Main area: left panel + toolbar + viewport + right panel */}
      <div className={styles.mainArea}>
        <ModelEditorLeftPanel api={api} />
        <ModelEditorToolbar api={api} />
        <ModelEditorViewport api={api} />
        <ModelEditorRightPanel api={api} />
      </div>

      {/* Bottom animation timeline */}
      <ModelEditorTimeline api={api} />

      {/* Status bar */}
      <div className={styles.statusBar}>
        <span>{api.statusText}</span>
        <span style={{ marginLeft: "auto" }}>
          {api.polyCount.toLocaleString()} triangles · {api.meshCount} meshes ·{" "}
          {api.boneCount} bones · {api.animations.length} anim(s)
        </span>
      </div>
    </div>
  );
};

export default ModelEditor;
