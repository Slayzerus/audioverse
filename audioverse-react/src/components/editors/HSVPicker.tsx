/**
 * HSVPicker — HSV/RGB colour picker sub-component for PixelEditor.
 */

import React from "react";
import { hexToRGBA, rgbaToHex, hsvToRgb, rgbToHsv } from "./pixelEditorUtils";
import styles from "./PixelEditor.module.css";

export const HSVPicker: React.FC<{
  color: string;
  onChange: (hex: string) => void;
}> = ({ color, onChange }) => {
  const rgb = hexToRGBA(color);
  const [h, s, v] = rgbToHsv(rgb[0], rgb[1], rgb[2]);

  const set = (nh: number, ns: number, nv: number) => {
    const [r, g, b] = hsvToRgb(nh, ns, nv);
    onChange(rgbaToHex([r, g, b, 255]));
  };

  return (
    <div className={styles.hsvPicker}>
      <div className={styles.hsvRow}>
        <span className={styles.hsvLabel}>H</span>
        <input type="range" min={0} max={360} value={Math.round(h)}
          onChange={(e) => set(+e.target.value, s, v)} className={styles.hsvSlider}
          style={{ background: `linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)` }} />
        <span className={styles.hsvVal}>{Math.round(h)}°</span>
      </div>
      <div className={styles.hsvRow}>
        <span className={styles.hsvLabel}>S</span>
        <input type="range" min={0} max={100} value={Math.round(s * 100)}
          onChange={(e) => set(h, +e.target.value / 100, v)} className={styles.hsvSlider} />
        <span className={styles.hsvVal}>{Math.round(s * 100)}%</span>
      </div>
      <div className={styles.hsvRow}>
        <span className={styles.hsvLabel}>V</span>
        <input type="range" min={0} max={100} value={Math.round(v * 100)}
          onChange={(e) => set(h, s, +e.target.value / 100)} className={styles.hsvSlider} />
        <span className={styles.hsvVal}>{Math.round(v * 100)}%</span>
      </div>
      <div className={styles.hsvRow}>
        <span className={styles.hsvLabel}>R</span>
        <input type="number" min={0} max={255} value={rgb[0]}
          onChange={(e) => {
            const nr = Math.max(0, Math.min(255, +e.target.value));
            onChange(rgbaToHex([nr, rgb[1], rgb[2], 255]));
          }} className={styles.hsvNumInput} />
        <span className={styles.hsvLabel}>G</span>
        <input type="number" min={0} max={255} value={rgb[1]}
          onChange={(e) => {
            const ng = Math.max(0, Math.min(255, +e.target.value));
            onChange(rgbaToHex([rgb[0], ng, rgb[2], 255]));
          }} className={styles.hsvNumInput} />
        <span className={styles.hsvLabel}>B</span>
        <input type="number" min={0} max={255} value={rgb[2]}
          onChange={(e) => {
            const nb = Math.max(0, Math.min(255, +e.target.value));
            onChange(rgbaToHex([rgb[0], rgb[1], nb, 255]));
          }} className={styles.hsvNumInput} />
      </div>
      <div className={styles.hsvRow}>
        <span className={styles.hsvLabel}>Hex</span>
        <input type="text" value={color}
          onChange={(e) => {
            const v2 = e.target.value;
            if (/^#[0-9a-fA-F]{6}$/.test(v2)) onChange(v2);
          }}
          className={styles.hsvHexInput} />
      </div>
    </div>
  );
};
