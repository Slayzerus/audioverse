/**
 * AssetListView — Renders the asset library as a tabular list.
 */

import React from "react";
import {
  LocalAsset,
  assetTypeIcon,
  formatSize,
  formatDate,
} from "./assetManagerTypes";

export interface AssetListViewProps {
  assets: LocalAsset[];
  selectedIds: Set<string>;
  toggleSelect: (id: string, shift: boolean) => void;
  toggleStar: (id: string) => void;
  handleDownload: (id: string) => void;
  handleDelete: (id: string) => void;
  setDetailAssetId: (id: string) => void;
  handleContextMenu: (e: React.MouseEvent, assetId: string) => void;
  styles: Record<string, string>;
}

export const AssetListView: React.FC<AssetListViewProps> = ({
  assets,
  selectedIds,
  toggleSelect,
  toggleStar,
  handleDownload,
  handleDelete,
  setDetailAssetId,
  handleContextMenu,
  styles,
}) => (
  <div className={styles.assetList}>
    <div className={styles.listHeader}>
      <span style={{ flex: 2 }}>Name</span>
      <span style={{ width: 60 }}>Type</span>
      <span style={{ width: 80 }}>Size</span>
      <span style={{ width: 100 }}>Date</span>
      <span style={{ width: 60 }}>Tags</span>
      <span style={{ width: 100 }}>Actions</span>
    </div>
    {assets.map((asset) => (
      <div
        key={asset.id}
        className={`${styles.listRow} ${selectedIds.has(asset.id) ? styles.listRowSelected : ""}`}
        onClick={(e) => toggleSelect(asset.id, e.shiftKey || e.ctrlKey)}
        onDoubleClick={() => setDetailAssetId(asset.id)}
        onContextMenu={(e) => handleContextMenu(e, asset.id)}
      >
        <span
          style={{
            flex: 2,
            display: "flex",
            alignItems: "center",
            gap: 6,
            minWidth: 0,
          }}
        >
          <button
            style={{
              background: "none",
              border: "none",
              color: asset.starred ? "#fc0" : "#555",
              cursor: "pointer",
              fontSize: 14,
              padding: 0,
            }}
            onClick={(e) => {
              e.stopPropagation();
              toggleStar(asset.id);
            }}
          >
            {asset.starred ? "★" : "☆"}
          </button>
          <span style={{ width: 20, textAlign: "center" }}>
            {assetTypeIcon(asset.type)}
          </span>
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {asset.name}
          </span>
        </span>
        <span style={{ width: 60 }}>
          <span className={styles.assetBadge}>{asset.type}</span>
        </span>
        <span style={{ width: 80, opacity: 0.6 }}>
          {formatSize(asset.sizeBytes)}
        </span>
        <span style={{ width: 100, opacity: 0.5, fontSize: "0.75rem" }}>
          {formatDate(asset.createdAt)}
        </span>
        <span style={{ width: 60, opacity: 0.5, fontSize: "0.7rem" }}>
          {asset.tags.length > 0
            ? asset.tags.map((tg) => `#${tg}`).join(" ")
            : "—"}
        </span>
        <span style={{ width: 100, display: "flex", gap: 4 }}>
          <button
            className={styles.listActionBtn}
            title="Download"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(asset.id);
            }}
          >
            <i className="fa-solid fa-arrow-down" />
          </button>
          <button
            className={styles.listActionBtn}
            title="Details"
            onClick={(e) => {
              e.stopPropagation();
              setDetailAssetId(asset.id);
            }}
          >
            <i className="fa-solid fa-magnifying-glass" />
          </button>
          <button
            className={styles.listActionBtn}
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(asset.id);
            }}
          >
            <i className="fa-solid fa-trash" />
          </button>
        </span>
      </div>
    ))}
  </div>
);
