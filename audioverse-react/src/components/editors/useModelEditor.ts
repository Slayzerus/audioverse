/**
 * useModelEditor — custom hook encapsulating all state,
 * refs, callbacks, side-effects, and scene setup for the
 * ModelEditor (Blender-style 3D editor).
 *
 * Extracted from the original ModelEditor.tsx god-component.
 */

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import * as THREE from "three";
// @ts-expect-error — three/examples/jsm re-exports
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// @ts-expect-error — three/examples/jsm re-exports
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
// @ts-expect-error — three/examples/jsm re-exports
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
// @ts-expect-error — three/examples/jsm re-exports
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// @ts-expect-error — three/examples/jsm re-exports
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
// @ts-expect-error — three/examples/jsm re-exports
import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter";
// @ts-expect-error — three/examples/jsm re-exports
import { STLExporter } from "three/examples/jsm/exporters/STLExporter";
// @ts-expect-error — three/examples/jsm re-exports
import { PLYExporter } from "three/examples/jsm/exporters/PLYExporter";
// @ts-expect-error — three/examples/jsm re-exports
import { USDZExporter } from "three/examples/jsm/exporters/USDZExporter";
// @ts-expect-error — three/examples/jsm re-exports
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
// @ts-expect-error — three/examples/jsm re-exports
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader";
// @ts-expect-error — three/examples/jsm re-exports
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
// @ts-expect-error — three/examples/jsm re-exports
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";
// @ts-expect-error — three/examples/jsm re-exports
import { TDSLoader } from "three/examples/jsm/loaders/TDSLoader";
// @ts-expect-error — three/examples/jsm re-exports
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader";
// @ts-expect-error — three/examples/jsm re-exports
import { AMFLoader } from "three/examples/jsm/loaders/AMFLoader";
// @ts-expect-error — three/examples/jsm re-exports
import { PCDLoader } from "three/examples/jsm/loaders/PCDLoader";
// @ts-expect-error — three/examples/jsm re-exports
import { VTKLoader } from "three/examples/jsm/loaders/VTKLoader";
// @ts-expect-error — three/examples/jsm re-exports
import { VRMLLoader } from "three/examples/jsm/loaders/VRMLLoader";
// @ts-expect-error — three/examples/jsm re-exports
import { GCodeLoader } from "three/examples/jsm/loaders/GCodeLoader";
// @ts-expect-error — three/examples/jsm re-exports
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader";
import {
  postPose3dFromVideo,
} from "../../scripts/api/apiLibraryAiVideo";
import { logger } from "../../utils/logger";
import {
  type SceneNode,
  type AnimClip,
  type TransformMode,
  type ShadingMode,
  type EditorMode,
  type PropTab,
  type AddMenuCat,
  type Pose3DSequenceResult,
  SUPPORTED_EXTENSIONS,
  pose3dToClip,
} from "./modelEditorTypes";

const log = logger.scoped("ModelEditor");

/* helpers */
let _nid = 0;
const nid = () => `n${++_nid}`;

/* ═══════════════════════════════════════════
   Hook props & return type
   ═══════════════════════════════════════════ */

export interface UseModelEditorProps {
  onSaveToLibrary?: (dataUrl: string, name: string, mimeType: string) => void;
}

export interface ModelEditorAPI {
  /* ── refs ── */
  mountRef: React.RefObject<HTMLDivElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  mergeInputRef: React.RefObject<HTMLInputElement>;
  videoInputRef: React.RefObject<HTMLInputElement>;
  rootObjectRef: React.MutableRefObject<THREE.Object3D | null>;

  /* ── state ── */
  sceneTree: SceneNode[];
  selectedId: string | null;
  transformMode: TransformMode;
  setTransformMode: React.Dispatch<React.SetStateAction<TransformMode>>;
  animations: AnimClip[];
  activeAnimIdx: number;
  isPlaying: boolean;
  animTime: number;
  animDuration: number;
  animSpeed: number;
  setAnimSpeed: React.Dispatch<React.SetStateAction<number>>;
  loopAnim: boolean;
  setLoopAnim: React.Dispatch<React.SetStateAction<boolean>>;
  bottomCollapsed: boolean;
  setBottomCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  showGrid: boolean;
  setShowGrid: React.Dispatch<React.SetStateAction<boolean>>;
  showAxes: boolean;
  setShowAxes: React.Dispatch<React.SetStateAction<boolean>>;
  wireframe: boolean;
  setWireframe: React.Dispatch<React.SetStateAction<boolean>>;
  bgColor: string;
  setBgColor: React.Dispatch<React.SetStateAction<string>>;
  statusText: string;
  dragOver: boolean;
  polyCount: number;
  meshCount: number;
  boneCount: number;
  selMaterialIdx: number;
  setSelMaterialIdx: React.Dispatch<React.SetStateAction<number>>;
  matRefresh: number;
  setMatRefresh: React.Dispatch<React.SetStateAction<number>>;
  aiStatus: string;
  aiBusy: boolean;
  shadingMode: ShadingMode;
  setShadingMode: React.Dispatch<React.SetStateAction<ShadingMode>>;
  editorMode: EditorMode;
  setEditorMode: React.Dispatch<React.SetStateAction<EditorMode>>;
  contextMenu: { x: number; y: number } | null;
  outlinerSearch: string;
  setOutlinerSearch: React.Dispatch<React.SetStateAction<string>>;
  snapEnabled: boolean;
  setSnapEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  snapGrid: number;
  setSnapGrid: React.Dispatch<React.SetStateAction<number>>;
  showSkeleton: boolean;
  setShowSkeleton: React.Dispatch<React.SetStateAction<boolean>>;
  addMenuOpen: AddMenuCat;
  setAddMenuOpen: React.Dispatch<React.SetStateAction<AddMenuCat>>;
  gizmoSpace: "local" | "world";
  setGizmoSpace: React.Dispatch<React.SetStateAction<"local" | "world">>;
  propTab: PropTab;
  setPropTab: React.Dispatch<React.SetStateAction<PropTab>>;
  fogEnabled: boolean;
  setFogEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  fogColor: string;
  setFogColor: React.Dispatch<React.SetStateAction<string>>;
  fogNear: number;
  setFogNear: React.Dispatch<React.SetStateAction<number>>;
  fogFar: number;
  setFogFar: React.Dispatch<React.SetStateAction<number>>;
  showLightHelpers: boolean;
  setShowLightHelpers: React.Dispatch<React.SetStateAction<boolean>>;

  /* ── derived ── */
  selectedNode: SceneNode | null;
  selectedMaterials: THREE.Material[];

  /* ── callbacks ── */
  rebuildTree: () => void;
  loadFile: (file: File) => Promise<void>;
  mergeAnimationFBX: (file: File) => Promise<void>;
  playClip: (index: number) => void;
  togglePlay: () => void;
  stopAnim: () => void;
  seekAnim: (t: number) => void;
  focusOnObject: (obj: THREE.Object3D) => void;
  setCameraPreset: (preset: string) => void;
  selectObject: (node: SceneNode | null) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  handleFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMergeInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAIVideo: (e: React.ChangeEvent<HTMLInputElement>) => void;
  exportGLTF: (binary: boolean) => void;
  exportOBJ: () => void;
  exportSTL: (binary: boolean) => void;
  exportPLY: (binary: boolean) => void;
  exportUSDZ: () => Promise<void>;
  clearScene: () => void;
  saveToLibrary: () => void;
  addPrimitive: (type: string) => void;
  addSceneLight: (type: string) => void;
  addCameraObject: () => void;
  addEmpty: (type: string) => void;
  handleViewportClick: (e: React.MouseEvent) => void;
  handleContextMenu: (e: React.MouseEvent) => void;
  closeContextMenu: () => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  toggleNodeVisibility: (node: SceneNode) => void;
  toggleNodeExpanded: (node: SceneNode) => void;
  setStatusText: React.Dispatch<React.SetStateAction<string>>;
}

/* ── Pure helper — extracted outside the hook for stable identity ── */
function findNodeById(
  nodes: SceneNode[],
  id: string,
): SceneNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNodeById(n.children, id);
    if (found) return found;
  }
  return null;
}

/* ═══════════════════════════════════════════
   Hook
   ═══════════════════════════════════════════ */

export function useModelEditor({
  onSaveToLibrary,
}: UseModelEditorProps): ModelEditorAPI {
  /* ── refs ── */
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene>(new THREE.Scene());
  const cameraRef = useRef<THREE.PerspectiveCamera>(
    new THREE.PerspectiveCamera(50, 1, 0.01, 10000),
  );
  const orbitRef = useRef<OrbitControls | null>(null);
  const transformRef = useRef<TransformControls | null>(null);
  const clockRef = useRef(new THREE.Clock());
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const rafRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mergeInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const skeletonHelperRef = useRef<THREE.SkeletonHelper | null>(null);

  /* ── state ── */
  const [sceneTree, setSceneTree] = useState<SceneNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transformMode, setTransformMode] = useState<TransformMode>("translate");
  const [animations, setAnimations] = useState<AnimClip[]>([]);
  const [activeAnimIdx, setActiveAnimIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animTime, setAnimTime] = useState(0);
  const [animDuration, setAnimDuration] = useState(0);
  const [animSpeed, setAnimSpeed] = useState(1);
  const [loopAnim, setLoopAnim] = useState(true);
  const [bottomCollapsed, setBottomCollapsed] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [bgColor, setBgColor] = useState("#111122");
  const [statusText, setStatusText] = useState("Ready");
  const [dragOver, setDragOver] = useState(false);
  const [polyCount, setPolyCount] = useState(0);
  const [meshCount, setMeshCount] = useState(0);
  const [boneCount, setBoneCount] = useState(0);

  // Material editor
  const [selMaterialIdx, setSelMaterialIdx] = useState(0);
  const [matRefresh, setMatRefresh] = useState(0);

  // AI panel
  const [aiStatus, setAiStatus] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  // Blender 2.0 — viewport & editor
  const [shadingMode, setShadingMode] = useState<ShadingMode>("solid");
  const [editorMode, setEditorMode] = useState<EditorMode>("object");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [outlinerSearch, setOutlinerSearch] = useState("");
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [snapGrid, setSnapGrid] = useState(1);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [addMenuOpen, setAddMenuOpen] = useState<AddMenuCat>(null);
  const [gizmoSpace, setGizmoSpace] = useState<"local" | "world">("world");
  const [propTab, setPropTab] = useState<PropTab>("object");
  const [fogEnabled, setFogEnabled] = useState(false);
  const [fogColor, setFogColor] = useState("#111122");
  const [fogNear, setFogNear] = useState(10);
  const [fogFar, setFogFar] = useState(100);
  const [showLightHelpers, setShowLightHelpers] = useState(true);

  // The root object that was loaded (mesh/character)
  const rootObjectRef = useRef<THREE.Object3D | null>(null);
  // Active animation action
  const activeActionRef = useRef<THREE.AnimationAction | null>(null);
  // All loaded animation clips (for the current model)
  const allClipsRef = useRef<AnimClip[]>([]);

  /* keep refs current */
  const animTimeRef = useRef(animTime);
  animTimeRef.current = animTime;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const animSpeedRef = useRef(animSpeed);
  animSpeedRef.current = animSpeed;
  const loopAnimRef = useRef(loopAnim);
  loopAnimRef.current = loopAnim;

  /* ─────────────────────────────────────────
     Scene setup
     ───────────────────────────────────────── */
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = sceneRef.current;
    const camera = cameraRef.current;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Camera
    camera.position.set(3, 2, 5);
    camera.lookAt(0, 0, 0);

    // Scene background
    scene.background = new THREE.Color("#111122");

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    ambientLight.name = "__ambient";
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.name = "__dirLight";
    dirLight.position.set(5, 8, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -10;
    dirLight.shadow.camera.right = 10;
    dirLight.shadow.camera.top = 10;
    dirLight.shadow.camera.bottom = -10;
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0x8888ff, 0x444422, 0.4);
    hemiLight.name = "__hemiLight";
    scene.add(hemiLight);

    // Ground plane
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.ShadowMaterial({ opacity: 0.15 }),
    );
    ground.name = "__ground";
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid
    const grid = new THREE.GridHelper(20, 20, 0x333355, 0x22223a);
    grid.name = "__grid";
    scene.add(grid);

    // Axes
    const axes = new THREE.AxesHelper(2);
    axes.name = "__axes";
    scene.add(axes);

    // Orbit controls
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.08;
    orbit.minDistance = 0.1;
    orbit.maxDistance = 500;
    orbit.target.set(0, 0.5, 0);
    orbitRef.current = orbit;

    // Transform controls
    const tc = new TransformControls(camera, renderer.domElement);
    tc.name = "__transformControls";
    tc.addEventListener("dragging-changed", (e: { value: boolean }) => {
      orbit.enabled = !e.value;
    });
    scene.add(tc);
    transformRef.current = tc;

    // Resize handler
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);
    onResize();

    // Animation loop
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      const dt = clockRef.current.getDelta();
      orbit.update();

      // Update mixer
      if (mixerRef.current && isPlayingRef.current) {
        mixerRef.current.update(dt * animSpeedRef.current);
        // Sync time state (throttled to ~15fps for React)
        const action = activeActionRef.current;
        if (action) {
          const t = action.time;
          if (Math.abs(t - animTimeRef.current) > 0.05) {
            setAnimTime(t);
          }
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      const scn = sceneRef.current;
      scn.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
        if ((obj as THREE.Mesh).material) {
          const mats = Array.isArray((obj as THREE.Mesh).material)
            ? ((obj as THREE.Mesh).material as THREE.Material[])
            : [(obj as THREE.Mesh).material as THREE.Material];
          mats.forEach((mat) => mat.dispose());
        }
      });
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
      }
      renderer.dispose();
      orbit.dispose();
      tc.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─────────────────────────────────────────
     Rebuild scene tree from Three.js scene
     ───────────────────────────────────────── */
  const rebuildTree = useCallback(() => {
    const scene = sceneRef.current;
    let polys = 0;
    let meshes = 0;
    let bones = 0;

    const walk = (obj: THREE.Object3D, depth: number): SceneNode | null => {
      if (obj.name.startsWith("__")) return null;
      if (obj.type === "TransformControlsPlane" || obj.type === "TransformControlsGizmo") return null;
      if ("isTransformControls" in obj) return null;

      let nodeType: SceneNode["type"] = "group";
      if (obj instanceof THREE.Mesh) {
        nodeType = "mesh";
        meshes++;
        const geo = obj.geometry;
        if (geo) {
          const idx = geo.index;
          polys += idx ? idx.count / 3 : (geo.attributes.position?.count ?? 0) / 3;
        }
      } else if (obj instanceof THREE.Bone) {
        nodeType = "bone";
        bones++;
      } else if (obj instanceof THREE.Light) {
        nodeType = "light";
      } else if (obj instanceof THREE.Camera) {
        nodeType = "camera";
      } else if (
        obj instanceof THREE.GridHelper ||
        obj instanceof THREE.AxesHelper
      ) {
        nodeType = "helper";
      }

      const children: SceneNode[] = [];
      for (const c of obj.children) {
        const cn = walk(c, depth + 1);
        if (cn) children.push(cn);
      }

      return {
        id: (obj.userData.__nodeId as string) || ((obj.userData.__nodeId = nid()), obj.userData.__nodeId),
        name: obj.name || obj.type,
        type: nodeType,
        object: obj,
        children,
        expanded: depth < 2,
        visible: obj.visible,
      };
    };

    const roots: SceneNode[] = [];
    for (const c of scene.children) {
      const n = walk(c, 0);
      if (n) roots.push(n);
    }

    setSceneTree(roots);
    setPolyCount(Math.round(polys));
    setMeshCount(meshes);
    setBoneCount(bones);
  }, []);

  /* ─────────────────────────────────────────
     File loading
     ───────────────────────────────────────── */
  const playClipRef = useRef<(index: number) => void>(() => {});
  const focusOnObjectRef = useRef<(obj: THREE.Object3D) => void>(() => {});

  const addObjectToScene = useCallback(
    (obj: THREE.Object3D, clips: THREE.AnimationClip[], filename: string) => {
      const scene = sceneRef.current;

      obj.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      const box = new THREE.Box3().setFromObject(obj);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0.01) {
        const targetSize = 3;
        const scale = targetSize / maxDim;
        if (scale < 0.5 || scale > 2) {
          obj.scale.multiplyScalar(scale);
        }
      }

      const box2 = new THREE.Box3().setFromObject(obj);
      const center = box2.getCenter(new THREE.Vector3());
      obj.position.sub(center);
      obj.position.y += box2.getSize(new THREE.Vector3()).y / 2;

      obj.name = obj.name || filename;
      scene.add(obj);
      rootObjectRef.current = obj;

      if (clips.length > 0) {
        const mixer = new THREE.AnimationMixer(obj);
        mixerRef.current = mixer;
        const newAnims: AnimClip[] = clips.map((c) => ({
          name: c.name || "Animation",
          clip: c,
          duration: c.duration,
          source: filename,
        }));
        allClipsRef.current = [...allClipsRef.current, ...newAnims];
        setAnimations([...allClipsRef.current]);
        if (allClipsRef.current.length > 0) {
          playClipRef.current(0);
        }
      } else if (!mixerRef.current && rootObjectRef.current) {
        mixerRef.current = new THREE.AnimationMixer(rootObjectRef.current);
      }

      focusOnObjectRef.current(obj);
      rebuildTree();
      setStatusText(`Loaded: ${filename} (${clips.length} animation(s))`);
    },
    [rebuildTree],
  );

  const loadFile = useCallback(
    async (file: File) => {
      const name = file.name.toLowerCase();
      const ext = "." + name.split(".").pop();
      const url = URL.createObjectURL(file);

      setStatusText(`Loading ${file.name}...`);

      try {
        if (ext === ".fbx") {
          const loader = new FBXLoader();
          const obj: THREE.Group = await new Promise((res, rej) =>
            loader.load(url, res, undefined, rej),
          );
          addObjectToScene(obj, obj.animations ?? [], file.name);
        } else if (ext === ".glb" || ext === ".gltf") {
          const loader = new GLTFLoader();
          const gltf = await new Promise<{ scene: THREE.Group; animations: THREE.AnimationClip[] }>((res, rej) =>
            loader.load(url, res, undefined, rej),
          );
          addObjectToScene(gltf.scene, gltf.animations ?? [], file.name);
        } else if (ext === ".obj") {
          const loader = new OBJLoader();
          const obj: THREE.Group = await new Promise((res, rej) =>
            loader.load(url, res, undefined, rej),
          );
          addObjectToScene(obj, [], file.name);
        } else if (ext === ".dae") {
          const loader = new ColladaLoader();
          const collada = await new Promise<{ scene: THREE.Group }>((res, rej) =>
            loader.load(url, res, undefined, rej),
          );
          addObjectToScene(collada.scene, collada.scene?.animations ?? [], file.name);
        } else if (ext === ".stl") {
          const loader = new STLLoader();
          const geo = await new Promise<THREE.BufferGeometry>((res, rej) =>
            loader.load(url, res, undefined, rej),
          );
          const mat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.3, roughness: 0.6 });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.name = file.name;
          addObjectToScene(mesh, [], file.name);
        } else if (ext === ".ply") {
          const loader = new PLYLoader();
          const geo = await new Promise<THREE.BufferGeometry>((res, rej) =>
            loader.load(url, res, undefined, rej),
          );
          geo.computeVertexNormals();
          const mat = new THREE.MeshStandardMaterial({ color: 0x888888, vertexColors: geo.hasAttribute("color") });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.name = file.name;
          addObjectToScene(mesh, [], file.name);
        } else if (ext === ".3ds") {
          const loader = new TDSLoader();
          const obj: THREE.Group = await new Promise((res, rej) =>
            loader.load(url, res, undefined, rej),
          );
          addObjectToScene(obj, [], file.name);
        } else if (ext === ".3mf") {
          const loader = new ThreeMFLoader();
          const obj: THREE.Group = await new Promise((res, rej) =>
            loader.load(url, res, undefined, rej),
          );
          addObjectToScene(obj, [], file.name);
        } else if (ext === ".amf") {
          const loader = new AMFLoader();
          const obj: THREE.Group = await new Promise((res, rej) =>
            loader.load(url, res, undefined, rej),
          );
          addObjectToScene(obj, [], file.name);
        } else if (ext === ".pcd") {
          const loader = new PCDLoader();
          const points: THREE.Points = await new Promise((res, rej) =>
            loader.load(url, res, undefined, rej),
          );
          points.name = file.name;
          addObjectToScene(points, [], file.name);
        } else if (ext === ".vtk" || ext === ".vtp") {
          const loader = new VTKLoader();
          const geo = await new Promise<THREE.BufferGeometry>((res, rej) =>
            loader.load(url, res, undefined, rej),
          );
          geo.computeVertexNormals();
          const mat = new THREE.MeshStandardMaterial({ color: 0x888888, side: THREE.DoubleSide });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.name = file.name;
          addObjectToScene(mesh, [], file.name);
        } else if (ext === ".wrl" || ext === ".vrml") {
          const loader = new VRMLLoader();
          const scn: THREE.Scene = await new Promise((res, rej) =>
            loader.load(url, res, undefined, rej),
          );
          const group = new THREE.Group();
          group.name = file.name;
          while (scn.children.length) group.add(scn.children[0]);
          addObjectToScene(group, [], file.name);
        } else if (ext === ".gcode") {
          const loader = new GCodeLoader();
          const obj: THREE.Group = await new Promise((res, rej) =>
            loader.load(url, res, undefined, rej),
          );
          addObjectToScene(obj, [], file.name);
        } else if (ext === ".svg") {
          const loader = new SVGLoader();
          const data = await new Promise<{ paths: { color?: number }[] }>((res, rej) =>
            loader.load(url, res, undefined, rej),
          );
          const group = new THREE.Group();
          group.name = file.name;
          for (const path of data.paths) {
            const shapes2 = SVGLoader.createShapes(path);
            for (const shape of shapes2) {
              const geo = new THREE.ExtrudeGeometry(shape, { depth: 2, bevelEnabled: false });
              const mat = new THREE.MeshStandardMaterial({ color: path.color || 0x888888, side: THREE.DoubleSide });
              const mesh = new THREE.Mesh(geo, mat);
              group.add(mesh);
            }
          }
          group.scale.set(0.01, -0.01, 0.01);
          addObjectToScene(group, [], file.name);
        } else {
          setStatusText(`Unsupported format: ${ext}`);
        }
      } catch (err) {
        log.error("Load error:", err);
        setStatusText(`Error loading ${file.name}: ${String(err)}`);
      } finally {
        URL.revokeObjectURL(url);
      }
    },
    [addObjectToScene],
  );

  const mergeAnimationFBX = useCallback(
    async (file: File) => {
      const url = URL.createObjectURL(file);
      setStatusText(`Merging animations from ${file.name}...`);
      try {
        const loader = new FBXLoader();
        const obj: THREE.Group = await new Promise((res, rej) =>
          loader.load(url, res, undefined, rej),
        );
        const clips = obj.animations ?? [];
        if (clips.length === 0) {
          setStatusText(`No animations found in ${file.name}`);
          return;
        }
        const root = rootObjectRef.current;
        if (!root) {
          setStatusText("No model loaded — load a base model first");
          return;
        }
        if (!mixerRef.current) {
          mixerRef.current = new THREE.AnimationMixer(root);
        }
        const newAnims: AnimClip[] = clips.map((c) => ({
          name: c.name || file.name.replace(/\.[^.]+$/, ""),
          clip: c,
          duration: c.duration,
          source: file.name,
        }));
        allClipsRef.current = [...allClipsRef.current, ...newAnims];
        setAnimations([...allClipsRef.current]);
        setStatusText(`Merged ${clips.length} animation(s) from ${file.name}`);
      } catch (err) {
        log.error("Merge error:", err);
        setStatusText(`Error merging ${file.name}: ${String(err)}`);
      } finally {
        URL.revokeObjectURL(url);
      }
    },
    [],
  );

  /* ─────────────────────────────────────────
     Animation controls
     ───────────────────────────────────────── */
  const playClip = useCallback((index: number) => {
    const mixer = mixerRef.current;
    if (!mixer || index < 0 || index >= allClipsRef.current.length) return;

    if (activeActionRef.current) {
      activeActionRef.current.stop();
    }

    const anim = allClipsRef.current[index];
    const action = mixer.clipAction(anim.clip);
    action.reset();
    action.setLoop(loopAnimRef.current ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    action.clampWhenFinished = !loopAnimRef.current;
    action.play();
    activeActionRef.current = action;
    setActiveAnimIdx(index);
    setAnimDuration(anim.duration);
    setAnimTime(0);
    setIsPlaying(true);
  }, []);
  playClipRef.current = playClip;

  const togglePlay = useCallback(() => {
    if (activeAnimIdx < 0 && allClipsRef.current.length > 0) {
      playClip(0);
      return;
    }
    const action = activeActionRef.current;
    if (!action) return;
    if (isPlayingRef.current) {
      action.paused = true;
      setIsPlaying(false);
    } else {
      action.paused = false;
      setIsPlaying(true);
    }
  }, [activeAnimIdx, playClip]);

  const stopAnim = useCallback(() => {
    const action = activeActionRef.current;
    if (action) {
      action.stop();
      action.reset();
    }
    setIsPlaying(false);
    setAnimTime(0);
  }, []);

  const seekAnim = useCallback((t: number) => {
    const action = activeActionRef.current;
    if (!action) return;
    action.time = t;
    action.paused = true;
    setAnimTime(t);
    setIsPlaying(false);
    mixerRef.current?.update(0);
  }, []);

  /* ─────────────────────────────────────────
     Camera helpers
     ───────────────────────────────────────── */
  const focusOnObject = useCallback((obj: THREE.Object3D) => {
    const box = new THREE.Box3().setFromObject(obj);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const dist = maxDim * 2;
    const orbit = orbitRef.current;
    if (orbit) {
      orbit.target.copy(center);
      cameraRef.current.position.copy(
        center.clone().add(new THREE.Vector3(dist * 0.6, dist * 0.4, dist * 0.8)),
      );
      orbit.update();
    }
  }, []);
  focusOnObjectRef.current = focusOnObject;

  const setCameraPreset = useCallback((preset: string) => {
    const orbit = orbitRef.current;
    if (!orbit) return;
    const target = orbit.target.clone();
    const d = cameraRef.current.position.distanceTo(target);
    const pos = new THREE.Vector3();

    switch (preset) {
      case "front":  pos.set(0, 0, d); break;
      case "back":   pos.set(0, 0, -d); break;
      case "left":   pos.set(-d, 0, 0); break;
      case "right":  pos.set(d, 0, 0); break;
      case "top":    pos.set(0, d, 0.001); break;
      case "bottom": pos.set(0, -d, 0.001); break;
      default: return;
    }
    cameraRef.current.position.copy(target.clone().add(pos));
    orbit.update();
  }, []);

  /* ─────────────────────────────────────────
     Selection & transform
     ───────────────────────────────────────── */
  const selectObject = useCallback(
    (node: SceneNode | null) => {
      setSelectedId(node?.id ?? null);
      const tc = transformRef.current;
      if (!tc) return;
      if (node && node.type !== "helper") {
        tc.attach(node.object);
        tc.setMode(transformMode);
      } else {
        tc.detach();
      }
    },
    [transformMode],
  );

  useEffect(() => {
    transformRef.current?.setMode(transformMode);
  }, [transformMode]);

  /* ─────────────────────────────────────────
     Toggle helpers
     ───────────────────────────────────────── */
  useEffect(() => {
    const scene = sceneRef.current;
    const grid = scene.getObjectByName("__grid");
    if (grid) grid.visible = showGrid;
  }, [showGrid]);

  useEffect(() => {
    const scene = sceneRef.current;
    const axes = scene.getObjectByName("__axes");
    if (axes) axes.visible = showAxes;
  }, [showAxes]);

  useEffect(() => {
    sceneRef.current.background = new THREE.Color(bgColor);
  }, [bgColor]);

  useEffect(() => {
    const root = rootObjectRef.current;
    if (!root) return;
    root.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        const mats = Array.isArray(child.material)
          ? child.material
          : [child.material];
        mats.forEach((m: THREE.Material) => {
          if ("wireframe" in m) (m as THREE.MeshStandardMaterial).wireframe = wireframe;
        });
      }
    });
  }, [wireframe]);

  /* ─────────────────────────────────────────
     Viewport shading mode
     ───────────────────────────────────────── */
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    const scene = sceneRef.current;

    switch (shadingMode) {
      case "wireframe":
        scene.traverse((obj: THREE.Object3D) => {
          if (obj instanceof THREE.Mesh && !obj.name.startsWith("__")) {
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((m: THREE.Material) => { if ("wireframe" in m) (m as THREE.MeshStandardMaterial).wireframe = true; });
          }
        });
        renderer.toneMapping = THREE.NoToneMapping;
        renderer.toneMappingExposure = 1;
        break;
      case "solid":
        scene.traverse((obj: THREE.Object3D) => {
          if (obj instanceof THREE.Mesh && !obj.name.startsWith("__")) {
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((m: THREE.Material) => { if ("wireframe" in m) (m as THREE.MeshStandardMaterial).wireframe = false; });
          }
        });
        renderer.toneMapping = THREE.NoToneMapping;
        renderer.toneMappingExposure = 1;
        break;
      case "material":
        scene.traverse((obj: THREE.Object3D) => {
          if (obj instanceof THREE.Mesh && !obj.name.startsWith("__")) {
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((m: THREE.Material) => { if ("wireframe" in m) (m as THREE.MeshStandardMaterial).wireframe = false; });
          }
        });
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        break;
      case "rendered":
        scene.traverse((obj: THREE.Object3D) => {
          if (obj instanceof THREE.Mesh && !obj.name.startsWith("__")) {
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((m: THREE.Material) => { if ("wireframe" in m) (m as THREE.MeshStandardMaterial).wireframe = false; });
          }
        });
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.5;
        break;
    }
  }, [shadingMode]);

  /* Gizmo space */
  useEffect(() => {
    transformRef.current?.setSpace(gizmoSpace);
  }, [gizmoSpace]);

  /* Snap settings */
  useEffect(() => {
    const tc = transformRef.current;
    if (!tc) return;
    if (snapEnabled) {
      tc.setTranslationSnap(snapGrid);
      tc.setRotationSnap(THREE.MathUtils.degToRad(15));
      tc.setScaleSnap(0.25);
    } else {
      tc.setTranslationSnap(null);
      tc.setRotationSnap(null);
      tc.setScaleSnap(null);
    }
  }, [snapEnabled, snapGrid]);

  /* Skeleton helper */
  useEffect(() => {
    const scene = sceneRef.current;
    if (skeletonHelperRef.current) {
      scene.remove(skeletonHelperRef.current);
      skeletonHelperRef.current = null;
    }
    if (!showSkeleton || !rootObjectRef.current) return;

    let hasRig = false;
    rootObjectRef.current.traverse((obj: THREE.Object3D) => {
      if (obj instanceof THREE.SkinnedMesh) hasRig = true;
    });

    if (hasRig) {
      const helper = new THREE.SkeletonHelper(rootObjectRef.current);
      helper.name = "__skeletonHelper";
      scene.add(helper);
      skeletonHelperRef.current = helper;
    }
  }, [showSkeleton, sceneTree]);

  /* Fog */
  useEffect(() => {
    if (fogEnabled) {
      sceneRef.current.fog = new THREE.Fog(fogColor, fogNear, fogFar);
    } else {
      sceneRef.current.fog = null;
    }
  }, [fogEnabled, fogColor, fogNear, fogFar]);

  /* Light helpers visibility */
  useEffect(() => {
    sceneRef.current.traverse((obj: THREE.Object3D) => {
      if (obj.name.startsWith("__helper_")) {
        obj.visible = showLightHelpers;
      }
    });
  }, [showLightHelpers, sceneTree]);

  /* ─────────────────────────────────────────
     Drag-and-drop
     ───────────────────────────────────────── */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      files.forEach((f) => {
        const ext = "." + f.name.toLowerCase().split(".").pop();
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          loadFile(f);
        }
      });
    },
    [loadFile],
  );

  /* ─────────────────────────────────────────
     Helpers
     ───────────────────────────────────────── */

  const selectedNode = useMemo(
    () => (selectedId ? findNodeById(sceneTree, selectedId) : null),
    [selectedId, sceneTree],
  );

  const selectedMaterials = useMemo((): THREE.Material[] => {
    void matRefresh;
    if (!selectedNode || !(selectedNode.object instanceof THREE.Mesh))
      return [];
    const m = selectedNode.object.material;
    return Array.isArray(m) ? m : [m];
  }, [selectedNode, matRefresh]);

  const deleteSelected = useCallback(() => {
    if (!selectedNode) return;
    selectedNode.object.removeFromParent();
    transformRef.current?.detach();
    setSelectedId(null);
    rebuildTree();
  }, [selectedNode, rebuildTree]);

  const duplicateSelected = useCallback(() => {
    if (!selectedNode) return;
    const clone = selectedNode.object.clone(true);
    clone.name = selectedNode.object.name + ".001";
    clone.position.x += 1;
    sceneRef.current.add(clone);
    rebuildTree();
    setStatusText(`Duplicated ${selectedNode.name}`);
  }, [selectedNode, rebuildTree]);

  /* ─────────────────────────────────────────
     Keyboard shortcuts
     ───────────────────────────────────────── */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      switch (e.key.toLowerCase()) {
        case "g": setTransformMode("translate"); break;
        case "r": setTransformMode("rotate"); break;
        case "s": if (!e.ctrlKey) setTransformMode("scale"); break;
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "f":
          if (rootObjectRef.current) focusOnObject(rootObjectRef.current);
          break;
        case "delete":
          if (selectedId) {
            const sel = findNodeById(sceneTree, selectedId);
            if (sel) {
              sel.object.removeFromParent();
              transformRef.current?.detach();
              setSelectedId(null);
              rebuildTree();
            }
          }
          break;
        case "x":
          if (e.ctrlKey && selectedId) {
            const sel = findNodeById(sceneTree, selectedId);
            if (sel) {
              sel.object.removeFromParent();
              transformRef.current?.detach();
              setSelectedId(null);
              rebuildTree();
            }
          }
          break;
        case "d":
          if (e.shiftKey) {
            e.preventDefault();
            duplicateSelected();
          }
          break;
        case "tab":
          e.preventDefault();
          setEditorMode((m) =>
            m === "object" ? "edit" : m === "edit" ? "pose" : "object",
          );
          break;
        case "n":
          if (!e.ctrlKey) {
            // N-panel toggle could go here
          }
          break;
        case "1": if (e.code.startsWith("Numpad")) setCameraPreset("front"); break;
        case "3": if (e.code.startsWith("Numpad")) setCameraPreset("right"); break;
        case "7": if (e.code.startsWith("Numpad")) setCameraPreset("top"); break;
        case "4": if (e.code.startsWith("Numpad")) setCameraPreset("left"); break;
        case "6": if (e.code.startsWith("Numpad")) setCameraPreset("right"); break;
        case "9": if (e.code.startsWith("Numpad")) setCameraPreset("back"); break;
        case "2": if (e.code.startsWith("Numpad")) setCameraPreset("bottom"); break;
      }

      if (e.key === "Escape") {
        setAddMenuOpen(null);
        setContextMenu(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [
    togglePlay,
    focusOnObject,
    selectedId,
    sceneTree,
    rebuildTree,
    setCameraPreset,
    duplicateSelected,
  ]);

  /* ─────────────────────────────────────────
     File input handlers
     ───────────────────────────────────────── */
  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      Array.from(files).forEach(loadFile);
      e.target.value = "";
    },
    [loadFile],
  );

  const handleMergeInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      Array.from(files).forEach(mergeAnimationFBX);
      e.target.value = "";
    },
    [mergeAnimationFBX],
  );

  /* ─────────────────────────────────────────
     Export functions
     ───────────────────────────────────────── */
  const exportGLTF = useCallback(
    (binary: boolean) => {
      const root = rootObjectRef.current;
      if (!root) { setStatusText("Nothing to export"); return; }
      const exporter = new GLTFExporter();
      const options: Record<string, unknown> = { binary, animations: allClipsRef.current.map((a) => a.clip) };
      exporter.parse(
        root,
        (result: ArrayBuffer | object) => {
          let blob: Blob;
          if (binary) {
            blob = new Blob([result as ArrayBuffer], { type: "application/octet-stream" });
          } else {
            blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
          }
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `export.${binary ? "glb" : "gltf"}`;
          a.click();
          URL.revokeObjectURL(a.href);
          setStatusText(`Exported ${binary ? "GLB" : "GLTF"} successfully`);
        },
        (err: unknown) => {
          log.error("Export error:", err);
          setStatusText(`Export error: ${String(err)}`);
        },
        options,
      );
    },
    [],
  );

  const exportOBJ = useCallback(() => {
    const root = rootObjectRef.current;
    if (!root) { setStatusText("Nothing to export"); return; }
    const exporter = new OBJExporter();
    const result = exporter.parse(root);
    const blob = new Blob([result], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "export.obj";
    a.click();
    URL.revokeObjectURL(a.href);
    setStatusText("Exported OBJ successfully");
  }, []);

  const exportSTL = useCallback((binary: boolean) => {
    const root = rootObjectRef.current;
    if (!root) { setStatusText("Nothing to export"); return; }
    const exporter = new STLExporter();
    const result = exporter.parse(root, { binary });
    let blob: Blob;
    if (binary) {
      blob = new Blob([result], { type: "application/octet-stream" });
    } else {
      blob = new Blob([result], { type: "text/plain" });
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "export.stl";
    a.click();
    URL.revokeObjectURL(a.href);
    setStatusText(`Exported STL${binary ? " (binary)" : ""} successfully`);
  }, []);

  const exportPLY = useCallback((binary: boolean) => {
    const root = rootObjectRef.current;
    if (!root) { setStatusText("Nothing to export"); return; }
    const exporter = new PLYExporter();
    exporter.parse(root, (result: string | DataView) => {
      let blob: Blob;
      if (binary) {
        blob = new Blob([result], { type: "application/octet-stream" });
      } else {
        blob = new Blob([result], { type: "text/plain" });
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "export.ply";
      a.click();
      URL.revokeObjectURL(a.href);
      setStatusText(`Exported PLY${binary ? " (binary)" : ""} successfully`);
    }, { binary });
  }, []);

  const exportUSDZ = useCallback(async () => {
    const root = rootObjectRef.current;
    if (!root) { setStatusText("Nothing to export"); return; }
    try {
      const exporter = new USDZExporter();
      const result = await exporter.parse(root);
      const blob = new Blob([result], { type: "application/octet-stream" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "export.usdz";
      a.click();
      URL.revokeObjectURL(a.href);
      setStatusText("Exported USDZ successfully");
    } catch (err: unknown) {
      log.error("USDZ export error:", err);
      setStatusText(`USDZ export error: ${String(err)}`);
    }
  }, []);

  /* ─────────────────────────────────────────
     Dispose & clear
     ───────────────────────────────────────── */
  const disposeObject = useCallback((obj: THREE.Object3D) => {
    obj.traverse((child) => {
      if ((child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.dispose();
      }
      if ((child as THREE.Mesh).material) {
        const mats = Array.isArray((child as THREE.Mesh).material)
          ? ((child as THREE.Mesh).material as THREE.Material[])
          : [(child as THREE.Mesh).material as THREE.Material];
        mats.forEach((mat) => {
          const m = mat as unknown as Record<string, { dispose?: () => void } | undefined>;
          ["map", "normalMap", "roughnessMap", "metalnessMap", "emissiveMap", "aoMap", "alphaMap", "envMap", "lightMap", "bumpMap", "displacementMap", "specularMap"].forEach((prop) => {
            if (m[prop] && typeof m[prop].dispose === "function") m[prop].dispose();
          });
          mat.dispose();
        });
      }
    });
  }, []);

  const clearScene = useCallback(() => {
    if (!window.confirm("Clear the entire scene? This cannot be undone.")) return;
    const scene = sceneRef.current;
    const toRemove: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if (!obj.name.startsWith("__") && obj !== scene && obj.parent === scene) {
        toRemove.push(obj);
      }
    });
    toRemove.forEach((o) => {
      disposeObject(o);
      scene.remove(o);
    });

    if (mixerRef.current) {
      mixerRef.current.stopAllAction();
      if (rootObjectRef.current) {
        mixerRef.current.uncacheRoot(rootObjectRef.current);
      }
    }

    transformRef.current?.detach();
    rootObjectRef.current = null;
    mixerRef.current = null;
    activeActionRef.current = null;
    allClipsRef.current = [];
    setAnimations([]);
    setActiveAnimIdx(-1);
    setIsPlaying(false);
    setAnimTime(0);
    setAnimDuration(0);
    setSelectedId(null);
    rebuildTree();
    setStatusText("Scene cleared");
  }, [rebuildTree, disposeObject]);

  /* ─────────────────────────────────────────
     Save to Library
     ───────────────────────────────────────── */
  const saveToLibrary = useCallback(() => {
    if (!onSaveToLibrary) return;
    const root = rootObjectRef.current;
    if (!root) { setStatusText("Nothing to save"); return; }
    const exporter = new GLTFExporter();
    exporter.parse(
      root,
      (result: ArrayBuffer | object) => {
        const blob = new Blob([result as ArrayBuffer], { type: "model/gltf-binary" });
        const reader = new FileReader();
        reader.onload = () => {
          const defaultName = "model.glb";
          const name = window.prompt("Save to library as:", defaultName);
          if (!name || !name.trim()) return;
          onSaveToLibrary(reader.result as string, name.trim(), "model/gltf-binary");
        };
        reader.readAsDataURL(blob);
      },
      (err: unknown) => {
        log.error("Save to library error:", err);
        setStatusText(`Save error: ${String(err)}`);
      },
      { binary: true, animations: allClipsRef.current.map((a) => a.clip) },
    );
  }, [onSaveToLibrary]);

  /* ─────────────────────────────────────────
     Add Mesh / Light / Camera / Empty
     ───────────────────────────────────────── */
  const addPrimitive = useCallback(
    (type: string) => {
      let geo: THREE.BufferGeometry;
      switch (type) {
        case "cube": geo = new THREE.BoxGeometry(1, 1, 1); break;
        case "sphere": geo = new THREE.SphereGeometry(0.5, 32, 32); break;
        case "cylinder": geo = new THREE.CylinderGeometry(0.5, 0.5, 1, 32); break;
        case "cone": geo = new THREE.ConeGeometry(0.5, 1, 32); break;
        case "torus": geo = new THREE.TorusGeometry(0.5, 0.2, 16, 32); break;
        case "plane": geo = new THREE.PlaneGeometry(2, 2); break;
        case "circle": geo = new THREE.CircleGeometry(0.5, 32); break;
        case "ring": geo = new THREE.RingGeometry(0.3, 0.5, 32); break;
        case "dodecahedron": geo = new THREE.DodecahedronGeometry(0.5); break;
        case "icosahedron": geo = new THREE.IcosahedronGeometry(0.5); break;
        case "octahedron": geo = new THREE.OctahedronGeometry(0.5); break;
        case "tetrahedron": geo = new THREE.TetrahedronGeometry(0.5); break;
        case "torusKnot": geo = new THREE.TorusKnotGeometry(0.4, 0.15, 64, 16); break;
        default: return;
      }
      const mat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.1, roughness: 0.7 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = type.charAt(0).toUpperCase() + type.slice(1);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (type === "plane" || type === "circle") {
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = 0.001;
      } else {
        mesh.position.y = 0.5;
      }
      sceneRef.current.add(mesh);
      rebuildTree();
      setStatusText(`Added ${mesh.name}`);
      setAddMenuOpen(null);
    },
    [rebuildTree],
  );

  const addSceneLight = useCallback(
    (type: string) => {
      let light: THREE.Light;
      switch (type) {
        case "point": {
          const l = new THREE.PointLight(0xffffff, 1, 20);
          l.position.set(0, 3, 0);
          l.castShadow = true;
          light = l; break;
        }
        case "spot": {
          const l = new THREE.SpotLight(0xffffff, 1, 20, Math.PI / 6, 0.3);
          l.position.set(0, 4, 2);
          l.castShadow = true;
          light = l; break;
        }
        case "directional": {
          const l = new THREE.DirectionalLight(0xffffff, 1);
          l.position.set(3, 5, 3);
          l.castShadow = true;
          light = l; break;
        }
        case "hemisphere": {
          light = new THREE.HemisphereLight(0x8888ff, 0x442200, 0.5);
          break;
        }
        default: return;
      }
      light.name = type.charAt(0).toUpperCase() + type.slice(1) + "Light";
      sceneRef.current.add(light);
      let helper: THREE.Object3D | null = null;
      if (light instanceof THREE.PointLight) {
        helper = new THREE.PointLightHelper(light, 0.3);
      } else if (light instanceof THREE.SpotLight) {
        helper = new THREE.SpotLightHelper(light);
      } else if (light instanceof THREE.DirectionalLight) {
        helper = new THREE.DirectionalLightHelper(light, 0.5);
      } else if (light instanceof THREE.HemisphereLight) {
        helper = new THREE.HemisphereLightHelper(light, 0.3);
      }
      if (helper) {
        helper.name = `__helper_${light.name}`;
        sceneRef.current.add(helper);
      }
      rebuildTree();
      setStatusText(`Added ${light.name}`);
      setAddMenuOpen(null);
    },
    [rebuildTree],
  );

  const addCameraObject = useCallback(() => {
    const cam = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 1000);
    cam.name = "Camera";
    cam.position.set(5, 3, 5);
    cam.lookAt(0, 0, 0);
    sceneRef.current.add(cam);
    const helper = new THREE.CameraHelper(cam);
    helper.name = "__helper_Camera";
    sceneRef.current.add(helper);
    rebuildTree();
    setStatusText("Added Camera");
    setAddMenuOpen(null);
  }, [rebuildTree]);

  const addEmpty = useCallback(
    (type: string) => {
      const obj = new THREE.Object3D();
      obj.name = type === "arrows" ? "Empty_Arrows" : type === "cube_empty" ? "Empty_Cube" : "Empty";
      sceneRef.current.add(obj);
      if (type === "arrows") {
        const h = new THREE.AxesHelper(0.5);
        h.name = "__emptyAxes";
        obj.add(h);
      }
      rebuildTree();
      setStatusText(`Added ${obj.name}`);
      setAddMenuOpen(null);
    },
    [rebuildTree],
  );

  /* ─────────────────────────────────────────
     Raycaster click-to-select
     ───────────────────────────────────────── */
  const handleViewportClick = useCallback(
    (e: React.MouseEvent) => {
      if (editorMode !== "object") return;
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      if ((e.target as HTMLElement) !== rendererRef.current.domElement) return;
      const rect = mountRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);
      const meshes: THREE.Object3D[] = [];
      sceneRef.current.traverse((obj: THREE.Object3D) => {
        if (obj instanceof THREE.Mesh && !obj.name.startsWith("__")) meshes.push(obj);
      });
      const intersects = raycasterRef.current.intersectObjects(meshes, false);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const nodeId = hit.userData.__nodeId as string;
        if (nodeId) {
          const node = findNodeById(sceneTree, nodeId);
          if (node) { selectObject(node); return; }
        }
        rebuildTree();
      } else {
        selectObject(null);
      }
    },
    [editorMode, sceneTree, selectObject, rebuildTree],
  );

  /* ─────────────────────────────────────────
     Context menu
     ───────────────────────────────────────── */
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [contextMenu]);

  /* ─────────────────────────────────────────
     AI animation from video
     ───────────────────────────────────────── */
  const handleAIVideo = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";

      setAiBusy(true);
      setAiStatus("Uploading video for AI pose estimation...");
      try {
        const result: Pose3DSequenceResult = await postPose3dFromVideo(file);
        setAiStatus(`Got ${result.frame_count} frames at ${result.fps} fps. Creating animation clip...`);
        const clip = pose3dToClip(result);
        if (clip && rootObjectRef.current) {
          if (!mixerRef.current) {
            mixerRef.current = new THREE.AnimationMixer(rootObjectRef.current);
          }
          const newAnim: AnimClip = {
            name: `AI: ${file.name}`,
            clip,
            duration: clip.duration,
            source: file.name,
          };
          allClipsRef.current = [...allClipsRef.current, newAnim];
          setAnimations([...allClipsRef.current]);
          playClip(allClipsRef.current.length - 1);
          setAiStatus("Animation created successfully!");
        } else {
          setAiStatus("Could not create animation — load a rigged model first.");
        }
      } catch (err) {
        log.error("AI pose error:", err);
        setAiStatus(`Error: ${String(err)}`);
      } finally {
        setAiBusy(false);
      }
    },
    [playClip],
  );

  /* ─────────────────────────────────────────
     Node helpers
     ───────────────────────────────────────── */
  const toggleNodeVisibility = useCallback(
    (node: SceneNode) => {
      node.object.visible = !node.object.visible;
      rebuildTree();
    },
    [rebuildTree],
  );

  const toggleNodeExpanded = useCallback(
    (node: SceneNode) => {
      node.expanded = !node.expanded;
      setSceneTree((prev) => [...prev]);
    },
    [],
  );

  /* ═══════════════════════════════════════════
     Return API
     ═══════════════════════════════════════════ */
  return {
    // refs
    mountRef,
    fileInputRef,
    mergeInputRef,
    videoInputRef,
    rootObjectRef,

    // state
    sceneTree,
    selectedId,
    transformMode,
    setTransformMode,
    animations,
    activeAnimIdx,
    isPlaying,
    animTime,
    animDuration,
    animSpeed,
    setAnimSpeed,
    loopAnim,
    setLoopAnim,
    bottomCollapsed,
    setBottomCollapsed,
    showGrid,
    setShowGrid,
    showAxes,
    setShowAxes,
    wireframe,
    setWireframe,
    bgColor,
    setBgColor,
    statusText,
    dragOver,
    polyCount,
    meshCount,
    boneCount,
    selMaterialIdx,
    setSelMaterialIdx,
    matRefresh,
    setMatRefresh,
    aiStatus,
    aiBusy,
    shadingMode,
    setShadingMode,
    editorMode,
    setEditorMode,
    contextMenu,
    outlinerSearch,
    setOutlinerSearch,
    snapEnabled,
    setSnapEnabled,
    snapGrid,
    setSnapGrid,
    showSkeleton,
    setShowSkeleton,
    addMenuOpen,
    setAddMenuOpen,
    gizmoSpace,
    setGizmoSpace,
    propTab,
    setPropTab,
    fogEnabled,
    setFogEnabled,
    fogColor,
    setFogColor,
    fogNear,
    setFogNear,
    fogFar,
    setFogFar,
    showLightHelpers,
    setShowLightHelpers,

    // derived
    selectedNode,
    selectedMaterials,

    // callbacks
    rebuildTree,
    loadFile,
    mergeAnimationFBX,
    playClip,
    togglePlay,
    stopAnim,
    seekAnim,
    focusOnObject,
    setCameraPreset,
    selectObject,
    deleteSelected,
    duplicateSelected,
    handleFileInput,
    handleMergeInput,
    handleAIVideo,
    exportGLTF,
    exportOBJ,
    exportSTL,
    exportPLY,
    exportUSDZ,
    clearScene,
    saveToLibrary,
    addPrimitive,
    addSceneLight,
    addCameraObject,
    addEmpty,
    handleViewportClick,
    handleContextMenu,
    closeContextMenu,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    toggleNodeVisibility,
    toggleNodeExpanded,
    setStatusText,
  };
}
