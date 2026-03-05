import React from "react";
import styles from "./VectorEditor.module.css";
import type { VectorEditorAPI } from "./useVectorEditor";

interface Props {
  api: VectorEditorAPI;
  hasOnSaveToLibrary?: boolean;
}

const VectorEditorMenuBar: React.FC<Props> = ({ api, hasOnSaveToLibrary }) => {
  const {
    selId, hasClipboard, snapGrid, fInp,
    newCanvas, setDlgSvg,
    exportSVG, exportPNG, exportJPG, exportWebP, exportBMP,
    undo, redo, duplicateShape, copyShape, pasteShape,
    deleteShape, bringToFront, sendToBack,
    flipH, flipV, alignShapes,
    setSnapGrid, saveToLibrary,
  } = api;

  return (
    <div className={styles.menuBar}>
      <button className={styles.menuBtn} onClick={newCanvas}>New</button>
      <button className={styles.menuBtn} onClick={() => fInp.current?.click()}>Open SVG</button>
      <button className={styles.menuBtn} onClick={() => setDlgSvg(true)}>Paste SVG</button>
      <div className={styles.menuSep} />
      <button className={styles.menuBtn} onClick={exportSVG}>SVG</button>
      <button className={styles.menuBtn} onClick={exportPNG}>PNG</button>
      <button className={styles.menuBtn} onClick={exportJPG}>JPG</button>
      <button className={styles.menuBtn} onClick={exportWebP}>WebP</button>
      <button className={styles.menuBtn} onClick={exportBMP}>BMP</button>
      <div className={styles.menuSep} />
      <button className={styles.menuBtn} onClick={undo}>Undo</button>
      <button className={styles.menuBtn} onClick={redo}>Redo</button>
      <div className={styles.menuSep} />
      <button className={styles.menuBtn} onClick={duplicateShape} disabled={!selId} title="Ctrl+D">Dup</button>
      <button className={styles.menuBtn} onClick={copyShape} disabled={!selId} title="Ctrl+C">Copy</button>
      <button className={styles.menuBtn} onClick={pasteShape} disabled={!hasClipboard} title="Ctrl+V">Paste</button>
      <div className={styles.menuSep} />
      <button className={styles.menuBtn} onClick={deleteShape} disabled={!selId}>Delete</button>
      <button className={styles.menuBtn} onClick={bringToFront} disabled={!selId}>↑ Front</button>
      <button className={styles.menuBtn} onClick={sendToBack} disabled={!selId}>↓ Back</button>
      <div className={styles.menuSep} />
      <button className={styles.menuBtn} onClick={flipH} disabled={!selId} title="Flip H">⇔</button>
      <button className={styles.menuBtn} onClick={flipV} disabled={!selId} title="Flip V">⇕</button>
      <div className={styles.menuSep} />
      <button className={styles.menuBtn} onClick={() => alignShapes("left")} disabled={!selId} title="Align Left">◧</button>
      <button className={styles.menuBtn} onClick={() => alignShapes("center")} disabled={!selId} title="Align Center">◫</button>
      <button className={styles.menuBtn} onClick={() => alignShapes("right")} disabled={!selId} title="Align Right">◨</button>
      <div className={styles.menuSep} />
      <label className={styles.menuLabel} title="Snap to Grid">
        <input type="checkbox" checked={snapGrid} onChange={() => setSnapGrid((v) => !v)} style={{ marginRight: 3 }} />
        Snap
      </label>
      {hasOnSaveToLibrary && (
        <>
          <div className={styles.menuSep} />
          <button className={styles.menuBtn} onClick={saveToLibrary}>📦 Save to Library</button>
        </>
      )}
    </div>
  );
};

export default React.memo(VectorEditorMenuBar);
