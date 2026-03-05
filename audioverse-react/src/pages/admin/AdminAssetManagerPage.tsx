/**
 * AdminAssetManagerPage  Admin  Asset Manager
 *
 * Orchestrator page that composes the following sub-components:
 *  - AssetConversionPanel  (Pixel  Vector conversion)
 *  - AssetLibraryToolbar   (search / filter / sort / bulk actions)
 *  - AssetGridView         (card grid)
 *  - AssetListView         (tabular list)
 *  - AssetContextMenu      (right-click menu)
 *  - AssetDetailModal      (detail overlay + tag editing)
 *
 * All state & callbacks live here; children receive data via props.
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PixelEditor } from "../../components/editors/PixelEditor";
import { VectorEditor } from "../../components/editors/VectorEditor";
import { ModelEditor } from "../../components/editors/ModelEditor";
import styles from "./AdminAssetManagerPage.module.css";

import {
  Tab,
  AssetType,
  LocalAsset,
  SortKey,
  ViewMode,
  generateId,
  mimeToAssetType,
  assetTypeIcon,
  dataUrlToByteLength,
  sortAssets,
  estimateStorageUsage,
  loadAssetsFromStorage,
  saveAssetsToStorage,
} from "../../components/admin/assetManagerTypes";
import { AssetConversionPanel } from "../../components/admin/AssetConversionPanel";
import { AssetLibraryToolbar } from "../../components/admin/AssetLibraryToolbar";
import { AssetGridView } from "../../components/admin/AssetGridView";
import { AssetListView } from "../../components/admin/AssetListView";
import { AssetContextMenu } from "../../components/admin/AssetContextMenu";
import { AssetDetailModal } from "../../components/admin/AssetDetailModal";

/*  Component  */

const AdminAssetManagerPage: React.FC = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("pixel");

  /*  Library state  */
  const [assets, setAssets] = useState<LocalAsset[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<AssetType | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [dragging, setDragging] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    assetId: string;
  } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailAssetId, setDetailAssetId] = useState<string | null>(null);
  const [editingTagsId, setEditingTagsId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");

  const uploadRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  /* Load from localStorage on mount */
  useEffect(() => {
    setAssets(loadAssetsFromStorage());
  }, []);

  /* Persist whenever assets change (skip initial empty render) */
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    saveAssetsToStorage(assets);
  }, [assets]);

  /* Close context menu on outside click */
  useEffect(() => {
    const handler = () => setContextMenu(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  /* Close context menu / modal on Escape key */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (contextMenu) { setContextMenu(null); return; }
        if (detailAssetId) { setDetailAssetId(null); setEditingTagsId(null); return; }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [contextMenu, detailAssetId]);

  /*  Asset CRUD  */

  const addAsset = useCallback(
    (
      name: string,
      dataUrl: string,
      mimeType: string,
      tags: string[] = [],
    ) => {
      const asset: LocalAsset = {
        id: generateId(),
        name,
        type: mimeToAssetType(mimeType),
        dataUrl,
        mimeType,
        sizeBytes: dataUrlToByteLength(dataUrl),
        createdAt: new Date().toISOString(),
        tags,
      };
      setAssets((prev) => [asset, ...prev]);
      return asset;
    },
    [],
  );

  const deleteAsset = useCallback((id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const renameAsset = useCallback((id: string, newName: string) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, name: newName } : a)),
    );
  }, []);

  const duplicateAsset = useCallback((id: string) => {
    setAssets((prev) => {
      const original = prev.find((a) => a.id === id);
      if (!original) return prev;
      const copy: LocalAsset = {
        ...original,
        id: generateId(),
        name: `${original.name} (copy)`,
        createdAt: new Date().toISOString(),
      };
      return [copy, ...prev];
    });
  }, []);

  const toggleStar = useCallback((id: string) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, starred: !a.starred } : a)),
    );
  }, []);

  const updateTags = useCallback((id: string, tags: string[]) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, tags } : a)),
    );
  }, []);

  /*  Bulk selection  */

  const toggleSelect = useCallback((id: string, shift: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (shift) {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      } else {
        if (next.has(id) && next.size === 1) {
          next.clear();
        } else {
          next.clear();
          next.add(id);
        }
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(assets.map((a) => a.id)));
  }, [assets]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const bulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected asset(s)?`)) return;
    setAssets((prev) => prev.filter((a) => !selectedIds.has(a.id)));
    setSelectedIds(new Set());
  }, [selectedIds]);

  const bulkDownload = useCallback(() => {
    selectedIds.forEach((id) => {
      const asset = assets.find((a) => a.id === id);
      if (!asset) return;
      const a = document.createElement("a");
      a.href = asset.dataUrl;
      const ext = asset.mimeType.split("/")[1]?.replace("+xml", "") || "bin";
      a.download = asset.name.includes(".") ? asset.name : `${asset.name}.${ext}`;
      a.click();
    });
  }, [selectedIds, assets]);

  /*  Export / Import library  */

  const exportLibrary = useCallback(() => {
    const blob = new Blob([JSON.stringify(assets, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `asset-library-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [assets]);

  const importLibrary = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result as string) as LocalAsset[];
        if (!Array.isArray(imported)) { alert("Invalid library file."); return; }
        const count = imported.length;
        if (!window.confirm(`Import ${count} asset(s)? This will merge with existing library.`)) return;
        setAssets((prev) => {
          const existingIds = new Set(prev.map((a) => a.id));
          const newOnes = imported.filter((a) => !existingIds.has(a.id));
          return [...newOnes, ...prev];
        });
      } catch {
        alert("Failed to parse library file.");
      }
    };
    reader.readAsText(file);
  }, []);

  const clearLibrary = useCallback(() => {
    if (assets.length === 0) return;
    if (!window.confirm(`Clear ALL ${assets.length} assets from library? This cannot be undone.`)) return;
    setAssets([]);
  }, [assets.length]);

  /*  File reading helper  */

  const readFilesAsAssets = useCallback(
    (files: FileList | File[]) => {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          addAsset(file.name, dataUrl, file.type || "application/octet-stream");
        };
        reader.readAsDataURL(file);
      });
    },
    [addAsset],
  );

  /*  Upload handler  */
  const handleUploadChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      readFilesAsAssets(files);
      e.target.value = "";
    },
    [readFilesAsAssets],
  );

  /*  Drag & Drop handlers  */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setDragging(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        readFilesAsAssets(files);
      }
    },
    [readFilesAsAssets],
  );

  /*  Asset actions  */

  const handleDownload = useCallback(
    (id: string) => {
      const asset = assets.find((a) => a.id === id);
      if (!asset) return;
      const a = document.createElement("a");
      a.href = asset.dataUrl;
      const ext =
        asset.mimeType.split("/")[1]?.replace("+xml", "") || "bin";
      a.download = asset.name.includes(".")
        ? asset.name
        : `${asset.name}.${ext}`;
      a.click();
    },
    [assets],
  );

  const handleDelete = useCallback(
    (id: string) => {
      const asset = assets.find((a) => a.id === id);
      if (!asset) return;
      if (window.confirm(`Delete "${asset.name}"? This cannot be undone.`)) {
        deleteAsset(id);
      }
    },
    [assets, deleteAsset],
  );

  const handleRename = useCallback(
    (id: string) => {
      const asset = assets.find((a) => a.id === id);
      if (!asset) return;
      const newName = window.prompt("Rename asset:", asset.name);
      if (newName && newName.trim()) {
        renameAsset(id, newName.trim());
      }
    },
    [assets, renameAsset],
  );

  const handleDuplicate = useCallback(
    (id: string) => {
      duplicateAsset(id);
    },
    [duplicateAsset],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, assetId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, assetId });
    },
    [],
  );

  /*  Filtering & sorting  */

  const filteredAssets = useMemo(() => sortAssets(
    assets.filter((a) => {
      if (filterType !== "all" && a.type !== filterType) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const nameMatch = a.name.toLowerCase().includes(q);
        const tagMatch = a.tags.some((tag) => tag.toLowerCase().includes(q));
        if (!nameMatch && !tagMatch) return false;
      }
      return true;
    }),
    sortKey,
  ), [assets, filterType, searchTerm, sortKey]);

  const storageInfo = useMemo(() => estimateStorageUsage(), [assets]);

  const detailAsset = useMemo(
    () => (detailAssetId ? assets.find((a) => a.id === detailAssetId) ?? null : null),
    [detailAssetId, assets],
  );

  /*  Save-to-library callback for editors  */
  const handleEditorSave = useCallback(
    (dataUrl: string, name: string, mimeType: string) => {
      addAsset(name, dataUrl, mimeType, ["editor"]);
      setTab("library");
    },
    [addAsset],
  );

  /*  Tabs config  */
  const tabs: { id: Tab; label: string; icon: string }[] = [
    {
      id: "pixel",
      label: t("assetManager.pixelEditor", "Pixel Editor"),
      icon: "",
    },
    {
      id: "vector",
      label: t("assetManager.vectorEditor", "Vector Editor"),
      icon: "",
    },
    {
      id: "model",
      label: t("assetManager.modelEditor", "3D Model Editor"),
      icon: "",
    },
    {
      id: "convert",
      label: t("assetManager.convert", "Convert"),
      icon: "",
    },
    {
      id: "library",
      label: t("assetManager.library", "Library"),
      icon: "",
    },
  ];

  /*  Render helpers  */

  const renderAssetPreview = useCallback((asset: LocalAsset) => {
    if (asset.type === "image" || asset.type === "svg") {
      return <img src={asset.dataUrl} alt={asset.name} />;
    }
    return <span className={styles.assetIcon}>{assetTypeIcon(asset.type)}</span>;
  }, []);

  return (
    <div className={styles.container}>
      {/* header + tabs */}
      <div className={styles.topBar}>
        <h1 className={styles.title}>
          {t("assetManager.title", "Asset Manager")}
        </h1>
        <div className={styles.tabBar}>
          {tabs.map((tb) => (
            <button
              key={tb.id}
              className={`${styles.tab} ${tab === tb.id ? styles.activeTab : ""}`}
              onClick={() => setTab(tb.id)}
            >
              <span className={styles.tabIcon}>{tb.icon}</span>
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      {/* content */}
      <div className={styles.content}>
        {tab === "pixel" && <PixelEditor className={styles.editorPanel} onSaveToLibrary={handleEditorSave} />}

        {tab === "vector" && <VectorEditor className={styles.editorPanel} onSaveToLibrary={handleEditorSave} />}

        {tab === "model" && <ModelEditor className={styles.editorPanel} onSaveToLibrary={handleEditorSave} />}

        {tab === "convert" && (
          <AssetConversionPanel addAsset={addAsset} styles={styles} />
        )}

        {tab === "library" && (
          <div
            className={styles.libraryPanel}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{ position: "relative" }}
          >
            {/* Hidden file inputs */}
            <input ref={uploadRef} type="file" multiple style={{ display: "none" }} onChange={handleUploadChange} />
            <input ref={importRef} type="file" accept=".json" style={{ display: "none" }} onChange={importLibrary} />

            {/* Drag overlay */}
            {dragging && (
              <div className={styles.dragOverlay}>
                <div style={{ fontSize: "3rem" }}></div>
                <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>Drop files to add to library</div>
              </div>
            )}

            {/* Toolbars */}
            <AssetLibraryToolbar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterType={filterType}
              setFilterType={setFilterType}
              sortKey={sortKey}
              setSortKey={setSortKey}
              viewMode={viewMode}
              setViewMode={setViewMode}
              uploadRef={uploadRef}
              importRef={importRef}
              selectedIds={selectedIds}
              selectAll={selectAll}
              deselectAll={deselectAll}
              bulkDownload={bulkDownload}
              bulkDelete={bulkDelete}
              exportLibrary={exportLibrary}
              clearLibrary={clearLibrary}
              assetsLength={assets.length}
              filteredAssetsLength={filteredAssets.length}
              storageInfo={storageInfo}
              styles={styles}
              t={t}
            />

            {/* Empty state */}
            {filteredAssets.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}></div>
                <p>{t("assetManager.noAssets", "No assets found. Use the editors to create assets or upload files.")}</p>
              </div>
            ) : viewMode === "grid" ? (
              <AssetGridView
                assets={filteredAssets}
                selectedIds={selectedIds}
                toggleSelect={toggleSelect}
                toggleStar={toggleStar}
                handleDownload={handleDownload}
                handleRename={handleRename}
                handleDelete={handleDelete}
                setDetailAssetId={setDetailAssetId}
                handleContextMenu={handleContextMenu}
                renderAssetPreview={renderAssetPreview}
                styles={styles}
              />
            ) : (
              <AssetListView
                assets={filteredAssets}
                selectedIds={selectedIds}
                toggleSelect={toggleSelect}
                toggleStar={toggleStar}
                handleDownload={handleDownload}
                handleDelete={handleDelete}
                setDetailAssetId={setDetailAssetId}
                handleContextMenu={handleContextMenu}
                styles={styles}
              />
            )}

            {/* Context menu */}
            {contextMenu && (
              <AssetContextMenu
                contextMenu={contextMenu}
                handleDownload={handleDownload}
                handleRename={handleRename}
                handleDuplicate={handleDuplicate}
                toggleStar={toggleStar}
                setDetailAssetId={setDetailAssetId}
                handleDelete={handleDelete}
                setContextMenu={setContextMenu}
                styles={styles}
              />
            )}

            {/* Detail / Tag editing modal */}
            {detailAsset && (
              <AssetDetailModal
                detailAsset={detailAsset}
                handleDownload={handleDownload}
                handleRename={handleRename}
                handleDuplicate={handleDuplicate}
                toggleStar={toggleStar}
                handleDelete={handleDelete}
                setDetailAssetId={setDetailAssetId}
                editingTagsId={editingTagsId}
                setEditingTagsId={setEditingTagsId}
                tagInput={tagInput}
                setTagInput={setTagInput}
                updateTags={updateTags}
                styles={styles}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export { AdminAssetManagerPage };
export default AdminAssetManagerPage;
