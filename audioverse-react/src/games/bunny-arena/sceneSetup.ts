/**
 * sceneSetup.ts — Three.js scene for BunnyGame (2.5D side-scroller).
 *
 * Orthographic camera looks along -Z so the XY plane is the gameplay plane.
 * Three.js Y = up; we flip from screen coords in sceneSync.
 */
import * as THREE from 'three'
import { WORLD_W, WORLD_H, CAMERA_HALF_H } from './constants'

export interface SceneContext {
  scene: THREE.Scene
  camera: THREE.OrthographicCamera
  renderer: THREE.WebGLRenderer
  /** Update camera frustum on container resize */
  resize: (w: number, h: number) => void
  /** Dispose renderer & scene */
  dispose: () => void
}

/**
 * Create the Three.js scene with a side-view orthographic camera.
 *
 * Coordinate mapping:
 *   game x  →  THREE x  (same)
 *   game y  →  THREE y  =  WORLD_H - gameY  (flip)
 *   depth   →  THREE z  (objects at z = 0 .. small offsets for layering)
 */
export function createScene(canvas: HTMLCanvasElement): SceneContext {
  // ── Renderer ────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setClearColor(0x0d0d1a)

  const w = canvas.clientWidth || 960
  const h = canvas.clientHeight || 600
  renderer.setSize(w, h, false)

  // ── Scene ───────────────────────────────────────────────
  const scene = new THREE.Scene()
  // Subtle depth fog for atmosphere
  scene.fog = new THREE.FogExp2(0x0d0d1a, 0.0015)

  // ── Orthographic camera (side view, looking along -Z) ──
  const aspect = w / h
  const halfH = CAMERA_HALF_H
  const halfW = halfH * aspect

  const camera = new THREE.OrthographicCamera(
    -halfW, halfW + WORLD_W,    // left, right  — show full world width
    WORLD_H + halfH, -halfH,    // top, bottom  — show full world height
    0.1, 1000,
  )
  // Camera position: look from +Z toward origin
  camera.position.set(WORLD_W / 2, WORLD_H / 2, 500)
  camera.lookAt(WORLD_W / 2, WORLD_H / 2, 0)
  camera.updateProjectionMatrix()

  // ── Lighting ────────────────────────────────────────────
  // Ambient — cool arena glow
  const ambient = new THREE.AmbientLight(0x8888cc, 0.5)
  scene.add(ambient)

  // Main directional light — provides shadows
  const sun = new THREE.DirectionalLight(0xffffff, 1.0)
  sun.position.set(WORLD_W / 2, WORLD_H + 100, 200)
  sun.target.position.set(WORLD_W / 2, WORLD_H / 2, 0)
  sun.castShadow = true
  sun.shadow.mapSize.width = 2048
  sun.shadow.mapSize.height = 2048
  sun.shadow.camera.near = 0.5
  sun.shadow.camera.far = 800
  const shadowSize = Math.max(WORLD_W, WORLD_H) * 0.8
  sun.shadow.camera.left = -shadowSize
  sun.shadow.camera.right = shadowSize
  sun.shadow.camera.top = shadowSize
  sun.shadow.camera.bottom = -shadowSize
  scene.add(sun)
  scene.add(sun.target)

  // Hemisphere — sky/ground color blend for nicer fills
  const hemi = new THREE.HemisphereLight(0x6666aa, 0x222244, 0.3)
  scene.add(hemi)

  // Rim light from behind to make characters pop
  const rimLight = new THREE.DirectionalLight(0x6688ff, 0.4)
  rimLight.position.set(WORLD_W / 2, WORLD_H / 2, -200)
  scene.add(rimLight)

  // ── Background wall (far back) ──────────────────────────
  const bgGeo = new THREE.PlaneGeometry(WORLD_W + 200, WORLD_H + 200)
  const bgMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a3e,
    roughness: 1.0,
    metalness: 0.0,
  })
  const bgMesh = new THREE.Mesh(bgGeo, bgMat)
  bgMesh.position.set(WORLD_W / 2, WORLD_H / 2, -50)
  scene.add(bgMesh)

  // ── Resize handler ─────────────────────────────────────
  function resize(newW: number, newH: number) {
    const a = newW / newH
    const hH = CAMERA_HALF_H
    const hW = hH * a
    camera.left = -hW
    camera.right = hW + WORLD_W
    camera.top = WORLD_H + hH
    camera.bottom = -hH
    camera.updateProjectionMatrix()
    renderer.setSize(newW, newH, false)
  }

  // ── Dispose ─────────────────────────────────────────────
  function dispose() {
    renderer.dispose()
    scene.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach(m => m.dispose())
      }
    })
  }

  return { scene, camera, renderer, resize, dispose }
}
