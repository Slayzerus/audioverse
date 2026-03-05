/**
 * PixelEditor component tests.
 *
 * Covers: PixelEditorMenuBar, PixelEditorToolbar, PixelEditorRightPanel,
 *         PixelEditorTimeline, PixelEditorStatusBar, PixelEditorCanvas
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

import type { PixelEditorAPI } from "../components/editors/usePixelEditor";

// ── Mocks ──

vi.mock("../components/editors/HSVPicker", () => ({
    HSVPicker: ({ color, onChange }: any) => (
        <div data-testid="hsv-picker" data-color={color}>HSV Picker</div>
    ),
}));

// ── Import components ──

import PixelEditorMenuBar from "../components/editors/PixelEditorMenuBar";
import PixelEditorToolbar from "../components/editors/PixelEditorToolbar";
import PixelEditorRightPanel from "../components/editors/PixelEditorRightPanel";
import PixelEditorTimeline from "../components/editors/PixelEditorTimeline";
import PixelEditorStatusBar from "../components/editors/PixelEditorStatusBar";
import PixelEditorCanvas from "../components/editors/PixelEditorCanvas";

// ── Mock API factory ──

function createMockApi(overrides?: Partial<PixelEditorAPI>): PixelEditorAPI {
    return {
        // Canvas dimensions
        dw: 64,
        dh: 64,
        // Layers
        layers: [
            { id: "l0", name: "Background", visible: true, opacity: 255, locked: false, blendMode: "normal" as any },
        ],
        aLi: 0,
        setALi: vi.fn(),
        // Frames
        fc: 1,
        afi: 0,
        setAfi: vi.fn(),
        fDur: [100],
        // Tool
        tool: "pencil",
        setTool: vi.fn(),
        // Colours
        col1: "#000000",
        setCol1: vi.fn(),
        col2: "#ffffff",
        setCol2: vi.fn(),
        // Brush
        brush: {
            size: 1,
            shape: "square",
            opacity: 100,
            flow: 100,
            spacing: 25,
            pressureSize: true,
            pressureOpacity: false,
            hardness: 100,
        },
        setBrush: vi.fn(),
        // View
        zoom: 8,
        setZoom: vi.fn(),
        grid: true,
        setGrid: vi.fn(),
        onion: false,
        setOnion: vi.fn(),
        // Animation
        fps: 12,
        setFps: vi.fn(),
        playing: false,
        setPlaying: vi.fn(),
        // Palette
        pal: ["#000000", "#ffffff", "#ff0000"],
        setPal: vi.fn(),
        // Cursor
        cursor: { x: 10, y: 20 },
        setCursor: vi.fn(),
        // Dialog
        dlgNew: false,
        setDlgNew: vi.fn(),
        nw: 64,
        setNw: vi.fn(),
        nh: 64,
        setNh: vi.fn(),
        // Selection
        sel: null,
        setSel: vi.fn(),
        // Symmetry & shape
        symmetry: "none",
        setSymmetry: vi.fn(),
        shapeFilled: false,
        setShapeFilled: vi.fn(),
        // Pressure
        pressure: 0.5,
        // HSV picker
        showHSV: false,
        setShowHSV: vi.fn(),
        // Layer name editing
        editingLayerName: null,
        setEditingLayerName: vi.fn(),
        // Refs
        cvRef: { current: null },
        boxRef: { current: null },
        fInp: { current: null },
        clipboard: { current: null },
        drawing: { current: false },
        panning: { current: false },
        // Callbacks
        undo: vi.fn(),
        redo: vi.fn(),
        openFile: vi.fn(),
        exportAse: vi.fn(),
        exportPNG: vi.fn(),
        exportJPG: vi.fn(),
        exportWebP: vi.fn(),
        exportBMP: vi.fn(),
        exportSVG: vi.fn(),
        exportSheet: vi.fn(),
        saveToLibrary: vi.fn(),
        addLayer: vi.fn(),
        rmLayer: vi.fn(),
        toggleVis: vi.fn(),
        toggleLock: vi.fn(),
        setLayerOpacity: vi.fn(),
        setLayerBlendMode: vi.fn(),
        renameLayer: vi.fn(),
        moveLayerUp: vi.fn(),
        moveLayerDown: vi.fn(),
        mergeDown: vi.fn(),
        dupLayer: vi.fn(),
        addFrame: vi.fn(),
        dupFrame: vi.fn(),
        rmFrame: vi.fn(),
        flipCv: vi.fn(),
        rotateCv: vi.fn(),
        clearCv: vi.fn(),
        newDoc: vi.fn(),
        doCopy: vi.fn(),
        doCut: vi.fn(),
        doPaste: vi.fn(),
        doDeleteSel: vi.fn(),
        doSelectAll: vi.fn(),
        doDeselectAll: vi.fn(),
        onDown: vi.fn(),
        onMove: vi.fn(),
        onUp: vi.fn(),
        onWheel: vi.fn(),
        // Memos
        thumbs: ["data:image/png;base64,AAAA"],

        ...overrides,
    };
}

// ══════════════════════════════════════════════
// PixelEditorMenuBar
// ══════════════════════════════════════════════
describe("PixelEditorMenuBar", () => {
    it("renders file operation buttons", () => {
        const api = createMockApi();
        render(<PixelEditorMenuBar api={api} hasOnSaveToLibrary={false} />);

        expect(screen.getByText("New")).toBeInTheDocument();
        expect(screen.getByText("Open")).toBeInTheDocument();
        expect(screen.getByText("Save .ase")).toBeInTheDocument();
    });

    it("renders export format buttons", () => {
        const api = createMockApi();
        render(<PixelEditorMenuBar api={api} hasOnSaveToLibrary={false} />);

        expect(screen.getByText("PNG")).toBeInTheDocument();
        expect(screen.getByText("JPG")).toBeInTheDocument();
        expect(screen.getByText("WebP")).toBeInTheDocument();
        expect(screen.getByText("BMP")).toBeInTheDocument();
        expect(screen.getByText("SVG")).toBeInTheDocument();
        expect(screen.getByText("Sheet")).toBeInTheDocument();
    });

    it("renders undo/redo buttons", () => {
        const api = createMockApi();
        render(<PixelEditorMenuBar api={api} hasOnSaveToLibrary={false} />);

        expect(screen.getByText("Undo")).toBeInTheDocument();
        expect(screen.getByText("Redo")).toBeInTheDocument();
    });

    it("calls undo when clicked", () => {
        const api = createMockApi();
        render(<PixelEditorMenuBar api={api} hasOnSaveToLibrary={false} />);

        fireEvent.click(screen.getByText("Undo"));
        expect(api.undo).toHaveBeenCalledOnce();
    });

    it("calls redo when clicked", () => {
        const api = createMockApi();
        render(<PixelEditorMenuBar api={api} hasOnSaveToLibrary={false} />);

        fireEvent.click(screen.getByText("Redo"));
        expect(api.redo).toHaveBeenCalledOnce();
    });

    it("renders transform buttons", () => {
        const api = createMockApi();
        render(<PixelEditorMenuBar api={api} hasOnSaveToLibrary={false} />);

        expect(screen.getByText("Flip H")).toBeInTheDocument();
        expect(screen.getByText("Flip V")).toBeInTheDocument();
        expect(screen.getByText("Rot 90°")).toBeInTheDocument();
        expect(screen.getByText("Clear")).toBeInTheDocument();
    });

    it("calls flipCv when Flip H clicked", () => {
        const api = createMockApi();
        render(<PixelEditorMenuBar api={api} hasOnSaveToLibrary={false} />);

        fireEvent.click(screen.getByText("Flip H"));
        expect(api.flipCv).toHaveBeenCalledWith("h");
    });

    it("calls clearCv when Clear clicked", () => {
        const api = createMockApi();
        render(<PixelEditorMenuBar api={api} hasOnSaveToLibrary={false} />);

        fireEvent.click(screen.getByText("Clear"));
        expect(api.clearCv).toHaveBeenCalledOnce();
    });

    it("shows grid toggle with current state", () => {
        const api = createMockApi({ grid: true });
        render(<PixelEditorMenuBar api={api} hasOnSaveToLibrary={false} />);

        expect(screen.getByText("Grid: ON")).toBeInTheDocument();
    });

    it("shows Grid: OFF when grid disabled", () => {
        const api = createMockApi({ grid: false });
        render(<PixelEditorMenuBar api={api} hasOnSaveToLibrary={false} />);

        expect(screen.getByText("Grid: OFF")).toBeInTheDocument();
    });

    it("renders clipboard buttons", () => {
        const api = createMockApi();
        render(<PixelEditorMenuBar api={api} hasOnSaveToLibrary={false} />);

        expect(screen.getByText("Copy")).toBeInTheDocument();
        expect(screen.getByText("Cut")).toBeInTheDocument();
        expect(screen.getByText("Paste")).toBeInTheDocument();
        expect(screen.getByText("Sel All")).toBeInTheDocument();
    });

    it("shows Save to Library when hasOnSaveToLibrary is true", () => {
        const api = createMockApi();
        render(<PixelEditorMenuBar api={api} hasOnSaveToLibrary={true} />);

        expect(screen.getByText(/Save to Library/)).toBeInTheDocument();
    });

    it("hides Save to Library when hasOnSaveToLibrary is false", () => {
        const api = createMockApi();
        render(<PixelEditorMenuBar api={api} hasOnSaveToLibrary={false} />);

        expect(screen.queryByText(/Save to Library/)).not.toBeInTheDocument();
    });

    it("calls exportPNG when PNG clicked", () => {
        const api = createMockApi();
        render(<PixelEditorMenuBar api={api} hasOnSaveToLibrary={false} />);

        fireEvent.click(screen.getByText("PNG"));
        expect(api.exportPNG).toHaveBeenCalledOnce();
    });
});

// ══════════════════════════════════════════════
// PixelEditorToolbar
// ══════════════════════════════════════════════
describe("PixelEditorToolbar", () => {
    it("renders tool buttons with titles", () => {
        const api = createMockApi();
        render(<PixelEditorToolbar api={api} />);

        expect(screen.getByTitle("Pencil (B)")).toBeInTheDocument();
        expect(screen.getByTitle("Eraser (E)")).toBeInTheDocument();
        expect(screen.getByTitle("Bucket Fill (G)")).toBeInTheDocument();
        expect(screen.getByTitle("Line (L)")).toBeInTheDocument();
        expect(screen.getByTitle("Eyedropper (I)")).toBeInTheDocument();
    });

    it("calls setTool when tool button clicked", () => {
        const api = createMockApi();
        render(<PixelEditorToolbar api={api} />);

        fireEvent.click(screen.getByTitle("Eraser (E)"));
        expect(api.setTool).toHaveBeenCalledWith("eraser");
    });

    it("renders shape fill toggle", () => {
        const api = createMockApi({ shapeFilled: false });
        render(<PixelEditorToolbar api={api} />);

        expect(screen.getByTitle("Outline (F)")).toBeInTheDocument();
    });

    it("renders filled state", () => {
        const api = createMockApi({ shapeFilled: true });
        render(<PixelEditorToolbar api={api} />);

        expect(screen.getByTitle("Filled (F)")).toBeInTheDocument();
    });

    it("renders symmetry selector", () => {
        const api = createMockApi();
        render(<PixelEditorToolbar api={api} />);

        expect(screen.getByTitle("Symmetry: Off")).toBeInTheDocument();
    });

    it("renders colour swatches", () => {
        const api = createMockApi();
        render(<PixelEditorToolbar api={api} />);

        expect(screen.getByTitle("Primary Colour (click for HSV)")).toBeInTheDocument();
        expect(screen.getByTitle("Secondary Colour")).toBeInTheDocument();
    });

    it("renders swap colour button", () => {
        const api = createMockApi();
        render(<PixelEditorToolbar api={api} />);

        expect(screen.getByTitle("Swap (X)")).toBeInTheDocument();
    });
});

// ══════════════════════════════════════════════
// PixelEditorCanvas
// ══════════════════════════════════════════════
describe("PixelEditorCanvas", () => {
    it("renders canvas with aria-label", () => {
        const api = createMockApi();
        render(<PixelEditorCanvas api={api} />);

        expect(screen.getByLabelText("Pixel editor canvas")).toBeInTheDocument();
    });
});

// ══════════════════════════════════════════════
// PixelEditorRightPanel
// ══════════════════════════════════════════════
describe("PixelEditorRightPanel", () => {
    it("renders Brush section", () => {
        const api = createMockApi();
        render(<PixelEditorRightPanel api={api} />);

        expect(screen.getByText("Brush")).toBeInTheDocument();
    });

    it("renders brush size slider", () => {
        const api = createMockApi();
        render(<PixelEditorRightPanel api={api} />);

        expect(screen.getByLabelText("Brush size")).toBeInTheDocument();
    });

    it("renders brush opacity slider", () => {
        const api = createMockApi();
        render(<PixelEditorRightPanel api={api} />);

        expect(screen.getByLabelText("Brush opacity")).toBeInTheDocument();
    });

    it("renders Colour section", () => {
        const api = createMockApi();
        render(<PixelEditorRightPanel api={api} />);

        expect(screen.getByText("Colour")).toBeInTheDocument();
    });

    it("shows HSV picker when toggled open", () => {
        const api = createMockApi({ showHSV: true });
        render(<PixelEditorRightPanel api={api} />);

        expect(screen.getByTestId("hsv-picker")).toBeInTheDocument();
    });

    it("hides HSV picker when closed", () => {
        const api = createMockApi({ showHSV: false });
        render(<PixelEditorRightPanel api={api} />);

        expect(screen.queryByTestId("hsv-picker")).not.toBeInTheDocument();
    });

    it("renders Layers section", () => {
        const api = createMockApi();
        render(<PixelEditorRightPanel api={api} />);

        expect(screen.getByText("Layers")).toBeInTheDocument();
    });

    it("renders layer action buttons", () => {
        const api = createMockApi();
        render(<PixelEditorRightPanel api={api} />);

        expect(screen.getByLabelText("Add Layer")).toBeInTheDocument();
        expect(screen.getByLabelText("Remove Layer")).toBeInTheDocument();
        expect(screen.getByLabelText("Duplicate Layer")).toBeInTheDocument();
        expect(screen.getByLabelText("Merge Down")).toBeInTheDocument();
        expect(screen.getByLabelText("Move Up")).toBeInTheDocument();
        expect(screen.getByLabelText("Move Down")).toBeInTheDocument();
    });

    it("calls addLayer when Add Layer clicked", () => {
        const api = createMockApi();
        render(<PixelEditorRightPanel api={api} />);

        fireEvent.click(screen.getByLabelText("Add Layer"));
        expect(api.addLayer).toHaveBeenCalledOnce();
    });

    it("calls rmLayer when Remove Layer clicked", () => {
        const api = createMockApi();
        render(<PixelEditorRightPanel api={api} />);

        fireEvent.click(screen.getByLabelText("Remove Layer"));
        expect(api.rmLayer).toHaveBeenCalledOnce();
    });

    it("displays layer name", () => {
        const api = createMockApi();
        render(<PixelEditorRightPanel api={api} />);

        expect(screen.getByText("Background")).toBeInTheDocument();
    });

    it("renders Palette section", () => {
        const api = createMockApi();
        render(<PixelEditorRightPanel api={api} />);

        expect(screen.getByText("Palette")).toBeInTheDocument();
    });

    it("renders add colour button in palette", () => {
        const api = createMockApi();
        render(<PixelEditorRightPanel api={api} />);

        expect(screen.getByTitle("Add current colour")).toBeInTheDocument();
    });

    it("renders pressure toggles", () => {
        const api = createMockApi();
        render(<PixelEditorRightPanel api={api} />);

        expect(screen.getByText("Pressure→Size")).toBeInTheDocument();
        expect(screen.getByText("Pressure→Opacity")).toBeInTheDocument();
    });
});

// ══════════════════════════════════════════════
// PixelEditorTimeline
// ══════════════════════════════════════════════
describe("PixelEditorTimeline", () => {
    it("renders frame management buttons", () => {
        const api = createMockApi();
        render(<PixelEditorTimeline api={api} />);

        expect(screen.getByText("+ Frame")).toBeInTheDocument();
        expect(screen.getByLabelText("Duplicate frame")).toBeInTheDocument();
        expect(screen.getByLabelText("Remove frame")).toBeInTheDocument();
    });

    it("calls addFrame when + Frame clicked", () => {
        const api = createMockApi();
        render(<PixelEditorTimeline api={api} />);

        fireEvent.click(screen.getByText("+ Frame"));
        expect(api.addFrame).toHaveBeenCalledOnce();
    });

    it("calls dupFrame when Dup clicked", () => {
        const api = createMockApi();
        render(<PixelEditorTimeline api={api} />);

        fireEvent.click(screen.getByLabelText("Duplicate frame"));
        expect(api.dupFrame).toHaveBeenCalledOnce();
    });

    it("renders play/pause toggle", () => {
        const api = createMockApi({ playing: false });
        render(<PixelEditorTimeline api={api} />);

        // Shows play icon when not playing
        expect(screen.getByText("▶")).toBeInTheDocument();
    });

    it("renders pause icon when playing", () => {
        const api = createMockApi({ playing: true });
        render(<PixelEditorTimeline api={api} />);

        expect(screen.getByText("⏸")).toBeInTheDocument();
    });

    it("renders FPS input", () => {
        const api = createMockApi();
        render(<PixelEditorTimeline api={api} />);

        expect(screen.getByLabelText("Frames per second")).toBeInTheDocument();
    });

    it("shows frame count", () => {
        const api = createMockApi({ fc: 1 });
        render(<PixelEditorTimeline api={api} />);

        expect(screen.getByText(/1 frame\b/)).toBeInTheDocument();
    });

    it("shows plural frame count", () => {
        const api = createMockApi({ fc: 3, fDur: [100, 100, 100], thumbs: ["a", "b", "c"] });
        render(<PixelEditorTimeline api={api} />);

        expect(screen.getByText(/3 frames/)).toBeInTheDocument();
    });

    it("renders frame thumbnails", () => {
        const api = createMockApi();
        render(<PixelEditorTimeline api={api} />);

        expect(screen.getByAltText("Frame 1")).toBeInTheDocument();
    });

    it("renders onion skin toggle", () => {
        const api = createMockApi();
        render(<PixelEditorTimeline api={api} />);

        expect(screen.getByText(/Onion/)).toBeInTheDocument();
    });
});

// ══════════════════════════════════════════════
// PixelEditorStatusBar
// ══════════════════════════════════════════════
describe("PixelEditorStatusBar", () => {
    it("shows canvas dimensions", () => {
        const api = createMockApi({ dw: 64, dh: 64 });
        render(<PixelEditorStatusBar api={api} />);

        expect(screen.getByText("64×64")).toBeInTheDocument();
    });

    it("shows zoom level", () => {
        const api = createMockApi({ zoom: 8 });
        render(<PixelEditorStatusBar api={api} />);

        expect(screen.getByText("Zoom 800%")).toBeInTheDocument();
    });

    it("shows cursor position when hovered", () => {
        const api = createMockApi({ cursor: { x: 10, y: 20 } });
        render(<PixelEditorStatusBar api={api} />);

        expect(screen.getByText("(10, 20)")).toBeInTheDocument();
    });

    it("shows current tool name", () => {
        const api = createMockApi({ tool: "pencil" });
        render(<PixelEditorStatusBar api={api} />);

        expect(screen.getByText("pencil")).toBeInTheDocument();
    });

    it("shows brush info", () => {
        const api = createMockApi();
        render(<PixelEditorStatusBar api={api} />);

        expect(screen.getByText("Brush: 1px square")).toBeInTheDocument();
    });

    it("shows active layer name", () => {
        const api = createMockApi();
        render(<PixelEditorStatusBar api={api} />);

        expect(screen.getByText("Layer: Background")).toBeInTheDocument();
    });

    it("shows frame info", () => {
        const api = createMockApi({ afi: 0, fc: 1 });
        render(<PixelEditorStatusBar api={api} />);

        expect(screen.getByText("Frame 1/1")).toBeInTheDocument();
    });

    it("shows selection dimensions when active", () => {
        const api = createMockApi({ sel: { x: 0, y: 0, w: 32, h: 16 } });
        render(<PixelEditorStatusBar api={api} />);

        expect(screen.getByText("Sel: 32×16")).toBeInTheDocument();
    });

    it("shows symmetry mode when not none", () => {
        const api = createMockApi({ symmetry: "h" });
        render(<PixelEditorStatusBar api={api} />);

        expect(screen.getByText("Sym: h")).toBeInTheDocument();
    });

    it("shows Filled when shapeFilled is true", () => {
        const api = createMockApi({ shapeFilled: true });
        render(<PixelEditorStatusBar api={api} />);

        expect(screen.getByText("Filled")).toBeInTheDocument();
    });
});
