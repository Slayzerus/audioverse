/**
 * photoEditorTypes.ts — Shared types and constants for PhotoEditor.
 */
import type { AdjustmentValues } from "../../scripts/photoFilters";

// ── Types ──

export interface PhotoEditorProps {
    /** Image source — File, Blob, or URL string */
    src: File | Blob | string;
    /** Player colour accent */
    playerColor?: string;
    /** Called with the edited File (+ serialised editor state) when user clicks Save */
    onSave: (file: File, editorStateJson?: string) => void;
    /** Called when user cancels editing */
    onCancel: () => void;
    /** Previously stored editor-state JSON to restore (if re-editing) */
    initialState?: string | null;
}

export type EditorTab =
    | "filters" | "adjust" | "crop" | "transform"
    | "stickers" | "text" | "shapes" | "draw";
export type FilterCategory = "all" | "color" | "light" | "vintage" | "artistic" | "fun";

export const TAB_DEFS: { key: EditorTab; icon: string; label: string }[] = [
    { key: "filters",   icon: "fa-sliders",    label: "Filters" },
    { key: "adjust",    icon: "fa-sun-o",      label: "Adjust" },
    { key: "crop",      icon: "fa-crop",       label: "Crop" },
    { key: "transform", icon: "fa-arrows-alt", label: "Transform" },
    { key: "stickers",  icon: "fa-smile-o",    label: "Stickers" },
    { key: "text",      icon: "fa-font",       label: "Text" },
    { key: "shapes",    icon: "fa-star",       label: "Shapes" },
    { key: "draw",      icon: "fa-paint-brush",label: "Draw" },
];

export const ASPECT_RATIOS: { label: string; value: number | null }[] = [
    { label: "Free", value: null },
    { label: "1:1", value: 1 },
    { label: "4:3", value: 4 / 3 },
    { label: "3:4", value: 3 / 4 },
    { label: "16:9", value: 16 / 9 },
    { label: "9:16", value: 9 / 16 },
    { label: "3:2", value: 3 / 2 },
];

export const ADJUSTMENT_SLIDERS: { key: keyof AdjustmentValues; label: string; min: number; max: number; icon: string }[] = [
    { key: "brightness",  label: "Brightness",   min: -100, max: 100, icon: "fa-sun-o" },
    { key: "contrast",    label: "Contrast",     min: -100, max: 100, icon: "fa-adjust" },
    { key: "saturation",  label: "Saturation",   min: -100, max: 100, icon: "fa-tint" },
    { key: "exposure",    label: "Exposure",     min: -100, max: 100, icon: "fa-circle-o" },
    { key: "temperature", label: "Temperature",  min: -100, max: 100, icon: "fa-thermometer" },
    { key: "tint",        label: "Tint",         min: -100, max: 100, icon: "fa-paint-brush" },
    { key: "highlights",  label: "Highlights",   min: -100, max: 100, icon: "fa-star" },
    { key: "shadows",     label: "Shadows",      min: -100, max: 100, icon: "fa-moon-o" },
    { key: "sharpness",   label: "Sharpness",    min: 0,    max: 100, icon: "fa-bolt" },
    { key: "vignette",    label: "Vignette",     min: 0,    max: 100, icon: "fa-circle" },
    { key: "grain",       label: "Grain",        min: 0,    max: 100, icon: "fa-braille" },
    { key: "blur",        label: "Blur",         min: 0,    max: 20,  icon: "fa-low-vision" },
];
