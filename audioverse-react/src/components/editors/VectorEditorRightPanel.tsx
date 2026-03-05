import React from "react";
import styles from "./VectorEditor.module.css";
import { FONTS } from "./vectorEditorTypes";
import type { VectorEditorAPI } from "./useVectorEditor";

interface Props {
  api: VectorEditorAPI;
}

const VectorEditorRightPanel: React.FC<Props> = ({ api }) => {
  const {
    tool, selId, selShape, shapes,
    fillCol, strokeCol, strokeW, shapeOpacity,
    cornerRadius, polygonSides, starPoints2, starInnerRatio,
    fontSize, fontFamily, snapGrid, gridSize,
    setFillCol, setStrokeCol, setStrokeW, setShapeOpacity,
    setCornerRadius, setPolygonSides, setStarPoints2, setStarInnerRatio,
    setFontSize, setFontFamily, setGridSize,
    updateSel, setSelId, setTool,
  } = api;

  return (
    <div className={styles.rightPanel}>
      {/* ── Appearance ── */}
      <div className={styles.panelSection}>
        <div className={styles.panelTitle}><span>Appearance</span></div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Fill</span>
          <div className={styles.propColorSwatch} style={{ background: fillCol }}>
            <input type="color" value={fillCol} onChange={(e) => { setFillCol(e.target.value); updateSel({ fill: e.target.value }); }} />
          </div>
          <input className={styles.propInput} value={selShape?.fill || fillCol}
            onChange={(e) => { setFillCol(e.target.value); updateSel({ fill: e.target.value }); }} />
        </div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Stroke</span>
          <div className={styles.propColorSwatch} style={{ background: strokeCol }}>
            <input type="color" value={strokeCol} onChange={(e) => { setStrokeCol(e.target.value); updateSel({ stroke: e.target.value }); }} />
          </div>
          <input className={styles.propInput} value={selShape?.stroke || strokeCol}
            onChange={(e) => { setStrokeCol(e.target.value); updateSel({ stroke: e.target.value }); }} />
        </div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Width</span>
          <input className={styles.propInput} type="number" min={0} max={100}
            value={selShape?.strokeWidth ?? strokeW}
            onChange={(e) => { const v = +e.target.value; setStrokeW(v); updateSel({ strokeWidth: v }); }} />
        </div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Opacity</span>
          <input className={styles.propInput} type="range" min={0} max={1} step={0.01}
            value={selShape?.opacity ?? shapeOpacity}
            onChange={(e) => { const v = +e.target.value; setShapeOpacity(v); updateSel({ opacity: v }); }} />
          <span style={{ fontSize: 10, minWidth: 28 }}>{Math.round((selShape?.opacity ?? shapeOpacity) * 100)}%</span>
        </div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Rotation</span>
          <input className={styles.propInput} type="number" min={-360} max={360}
            value={selShape?.rotation ?? 0}
            onChange={(e) => updateSel({ rotation: +e.target.value })} />
          <span style={{ fontSize: 10 }}>°</span>
        </div>
      </div>

      {/* ── Tool options ── */}
      <div className={styles.panelSection}>
        <div className={styles.panelTitle}><span>Tool Options</span></div>
        {(tool === "roundrect" || selShape?.type === "roundrect") && (
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Radius</span>
            <input className={styles.propInput} type="number" min={0} max={200}
              value={selShape?.rx ?? cornerRadius}
              onChange={(e) => { const v = +e.target.value; setCornerRadius(v); updateSel({ rx: v }); }} />
          </div>
        )}
        {(tool === "polygon" || selShape?.type === "polygon") && (
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Sides</span>
            <input className={styles.propInput} type="number" min={3} max={32}
              value={selShape?.sides ?? polygonSides}
              onChange={(e) => { const v = +e.target.value; setPolygonSides(v); updateSel({ sides: v }); }} />
          </div>
        )}
        {(tool === "star" || selShape?.type === "star") && (
          <>
            <div className={styles.propRow}>
              <span className={styles.propLabel}>Points</span>
              <input className={styles.propInput} type="number" min={3} max={32}
                value={selShape?.sides ?? starPoints2}
                onChange={(e) => { const v = +e.target.value; setStarPoints2(v); updateSel({ sides: v }); }} />
            </div>
            <div className={styles.propRow}>
              <span className={styles.propLabel}>Inner R</span>
              <input className={styles.propInput} type="range" min={0.1} max={0.9} step={0.05}
                value={selShape?.innerRadius ?? starInnerRatio}
                onChange={(e) => { const v = +e.target.value; setStarInnerRatio(v); updateSel({ innerRadius: v }); }} />
              <span style={{ fontSize: 10 }}>{Math.round((selShape?.innerRadius ?? starInnerRatio) * 100)}%</span>
            </div>
          </>
        )}
        {(tool === "text" || selShape?.type === "text") && (
          <>
            <div className={styles.propRow}>
              <span className={styles.propLabel}>Size</span>
              <input className={styles.propInput} type="number" min={8} max={200}
                value={selShape?.fontSize ?? fontSize}
                onChange={(e) => { const v = +e.target.value; setFontSize(v); updateSel({ fontSize: v }); }} />
            </div>
            <div className={styles.propRow}>
              <span className={styles.propLabel}>Font</span>
              <select className={styles.propInput} value={selShape?.fontFamily ?? fontFamily}
                onChange={(e) => { setFontFamily(e.target.value); updateSel({ fontFamily: e.target.value }); }}>
                {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </>
        )}
        {snapGrid && (
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Grid</span>
            <input className={styles.propInput} type="number" min={4} max={128}
              value={gridSize} onChange={(e) => setGridSize(+e.target.value)} />
          </div>
        )}
      </div>

      {/* ── Shapes list ── */}
      <div className={styles.panelSection}>
        <div className={styles.panelTitle}><span>Shapes ({shapes.length})</span></div>
        {[...shapes].reverse().map((s) => (
          <div
            key={s.id}
            className={`${styles.shapeItem} ${s.id === selId ? styles.shapeItemActive : ""}`}
            onClick={() => { setSelId(s.id); setTool("pointer"); }}
          >
            <span className={styles.shapeIcon}>
              {s.type === "rect" ? "▢"
                : s.type === "roundrect" ? "▣"
                  : s.type === "ellipse" ? "◯"
                    : s.type === "line" ? "╱"
                      : s.type === "arrow" ? "→"
                        : s.type === "polygon" ? "⬡"
                          : s.type === "star" ? "★"
                            : s.type === "polyline" ? "✎"
                              : "T"}
            </span>
            <span className={styles.shapeName}>
              {s.type}{s.text ? ` "${s.text}"` : ""}
            </span>
          </div>
        ))}
        {shapes.length === 0 && (
          <div style={{ color: "#555", fontSize: 11, padding: 4 }}>
            No shapes yet. Use the tools to draw.
          </div>
        )}
      </div>

      {/* ── Transform (selected) ── */}
      {selShape && (
        <div className={styles.panelSection}>
          <div className={styles.panelTitle}><span>Transform</span></div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>X</span>
            <input className={styles.propInput} type="number" value={Math.round(selShape.x)}
              onChange={(e) => updateSel({ x: +e.target.value })} />
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Y</span>
            <input className={styles.propInput} type="number" value={Math.round(selShape.y)}
              onChange={(e) => updateSel({ y: +e.target.value })} />
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>W</span>
            <input className={styles.propInput} type="number" value={Math.round(selShape.w)}
              onChange={(e) => updateSel({ w: +e.target.value })} />
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>H</span>
            <input className={styles.propInput} type="number" value={Math.round(selShape.h)}
              onChange={(e) => updateSel({ h: +e.target.value })} />
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(VectorEditorRightPanel);
