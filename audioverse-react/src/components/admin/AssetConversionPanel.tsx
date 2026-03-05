/**
 * AssetConversionPanel — Pixel ↔ Vector conversion tab.
 *
 * Self-contained conversion state; only needs `addAsset` callback
 * and the shared CSS-module `styles` from the parent page.
 */

import React, { useState, useCallback, useRef } from "react";
import { logger } from "../../utils/logger";
const log = logger.scoped('AssetConversionPanel');
import DOMPurify from "dompurify";
import {
  svgToImageData,
  imageDataToSVG,
} from "../editors/conversionUtils";

export interface AssetConversionPanelProps {
  addAsset: (
    name: string,
    dataUrl: string,
    mimeType: string,
    tags?: string[],
  ) => void;
  styles: Record<string, string>;
}

export const AssetConversionPanel: React.FC<AssetConversionPanelProps> = ({
  addAsset,
  styles,
}) => {
  const [convMode, setConvMode] = useState<"p2v" | "v2p">("p2v");
  const [convSrc, setConvSrc] = useState<string>("");
  const [convResult, setConvResult] = useState<string>("");
  const [convBusy, setConvBusy] = useState(false);
  const convFileRef = useRef<HTMLInputElement>(null);

  const handleConvertP2V = useCallback(async () => {
    if (!convSrc) return;
    setConvBusy(true);
    try {
      const img = new Image();
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error("Failed to load image"));
        img.src = convSrc;
      });
      const cv = document.createElement("canvas");
      cv.width = img.naturalWidth;
      cv.height = img.naturalHeight;
      const ctx = cv.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, cv.width, cv.height);
      const svg = imageDataToSVG(data, 1);
      setConvResult(svg);
    } catch (err) {
      log.error('Conversion failed', err);
      alert("Conversion failed.");
    }
    setConvBusy(false);
  }, [convSrc]);

  const handleConvertV2P = useCallback(async () => {
    if (!convSrc) return;
    setConvBusy(true);
    try {
      const data = await svgToImageData(convSrc, 256, 256);
      const cv = document.createElement("canvas");
      cv.width = data.width;
      cv.height = data.height;
      cv.getContext("2d")!.putImageData(data, 0, 0);
      setConvResult(cv.toDataURL());
    } catch (err) {
      log.error('Conversion failed', err);
      alert("Conversion failed.");
    }
    setConvBusy(false);
  }, [convSrc]);

  const handleConvFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      e.target.value = "";
      if (convMode === "p2v") {
        const reader = new FileReader();
        reader.onload = () => setConvSrc(reader.result as string);
        reader.readAsDataURL(f);
      } else {
        const reader = new FileReader();
        reader.onload = () => setConvSrc(reader.result as string);
        reader.readAsText(f);
      }
    },
    [convMode],
  );

  const downloadConvResult = useCallback(() => {
    if (!convResult) return;
    const a = document.createElement("a");
    if (convMode === "p2v") {
      a.href = URL.createObjectURL(
        new Blob([convResult], { type: "image/svg+xml" }),
      );
      a.download = "converted.svg";
    } else {
      a.href = convResult;
      a.download = "converted.png";
    }
    a.click();
  }, [convResult, convMode]);

  const saveConvToLibrary = useCallback(() => {
    if (!convResult) return;
    const defaultName =
      convMode === "p2v" ? "converted.svg" : "converted.png";
    const name = window.prompt("Save to library as:", defaultName);
    if (!name || !name.trim()) return;
    if (convMode === "p2v") {
      const blob = new Blob([convResult], { type: "image/svg+xml" });
      const reader = new FileReader();
      reader.onload = () => {
        addAsset(name.trim(), reader.result as string, "image/svg+xml", [
          "converted",
        ]);
      };
      reader.readAsDataURL(blob);
    } else {
      addAsset(name.trim(), convResult, "image/png", ["converted"]);
    }
  }, [convResult, convMode, addAsset]);

  return (
    <div className={styles.convertPanel}>
      <input
        ref={convFileRef}
        type="file"
        accept={convMode === "p2v" ? ".png,.jpg,.jpeg,.bmp,.webp" : ".svg"}
        style={{ display: "none" }}
        onChange={handleConvFile}
      />
      <div className={styles.convertHeader}>
        <h2>Pixel ↔ Vector Conversion</h2>
        <div className={styles.convertToggle}>
          <button
            className={convMode === "p2v" ? styles.activeTab : styles.tab}
            onClick={() => {
              setConvMode("p2v");
              setConvSrc("");
              setConvResult("");
            }}
          >
            Pixel → Vector
          </button>
          <button
            className={convMode === "v2p" ? styles.activeTab : styles.tab}
            onClick={() => {
              setConvMode("v2p");
              setConvSrc("");
              setConvResult("");
            }}
          >
            Vector → Pixel
          </button>
        </div>
      </div>

      <div className={styles.convertBody}>
        <div className={styles.convertCol}>
          <h3>Source</h3>
          <button
            className={styles.uploadBtn}
            onClick={() => convFileRef.current?.click()}
          >
            {convMode === "p2v" ? "Load Image" : "Load SVG"}
          </button>
          {convMode === "v2p" && (
            <textarea
              className={styles.convTextarea}
              placeholder="Or paste SVG code here..."
              value={convSrc}
              onChange={(e) => setConvSrc(e.target.value)}
            />
          )}
          {convMode === "p2v" && convSrc && (
            <img
              src={convSrc}
              alt="source"
              className={styles.convPreview}
            />
          )}
        </div>

        <div className={styles.convertArrow}>
          <button
            className={styles.uploadBtn}
            disabled={!convSrc || convBusy}
            onClick={convMode === "p2v" ? handleConvertP2V : handleConvertV2P}
          >
            {convBusy ? "Converting..." : "Convert →"}
          </button>
        </div>

        <div className={styles.convertCol}>
          <h3>Result</h3>
          {convResult && convMode === "p2v" && (
            <div
              className={styles.convPreviewSvg}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(convResult),
              }}
            />
          )}
          {convResult && convMode === "v2p" && (
            <img
              src={convResult}
              alt="result"
              className={styles.convPreview}
            />
          )}
          {convResult && (
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 8,
                flexWrap: "wrap",
              }}
            >
              <button
                className={styles.uploadBtn}
                onClick={downloadConvResult}
              >
                Download
              </button>
              <button
                className={styles.uploadBtn}
                onClick={saveConvToLibrary}
              >
                Save to Library
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
