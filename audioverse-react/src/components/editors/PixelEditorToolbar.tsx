/**
 * PixelEditorToolbar — left-side tool buttons, shape-fill toggle,
 * symmetry selector and colour swatches.
 */
import React from "react";
import styles from "./PixelEditor.module.css";
import { TOOLS, SYMMETRY_MODES } from "./pixelEditorTypes";
import type { PixelEditorAPI } from "./usePixelEditor";

interface Props {
  api: PixelEditorAPI;
}

const PixelEditorToolbar: React.FC<Props> = React.memo(({ api }) => (
  <div className={styles.toolbar}>
    {TOOLS.map((t) => (
      <button
        key={t.id}
        className={`${styles.toolBtn} ${api.tool === t.id ? styles.toolBtnActive : ""}`}
        onClick={() => api.setTool(t.id)}
        title={`${t.label} (${t.key})`}
      >
        {t.icon}
      </button>
    ))}

    <div className={styles.toolSep} />

    {/* shape filled toggle */}
    <button
      className={`${styles.toolBtn} ${api.shapeFilled ? styles.toolBtnActive : ""}`}
      onClick={() => api.setShapeFilled((f) => !f)}
      title={`${api.shapeFilled ? "Filled" : "Outline"} (F)`}
    >
      {api.shapeFilled ? "■" : "□"}
    </button>

    {/* symmetry selector */}
    <div className={styles.toolGroup}>
      {SYMMETRY_MODES.map((m) => (
        <button
          key={m.id}
          className={`${styles.miniBtn} ${api.symmetry === m.id ? styles.miniBtnActive : ""}`}
          onClick={() => api.setSymmetry(m.id)}
          title={`Symmetry: ${m.label}`}
        >
          {m.label.slice(0, 2)}
        </button>
      ))}
    </div>

    {/* colour swatches */}
    <div className={styles.colorSwatches}>
      <label style={{ position: "relative", width: 28, height: 28, cursor: "pointer" }} title="Primary Colour (click for HSV)">
        <input
          type="color"
          value={api.col1}
          onChange={(e) => api.setCol1(e.target.value)}
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
        />
        <span style={{ display: "block", width: 28, height: 28, background: api.col1, border: "2px solid #fff", borderRadius: 3 }} />
      </label>
      <label style={{ position: "relative", width: 22, height: 22, cursor: "pointer" }} title="Secondary Colour">
        <input
          type="color"
          value={api.col2}
          onChange={(e) => api.setCol2(e.target.value)}
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
        />
        <span style={{ display: "block", width: 22, height: 22, background: api.col2, border: "1px solid #888", borderRadius: 3 }} />
      </label>
      <button
        className={styles.toolBtn}
        onClick={() => {
          const tmp = api.col1;
          api.setCol1(api.col2);
          api.setCol2(tmp);
        }}
        title="Swap (X)"
        style={{ fontSize: 12, width: 24, height: 24 }}
      >
        ⇄
      </button>
    </div>
  </div>
));

PixelEditorToolbar.displayName = "PixelEditorToolbar";
export default PixelEditorToolbar;
