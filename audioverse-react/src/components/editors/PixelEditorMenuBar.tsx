/**
 * PixelEditorMenuBar — top menu bar for PixelEditor.
 */
import React from "react";
import styles from "./PixelEditor.module.css";
import type { PixelEditorAPI } from "./usePixelEditor";

interface Props {
  api: PixelEditorAPI;
  hasOnSaveToLibrary: boolean;
}

const PixelEditorMenuBar: React.FC<Props> = React.memo(({ api, hasOnSaveToLibrary }) => (
  <div className={styles.menuBar}>
    <button className={styles.menuBtn} onClick={() => api.setDlgNew(true)}>New</button>
    <button className={styles.menuBtn} onClick={() => api.fInp.current?.click()}>Open</button>
    <button className={styles.menuBtn} onClick={api.exportAse}>Save .ase</button>
    <div className={styles.menuSep} />
    <button className={styles.menuBtn} onClick={api.exportPNG}>PNG</button>
    <button className={styles.menuBtn} onClick={api.exportJPG}>JPG</button>
    <button className={styles.menuBtn} onClick={api.exportWebP}>WebP</button>
    <button className={styles.menuBtn} onClick={api.exportBMP}>BMP</button>
    <button className={styles.menuBtn} onClick={api.exportSVG}>SVG</button>
    <button className={styles.menuBtn} onClick={api.exportSheet}>Sheet</button>
    {hasOnSaveToLibrary && (
      <>
        <div className={styles.menuSep} />
        <button className={styles.menuBtn} onClick={api.saveToLibrary}>📦 Save to Library</button>
      </>
    )}
    <div className={styles.menuSep} />
    <button className={styles.menuBtn} onClick={api.undo}>Undo</button>
    <button className={styles.menuBtn} onClick={api.redo}>Redo</button>
    <div className={styles.menuSep} />
    <button className={styles.menuBtn} onClick={() => api.flipCv("h")}>Flip H</button>
    <button className={styles.menuBtn} onClick={() => api.flipCv("v")}>Flip V</button>
    <button className={styles.menuBtn} onClick={api.rotateCv}>Rot 90°</button>
    <button className={styles.menuBtn} onClick={api.clearCv}>Clear</button>
    <div className={styles.menuSep} />
    <button className={styles.menuBtn} onClick={() => api.setGrid((g) => !g)}>
      Grid: {api.grid ? "ON" : "OFF"}
    </button>
    <div className={styles.menuSep} />
    <button className={styles.menuBtn} onClick={api.doCopy} disabled={!api.sel}>Copy</button>
    <button className={styles.menuBtn} onClick={api.doCut} disabled={!api.sel}>Cut</button>
    <button className={styles.menuBtn} onClick={api.doPaste} disabled={!api.clipboard.current}>Paste</button>
    <button className={styles.menuBtn} onClick={api.doSelectAll}>Sel All</button>
  </div>
));

PixelEditorMenuBar.displayName = "PixelEditorMenuBar";
export default PixelEditorMenuBar;
