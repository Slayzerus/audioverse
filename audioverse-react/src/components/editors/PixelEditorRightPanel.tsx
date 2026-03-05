/**
 * PixelEditorRightPanel — brush config, HSV colour picker,
 * layer management and palette.
 */
import React from "react";
import styles from "./PixelEditor.module.css";
import { BRUSH_SHAPES, BLEND_MODES } from "./pixelEditorTypes";
import type { PixelEditorAPI } from "./usePixelEditor";
import { HSVPicker } from "./HSVPicker";

interface Props {
  api: PixelEditorAPI;
}

const PixelEditorRightPanel: React.FC<Props> = React.memo(({ api }) => (
  <div className={styles.rightPanel}>
    {/* ── Brush config ── */}
    <div className={styles.panelSection}>
      <div className={styles.panelTitle}><span>Brush</span></div>
      <div className={styles.brushSlider}>
        <label>Size</label>
        <input type="range" min={1} max={64} value={api.brush.size}
          onChange={(e) => api.setBrush((b) => ({ ...b, size: +e.target.value }))}
          aria-label="Brush size" />
        <span>{api.brush.size}</span>
      </div>
      <div className={styles.brushSlider}>
        <label>Opacity</label>
        <input type="range" min={1} max={100} value={api.brush.opacity}
          onChange={(e) => api.setBrush((b) => ({ ...b, opacity: +e.target.value }))}
          aria-label="Brush opacity" />
        <span>{api.brush.opacity}%</span>
      </div>
      <div className={styles.brushSlider}>
        <label>Flow</label>
        <input type="range" min={1} max={100} value={api.brush.flow}
          onChange={(e) => api.setBrush((b) => ({ ...b, flow: +e.target.value }))}
          aria-label="Brush flow" />
        <span>{api.brush.flow}%</span>
      </div>
      <div className={styles.brushSlider}>
        <label>Hard</label>
        <input type="range" min={0} max={100} value={api.brush.hardness}
          onChange={(e) => api.setBrush((b) => ({ ...b, hardness: +e.target.value }))}
          aria-label="Brush hardness" />
        <span>{api.brush.hardness}%</span>
      </div>
      <div className={styles.brushSlider}>
        <label>Space</label>
        <input type="range" min={1} max={100} value={api.brush.spacing}
          onChange={(e) => api.setBrush((b) => ({ ...b, spacing: +e.target.value }))}
          aria-label="Brush spacing" />
        <span>{api.brush.spacing}%</span>
      </div>
      <div className={styles.brushShapes}>
        {BRUSH_SHAPES.map((s) => (
          <button key={s.id}
            className={`${styles.miniBtn} ${api.brush.shape === s.id ? styles.miniBtnActive : ""}`}
            onClick={() => api.setBrush((b) => ({ ...b, shape: s.id }))}
            title={s.label}>
            {s.icon}
          </button>
        ))}
      </div>
      <div className={styles.pressureToggles}>
        <label className={styles.checkLabel}>
          <input type="checkbox" checked={api.brush.pressureSize}
            onChange={(e) => api.setBrush((b) => ({ ...b, pressureSize: e.target.checked }))} />
          Pressure→Size
        </label>
        <label className={styles.checkLabel}>
          <input type="checkbox" checked={api.brush.pressureOpacity}
            onChange={(e) => api.setBrush((b) => ({ ...b, pressureOpacity: e.target.checked }))} />
          Pressure→Opacity
        </label>
      </div>
    </div>

    {/* ── HSV Colour Picker ── */}
    <div className={styles.panelSection}>
      <div className={styles.panelTitle}>
        <span>Colour</span>
        <button onClick={() => api.setShowHSV(!api.showHSV)} title="Toggle HSV Picker">
          {api.showHSV ? "▾" : "▸"}
        </button>
      </div>
      {api.showHSV && <HSVPicker color={api.col1} onChange={api.setCol1} />}
    </div>

    {/* ── Layers ── */}
    <div className={styles.panelSection}>
      <div className={styles.panelTitle}>
        <span>Layers</span>
        <span>
          <button onClick={api.addLayer} title="Add Layer" aria-label="Add Layer">+</button>
          <button onClick={api.dupLayer} title="Duplicate Layer" aria-label="Duplicate Layer">⧉</button>
          <button onClick={api.rmLayer} title="Remove Layer" aria-label="Remove Layer">−</button>
          <button onClick={api.mergeDown} title="Merge Down" aria-label="Merge Down">⤓</button>
          <button onClick={api.moveLayerUp} title="Move Up" aria-label="Move Up">↑</button>
          <button onClick={api.moveLayerDown} title="Move Down" aria-label="Move Down">↓</button>
        </span>
      </div>
      {[...api.layers].map((l, i) => ({ l, i })).reverse().map(({ l, i }) => (
        <div key={l.id}
          className={`${styles.layerItem} ${i === api.aLi ? styles.layerItemActive : ""}`}
          onClick={() => api.setALi(i)}>
          <span className={styles.layerVis} onClick={(e) => { e.stopPropagation(); api.toggleVis(i); }}>
            {l.visible ? "👁" : "─"}
          </span>
          <span className={styles.layerLock} onClick={(e) => { e.stopPropagation(); api.toggleLock(i); }}
            title={l.locked ? "Locked" : "Unlocked"}>
            {l.locked ? "🔒" : "🔓"}
          </span>
          {api.editingLayerName === l.id ? (
            <input className={styles.layerNameInput} value={l.name}
              onChange={(e) => api.renameLayer(i, e.target.value)}
              onBlur={() => api.setEditingLayerName(null)}
              onKeyDown={(e) => { if (e.key === "Enter") api.setEditingLayerName(null); }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              aria-label="Layer name" />
          ) : (
            <span className={styles.layerName}
              onDoubleClick={(e) => { e.stopPropagation(); api.setEditingLayerName(l.id); }}>
              {l.name}
            </span>
          )}
          <span className={styles.layerOpacity}>{Math.round((l.opacity / 255) * 100)}%</span>
        </div>
      ))}
      {api.layers[api.aLi] && (
        <div className={styles.layerControls}>
          <select value={api.layers[api.aLi].blendMode}
            onChange={(e) => api.setLayerBlendMode(api.aLi, e.target.value as typeof BLEND_MODES[number])}
            className={styles.blendSelect}
            aria-label="Blend mode">
            {BLEND_MODES.map((m) => (<option key={m} value={m}>{m}</option>))}
          </select>
          <input type="range" min={0} max={255} value={api.layers[api.aLi].opacity}
            onChange={(e) => api.setLayerOpacity(api.aLi, +e.target.value)}
            className={styles.layerOpSlider}
            title={`Opacity: ${Math.round((api.layers[api.aLi].opacity / 255) * 100)}%`} />
        </div>
      )}
    </div>

    {/* ── Palette ── */}
    <div className={styles.panelSection}>
      <div className={styles.panelTitle}>
        <span>Palette</span>
        <button onClick={() => { if (!api.pal.includes(api.col1)) api.setPal((p) => [...p, api.col1]); }}
          title="Add current colour">+</button>
      </div>
      <div className={styles.paletteGrid}>
        {api.pal.map((c, i) => (
          <div key={i}
            className={`${styles.paletteSwatch} ${c === api.col1 ? styles.paletteSwatchActive : ""}`}
            style={{ backgroundColor: c }}
            onClick={() => api.setCol1(c)}
            onContextMenu={(e) => { e.preventDefault(); api.setCol2(c); }}
            title={c} />
        ))}
      </div>
    </div>
  </div>
));

PixelEditorRightPanel.displayName = "PixelEditorRightPanel";
export default PixelEditorRightPanel;
