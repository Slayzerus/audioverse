/**
 * Sub-components used by the ModelEditor.
 */
import React, { useState } from "react";
import * as THREE from "three";
import styles from "./ModelEditor.module.css";
import { DEG } from "./modelEditorTypes";

/* ═══════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════ */

/** Vec3 input row for position/scale */
export const Vec3Row: React.FC<{
  label: string;
  value: THREE.Vector3;
  onChange: () => void;
}> = ({ label, value, onChange }) => {
  const [, forceUpdate] = useState(0);
  const set = (axis: "x" | "y" | "z", v: string) => {
    const n = parseFloat(v);
    if (!isNaN(n)) {
      value[axis] = n;
      forceUpdate((x) => x + 1);
      onChange();
    }
  };
  return (
    <div className={styles.propRow}>
      <span className={styles.propLabel}>{label}</span>
      <div className={styles.propVec3}>
        <input
          className={styles.propVec3X}
          value={value.x.toFixed(3)}
          onChange={(e) => set("x", e.target.value)}
        />
        <input
          className={styles.propVec3Y}
          value={value.y.toFixed(3)}
          onChange={(e) => set("y", e.target.value)}
        />
        <input
          className={styles.propVec3Z}
          value={value.z.toFixed(3)}
          onChange={(e) => set("z", e.target.value)}
        />
      </div>
    </div>
  );
};

/** Vec3 input row for rotation (shows degrees) */
export const Vec3RowDeg: React.FC<{
  label: string;
  value: THREE.Euler;
  onChange: () => void;
}> = ({ label, value, onChange }) => {
  const [, forceUpdate] = useState(0);
  const set = (axis: "x" | "y" | "z", v: string) => {
    const n = parseFloat(v);
    if (!isNaN(n)) {
      value[axis] = n / DEG;
      forceUpdate((x) => x + 1);
      onChange();
    }
  };
  return (
    <div className={styles.propRow}>
      <span className={styles.propLabel}>{label}</span>
      <div className={styles.propVec3}>
        <input
          className={styles.propVec3X}
          value={(value.x * DEG).toFixed(1)}
          onChange={(e) => set("x", e.target.value)}
        />
        <input
          className={styles.propVec3Y}
          value={(value.y * DEG).toFixed(1)}
          onChange={(e) => set("y", e.target.value)}
        />
        <input
          className={styles.propVec3Z}
          value={(value.z * DEG).toFixed(1)}
          onChange={(e) => set("z", e.target.value)}
        />
      </div>
    </div>
  );
};

/** Material card with editable properties */
export const MaterialCard: React.FC<{
  material: THREE.Material;
  active: boolean;
  onClick: () => void;
  onUpdate: () => void;
}> = ({ material, active, onClick, onUpdate }) => {
  const mat = material as THREE.MeshStandardMaterial;
  const hasColor = "color" in mat;
  const hasMetalness = "metalness" in mat;
  const hasRoughness = "roughness" in mat;
  const hasEmissive = "emissive" in mat;
  const hasMap = "map" in mat;
  const hasNormalMap = "normalMap" in mat;

  const setColor = (hex: string) => {
    if (hasColor) {
      mat.color.set(hex);
      mat.needsUpdate = true;
      onUpdate();
    }
  };

  const setNum = (prop: string, val: number) => {
    (mat as unknown as Record<string, number>)[prop] = val;
    mat.needsUpdate = true;
    onUpdate();
  };

  return (
    <div
      className={`${styles.materialCard} ${active ? styles.materialCardActive : ""}`}
      onClick={onClick}
    >
      <div className={styles.materialHeader}>
        <span className={styles.materialName}>{mat.name || mat.type}</span>
      </div>

      {hasColor && (
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Color</span>
          <div
            className={styles.propColorSwatch}
            style={{ background: `#${mat.color.getHexString()}` }}
          >
            <input
              type="color"
              value={`#${mat.color.getHexString()}`}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          <span style={{ fontSize: 10, color: "#888" }}>
            #{mat.color.getHexString()}
          </span>
        </div>
      )}

      {hasMetalness && (
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Metal</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={mat.metalness}
            onChange={(e) => setNum("metalness", parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: "#5566cc" }}
          />
          <span style={{ fontSize: 9, color: "#888", width: 28, textAlign: "right" }}>
            {mat.metalness.toFixed(2)}
          </span>
        </div>
      )}

      {hasRoughness && (
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Rough</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={mat.roughness}
            onChange={(e) => setNum("roughness", parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: "#5566cc" }}
          />
          <span style={{ fontSize: 9, color: "#888", width: 28, textAlign: "right" }}>
            {mat.roughness.toFixed(2)}
          </span>
        </div>
      )}

      {hasEmissive && mat.emissive && (
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Emissive</span>
          <div
            className={styles.propColorSwatch}
            style={{ background: `#${mat.emissive.getHexString()}` }}
          >
            <input
              type="color"
              value={`#${mat.emissive.getHexString()}`}
              onChange={(e) => {
                mat.emissive.set(e.target.value);
                mat.needsUpdate = true;
                onUpdate();
              }}
            />
          </div>
        </div>
      )}

      <div className={styles.propRow}>
        <span className={styles.propLabel}>Opacity</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={mat.opacity}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            mat.opacity = v;
            mat.transparent = v < 1;
            mat.needsUpdate = true;
            onUpdate();
          }}
          style={{ flex: 1, accentColor: "#5566cc" }}
        />
        <span style={{ fontSize: 9, color: "#888", width: 28, textAlign: "right" }}>
          {mat.opacity.toFixed(2)}
        </span>
      </div>

      <div className={styles.propRow}>
        <span className={styles.propLabel}>Side</span>
        <select
          className={styles.propSelect}
          value={mat.side}
          onChange={(e) => {
            mat.side = parseInt(e.target.value) as THREE.Side;
            mat.needsUpdate = true;
            onUpdate();
          }}
        >
          <option value={THREE.FrontSide}>Front</option>
          <option value={THREE.BackSide}>Back</option>
          <option value={THREE.DoubleSide}>Double</option>
        </select>
      </div>

      {/* Texture indicators */}
      {hasMap && mat.map && (
        <div className={styles.textureSlot}>
          <div className={styles.textureThumb}>
            {(mat.map.image as HTMLImageElement | null) != null && (
              <img
                src={(mat.map.image as HTMLImageElement).src ?? ""}
                alt="diffuse"
              />
            )}
          </div>
          <div className={styles.textureInfo}>
            <div className={styles.textureName}>Diffuse Map</div>
            <div style={{ fontSize: 9, color: "#666" }}>
              {(mat.map.image as HTMLImageElement)?.width}×{(mat.map.image as HTMLImageElement)?.height}
            </div>
          </div>
        </div>
      )}

      {hasNormalMap && mat.normalMap && (
        <div className={styles.textureSlot}>
          <div className={styles.textureThumb}>
            {(mat.normalMap.image as HTMLImageElement | null) != null && (
              <img
                src={(mat.normalMap.image as HTMLImageElement).src ?? ""}
                alt="normal"
              />
            )}
          </div>
          <div className={styles.textureInfo}>
            <div className={styles.textureName}>Normal Map</div>
          </div>
        </div>
      )}
    </div>
  );
};
