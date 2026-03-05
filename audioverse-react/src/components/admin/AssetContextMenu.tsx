/**
 * AssetContextMenu — Right-click context menu for a single asset.
 */

import React from "react";

export interface AssetContextMenuProps {
  contextMenu: { x: number; y: number; assetId: string };
  handleDownload: (id: string) => void;
  handleRename: (id: string) => void;
  handleDuplicate: (id: string) => void;
  toggleStar: (id: string) => void;
  setDetailAssetId: (id: string) => void;
  handleDelete: (id: string) => void;
  setContextMenu: (value: null) => void;
  styles: Record<string, string>;
}

export const AssetContextMenu: React.FC<AssetContextMenuProps> = ({
  contextMenu,
  handleDownload,
  handleRename,
  handleDuplicate,
  toggleStar,
  setDetailAssetId,
  handleDelete,
  setContextMenu,
  styles,
}) => (
  <div
    className={styles.contextMenu}
    style={{
      position: "fixed",
      top: contextMenu.y,
      left: contextMenu.x,
      zIndex: 9999,
    }}
    onClick={(e) => e.stopPropagation()}
  >
    <button
      className={styles.contextMenuItem}
      onClick={() => {
        handleDownload(contextMenu.assetId);
        setContextMenu(null);
      }}
    >
      <i className="fa-solid fa-arrow-down" />{" "}Download
    </button>
    <button
      className={styles.contextMenuItem}
      onClick={() => {
        handleRename(contextMenu.assetId);
        setContextMenu(null);
      }}
    >
      ✏️ Rename
    </button>
    <button
      className={styles.contextMenuItem}
      onClick={() => {
        handleDuplicate(contextMenu.assetId);
        setContextMenu(null);
      }}
    >
      <i className="fa-solid fa-clipboard-list" />{" "}Duplicate
    </button>
    <button
      className={styles.contextMenuItem}
      onClick={() => {
        toggleStar(contextMenu.assetId);
        setContextMenu(null);
      }}
    >
      ⭐ Toggle Star
    </button>
    <button
      className={styles.contextMenuItem}
      onClick={() => {
        setDetailAssetId(contextMenu.assetId);
        setContextMenu(null);
      }}
    >
      <i className="fa-solid fa-magnifying-glass" />{" "}Details
    </button>
    <div
      style={{
        height: 1,
        background: "rgba(255,255,255,0.08)",
        margin: "4px 0",
      }}
    />
    <button
      className={styles.contextMenuItem}
      style={{ color: "#f88" }}
      onClick={() => {
        handleDelete(contextMenu.assetId);
        setContextMenu(null);
      }}
    >
      <i className="fa-solid fa-trash" />{" "}Delete
    </button>
  </div>
);
