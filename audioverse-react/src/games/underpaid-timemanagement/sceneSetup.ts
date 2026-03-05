/**
 * Three.js scene setup for isometric view — Underpaid Time Management
 *
 * Warm kitchen-themed lighting with orthographic isometric projection.
 */
import * as THREE from 'three'
import { CAMERA_ZOOM, CAMERA_FOLLOW, CELL_SIZE } from './constants'
import { lerp } from './helpers'

export interface SceneContext {
  scene: THREE.Scene
  camera: THREE.OrthographicCamera
  renderer: THREE.WebGLRenderer
  ground: THREE.Mesh
  updateCamera: (targetX: number, targetZ: number) => void
  resize: (w: number, h: number) => void
  dispose: () => void
}

/**
 * Create the full Three.js scene with isometric camera and kitchen lighting.
 */
export function createScene(
  canvas: HTMLCanvasElement,
  gridCols: number, gridRows: number,
): SceneContext {
  const mapW = gridCols * CELL_SIZE
  const mapH = gridRows * CELL_SIZE

  // ─── Renderer ──────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setClearColor(0x5b463a) // warm brown kitchen ambiance

  const w = canvas.clientWidth || 1024
  const h = canvas.clientHeight || 768
  renderer.setSize(w, h, false)

  // ─── Scene ─────────────────────────────────────────────
  const scene = new THREE.Scene()

  // ─── Orthographic Camera (isometric) ──────────────────
  const aspect = w / h
  const camera = new THREE.OrthographicCamera(
    -CAMERA_ZOOM * aspect, CAMERA_ZOOM * aspect,
    CAMERA_ZOOM, -CAMERA_ZOOM,
    0.1, 500,
  )

  // Classic isometric: 45° horizontal, ~35.26° vertical tilt
  const camDist = 80
  const camAngleH = Math.PI / 4
  const camAngleV = Math.atan(1 / Math.sqrt(2))
  camera.position.set(
    camDist * Math.cos(camAngleV) * Math.sin(camAngleH),
    camDist * Math.sin(camAngleV),
    camDist * Math.cos(camAngleV) * Math.cos(camAngleH),
  )
  camera.lookAt(0, 0, 0)
  camera.updateProjectionMatrix()

  // ─── Lighting (warm kitchen) ───────────────────────────
  // Ambient — warm, soft kitchen light
  const ambient = new THREE.AmbientLight(0xffe8cc, 0.65)
  scene.add(ambient)

  // Main overhead light — warm white
  const mainLight = new THREE.DirectionalLight(0xfff5e6, 1.0)
  mainLight.position.set(20, 40, 15)
  mainLight.castShadow = true
  mainLight.shadow.mapSize.width = 2048
  mainLight.shadow.mapSize.height = 2048
  mainLight.shadow.camera.near = 0.5
  mainLight.shadow.camera.far = 200
  const shadowSize = Math.max(mapW, mapH) * 0.7
  mainLight.shadow.camera.left = -shadowSize
  mainLight.shadow.camera.right = shadowSize
  mainLight.shadow.camera.top = shadowSize
  mainLight.shadow.camera.bottom = -shadowSize
  scene.add(mainLight)

  // Fill light from opposite side (softer)
  const fillLight = new THREE.DirectionalLight(0xffd6a0, 0.4)
  fillLight.position.set(-15, 20, -10)
  scene.add(fillLight)

  // Hemisphere light — ceiling / floor blend
  const hemi = new THREE.HemisphereLight(0xfff8f0, 0x8b6b4a, 0.3)
  scene.add(hemi)

  // ─── Ground plane (kitchen floor) ─────────────────────
  const groundGeo = new THREE.PlaneGeometry(mapW + 4, mapH + 4)
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0xc4a882,
    roughness: 0.8,
    metalness: 0.05,
  })
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.position.set(mapW / 2, -0.01, mapH / 2)
  ground.receiveShadow = true
  scene.add(ground)

  // Tile grid lines for visual reference
  const gridHelper = new THREE.Group()
  const lineMat = new THREE.LineBasicMaterial({ color: 0xb09878, transparent: true, opacity: 0.25 })
  for (let c = 0; c <= gridCols; c++) {
    const pts = [new THREE.Vector3(c * CELL_SIZE, 0.005, 0), new THREE.Vector3(c * CELL_SIZE, 0.005, mapH)]
    gridHelper.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat))
  }
  for (let r = 0; r <= gridRows; r++) {
    const pts = [new THREE.Vector3(0, 0.005, r * CELL_SIZE), new THREE.Vector3(mapW, 0.005, r * CELL_SIZE)]
    gridHelper.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat))
  }
  scene.add(gridHelper)

  // ─── Camera follow state ──────────────────────────────
  let camCurrentX = mapW / 2
  let camCurrentZ = mapH / 2

  function updateCamera(targetX: number, targetZ: number) {
    camCurrentX = lerp(camCurrentX, targetX, CAMERA_FOLLOW)
    camCurrentZ = lerp(camCurrentZ, targetZ, CAMERA_FOLLOW)

    camera.position.set(
      camCurrentX + camDist * Math.cos(camAngleV) * Math.sin(camAngleH),
      camDist * Math.sin(camAngleV),
      camCurrentZ + camDist * Math.cos(camAngleV) * Math.cos(camAngleH),
    )
    camera.lookAt(camCurrentX, 0, camCurrentZ)
  }

  function resize(newW: number, newH: number) {
    const a = newW / newH
    camera.left = -CAMERA_ZOOM * a
    camera.right = CAMERA_ZOOM * a
    camera.top = CAMERA_ZOOM
    camera.bottom = -CAMERA_ZOOM
    camera.updateProjectionMatrix()
    renderer.setSize(newW, newH, false)
  }

  function dispose() {
    renderer.dispose()
    scene.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
        else obj.material.dispose()
      }
    })
  }

  return { scene, camera, renderer, ground, updateCamera, resize, dispose }
}
