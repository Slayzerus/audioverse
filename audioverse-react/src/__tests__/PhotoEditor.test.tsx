/**
 * PhotoEditor.test.tsx — tests for PhotoEditor, PhotoEditorToolbar,
 * PhotoEditorLeftPanel, and PhotoEditorCanvas sub-components.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import type { PhotoEditorAPI } from "../components/forms/usePhotoEditor";
import type { EditorTab } from "../components/forms/photoEditorTypes";

// ── Mocks ──

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string, fallback?: string) => fallback ?? key,
    }),
}));

vi.mock("react-bootstrap", () => ({
    Button: ({ children, onClick, variant, size, className, style, title, ...rest }: any) => (
        <button onClick={onClick} className={className} style={style} title={title} data-variant={variant} data-size={size} {...rest}>
            {children}
        </button>
    ),
    Form: {
        Range: (props: any) => <input type="range" {...props} />,
        Control: ({ as, ...props }: any) => {
            const Tag = as === "textarea" ? "textarea" : "input";
            return <Tag {...props} />;
        },
        Check: (props: any) => <input type="checkbox" {...props} />,
        Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
        Select: ({ children, ...props }: any) => <select {...props}>{children}</select>,
    },
}));

// Mock canvas drawing/paths to prevent errors in photoEffects etc.
vi.mock("../../scripts/photoEffects", () => ({}));

// ── Import components (after mocks) ──

import PhotoEditorToolbar from "../components/forms/PhotoEditorToolbar";
import PhotoEditorLeftPanel from "../components/forms/PhotoEditorLeftPanel";

// ── Mock API factory ──

function createMockApi(overrides?: Partial<PhotoEditorAPI>): PhotoEditorAPI {
    const t = (key: string, fallback?: string) => fallback ?? key;
    return {
        t,
        playerColor: "#ff4444",
        onCancel: vi.fn(),
        accent: "#ff4444",
        accentDim: "#ff444466",

        image: null,
        loading: false,

        activeTab: "filters" as EditorTab,
        setActiveTab: vi.fn(),
        setCropMode: vi.fn(),

        selectedFilter: "none",
        setSelectedFilter: vi.fn(),
        filterIntensity: 1,
        setFilterIntensity: vi.fn(),
        filterCategory: "all",
        setFilterCategory: vi.fn(),
        filteredList: [],
        generateThumbnail: vi.fn(),

        adjustments: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0, sharpen: 0, blur: 0, vignette: 0 },
        handleAdjChange: vi.fn(),
        handleAdjChangeEnd: vi.fn(),

        rotation: 0,
        setRotation: vi.fn(),
        flipH: false,
        setFlipH: vi.fn(),
        flipV: false,
        setFlipV: vi.fn(),
        zoom: 1,
        setZoom: vi.fn(),

        cropMode: false,
        cropRect: null,
        setCropRect: vi.fn(),
        cropAspect: null,
        setCropAspect: vi.fn(),
        handleCropMouseDown: vi.fn(),

        showCompare: false,
        setShowCompare: vi.fn(),
        comparePosition: 50,
        setCompareDragging: vi.fn(),

        overlays: [],
        setOverlays: vi.fn(),
        selectedOverlayId: null,
        setSelectedOverlayId: vi.fn(),
        selectedOverlay: null,
        addOverlay: vi.fn(),
        updateOverlay: vi.fn(),
        deleteOverlay: vi.fn(),
        moveOverlayForward: vi.fn(),
        moveOverlayBack: vi.fn(),

        emojiCat: "smileys",
        setEmojiCat: vi.fn(),

        textDraft: "",
        setTextDraft: vi.fn(),
        textColor: "#ffffff",
        setTextColor: vi.fn(),
        textBold: true,
        setTextBold: vi.fn(),
        textItalic: false,
        setTextItalic: vi.fn(),
        textOutline: true,
        setTextOutline: vi.fn(),
        textFontSize: 48,
        setTextFontSize: vi.fn(),
        textBg: false,
        setTextBg: vi.fn(),

        shapeStroke: "#ffffff",
        setShapeStroke: vi.fn(),
        shapeFill: "transparent",
        setShapeFill: vi.fn(),
        shapeStrokeW: 3,
        setShapeStrokeW: vi.fn(),

        frameColor: "#ffffff",
        setFrameColor: vi.fn(),
        frameThick: 20,
        setFrameThick: vi.fn(),

        drawColor: "#ff0000",
        setDrawColor: vi.fn(),
        drawWidth: 4,
        setDrawWidth: vi.fn(),
        drawingOverlayRef: { current: null },

        historyIdx: 0,
        historyLength: 1,
        undo: vi.fn(),
        redo: vi.fn(),
        pushHistory: vi.fn(),

        handleSave: vi.fn(),
        handleReset: vi.fn(),
        handleDownload: vi.fn(),
        handleCopyToClipboard: vi.fn(),
        handleShareNative: vi.fn(),

        mainCanvasRef: { current: null },
        compareCanvasRef: { current: null },
        containerRef: { current: null },

        handleCanvasMouseDown: vi.fn(),
        handleCanvasMouseMove: vi.fn(),
        handleCanvasMouseUp: vi.fn(),

        createEmojiOverlay: vi.fn() as any,
        createTextOverlay: vi.fn() as any,
        createShapeOverlay: vi.fn() as any,
        createFrameOverlay: vi.fn() as any,

        ...overrides,
    };
}

beforeEach(() => vi.clearAllMocks());

// ═══════════════════════════════════════════
// PhotoEditorToolbar
// ═══════════════════════════════════════════

describe("PhotoEditorToolbar", () => {
    it("renders all toolbar buttons", () => {
        const api = createMockApi();
        render(<PhotoEditorToolbar api={api} />);

        expect(screen.getByTitle("Reset")).toBeInTheDocument();
        expect(screen.getByTitle("Download")).toBeInTheDocument();
        expect(screen.getByTitle("Copy to clipboard")).toBeInTheDocument();
        expect(screen.getByTitle("Share")).toBeInTheDocument();
        expect(screen.getByText("Cancel")).toBeInTheDocument();
        expect(screen.getByText("Apply")).toBeInTheDocument();
    });

    it("displays Photo Editor title", () => {
        const api = createMockApi();
        render(<PhotoEditorToolbar api={api} />);

        expect(screen.getByText("Photo Editor")).toBeInTheDocument();
    });

    it("calls handleReset when reset clicked", () => {
        const api = createMockApi();
        render(<PhotoEditorToolbar api={api} />);

        fireEvent.click(screen.getByTitle("Reset"));
        expect(api.handleReset).toHaveBeenCalledOnce();
    });

    it("calls handleDownload when download clicked", () => {
        const api = createMockApi();
        render(<PhotoEditorToolbar api={api} />);

        fireEvent.click(screen.getByTitle("Download"));
        expect(api.handleDownload).toHaveBeenCalledOnce();
    });

    it("calls onCancel when cancel clicked", () => {
        const api = createMockApi();
        render(<PhotoEditorToolbar api={api} />);

        fireEvent.click(screen.getByText("Cancel"));
        expect(api.onCancel).toHaveBeenCalledOnce();
    });

    it("calls handleSave when apply clicked", () => {
        const api = createMockApi();
        render(<PhotoEditorToolbar api={api} />);

        fireEvent.click(screen.getByText("Apply"));
        expect(api.handleSave).toHaveBeenCalledOnce();
    });

    it("shows undo/redo buttons", () => {
        const api = createMockApi({ historyIdx: 2, historyLength: 5 });
        render(<PhotoEditorToolbar api={api} />);

        // Undo title is hardcoded Polish: "Cofnij (Ctrl+Z)"
        expect(screen.getByTitle("Cofnij (Ctrl+Z)")).toBeInTheDocument();
        expect(screen.getByTitle("Redo (Ctrl+Y)")).toBeInTheDocument();
    });

    it("calls undo/redo when clicked", () => {
        const api = createMockApi({ historyIdx: 2, historyLength: 5 });
        render(<PhotoEditorToolbar api={api} />);

        fireEvent.click(screen.getByTitle("Cofnij (Ctrl+Z)"));
        expect(api.undo).toHaveBeenCalledOnce();

        fireEvent.click(screen.getByTitle("Redo (Ctrl+Y)"));
        expect(api.redo).toHaveBeenCalledOnce();
    });
});

// ═══════════════════════════════════════════
// PhotoEditorLeftPanel
// ═══════════════════════════════════════════

describe("PhotoEditorLeftPanel", () => {
    it("renders all 8 tab buttons", () => {
        const api = createMockApi();
        render(<PhotoEditorLeftPanel api={api} />);

        expect(screen.getByText("Filters")).toBeInTheDocument();
        expect(screen.getByText("Adjust")).toBeInTheDocument();
        expect(screen.getByText("Crop")).toBeInTheDocument();
        expect(screen.getByText("Transform")).toBeInTheDocument();
        expect(screen.getByText("Stickers")).toBeInTheDocument();
        expect(screen.getByText("Text")).toBeInTheDocument();
        expect(screen.getByText("Shapes")).toBeInTheDocument();
        expect(screen.getByText("Draw")).toBeInTheDocument();
    });

    it("calls setActiveTab when tab clicked", () => {
        const api = createMockApi();
        render(<PhotoEditorLeftPanel api={api} />);

        fireEvent.click(screen.getByText("Transform"));
        expect(api.setActiveTab).toHaveBeenCalledWith("transform");
    });

    it("shows Filters tab with category pills", () => {
        const api = createMockApi({ activeTab: "filters" });
        render(<PhotoEditorLeftPanel api={api} />);

        expect(screen.getByText("All")).toBeInTheDocument();
    });

    it("shows Transform tab with rotation and flip", () => {
        const api = createMockApi({ activeTab: "transform" });
        render(<PhotoEditorLeftPanel api={api} />);

        expect(screen.getByText("Rotation")).toBeInTheDocument();
        expect(screen.getByText("Flip")).toBeInTheDocument();
    });

    it("calls setRotation when rotation button clicked", () => {
        const api = createMockApi({ activeTab: "transform" });
        render(<PhotoEditorLeftPanel api={api} />);

        // Rotation buttons show "-90°" and "+90°"
        fireEvent.click(screen.getByText("+90°"));
        expect(api.setRotation).toHaveBeenCalled();
    });

    it("calls setFlipH when horizontal flip clicked", () => {
        const api = createMockApi({ activeTab: "transform" });
        render(<PhotoEditorLeftPanel api={api} />);

        fireEvent.click(screen.getByText("Horizontal"));
        expect(api.setFlipH).toHaveBeenCalled();
    });

    it("shows Text tab with format buttons", () => {
        const api = createMockApi({ activeTab: "text" });
        render(<PhotoEditorLeftPanel api={api} />);

        // Bold/Italic use title= not aria-label=
        expect(screen.getByTitle("Bold")).toBeInTheDocument();
        expect(screen.getByTitle("Italic")).toBeInTheDocument();
    });

    it("shows Draw tab with color and width controls", () => {
        const api = createMockApi({ activeTab: "draw" });
        render(<PhotoEditorLeftPanel api={api} />);

        expect(screen.getByText("Freehand drawing")).toBeInTheDocument();
        expect(screen.getByText("Color:")).toBeInTheDocument();
        expect(screen.getByText("Width:")).toBeInTheDocument();
    });

    it("shows Crop tab with aspect ratio presets", () => {
        const api = createMockApi({ activeTab: "crop" });
        render(<PhotoEditorLeftPanel api={api} />);

        expect(screen.getByText("Free")).toBeInTheDocument();
        expect(screen.getByText("1:1")).toBeInTheDocument();
    });

    it("shows Adjust tab with reset button", () => {
        const api = createMockApi({ activeTab: "adjust" });
        render(<PhotoEditorLeftPanel api={api} />);

        // Reset text is Polish: "Resetuj korekty"
        expect(screen.getByText("Resetuj korekty")).toBeInTheDocument();
    });

    it("shows reset button in adjust tab", () => {
        const api = createMockApi({ activeTab: "adjust" });
        render(<PhotoEditorLeftPanel api={api} />);

        const resetBtn = screen.getByText("Resetuj korekty");
        expect(resetBtn).toBeInTheDocument();
    });
});
