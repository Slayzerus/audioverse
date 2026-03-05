/**
 * sceneSetup.ts — Three.js scene, camera, lighting, renderer.
 *
 * Top-down camera with slight perspective tilt so building height is visible.
 * Camera is 30% closer than default (CAMERA_ZOOM_30).
 * Post-apocalyptic atmosphere: warm directional light, fog, ambient.
 */
import * as THREE from 'three'
import { CAMERA_HEIGHT, CAMERA_ANGLE, CAMERA_ZOOM_30, SKY_COLOR } from './constants'

export interface SceneContext {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  dirLight: THREE.DirectionalLight
  ambientLight: THREE.AmbientLight
  /** Call each frame with the camera follow target (player pos) */
  updateCamera: (targetX: number, targetZ: number) => void
  resize: (w: number, h: number) => void
  dispose: () => void
}

export function createScene(canvas: HTMLCanvasElement): SceneContext {
  // ── Renderer ────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.9

  // ── Scene ───────────────────────────────────────────────
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(SKY_COLOR)
  scene.fog = new THREE.FogExp2(SKY_COLOR, 0.0015)

  // ── Camera — perspective, slightly angled top-down ──────
  const camera = new THREE.PerspectiveCamera(50, 16 / 9, 1, 2000)
  // Camera positioned above and slightly behind/above the look target
  const camH = CAMERA_HEIGHT * CAMERA_ZOOM_30
  camera.position.set(0, camH, camH * (1 - CAMERA_ANGLE) * 0.6)
  camera.lookAt(0, 0, 0)
  scene.add(camera)

  // ── Lights ──────────────────────────────────────────────
  // Warm post-apo sunlight
  const dirLight = new THREE.DirectionalLight(0xffd8a0, 1.2)
  dirLight.position.set(100, 200, 80)
  dirLight.castShadow = true
  dirLight.shadow.mapSize.set(2048, 2048)
  dirLight.shadow.camera.left = -400
  dirLight.shadow.camera.right = 400
  dirLight.shadow.camera.top = 400
  dirLight.shadow.camera.bottom = -400
  dirLight.shadow.camera.near = 1
  dirLight.shadow.camera.far = 600
  dirLight.shadow.bias = -0.002
  scene.add(dirLight)

  // Secondary fill light (blueish)
  const fillLight = new THREE.DirectionalLight(0x6688aa, 0.3)
  fillLight.position.set(-60, 100, -60)
  scene.add(fillLight)

  // Ambient
  const ambientLight = new THREE.AmbientLight(0x998877, 0.5)
  scene.add(ambientLight)

  // Hemisphere light for sky/ground
  const hemiLight = new THREE.HemisphereLight(0xaa8866, 0x443322, 0.4)
  scene.add(hemiLight)

  // ── Camera follow ───────────────────────────────────────
  function updateCamera(targetX: number, targetZ: number) {
    const offsetZ = camH * (1 - CAMERA_ANGLE) * 0.6
    camera.position.x = targetX
    camera.position.y = camH
    camera.position.z = targetZ + offsetZ
    camera.lookAt(targetX, 0, targetZ)

    // Move shadow camera / directional light with player
    dirLight.position.set(targetX + 100, 200, targetZ + 80)
    dirLight.target.position.set(targetX, 0, targetZ)
    dirLight.target.updateMatrixWorld()
  }

  // ── Resize ──────────────────────────────────────────────
  function resize(w: number, h: number) {
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }

  // ── Dispose ─────────────────────────────────────────────
  function dispose() {
    renderer.dispose()
    scene.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose())
        } else {
          obj.material.dispose()
        }
      }
    })
  }

  return { scene, camera, renderer, dirLight, ambientLight, updateCamera, resize, dispose }
}

// ── Split-screen helpers ──────────────────────────────────
/** Create an independent PerspectiveCamera for one split-screen viewport. */
export function createPlayerCamera(): THREE.PerspectiveCamera {
  const camH = CAMERA_HEIGHT * CAMERA_ZOOM_30
  const cam = new THREE.PerspectiveCamera(50, 16 / 9, 1, 2000)
  cam.position.set(0, camH, camH * (1 - CAMERA_ANGLE) * 0.6)
  cam.lookAt(0, 0, 0)
  return cam
}

/** Position a split-screen camera above the given world XZ target. */
export function updatePlayerCamera(
  camera: THREE.PerspectiveCamera,
  targetX: number,
  targetZ: number,
) {
  const camH = CAMERA_HEIGHT * CAMERA_ZOOM_30
  const offsetZ = camH * (1 - CAMERA_ANGLE) * 0.6
  camera.position.set(targetX, camH, targetZ + offsetZ)
  camera.lookAt(targetX, 0, targetZ)
}

/** Configure directional light + shadow for split screen (covers whole map). */
export function setupSplitScreenLight(
  dirLight: THREE.DirectionalLight,
  worldW: number, worldH: number,
) {
  const cx = worldW / 2, cz = worldH / 2
  dirLight.position.set(cx + 100, 300, cz + 80)
  dirLight.target.position.set(cx, 0, cz)
  dirLight.target.updateMatrixWorld()
  const halfMap = Math.max(worldW, worldH) / 2 + 200
  dirLight.shadow.camera.left = -halfMap
  dirLight.shadow.camera.right = halfMap
  dirLight.shadow.camera.top = halfMap
  dirLight.shadow.camera.bottom = -halfMap
  dirLight.shadow.camera.near = 1
  dirLight.shadow.camera.far = 800
  dirLight.shadow.camera.updateProjectionMatrix()
}
