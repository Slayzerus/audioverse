/**
 * Shared types and utility functions for the Asset Manager.
 */
import { logger } from '../../utils/logger';
const log = logger.scoped('assetManagerTypes');

export type Tab = "pixel" | "vector" | "model" | "convert" | "library";

export type AssetType = "image" | "svg" | "model" | "audio" | "other";

export interface LocalAsset {
  id: string;
  name: string;
  type: AssetType;
  dataUrl: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  tags: string[];
  starred?: boolean;
}

export type SortKey = "name" | "date" | "size" | "type" | "starred";
export type ViewMode = "grid" | "list";

export const STORAGE_KEY = "av_asset_library";

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function mimeToAssetType(mime: string): AssetType {
  if (mime === "image/svg+xml") return "svg";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (
    mime === "model/gltf-binary" ||
    mime === "model/gltf+json" ||
    mime === "application/octet-stream"
  )
    return "model";
  return "other";
}

export function assetTypeIcon(type: AssetType): string {
  switch (type) {
    case "image":
      return "🖼️";
    case "svg":
      return "✒️";
    case "model":
      return "🧊";
    case "audio":
      return "🔊";
    default:
      return "📄";
  }
}

export function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function loadAssetsFromStorage(): LocalAsset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LocalAsset[];
  } catch {
    return [];
  }
}

export function saveAssetsToStorage(assets: LocalAsset[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
  } catch (err) {
    log.error("Failed to save assets to localStorage", err);
  }
}

export function dataUrlToByteLength(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1];
  if (!base64) return 0;
  const padding = (base64.match(/=+$/) || [""])[0].length;
  return Math.floor((base64.length * 3) / 4) - padding;
}

export function sortAssets(assets: LocalAsset[], key: SortKey): LocalAsset[] {
  const sorted = [...assets];
  switch (key) {
    case "name":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "date":
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      break;
    case "size":
      sorted.sort((a, b) => b.sizeBytes - a.sizeBytes);
      break;
    case "type":
      sorted.sort((a, b) => a.type.localeCompare(b.type));
      break;
    case "starred":
      sorted.sort((a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0));
      break;
  }
  return sorted;
}

export function estimateStorageUsage(): { used: string; percent: number } {
  let totalBytes = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const val = localStorage.getItem(key);
      totalBytes += (key.length + (val?.length || 0)) * 2; // UTF-16
    }
  }
  const maxBytes = 5 * 1024 * 1024; // ~5MB typical limit
  const percent = Math.min(100, (totalBytes / maxBytes) * 100);
  return { used: formatSize(totalBytes), percent };
}
