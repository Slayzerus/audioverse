/**
 * AssetGridView — Renders the asset library as a card grid.
 */

import React from "react";
import { LocalAsset, formatSize, formatDate } from "./assetManagerTypes";

export interface AssetGridViewProps {
  assets: LocalAsset[];
  selectedIds: Set<string>;
  toggleSelect: (id: string, shift: boolean) => void;
  toggleStar: (id: string) => void;
  handleDownload: (id: string) => void;
  handleRename: (id: string) => void;
  handleDelete: (id: string) => void;
  setDetailAssetId: (id: string) => void;
  handleContextMenu: (e: React.MouseEvent, assetId: string) => void;
  renderAssetPreview: (asset: LocalAsset) => React.ReactNode;
  styles: Record<string, string>;
}

export const AssetGridView: React.FC<AssetGridViewProps> = ({
  assets,
  selectedIds,
  toggleSelect,
  toggleStar,
  handleDownload,
  handleRename,
  handleDelete,
  setDetailAssetId,
  handleContextMenu,
  renderAssetPreview,
  styles,
}) => (
  <div className={styles.assetGrid}>
    {assets.map((asset) => (
      <div
        key={asset.id}
        className={`${styles.assetCard} ${selectedIds.has(asset.id) ? styles.assetCardSelected : ""}`}
        onClick={(e) => toggleSelect(asset.id, e.shiftKey || e.ctrlKey)}
        onDoubleClick={() => setDetailAssetId(asset.id)}
        onContextMenu={(e) => handleContextMenu(e, asset.id)}
      >
        <button
          className={styles.starBtn}
          onClick={(e) => {
            e.stopPropagation();
            toggleStar(asset.id);
          }}
          title={asset.starred ? "Unstar" : "Star"}
        >
          {asset.starred ? "★" : "☆"}
        </button>
        <div className={styles.assetPreview}>
          {renderAssetPreview(asset)}
        </div>
        <div className={styles.assetInfo}>
          <span className={styles.assetName}>{asset.name}</span>
          <span className={styles.assetMeta}>
            <span className={styles.assetBadge}>{asset.type}</span> ·{" "}
            {formatSize(asset.sizeBytes)}
          </span>
          {asset.tags.length > 0 && (
            <span className={styles.assetDate}>
              {asset.tags.map((tg) => `#${tg}`).join(" ")}
            </span>
          )}
          <span className={styles.assetDate}>
            {formatDate(asset.createdAt)}
          </span>
        </div>
        <div className={styles.assetActions}>
          <button
            title="Download"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(asset.id);
            }}
          >
            <i className="fa-solid fa-arrow-down" />
          </button>
          <button
            title="Rename"
            onClick={(e) => {
              e.stopPropagation();
              handleRename(asset.id);
            }}
          >
            ✏️
          </button>
          <button
            title="Details"
            onClick={(e) => {
              e.stopPropagation();
              setDetailAssetId(asset.id);
            }}
          >
            <i className="fa-solid fa-magnifying-glass" />
          </button>
          <button
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(asset.id);
            }}
          >
            <i className="fa-solid fa-trash" />
          </button>
        </div>
      </div>
    ))}
  </div>
);
