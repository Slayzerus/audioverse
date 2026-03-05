/**
 * AssetDetailModal — Full-screen overlay showing asset details & tag editing.
 */

import React from "react";
import { LocalAsset, assetTypeIcon, formatSize } from "./assetManagerTypes";

export interface AssetDetailModalProps {
  detailAsset: LocalAsset;
  handleDownload: (id: string) => void;
  handleRename: (id: string) => void;
  handleDuplicate: (id: string) => void;
  toggleStar: (id: string) => void;
  handleDelete: (id: string) => void;
  setDetailAssetId: (id: string | null) => void;
  editingTagsId: string | null;
  setEditingTagsId: (id: string | null) => void;
  tagInput: string;
  setTagInput: (value: string) => void;
  updateTags: (id: string, tags: string[]) => void;
  styles: Record<string, string>;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  detailAsset,
  handleDownload,
  handleRename,
  handleDuplicate,
  toggleStar,
  handleDelete,
  setDetailAssetId,
  editingTagsId,
  setEditingTagsId,
  tagInput,
  setTagInput,
  updateTags,
  styles,
}) => (
  <div
    className={styles.dialogOverlay}
    onClick={() => {
      setDetailAssetId(null);
      setEditingTagsId(null);
    }}
  >
    <div
      className={styles.detailModal}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h3 style={{ margin: 0, fontSize: "1.1rem" }}>
          {detailAsset.name}
        </h3>
        <button
          style={{
            background: "none",
            border: "none",
            color: "#888",
            fontSize: 18,
            cursor: "pointer",
          }}
          onClick={() => {
            setDetailAssetId(null);
            setEditingTagsId(null);
          }}
        >
          ✕
        </button>
      </div>

      {/* Preview */}
      <div
        style={{
          background: "rgba(0,0,0,0.3)",
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
          maxHeight: 300,
          overflow: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {detailAsset.type === "image" || detailAsset.type === "svg" ? (
          <img
            src={detailAsset.dataUrl}
            alt={detailAsset.name}
            style={{
              maxWidth: "100%",
              maxHeight: 260,
              imageRendering:
                detailAsset.type === "image" ? "pixelated" : "auto",
            }}
          />
        ) : (
          <span style={{ fontSize: "4rem" }}>
            {assetTypeIcon(detailAsset.type)}
          </span>
        )}
      </div>

      {/* Metadata grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "80px 1fr",
          gap: "4px 12px",
          fontSize: "0.85rem",
          marginBottom: 12,
        }}
      >
        <span style={{ color: "#888" }}>Type</span>
        <span>
          <span className={styles.assetBadge}>{detailAsset.type}</span>
        </span>
        <span style={{ color: "#888" }}>MIME</span>
        <span>{detailAsset.mimeType}</span>
        <span style={{ color: "#888" }}>Size</span>
        <span>{formatSize(detailAsset.sizeBytes)}</span>
        <span style={{ color: "#888" }}>Created</span>
        <span>{new Date(detailAsset.createdAt).toLocaleString()}</span>
        <span style={{ color: "#888" }}>ID</span>
        <span style={{ fontSize: "0.75rem", opacity: 0.5 }}>
          {detailAsset.id}
        </span>
      </div>

      {/* Tags */}
      <div style={{ marginBottom: 12 }}>
        <span style={{ color: "#888", fontSize: "0.85rem" }}>Tags: </span>
        {detailAsset.tags.map((tg, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 2,
              background: "rgba(85,102,204,0.18)",
              color: "#aac",
              padding: "1px 8px",
              borderRadius: 4,
              fontSize: "0.78rem",
              marginRight: 4,
              marginBottom: 2,
            }}
          >
            #{tg}
            <button
              style={{
                background: "none",
                border: "none",
                color: "#888",
                cursor: "pointer",
                fontSize: 11,
                padding: 0,
                marginLeft: 2,
              }}
              onClick={() =>
                updateTags(
                  detailAsset.id,
                  detailAsset.tags.filter((_, j) => j !== i),
                )
              }
              title="Remove tag"
            >
              ✕
            </button>
          </span>
        ))}
        {editingTagsId === detailAsset.id ? (
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && tagInput.trim()) {
                updateTags(detailAsset.id, [
                  ...detailAsset.tags,
                  tagInput.trim(),
                ]);
                setTagInput("");
              }
              if (e.key === "Escape") {
                setEditingTagsId(null);
                setTagInput("");
              }
            }}
            placeholder="tag name"
            autoFocus
            style={{
              width: 80,
              background: "#111",
              border: "1px solid #333",
              color: "#ddd",
              borderRadius: 4,
              padding: "1px 6px",
              fontSize: "0.78rem",
            }}
          />
        ) : (
          <button
            style={{
              background: "none",
              border: "1px dashed #444",
              color: "#888",
              borderRadius: 4,
              padding: "1px 6px",
              fontSize: "0.78rem",
              cursor: "pointer",
            }}
            onClick={() => {
              setEditingTagsId(detailAsset.id);
              setTagInput("");
            }}
          >
            + tag
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          className={styles.uploadBtn}
          onClick={() => handleDownload(detailAsset.id)}
        >
          Download
        </button>
        <button
          className={styles.uploadBtn}
          onClick={() => handleRename(detailAsset.id)}
        >
          Rename
        </button>
        <button
          className={styles.uploadBtn}
          onClick={() => handleDuplicate(detailAsset.id)}
        >
          Duplicate
        </button>
        <button
          className={styles.uploadBtn}
          onClick={() => toggleStar(detailAsset.id)}
        >
          {detailAsset.starred ? "★ Unstar" : "☆ Star"}
        </button>
        <button
          className={styles.uploadBtn}
          style={{ background: "linear-gradient(135deg,#c44,#a33)" }}
          onClick={() => {
            handleDelete(detailAsset.id);
            setDetailAssetId(null);
          }}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);
