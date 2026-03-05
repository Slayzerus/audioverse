/**
 * ModelEditor component tests.
 *
 * Covers: ModelEditorMenuBar, ModelEditorToolbar, ModelEditorLeftPanel,
 *         ModelEditorRightPanel, ModelEditorTimeline, ModelEditorViewport
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

import type { ModelEditorAPI } from "../components/editors/useModelEditor";
import type { SceneNode, AnimClip } from "../components/editors/modelEditorTypes";

// ── Mocks ──

// Mock three.js — prevent WebGL errors
vi.mock("three", () => {
    const Object3D = vi.fn();
    Object3D.prototype = {};
    const Light = vi.fn();
    Light.prototype = Object.create(Object3D.prototype);
    const SpotLight = vi.fn();
    SpotLight.prototype = Object.create(Light.prototype);
    const PerspectiveCamera = vi.fn();
    PerspectiveCamera.prototype = Object.create(Object3D.prototype);
    return {
        default: {},
        Object3D,
        Light,
        SpotLight,
        PerspectiveCamera,
        Color: vi.fn(),
        Vector3: vi.fn(() => ({ x: 0, y: 0, z: 0 })),
        Euler: vi.fn(() => ({ x: 0, y: 0, z: 0 })),
        Material: vi.fn(),
        MeshStandardMaterial: vi.fn(),
        AnimationClip: vi.fn(),
        VectorKeyframeTrack: vi.fn(),
        DoubleSide: 2,
        FrontSide: 0,
        BackSide: 1,
    };
});

// Mock sub-components that use Three.js refs
vi.mock("../components/editors/ModelEditorSubComponents", () => ({
    Vec3Row: ({ label }: any) => <div data-testid={`vec3-${label}`}>{label}</div>,
    Vec3RowDeg: ({ label }: any) => <div data-testid={`vec3deg-${label}`}>{label}</div>,
    MaterialCard: ({ mat }: any) => <div data-testid="material-card">{mat?.name ?? "Material"}</div>,
}));

// ── Import components ──

import ModelEditorMenuBar from "../components/editors/ModelEditorMenuBar";
import ModelEditorToolbar from "../components/editors/ModelEditorToolbar";
import ModelEditorLeftPanel from "../components/editors/ModelEditorLeftPanel";
import ModelEditorRightPanel from "../components/editors/ModelEditorRightPanel";
import ModelEditorTimeline from "../components/editors/ModelEditorTimeline";

// ── Mock helpers ──

function makeMockNode(overrides?: Partial<SceneNode>): SceneNode {
    return {
        id: "node-1",
        name: "TestCube",
        type: "mesh",
        object: {
            name: "TestCube",
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
        } as any,
        children: [],
        expanded: false,
        visible: true,
        ...overrides,
    };
}

function makeMockAnim(overrides?: Partial<AnimClip>): AnimClip {
    return {
        name: "Walk",
        clip: {} as any,
        duration: 2.5,
        source: "walk.fbx",
        ...overrides,
    };
}

function createMockApi(overrides?: Partial<ModelEditorAPI>): ModelEditorAPI {
    return {
        // refs
        mountRef: { current: null },
        fileInputRef: { current: null },
        mergeInputRef: { current: null },
        videoInputRef: { current: null },
        rootObjectRef: { current: null },

        // state
        sceneTree: [],
        selectedId: null,
        transformMode: "translate",
        setTransformMode: vi.fn(),
        animations: [],
        activeAnimIdx: -1,
        isPlaying: false,
        animTime: 0,
        animDuration: 0,
        animSpeed: 1,
        setAnimSpeed: vi.fn(),
        loopAnim: false,
        setLoopAnim: vi.fn(),
        bottomCollapsed: false,
        setBottomCollapsed: vi.fn(),
        showGrid: true,
        setShowGrid: vi.fn(),
        showAxes: true,
        setShowAxes: vi.fn(),
        wireframe: false,
        setWireframe: vi.fn(),
        bgColor: "#222222",
        setBgColor: vi.fn(),
        statusText: "Ready",
        dragOver: false,
        polyCount: 1000,
        meshCount: 3,
        boneCount: 0,
        selMaterialIdx: 0,
        setSelMaterialIdx: vi.fn(),
        matRefresh: 0,
        setMatRefresh: vi.fn(),
        aiStatus: "",
        aiBusy: false,
        shadingMode: "solid",
        setShadingMode: vi.fn(),
        editorMode: "object",
        setEditorMode: vi.fn(),
        contextMenu: null,
        outlinerSearch: "",
        setOutlinerSearch: vi.fn(),
        snapEnabled: false,
        setSnapEnabled: vi.fn(),
        snapGrid: 1,
        setSnapGrid: vi.fn(),
        showSkeleton: false,
        setShowSkeleton: vi.fn(),
        addMenuOpen: null,
        setAddMenuOpen: vi.fn(),
        gizmoSpace: "local",
        setGizmoSpace: vi.fn(),
        propTab: "object",
        setPropTab: vi.fn(),
        fogEnabled: false,
        setFogEnabled: vi.fn(),
        fogColor: "#cccccc",
        setFogColor: vi.fn(),
        fogNear: 1,
        setFogNear: vi.fn(),
        fogFar: 100,
        setFogFar: vi.fn(),
        showLightHelpers: false,
        setShowLightHelpers: vi.fn(),

        // derived
        selectedNode: null,
        selectedMaterials: [],

        // callbacks
        rebuildTree: vi.fn(),
        loadFile: vi.fn(),
        mergeAnimationFBX: vi.fn(),
        playClip: vi.fn(),
        togglePlay: vi.fn(),
        stopAnim: vi.fn(),
        seekAnim: vi.fn(),
        focusOnObject: vi.fn(),
        setCameraPreset: vi.fn(),
        selectObject: vi.fn(),
        deleteSelected: vi.fn(),
        duplicateSelected: vi.fn(),
        handleFileInput: vi.fn(),
        handleMergeInput: vi.fn(),
        handleAIVideo: vi.fn(),
        exportGLTF: vi.fn(),
        exportOBJ: vi.fn(),
        exportSTL: vi.fn(),
        exportPLY: vi.fn(),
        exportUSDZ: vi.fn(),
        clearScene: vi.fn(),
        saveToLibrary: vi.fn(),
        addPrimitive: vi.fn(),
        addSceneLight: vi.fn(),
        addCameraObject: vi.fn(),
        addEmpty: vi.fn(),
        handleViewportClick: vi.fn(),
        handleContextMenu: vi.fn(),
        closeContextMenu: vi.fn(),
        handleDragOver: vi.fn(),
        handleDragLeave: vi.fn(),
        handleDrop: vi.fn(),
        toggleNodeVisibility: vi.fn(),
        toggleNodeExpanded: vi.fn(),
        setStatusText: vi.fn(),

        ...overrides,
    };
}

// ══════════════════════════════════════════════
// ModelEditorMenuBar
// ══════════════════════════════════════════════
describe("ModelEditorMenuBar", () => {
    it("renders mode select and main action buttons", () => {
        const api = createMockApi();
        render(<ModelEditorMenuBar api={api} hasOnSaveToLibrary={false} />);

        expect(screen.getByText(/Open/)).toBeInTheDocument();
        expect(screen.getByText(/Clear/)).toBeInTheDocument();
    });

    it("renders export buttons", () => {
        const api = createMockApi();
        render(<ModelEditorMenuBar api={api} hasOnSaveToLibrary={false} />);

        expect(screen.getByText(/Export GLB/)).toBeInTheDocument();
        expect(screen.getByText(/Export GLTF/)).toBeInTheDocument();
    });

    it("renders 'Save to Library' when hasOnSaveToLibrary is true", () => {
        const api = createMockApi();
        render(<ModelEditorMenuBar api={api} hasOnSaveToLibrary={true} />);

        expect(screen.getByText(/Save to Library/)).toBeInTheDocument();
    });

    it("hides 'Save to Library' when hasOnSaveToLibrary is false", () => {
        const api = createMockApi();
        render(<ModelEditorMenuBar api={api} hasOnSaveToLibrary={false} />);

        expect(screen.queryByText(/Save to Library/)).not.toBeInTheDocument();
    });

    it("calls clearScene when Clear clicked", () => {
        const api = createMockApi();
        render(<ModelEditorMenuBar api={api} hasOnSaveToLibrary={false} />);

        fireEvent.click(screen.getByText(/Clear/));
        expect(api.clearScene).toHaveBeenCalledOnce();
    });

    it("calls exportGLTF(true) when Export GLB clicked", () => {
        const api = createMockApi();
        render(<ModelEditorMenuBar api={api} hasOnSaveToLibrary={false} />);

        fireEvent.click(screen.getByText(/Export GLB/));
        expect(api.exportGLTF).toHaveBeenCalledWith(true);
    });

    it("renders view toggles (Grid, Axes, Wire, Skel)", () => {
        const api = createMockApi();
        render(<ModelEditorMenuBar api={api} hasOnSaveToLibrary={false} />);

        expect(screen.getByText("Grid")).toBeInTheDocument();
        expect(screen.getByText("Axes")).toBeInTheDocument();
        expect(screen.getByText("Wire")).toBeInTheDocument();
        expect(screen.getByText("Skel")).toBeInTheDocument();
    });

    it("renders editor mode select with options", () => {
        const api = createMockApi();
        render(<ModelEditorMenuBar api={api} hasOnSaveToLibrary={false} />);

        expect(screen.getByText("Object Mode")).toBeInTheDocument();
    });
});

// ══════════════════════════════════════════════
// ModelEditorToolbar
// ══════════════════════════════════════════════
describe("ModelEditorToolbar", () => {
    it("renders transform mode buttons with titles", () => {
        const api = createMockApi();
        render(<ModelEditorToolbar api={api} />);

        expect(screen.getByTitle("Translate (G)")).toBeInTheDocument();
        expect(screen.getByTitle("Rotate (R)")).toBeInTheDocument();
        expect(screen.getByTitle("Scale (S)")).toBeInTheDocument();
    });

    it("calls setTransformMode when Translate clicked", () => {
        const api = createMockApi();
        render(<ModelEditorToolbar api={api} />);

        fireEvent.click(screen.getByTitle("Translate (G)"));
        expect(api.setTransformMode).toHaveBeenCalledWith("translate");
    });

    it("calls setTransformMode when Rotate clicked", () => {
        const api = createMockApi();
        render(<ModelEditorToolbar api={api} />);

        fireEvent.click(screen.getByTitle("Rotate (R)"));
        expect(api.setTransformMode).toHaveBeenCalledWith("rotate");
    });

    it("calls setTransformMode when Scale clicked", () => {
        const api = createMockApi();
        render(<ModelEditorToolbar api={api} />);

        fireEvent.click(screen.getByTitle("Scale (S)"));
        expect(api.setTransformMode).toHaveBeenCalledWith("scale");
    });

    it("renders snap toggle with correct title", () => {
        const api = createMockApi({ snapEnabled: false });
        render(<ModelEditorToolbar api={api} />);

        expect(screen.getByTitle("Snap to Grid (OFF)")).toBeInTheDocument();
    });

    it("renders snap toggle ON state", () => {
        const api = createMockApi({ snapEnabled: true });
        render(<ModelEditorToolbar api={api} />);

        expect(screen.getByTitle("Snap to Grid (ON)")).toBeInTheDocument();
    });

    it("renders camera preset buttons", () => {
        const api = createMockApi();
        render(<ModelEditorToolbar api={api} />);

        expect(screen.getByTitle('Front view (Numpad 1)')).toBeInTheDocument();
        expect(screen.getByTitle('Right view (Numpad 3)')).toBeInTheDocument();
        expect(screen.getByTitle('Top view (Numpad 7)')).toBeInTheDocument();
    });

    it("calls setCameraPreset when Front clicked", () => {
        const api = createMockApi();
        render(<ModelEditorToolbar api={api} />);

        fireEvent.click(screen.getByTitle('Front view (Numpad 1)'));
        expect(api.setCameraPreset).toHaveBeenCalledWith("front");
    });

    it("renders Focus button", () => {
        const api = createMockApi();
        render(<ModelEditorToolbar api={api} />);

        expect(screen.getByTitle("Focus (F)")).toBeInTheDocument();
    });

    it("renders delete and duplicate buttons", () => {
        const api = createMockApi();
        render(<ModelEditorToolbar api={api} />);

        expect(screen.getByTitle("Delete selected (Del)")).toBeInTheDocument();
        expect(screen.getByTitle("Duplicate (Shift+D)")).toBeInTheDocument();
    });

    it("calls deleteSelected when delete clicked", () => {
        const api = createMockApi();
        render(<ModelEditorToolbar api={api} />);

        fireEvent.click(screen.getByTitle("Delete selected (Del)"));
        expect(api.deleteSelected).toHaveBeenCalledOnce();
    });
});

// ══════════════════════════════════════════════
// ModelEditorLeftPanel (Outliner)
// ══════════════════════════════════════════════
describe("ModelEditorLeftPanel", () => {
    it("renders Outliner title", () => {
        const api = createMockApi();
        render(<ModelEditorLeftPanel api={api} />);

        expect(screen.getByText(/Outliner/)).toBeInTheDocument();
    });

    it("shows empty state when no scene tree", () => {
        const api = createMockApi({ sceneTree: [] });
        render(<ModelEditorLeftPanel api={api} />);

        expect(screen.getByText("Drop a 3D file to begin")).toBeInTheDocument();
    });

    it("renders scene tree nodes", () => {
        const node = makeMockNode({ name: "MyCube" });
        const api = createMockApi({ sceneTree: [node] });
        render(<ModelEditorLeftPanel api={api} />);

        expect(screen.getByText("MyCube")).toBeInTheDocument();
    });

    it("calls selectObject when node clicked", () => {
        const node = makeMockNode({ name: "MyCube" });
        const api = createMockApi({ sceneTree: [node] });
        render(<ModelEditorLeftPanel api={api} />);

        fireEvent.click(screen.getByText("MyCube"));
        expect(api.selectObject).toHaveBeenCalled();
    });

    it("renders refresh button", () => {
        const api = createMockApi();
        render(<ModelEditorLeftPanel api={api} />);

        expect(screen.getByLabelText("Refresh outliner")).toBeInTheDocument();
    });

    it("calls rebuildTree when refresh clicked", () => {
        const api = createMockApi();
        render(<ModelEditorLeftPanel api={api} />);

        fireEvent.click(screen.getByLabelText("Refresh outliner"));
        expect(api.rebuildTree).toHaveBeenCalledOnce();
    });

    it("renders search filter input", () => {
        const api = createMockApi();
        render(<ModelEditorLeftPanel api={api} />);

        expect(screen.getByPlaceholderText(/Filter/)).toBeInTheDocument();
    });

    it("shows node type icons for different types", () => {
        const nodes: SceneNode[] = [
            makeMockNode({ id: "1", name: "Mesh1", type: "mesh" }),
            makeMockNode({ id: "2", name: "Light1", type: "light" }),
        ];
        const api = createMockApi({ sceneTree: nodes });
        render(<ModelEditorLeftPanel api={api} />);

        expect(screen.getByText("Mesh1")).toBeInTheDocument();
        expect(screen.getByText("Light1")).toBeInTheDocument();
    });

    it("renders visibility toggles for nodes", () => {
        const node = makeMockNode({ name: "TestObj", visible: true });
        const api = createMockApi({ sceneTree: [node] });
        render(<ModelEditorLeftPanel api={api} />);

        // Visible node shows 👁 icon
        expect(screen.getByText("👁")).toBeInTheDocument();
    });
});

// ══════════════════════════════════════════════
// ModelEditorRightPanel (Properties)
// ══════════════════════════════════════════════
describe("ModelEditorRightPanel", () => {
    it("renders all 5 tab buttons", () => {
        const api = createMockApi();
        render(<ModelEditorRightPanel api={api} />);

        // Tab icons
        expect(screen.getByText("🔧")).toBeInTheDocument();
        expect(screen.getByText("🎨")).toBeInTheDocument();
        expect(screen.getByText("🌍")).toBeInTheDocument();
        expect(screen.getByText("🔩")).toBeInTheDocument();
        expect(screen.getByText("⚡")).toBeInTheDocument();
    });

    it("shows empty state on object tab when nothing selected", () => {
        const api = createMockApi({ propTab: "object", selectedNode: null });
        render(<ModelEditorRightPanel api={api} />);

        expect(screen.getByText("Select an object")).toBeInTheDocument();
    });

    it("shows Transform section when a node is selected", () => {
        const node = makeMockNode();
        const api = createMockApi({ propTab: "object", selectedNode: node, selectedId: node.id });
        render(<ModelEditorRightPanel api={api} />);

        expect(screen.getByText(/Transform/)).toBeInTheDocument();
        expect(screen.getByText("Name")).toBeInTheDocument();
    });

    it("shows World tab content", () => {
        const api = createMockApi({ propTab: "world" });
        render(<ModelEditorRightPanel api={api} />);

        expect(screen.getByText(/Environment/)).toBeInTheDocument();
        expect(screen.getByText(/Fog/)).toBeInTheDocument();
    });

    it("shows Modifiers tab content", () => {
        const api = createMockApi({ propTab: "modifiers" });
        render(<ModelEditorRightPanel api={api} />);

        expect(screen.getByText(/Modifiers/)).toBeInTheDocument();
    });

    it("shows Physics tab content", () => {
        const api = createMockApi({ propTab: "physics" });
        render(<ModelEditorRightPanel api={api} />);

        expect(screen.getByText(/Physics simulation preview/)).toBeInTheDocument();
    });

    it("calls setPropTab when tab button clicked", () => {
        const api = createMockApi({ propTab: "object" });
        render(<ModelEditorRightPanel api={api} />);

        // Click Material tab icon
        fireEvent.click(screen.getByText("🎨"));
        expect(api.setPropTab).toHaveBeenCalledWith("material");
    });

    it("shows modifiers empty state when no mesh selected", () => {
        const api = createMockApi({ propTab: "modifiers", selectedNode: null });
        render(<ModelEditorRightPanel api={api} />);

        expect(screen.getByText("Select a mesh to apply modifiers")).toBeInTheDocument();
    });
});

// ══════════════════════════════════════════════
// ModelEditorTimeline
// ══════════════════════════════════════════════
describe("ModelEditorTimeline", () => {
    it("shows 'No animations loaded' when empty", () => {
        const api = createMockApi({ animations: [] });
        render(<ModelEditorTimeline api={api} />);

        expect(screen.getByText("No animations loaded")).toBeInTheDocument();
    });

    it("shows animation header with count", () => {
        const anim = makeMockAnim();
        const api = createMockApi({ animations: [anim] });
        render(<ModelEditorTimeline api={api} />);

        // Header text: "Animation (1 clip)"
        expect(screen.getByText(/Animation \(1 clip\)/)).toBeInTheDocument();
    });

    it("renders transport control buttons", () => {
        const anim = makeMockAnim();
        const api = createMockApi({ animations: [anim], activeAnimIdx: 0, animDuration: 2.5 });
        render(<ModelEditorTimeline api={api} />);

        expect(screen.getByTitle("Go to start")).toBeInTheDocument();
        expect(screen.getByTitle("Play/Pause (Space)")).toBeInTheDocument();
        expect(screen.getByTitle("Stop")).toBeInTheDocument();
        expect(screen.getByTitle("Loop")).toBeInTheDocument();
    });

    it("calls togglePlay when play button clicked", () => {
        const anim = makeMockAnim();
        const api = createMockApi({ animations: [anim], activeAnimIdx: 0, animDuration: 2.5 });
        render(<ModelEditorTimeline api={api} />);

        fireEvent.click(screen.getByTitle("Play/Pause (Space)"));
        expect(api.togglePlay).toHaveBeenCalledOnce();
    });

    it("calls stopAnim when stop button clicked", () => {
        const anim = makeMockAnim();
        const api = createMockApi({ animations: [anim], activeAnimIdx: 0, animDuration: 2.5 });
        render(<ModelEditorTimeline api={api} />);

        fireEvent.click(screen.getByTitle("Stop"));
        expect(api.stopAnim).toHaveBeenCalledOnce();
    });

    it("renders animation list items", () => {
        const anims = [
            makeMockAnim({ name: "Walk" }),
            makeMockAnim({ name: "Run", duration: 1.2 }),
        ];
        const api = createMockApi({ animations: anims });
        render(<ModelEditorTimeline api={api} />);

        expect(screen.getByText("Walk")).toBeInTheDocument();
        expect(screen.getByText("Run")).toBeInTheDocument();
    });

    it("calls playClip when animation item clicked", () => {
        const anim = makeMockAnim({ name: "Walk" });
        const api = createMockApi({ animations: [anim] });
        render(<ModelEditorTimeline api={api} />);

        fireEvent.click(screen.getByText("Walk"));
        expect(api.playClip).toHaveBeenCalledWith(0);
    });

    it("shows speed indicator", () => {
        const anim = makeMockAnim();
        const api = createMockApi({ animations: [anim], activeAnimIdx: 0, animDuration: 2.5, animSpeed: 1.5 });
        render(<ModelEditorTimeline api={api} />);

        expect(screen.getByText("Speed")).toBeInTheDocument();
        expect(screen.getByText("1.5×")).toBeInTheDocument();
    });

    it("renders '+ Add Animation File' button", () => {
        const anim = makeMockAnim();
        const api = createMockApi({ animations: [anim] });
        render(<ModelEditorTimeline api={api} />);

        expect(screen.getByText("+ Add Animation File")).toBeInTheDocument();
    });
});
