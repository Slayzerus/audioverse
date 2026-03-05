/**
 * VideoEditor.test.tsx — tests for VideoEditor, VideoEditorToolbar,
 * VideoEditorLeftPanel, and VideoEditorTimeline sub-components.
 */

import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import type { VideoEditorAPI, EditorTab } from "../components/forms/useVideoEditor";

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
    },
}));

// ── Import components (after mocks) ──

import VideoEditor from "../components/forms/VideoEditor";
import VideoEditorToolbar from "../components/forms/VideoEditorToolbar";
import VideoEditorTimeline from "../components/forms/VideoEditorTimeline";
import VideoEditorLeftPanel from "../components/forms/VideoEditorLeftPanel";

// ── Mock API factory ──

function createMockApi(overrides?: Partial<VideoEditorAPI>): VideoEditorAPI {
    return {
        videoRef: { current: null },
        canvasRef: { current: null },
        containerRef: { current: null },
        timelineRef: { current: null },
        loading: false,
        duration: 120,
        currentTime: 30,
        isPlaying: false,
        activeTab: "filters" as EditorTab,
        setActiveTab: vi.fn(),
        videoReady: true,
        filterId: "none",
        setFilterId: vi.fn(),
        filterIntensity: 1,
        setFilterIntensity: vi.fn(),
        filterCategory: "all",
        setFilterCategory: vi.fn(),
        adjustments: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0, sharpen: 0, blur: 0, vignette: 0 },
        handleAdjChange: vi.fn(),
        resetAdjustments: vi.fn(),
        speed: 1,
        setSpeed: vi.fn(),
        trimStart: 0,
        setTrimStart: vi.fn(),
        trimEnd: 0,
        setTrimEnd: vi.fn(),
        rotation: 0,
        setRotation: vi.fn(),
        flipH: false,
        setFlipH: vi.fn(),
        flipV: false,
        setFlipV: vi.fn(),
        volume: 1,
        setVolume: vi.fn(),
        transitionIn: "none",
        setTransitionIn: vi.fn(),
        transitionOut: "none",
        setTransitionOut: vi.fn(),
        transitionDuration: 0.5,
        setTransitionDuration: vi.fn(),
        textOverlays: [],
        selectedTextId: null,
        setSelectedTextId: vi.fn(),
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
        textBg: false,
        setTextBg: vi.fn(),
        textFontSize: 48,
        setTextFontSize: vi.fn(),
        textAnimation: "fade_in",
        setTextAnimation: vi.fn(),
        activeFilter: null,
        selectedText: null,
        filteredFilters: [
            { id: "none", name: "None", icon: "🚫", category: "all", apply: () => {} },
        ],
        effectiveTrimEnd: 120,
        togglePlay: vi.fn(),
        seek: vi.fn(),
        skipForward: vi.fn(),
        skipBack: vi.fn(),
        handleSave: vi.fn(),
        handleReset: vi.fn(),
        handleDownload: vi.fn(),
        handleShareNative: vi.fn(),
        addTextOverlay: vi.fn(),
        updateTextOverlay: vi.fn(),
        deleteTextOverlay: vi.fn(),
        handleTimelineMouseDown: vi.fn(),
        accent: "#00aaff",
        onCancel: vi.fn(),
        ...overrides,
    };
}

beforeEach(() => vi.clearAllMocks());

// ═══════════════════════════════════════════
// VideoEditorToolbar
// ═══════════════════════════════════════════

describe("VideoEditorToolbar", () => {
    it("renders all toolbar buttons", () => {
        const api = createMockApi();
        render(<VideoEditorToolbar api={api} />);

        expect(screen.getByTitle("Reset")).toBeInTheDocument();
        expect(screen.getByTitle("Download")).toBeInTheDocument();
        expect(screen.getByTitle("Share")).toBeInTheDocument();
        expect(screen.getByText("Cancel")).toBeInTheDocument();
        expect(screen.getByText("Apply")).toBeInTheDocument();
    });

    it("displays the Video Editor title", () => {
        const api = createMockApi();
        render(<VideoEditorToolbar api={api} />);

        expect(screen.getByText("Video Editor")).toBeInTheDocument();
    });

    it("calls handleReset when reset button clicked", () => {
        const api = createMockApi();
        render(<VideoEditorToolbar api={api} />);

        fireEvent.click(screen.getByTitle("Reset"));
        expect(api.handleReset).toHaveBeenCalledOnce();
    });

    it("calls handleDownload when download button clicked", () => {
        const api = createMockApi();
        render(<VideoEditorToolbar api={api} />);

        fireEvent.click(screen.getByTitle("Download"));
        expect(api.handleDownload).toHaveBeenCalledOnce();
    });

    it("calls handleShareNative when share button clicked", () => {
        const api = createMockApi();
        render(<VideoEditorToolbar api={api} />);

        fireEvent.click(screen.getByTitle("Share"));
        expect(api.handleShareNative).toHaveBeenCalledOnce();
    });

    it("calls onCancel when cancel button clicked", () => {
        const api = createMockApi();
        render(<VideoEditorToolbar api={api} />);

        fireEvent.click(screen.getByText("Cancel"));
        expect(api.onCancel).toHaveBeenCalledOnce();
    });

    it("calls handleSave when save/apply button clicked", () => {
        const api = createMockApi();
        render(<VideoEditorToolbar api={api} />);

        fireEvent.click(screen.getByText("Apply"));
        expect(api.handleSave).toHaveBeenCalledOnce();
    });
});

// ═══════════════════════════════════════════
// VideoEditorTimeline
// ═══════════════════════════════════════════

describe("VideoEditorTimeline", () => {
    it("renders current time and total time", () => {
        const api = createMockApi({ currentTime: 65, effectiveTrimEnd: 120 });
        render(<VideoEditorTimeline api={api} />);

        // formatTime(65) should show "1:05.0", formatTime(120) should show "2:00.0"
        expect(screen.getByText("1:05.0")).toBeInTheDocument();
        expect(screen.getByText("2:00.0")).toBeInTheDocument();
    });

    it("renders play button when not playing", () => {
        const api = createMockApi({ isPlaying: false });
        render(<VideoEditorTimeline api={api} />);

        const playIcon = document.querySelector(".fa-play");
        expect(playIcon).toBeInTheDocument();
    });

    it("renders pause button when playing", () => {
        const api = createMockApi({ isPlaying: true });
        render(<VideoEditorTimeline api={api} />);

        const pauseIcon = document.querySelector(".fa-pause");
        expect(pauseIcon).toBeInTheDocument();
    });

    it("calls togglePlay when play button clicked", () => {
        const api = createMockApi();
        render(<VideoEditorTimeline api={api} />);

        // The play/pause button has the playBtn class
        const playButtons = screen.getAllByRole("button");
        const playBtn = playButtons.find((btn) =>
            btn.querySelector(".fa-play") || btn.querySelector(".fa-pause"),
        );
        expect(playBtn).toBeDefined();
        fireEvent.click(playBtn!);
        expect(api.togglePlay).toHaveBeenCalledOnce();
    });

    it("calls skipBack when skip-back button clicked", () => {
        const api = createMockApi();
        render(<VideoEditorTimeline api={api} />);

        fireEvent.click(screen.getByTitle("-5s"));
        expect(api.skipBack).toHaveBeenCalledOnce();
    });

    it("calls skipForward when skip-forward button clicked", () => {
        const api = createMockApi();
        render(<VideoEditorTimeline api={api} />);

        fireEvent.click(screen.getByTitle("+5s"));
        expect(api.skipForward).toHaveBeenCalledOnce();
    });

    it("shows speed indicator when speed is not 1x", () => {
        const api = createMockApi({ speed: 1.50 });
        render(<VideoEditorTimeline api={api} />);

        expect(screen.getByText("1.50×")).toBeInTheDocument();
    });

    it("hides speed indicator when speed is 1x", () => {
        const api = createMockApi({ speed: 1 });
        render(<VideoEditorTimeline api={api} />);

        expect(screen.queryByText(/×/)).toBeNull();
    });

    it("renders text overlay markers", () => {
        const api = createMockApi({
            textOverlays: [
                { id: "t1", text: "Hello", startTime: 10, endTime: 20, x: 0.5, y: 0.5, color: "#fff", fontSize: 48, bold: true, italic: false, outline: true, bg: false, animation: "fade_in" },
            ],
        });
        render(<VideoEditorTimeline api={api} />);

        // Marker should be rendered (positioned absolutely)
        const markers = document.querySelectorAll("[class*='textMarker']");
        expect(markers.length).toBe(1);
    });
});

// ═══════════════════════════════════════════
// VideoEditorLeftPanel
// ═══════════════════════════════════════════

describe("VideoEditorLeftPanel", () => {
    it("renders all 8 tab buttons", () => {
        const api = createMockApi();
        render(<VideoEditorLeftPanel api={api} />);

        expect(screen.getByText("Filters")).toBeInTheDocument();
        expect(screen.getByText("Adjust")).toBeInTheDocument();
        expect(screen.getByText("Trim")).toBeInTheDocument();
        expect(screen.getByText("Speed")).toBeInTheDocument();
        expect(screen.getByText("Text")).toBeInTheDocument();
        expect(screen.getByText("Transitions")).toBeInTheDocument();
        expect(screen.getByText("Transform")).toBeInTheDocument();
        expect(screen.getByText("Share")).toBeInTheDocument();
    });

    it("calls setActiveTab when a tab is clicked", () => {
        const api = createMockApi();
        render(<VideoEditorLeftPanel api={api} />);

        fireEvent.click(screen.getByText("Speed"));
        expect(api.setActiveTab).toHaveBeenCalledWith("speed");
    });

    it("shows Filters tab content by default", () => {
        const api = createMockApi({ activeTab: "filters" });
        render(<VideoEditorLeftPanel api={api} />);

        // Filter category pills
        expect(screen.getByText("All")).toBeInTheDocument();
        expect(screen.getByText("Color")).toBeInTheDocument();
        expect(screen.getByText("Cinematic")).toBeInTheDocument();
    });

    it("shows Trim tab content with sliders", () => {
        const api = createMockApi({ activeTab: "trim" });
        render(<VideoEditorLeftPanel api={api} />);

        expect(screen.getByText("Drag handles on the timeline or set values manually.")).toBeInTheDocument();
        expect(screen.getByText("Start")).toBeInTheDocument();
        expect(screen.getByText("End")).toBeInTheDocument();
        expect(screen.getByText(/Duration/)).toBeInTheDocument();
    });

    it("shows Speed tab content with presets", () => {
        const api = createMockApi({ activeTab: "speed" });
        render(<VideoEditorLeftPanel api={api} />);

        expect(screen.getByText("Change video playback speed.")).toBeInTheDocument();
        // "Speed" appears as both tab button and slider label
        expect(screen.getAllByText("Speed").length).toBeGreaterThanOrEqual(2);
        expect(screen.getAllByText("Volume").length).toBeGreaterThanOrEqual(1);
    });

    it("shows Text tab with textarea and format buttons", () => {
        const api = createMockApi({ activeTab: "text" });
        render(<VideoEditorLeftPanel api={api} />);

        expect(screen.getByLabelText("Text overlay content")).toBeInTheDocument();
        expect(screen.getByLabelText("Bold")).toBeInTheDocument();
        expect(screen.getByLabelText("Italic")).toBeInTheDocument();
        expect(screen.getByLabelText("Outline")).toBeInTheDocument();
        expect(screen.getByLabelText("Background")).toBeInTheDocument();
        expect(screen.getByText("Add text at current moment")).toBeInTheDocument();
    });

    it("calls addTextOverlay when add button clicked in text tab", () => {
        const api = createMockApi({ activeTab: "text" });
        render(<VideoEditorLeftPanel api={api} />);

        fireEvent.click(screen.getByText("Add text at current moment"));
        expect(api.addTextOverlay).toHaveBeenCalledOnce();
    });

    it("shows Transform tab with rotation and flip", () => {
        const api = createMockApi({ activeTab: "transform" });
        render(<VideoEditorLeftPanel api={api} />);

        expect(screen.getByText("Rotation")).toBeInTheDocument();
        expect(screen.getByText("Flip")).toBeInTheDocument();
        expect(screen.getByText("0°")).toBeInTheDocument();
        expect(screen.getByText("90°")).toBeInTheDocument();
        expect(screen.getByText("180°")).toBeInTheDocument();
        expect(screen.getByText("270°")).toBeInTheDocument();
        expect(screen.getByText("Horizontal")).toBeInTheDocument();
        expect(screen.getByText("Vertical")).toBeInTheDocument();
    });

    it("calls setRotation when rotation button clicked", () => {
        const api = createMockApi({ activeTab: "transform" });
        render(<VideoEditorLeftPanel api={api} />);

        fireEvent.click(screen.getByText("90°"));
        expect(api.setRotation).toHaveBeenCalledWith(90);
    });

    it("calls setFlipH when horizontal flip button clicked", () => {
        const api = createMockApi({ activeTab: "transform" });
        render(<VideoEditorLeftPanel api={api} />);

        fireEvent.click(screen.getByText("Horizontal"));
        expect(api.setFlipH).toHaveBeenCalled();
    });

    it("shows Share tab with download/share/save buttons", () => {
        const api = createMockApi({ activeTab: "share" });
        render(<VideoEditorLeftPanel api={api} />);

        expect(screen.getByText("Download or share your video.")).toBeInTheDocument();
        expect(screen.getByText("Download video")).toBeInTheDocument();
        expect(screen.getByText("Share (native)")).toBeInTheDocument();
        expect(screen.getByText("Save & send")).toBeInTheDocument();
    });

    it("calls handleDownload when download button clicked in share tab", () => {
        const api = createMockApi({ activeTab: "share" });
        render(<VideoEditorLeftPanel api={api} />);

        fireEvent.click(screen.getByText("Download video"));
        expect(api.handleDownload).toHaveBeenCalledOnce();
    });

    it("shows Transitions tab", () => {
        const api = createMockApi({ activeTab: "transitions" });
        render(<VideoEditorLeftPanel api={api} />);

        expect(screen.getByText("Transition In")).toBeInTheDocument();
        expect(screen.getByText("Transition Out")).toBeInTheDocument();
        expect(screen.getByText("Transition duration")).toBeInTheDocument();
    });

    it("shows Adjust tab with sliders for each adjustment", () => {
        const api = createMockApi({ activeTab: "adjust" });
        render(<VideoEditorLeftPanel api={api} />);

        expect(screen.getByText("Reset adjustments")).toBeInTheDocument();
    });

    it("calls resetAdjustments when reset button clicked in adjust tab", () => {
        const api = createMockApi({ activeTab: "adjust" });
        render(<VideoEditorLeftPanel api={api} />);

        fireEvent.click(screen.getByText("Reset adjustments"));
        expect(api.resetAdjustments).toHaveBeenCalledOnce();
    });

    it("shows filter category pills and calls setFilterCategory", () => {
        const api = createMockApi({ activeTab: "filters" });
        render(<VideoEditorLeftPanel api={api} />);

        fireEvent.click(screen.getByText("Cinematic"));
        expect(api.setFilterCategory).toHaveBeenCalledWith("cinematic");
    });

    it("shows text overlays list when overlays exist", () => {
        const overlay = {
            id: "ov1", text: "Test Overlay", startTime: 5, endTime: 15,
            x: 0.5, y: 0.5, color: "#fff", fontSize: 48,
            bold: true, italic: false, outline: true, bg: false, animation: "fade_in" as const,
        };
        const api = createMockApi({
            activeTab: "text",
            textOverlays: [overlay],
            selectedText: overlay,
            selectedTextId: "ov1",
        });
        render(<VideoEditorLeftPanel api={api} />);

        expect(screen.getByText(/^Overlays/)).toBeInTheDocument();
        expect(screen.getAllByText("Test Overlay").length).toBeGreaterThanOrEqual(1);
    });
});

// ═══════════════════════════════════════════
// VideoEditor (integration smoke test)
// ═══════════════════════════════════════════

vi.mock("../components/forms/useVideoEditor", () => ({
    useVideoEditor: vi.fn(),
}));

import { useVideoEditor } from "../components/forms/useVideoEditor";

describe("VideoEditor", () => {
    it("renders loading state when loading is true", () => {
        const api = createMockApi({ loading: true });
        (useVideoEditor as ReturnType<typeof vi.fn>).mockReturnValue(api);

        render(
            <VideoEditor
                src="test-video.mp4"
                onSave={vi.fn()}
                onCancel={vi.fn()}
            />,
        );

        const spinner = document.querySelector(".fa-spinner");
        expect(spinner).toBeInTheDocument();
    });

    it("renders full editor UI when loaded", () => {
        const api = createMockApi({ loading: false });
        (useVideoEditor as ReturnType<typeof vi.fn>).mockReturnValue(api);

        render(
            <VideoEditor
                src="test-video.mp4"
                onSave={vi.fn()}
                onCancel={vi.fn()}
            />,
        );

        // Toolbar elements
        expect(screen.getByText("Video Editor")).toBeInTheDocument();
        // Left panel tabs
        expect(screen.getByText("Filters")).toBeInTheDocument();
        // Canvas should exist
        const canvas = document.querySelector("canvas");
        expect(canvas).toBeInTheDocument();
    });

    it("renders hidden video element", () => {
        const api = createMockApi({ loading: false });
        (useVideoEditor as ReturnType<typeof vi.fn>).mockReturnValue(api);

        render(
            <VideoEditor
                src="test-video.mp4"
                onSave={vi.fn()}
                onCancel={vi.fn()}
            />,
        );

        const video = document.querySelector("video");
        expect(video).toBeInTheDocument();
    });
});
