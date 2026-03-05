/**
 * photoEditorActions.ts — Pure helper functions for photo export, download,
 * clipboard copy, and native share in PhotoEditor.
 */
import {
    renderToCanvas,
    type AdjustmentValues,
    type FilterParams,
} from "../../scripts/photoFilters";
import {
    type Overlay,
    renderAllOverlays,
} from "../../scripts/photoOverlays";

export interface ExportParams {
    image: HTMLImageElement;
    selectedFilter: string;
    filterParams: FilterParams;
    filterIntensity: number;
    adjustments: AdjustmentValues;
    cropRect: { x: number; y: number; w: number; h: number } | null;
    rotation: number;
    flipH: boolean;
    flipV: boolean;
    overlays: Overlay[];
}

/**
 * Render the current editor state to a JPEG Blob for export.
 */
export async function getExportBlob(params: ExportParams): Promise<Blob | null> {
    const { image, selectedFilter, filterParams, filterIntensity, adjustments, cropRect, rotation, flipH, flipV, overlays } = params;
    const exportCanvas = document.createElement("canvas");
    renderToCanvas(exportCanvas, image, selectedFilter, { ...filterParams, intensity: filterIntensity }, adjustments, cropRect, rotation, flipH, flipV);
    if (overlays.length > 0) {
        const ctx = exportCanvas.getContext("2d");
        if (ctx) renderAllOverlays(ctx, overlays, exportCanvas.width, exportCanvas.height);
    }
    return new Promise(res => exportCanvas.toBlob(b => res(b), "image/jpeg", 0.92));
}

/**
 * Trigger a browser download of the given Blob as "photo-edited.jpg".
 */
export function handleDownloadBlob(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "photo-edited.jpg";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
}

/**
 * Copy the current editor output to clipboard as PNG.
 */
export async function handleCopyImageToClipboard(params: ExportParams): Promise<void> {
    const { image, selectedFilter, filterParams, filterIntensity, adjustments, cropRect, rotation, flipH, flipV, overlays } = params;
    try {
        // Clipboard API requires image/png
        const pngCanvas = document.createElement("canvas");
        renderToCanvas(pngCanvas, image, selectedFilter, { ...filterParams, intensity: filterIntensity }, adjustments, cropRect, rotation, flipH, flipV);
        if (overlays.length > 0) {
            const ctx = pngCanvas.getContext("2d");
            if (ctx) renderAllOverlays(ctx, overlays, pngCanvas.width, pngCanvas.height);
        }
        const pngBlob = await new Promise<Blob | null>(res => pngCanvas.toBlob(b => res(b), "image/png"));
        if (pngBlob) {
            await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })]);
        }
    } catch { /* clipboard write not supported — silent fail */ }
}

/**
 * Use the Web Share API to share the exported image.
 * Falls back to download if sharing is not supported.
 */
export async function handleNativeShare(blob: Blob): Promise<void> {
    const file = new File([blob], "photo-edited.jpg", { type: "image/jpeg" });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
            await navigator.share({ files: [file], title: "AudioVerse Photo", text: "" });
        } catch { /* user cancelled or not supported */ }
    } else {
        // Fallback — just download
        handleDownloadBlob(blob);
    }
}
