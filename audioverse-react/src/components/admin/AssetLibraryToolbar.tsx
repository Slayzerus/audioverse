/**
 * AssetLibraryToolbar — Search / filter / sort bar + bulk-actions row.
 */

import React from "react";
import type { AssetType, SortKey, ViewMode } from "./assetManagerTypes";

export interface AssetLibraryToolbarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterType: AssetType | "all";
  setFilterType: (value: AssetType | "all") => void;
  sortKey: SortKey;
  setSortKey: (value: SortKey) => void;
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  uploadRef: React.RefObject<HTMLInputElement | null>;
  importRef: React.RefObject<HTMLInputElement | null>;
  selectedIds: Set<string>;
  selectAll: () => void;
  deselectAll: () => void;
  bulkDownload: () => void;
  bulkDelete: () => void;
  exportLibrary: () => void;
  clearLibrary: () => void;
  assetsLength: number;
  filteredAssetsLength: number;
  storageInfo: { used: string; percent: number };
  styles: Record<string, string>;
  t: (key: string, fallback: string) => string;
}

export const AssetLibraryToolbar: React.FC<AssetLibraryToolbarProps> = ({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  sortKey,
  setSortKey,
  viewMode,
  setViewMode,
  uploadRef,
  importRef,
  selectedIds,
  selectAll,
  deselectAll,
  bulkDownload,
  bulkDelete,
  exportLibrary,
  clearLibrary,
  assetsLength,
  filteredAssetsLength,
  storageInfo,
  styles,
  t,
}) => (
  <>
    {/* Toolbar row 1 */}
    <div className={styles.toolbar}>
      <input
        type="text"
        className={styles.searchInput}
        placeholder={t("assetManager.search", "Search assets & tags...")}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <select
        className={styles.filterSelect}
        value={filterType}
        onChange={(e) => setFilterType(e.target.value as AssetType | "all")}
      >
        <option value="all">
          {t("assetManager.allTypes", "All Types")}
        </option>
        <option value="image">Image</option>
        <option value="svg">SVG</option>
        <option value="model">Model</option>
        <option value="audio">Audio</option>
        <option value="other">Other</option>
      </select>
      <select
        className={styles.sortSelect}
        value={sortKey}
        onChange={(e) => setSortKey(e.target.value as SortKey)}
      >
        <option value="date">Sort: Date</option>
        <option value="name">Sort: Name</option>
        <option value="size">Sort: Size</option>
        <option value="type">Sort: Type</option>
        <option value="starred">Sort: Starred</option>
      </select>
      <button
        className={styles.uploadBtn}
        onClick={() => uploadRef.current?.click()}
      >
        {t("assetManager.upload", "Upload")}
      </button>
      <button
        className={styles.uploadBtn}
        onClick={() => setViewMode((m) => (m === "grid" ? "list" : "grid"))}
        title={viewMode === "grid" ? "List view" : "Grid view"}
        style={{ padding: "0.5rem 0.7rem", minWidth: 36 }}
      >
        {viewMode === "grid" ? "☰" : "⊞"}
      </button>
    </div>

    {/* Toolbar row 2 — bulk, import/export, storage */}
    <div
      className={styles.toolbar}
      style={{ gap: "0.5rem", fontSize: "0.82rem" }}
    >
      {selectedIds.size > 0 && (
        <>
          <span style={{ color: "#99b", fontWeight: 600 }}>
            {selectedIds.size} selected
          </span>
          <button
            className={styles.uploadBtn}
            style={{ padding: "3px 10px", fontSize: "0.8rem" }}
            onClick={bulkDownload}
          >
            ⬇ Download
          </button>
          <button
            className={styles.uploadBtn}
            style={{
              padding: "3px 10px",
              fontSize: "0.8rem",
              background: "linear-gradient(135deg,#c44,#a33)",
            }}
            onClick={bulkDelete}
          >
            🗑 Delete
          </button>
          <button
            className={styles.uploadBtn}
            style={{
              padding: "3px 10px",
              fontSize: "0.8rem",
              background: "#444",
            }}
            onClick={deselectAll}
          >
            ✕ Deselect
          </button>
          <div
            style={{
              width: 1,
              height: 16,
              background: "#333",
              margin: "0 4px",
            }}
          />
        </>
      )}
      <button
        className={styles.uploadBtn}
        style={{ padding: "3px 10px", fontSize: "0.8rem", background: "#333" }}
        onClick={selectAll}
      >
        Select All
      </button>
      <button
        className={styles.uploadBtn}
        style={{ padding: "3px 10px", fontSize: "0.8rem", background: "#333" }}
        onClick={exportLibrary}
        title="Export library as JSON"
      >
        📤 Export
      </button>
      <button
        className={styles.uploadBtn}
        style={{ padding: "3px 10px", fontSize: "0.8rem", background: "#333" }}
        onClick={() => importRef.current?.click()}
        title="Import library from JSON"
      >
        📥 Import
      </button>
      {assetsLength > 0 && (
        <button
          className={styles.uploadBtn}
          style={{
            padding: "3px 10px",
            fontSize: "0.8rem",
            background: "linear-gradient(135deg,#c44,#a33)",
          }}
          onClick={clearLibrary}
        >
          Clear All
        </button>
      )}
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: "#777", fontSize: "0.75rem" }}>
          Storage: {storageInfo.used}
        </span>
        <div
          style={{
            width: 60,
            height: 6,
            background: "#222",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${storageInfo.percent}%`,
              height: "100%",
              background:
                storageInfo.percent > 80
                  ? "#c44"
                  : storageInfo.percent > 50
                    ? "#ca3"
                    : "#5566cc",
              borderRadius: 3,
              transition: "width 0.3s",
            }}
          />
        </div>
      </div>
      <span className={styles.assetCount}>
        {filteredAssetsLength} {filteredAssetsLength === 1 ? "asset" : "assets"}
      </span>
    </div>
  </>
);
