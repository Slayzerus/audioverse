/**
 * VectorEditor component tests.
 *
 * Covers: VectorEditorMenuBar, VectorEditorRightPanel, VectorEditorStatusBar,
 *         and root VectorEditor toolbar/dialog.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// ── Mocks ──

// Mock export helpers that depend on Canvas/Image
vi.mock("../components/editors/vectorEditorExport", () => ({
    exportSVGBlob: vi.fn(),
    exportPNG: vi.fn(),
    exportJPG: vi.fn(),
    exportWebP: vi.fn(),
    exportBMP: vi.fn(),
}));

// Mock import helpers
vi.mock("../components/editors/vectorEditorImport", () => ({
    parseSVGToShapes: vi.fn(() => []),
}));

// ── Import components ──

import VectorEditorMenuBar from "../components/editors/VectorEditorMenuBar";
import VectorEditorRightPanel from "../components/editors/VectorEditorRightPanel";
import VectorEditorStatusBar from "../components/editors/VectorEditorStatusBar";

// Need the API type (inferred from hook, but we construct manually)
// VectorEditorAPI = ReturnType<typeof useVectorEditor>

// ── Mock API factory ──

function createMockApi(overrides?: Record<string, any>): any {
    return {
        // State values
        shapes: [],
        selId: null,
        tool: "pointer",
        fillCol: "#5566cc",
        strokeCol: "#ffffff",
        strokeW: 2,
        fontSize: 24,
        fontFamily: "sans-serif",
        shapeOpacity: 1,
        cornerRadius: 12,
        polygonSides: 6,
        starPoints2: 5,
        starInnerRatio: 0.4,
        zoom: 1,
        px: 0,
        py: 0,
        dlgSvg: false,
        svgText: "",
        snapGrid: false,
        gridSize: 16,
        hasClipboard: false,

        // Derived
        selShape: null,

        // Setters
        setTool: vi.fn(),
        setFillCol: vi.fn(),
        setStrokeCol: vi.fn(),
        setStrokeW: vi.fn(),
        setFontSize: vi.fn(),
        setFontFamily: vi.fn(),
        setShapeOpacity: vi.fn(),
        setCornerRadius: vi.fn(),
        setPolygonSides: vi.fn(),
        setStarPoints2: vi.fn(),
        setStarInnerRatio: vi.fn(),
        setZoom: vi.fn(),
        setDlgSvg: vi.fn(),
        setSvgText: vi.fn(),
        setSnapGrid: vi.fn(),
        setGridSize: vi.fn(),
        setSelId: vi.fn(),

        // Refs
        boxRef: { current: null },
        fInp: { current: null },

        // Mouse handlers
        onDown: vi.fn(),
        onMove: vi.fn(),
        onUp: vi.fn(),
        onWheel: vi.fn(),
        onDblClick: vi.fn(),

        // Actions
        undo: vi.fn(),
        redo: vi.fn(),
        deleteShape: vi.fn(),
        bringToFront: vi.fn(),
        sendToBack: vi.fn(),
        updateSel: vi.fn(),
        copyShape: vi.fn(),
        pasteShape: vi.fn(),
        duplicateShape: vi.fn(),
        flipH: vi.fn(),
        flipV: vi.fn(),
        alignShapes: vi.fn(),
        importSVGString: vi.fn(),
        openFile: vi.fn(),
        newCanvas: vi.fn(),
        exportSVG: vi.fn(),
        exportPNG: vi.fn(),
        exportJPG: vi.fn(),
        exportWebP: vi.fn(),
        exportBMP: vi.fn(),
        switchTool: vi.fn(),
        saveToLibrary: vi.fn(),

        ...overrides,
    };
}

// ══════════════════════════════════════════════
// VectorEditorMenuBar
// ══════════════════════════════════════════════
describe("VectorEditorMenuBar", () => {
    it("renders file operation buttons", () => {
        const api = createMockApi();
        render(<VectorEditorMenuBar api={api} />);

        expect(screen.getByText("New")).toBeInTheDocument();
        expect(screen.getByText("Open SVG")).toBeInTheDocument();
        expect(screen.getByText("Paste SVG")).toBeInTheDocument();
    });

    it("renders export format buttons", () => {
        const api = createMockApi();
        render(<VectorEditorMenuBar api={api} />);

        expect(screen.getByText("SVG")).toBeInTheDocument();
        expect(screen.getByText("PNG")).toBeInTheDocument();
        expect(screen.getByText("JPG")).toBeInTheDocument();
        expect(screen.getByText("WebP")).toBeInTheDocument();
        expect(screen.getByText("BMP")).toBeInTheDocument();
    });

    it("renders undo/redo buttons", () => {
        const api = createMockApi();
        render(<VectorEditorMenuBar api={api} />);

        expect(screen.getByText("Undo")).toBeInTheDocument();
        expect(screen.getByText("Redo")).toBeInTheDocument();
    });

    it("calls undo when clicked", () => {
        const api = createMockApi();
        render(<VectorEditorMenuBar api={api} />);

        fireEvent.click(screen.getByText("Undo"));
        expect(api.undo).toHaveBeenCalledOnce();
    });

    it("calls redo when clicked", () => {
        const api = createMockApi();
        render(<VectorEditorMenuBar api={api} />);

        fireEvent.click(screen.getByText("Redo"));
        expect(api.redo).toHaveBeenCalledOnce();
    });

    it("calls newCanvas when New clicked", () => {
        const api = createMockApi();
        render(<VectorEditorMenuBar api={api} />);

        fireEvent.click(screen.getByText("New"));
        expect(api.newCanvas).toHaveBeenCalledOnce();
    });

    it("calls exportSVG when SVG clicked", () => {
        const api = createMockApi();
        render(<VectorEditorMenuBar api={api} />);

        fireEvent.click(screen.getByText("SVG"));
        expect(api.exportSVG).toHaveBeenCalledOnce();
    });

    it("calls exportPNG when PNG clicked", () => {
        const api = createMockApi();
        render(<VectorEditorMenuBar api={api} />);

        fireEvent.click(screen.getByText("PNG"));
        expect(api.exportPNG).toHaveBeenCalledOnce();
    });

    it("renders selection-dependent buttons", () => {
        const api = createMockApi();
        render(<VectorEditorMenuBar api={api} />);

        expect(screen.getByText("Delete")).toBeInTheDocument();
        expect(screen.getByText(/Front/)).toBeInTheDocument();
        expect(screen.getByText(/Back/)).toBeInTheDocument();
    });

    it("calls deleteShape when Delete clicked", () => {
        const api = createMockApi({ selId: "s1" });
        render(<VectorEditorMenuBar api={api} />);

        fireEvent.click(screen.getByText("Delete"));
        expect(api.deleteShape).toHaveBeenCalledOnce();
    });

    it("renders alignment buttons", () => {
        const api = createMockApi();
        render(<VectorEditorMenuBar api={api} />);

        expect(screen.getByTitle("Align Left")).toBeInTheDocument();
        expect(screen.getByTitle("Align Center")).toBeInTheDocument();
        expect(screen.getByTitle("Align Right")).toBeInTheDocument();
    });

    it("calls alignShapes when Align Left clicked", () => {
        const api = createMockApi({ selId: "s1" });
        render(<VectorEditorMenuBar api={api} />);

        fireEvent.click(screen.getByTitle("Align Left"));
        expect(api.alignShapes).toHaveBeenCalledWith("left");
    });

    it("renders flip buttons", () => {
        const api = createMockApi();
        render(<VectorEditorMenuBar api={api} />);

        expect(screen.getByTitle("Flip H")).toBeInTheDocument();
        expect(screen.getByTitle("Flip V")).toBeInTheDocument();
    });

    it("calls flipH when Flip H clicked", () => {
        const api = createMockApi({ selId: "s1" });
        render(<VectorEditorMenuBar api={api} />);

        fireEvent.click(screen.getByTitle("Flip H"));
        expect(api.flipH).toHaveBeenCalledOnce();
    });

    it("renders snap toggle", () => {
        const api = createMockApi();
        render(<VectorEditorMenuBar api={api} />);

        expect(screen.getByText("Snap")).toBeInTheDocument();
    });

    it("shows Save to Library when saveToLibrary is defined", () => {
        const api = createMockApi({ saveToLibrary: vi.fn() });
        render(<VectorEditorMenuBar api={api} hasOnSaveToLibrary={true} />);

        expect(screen.getByText(/Save to Library/)).toBeInTheDocument();
    });

    it("hides Save to Library when saveToLibrary is falsy", () => {
        const api = createMockApi({ saveToLibrary: null });
        render(<VectorEditorMenuBar api={api} hasOnSaveToLibrary={false} />);

        expect(screen.queryByText(/Save to Library/)).not.toBeInTheDocument();
    });

    it("renders copy/paste buttons", () => {
        const api = createMockApi();
        render(<VectorEditorMenuBar api={api} />);

        expect(screen.getByText("Copy")).toBeInTheDocument();
        expect(screen.getByText("Paste")).toBeInTheDocument();
        expect(screen.getByText("Dup")).toBeInTheDocument();
    });
});

// ══════════════════════════════════════════════
// VectorEditorRightPanel
// ══════════════════════════════════════════════
describe("VectorEditorRightPanel", () => {
    it("renders Appearance section", () => {
        const api = createMockApi();
        render(<VectorEditorRightPanel api={api} />);

        expect(screen.getByText("Appearance")).toBeInTheDocument();
    });

    it("renders fill and stroke controls", () => {
        const api = createMockApi();
        render(<VectorEditorRightPanel api={api} />);

        expect(screen.getByText("Fill")).toBeInTheDocument();
        expect(screen.getByText("Stroke")).toBeInTheDocument();
        expect(screen.getByText("Width")).toBeInTheDocument();
        expect(screen.getByText("Opacity")).toBeInTheDocument();
    });

    it("shows empty shapes state when no shapes", () => {
        const api = createMockApi({ shapes: [] });
        render(<VectorEditorRightPanel api={api} />);

        expect(screen.getByText("No shapes yet. Use the tools to draw.")).toBeInTheDocument();
    });

    it("renders shapes list with shape count", () => {
        const shapes = [
            { id: "s1", type: "rect", x: 0, y: 0, w: 100, h: 50, fill: "#000", stroke: "#fff", strokeWidth: 1, opacity: 1, rotation: 0 },
        ];
        const api = createMockApi({ shapes });
        render(<VectorEditorRightPanel api={api} />);

        expect(screen.getByText(/Shapes \(1\)/)).toBeInTheDocument();
    });

    it("renders shape list items by type", () => {
        const shapes = [
            { id: "s1", type: "rect", x: 0, y: 0, w: 100, h: 50, fill: "#000", stroke: "#fff", strokeWidth: 1, opacity: 1, rotation: 0 },
            { id: "s2", type: "ellipse", x: 0, y: 0, w: 50, h: 50, fill: "#000", stroke: "#fff", strokeWidth: 1, opacity: 1, rotation: 0 },
        ];
        const api = createMockApi({ shapes });
        render(<VectorEditorRightPanel api={api} />);

        expect(screen.getByText(/rect/)).toBeInTheDocument();
        expect(screen.getByText(/ellipse/)).toBeInTheDocument();
    });

    it("shows Tool Options for roundrect tool", () => {
        const api = createMockApi({ tool: "roundrect" });
        render(<VectorEditorRightPanel api={api} />);

        expect(screen.getByText("Radius")).toBeInTheDocument();
    });

    it("shows Tool Options for polygon tool", () => {
        const api = createMockApi({ tool: "polygon" });
        render(<VectorEditorRightPanel api={api} />);

        expect(screen.getByText("Sides")).toBeInTheDocument();
    });

    it("shows Tool Options for star tool", () => {
        const api = createMockApi({ tool: "star" });
        render(<VectorEditorRightPanel api={api} />);

        expect(screen.getByText("Points")).toBeInTheDocument();
        expect(screen.getByText("Inner R")).toBeInTheDocument();
    });

    it("shows Tool Options for text tool", () => {
        const api = createMockApi({ tool: "text" });
        render(<VectorEditorRightPanel api={api} />);

        expect(screen.getByText("Size")).toBeInTheDocument();
        expect(screen.getByText("Font")).toBeInTheDocument();
    });

    it("shows grid size input when snap is enabled", () => {
        const api = createMockApi({ snapGrid: true });
        render(<VectorEditorRightPanel api={api} />);

        expect(screen.getByText("Grid")).toBeInTheDocument();
    });

    it("shows Transform section when shape is selected", () => {
        const selShape = { id: "s1", type: "rect", x: 10, y: 20, w: 100, h: 50, fill: "#000", stroke: "#fff", strokeWidth: 1, opacity: 1, rotation: 0 };
        const api = createMockApi({ selId: "s1", selShape, shapes: [selShape] });
        render(<VectorEditorRightPanel api={api} />);

        expect(screen.getByText("Transform")).toBeInTheDocument();
        expect(screen.getByText("X")).toBeInTheDocument();
        expect(screen.getByText("Y")).toBeInTheDocument();
        expect(screen.getByText("W")).toBeInTheDocument();
        expect(screen.getByText("H")).toBeInTheDocument();
    });

    it("shows Rotation input", () => {
        const api = createMockApi();
        render(<VectorEditorRightPanel api={api} />);

        expect(screen.getByText("Rotation")).toBeInTheDocument();
    });
});

// ══════════════════════════════════════════════
// VectorEditorStatusBar
// ══════════════════════════════════════════════
describe("VectorEditorStatusBar", () => {
    it("shows canvas dimensions", () => {
        const api = createMockApi();
        render(<VectorEditorStatusBar api={api} artW={512} artH={512} />);

        expect(screen.getByText("512×512")).toBeInTheDocument();
    });

    it("shows zoom level", () => {
        const api = createMockApi({ zoom: 2 });
        render(<VectorEditorStatusBar api={api} artW={512} artH={512} />);

        expect(screen.getByText("Zoom 200%")).toBeInTheDocument();
    });

    it("shows current tool name", () => {
        const api = createMockApi({ tool: "rect" });
        render(<VectorEditorStatusBar api={api} artW={512} artH={512} />);

        expect(screen.getByText("rect")).toBeInTheDocument();
    });

    it("shows shape count", () => {
        const shapes = [
            { id: "s1", type: "rect" },
            { id: "s2", type: "ellipse" },
        ];
        const api = createMockApi({ shapes });
        render(<VectorEditorStatusBar api={api} artW={512} artH={512} />);

        expect(screen.getByText("2 shape(s)")).toBeInTheDocument();
    });

    it("shows selected shape type when selected", () => {
        const selShape = { id: "s1", type: "rect" };
        const api = createMockApi({ selId: "s1", selShape, shapes: [selShape] });
        render(<VectorEditorStatusBar api={api} artW={512} artH={512} />);

        expect(screen.getByText("Selected: rect")).toBeInTheDocument();
    });

    it("hides selected info when nothing selected", () => {
        const api = createMockApi({ selId: null });
        render(<VectorEditorStatusBar api={api} artW={512} artH={512} />);

        expect(screen.queryByText(/Selected:/)).not.toBeInTheDocument();
    });

    it("shows snap grid info when snap enabled", () => {
        const api = createMockApi({ snapGrid: true, gridSize: 16 });
        render(<VectorEditorStatusBar api={api} artW={512} artH={512} />);

        expect(screen.getByText("Snap: 16px")).toBeInTheDocument();
    });

    it("hides snap info when snap disabled", () => {
        const api = createMockApi({ snapGrid: false });
        render(<VectorEditorStatusBar api={api} artW={512} artH={512} />);

        expect(screen.queryByText(/Snap:/)).not.toBeInTheDocument();
    });
});
