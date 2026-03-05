/**
 * Three.js scene setup for isometric view — AtomicPostApo
 *
 * Uses orthographic camera angled for classic isometric projection.
 * Provides scene, camera, renderer, lighting and a ground plane.
 */
import * as THREE from 'three'
import { CAMERA_ZOOM, CAMERA_FOLLOW_SPEED } from './constants'
import { lerp } from './helpers'

export interface SceneContext {
  scene: THREE.Scene
  camera: THREE.OrthographicCamera
  renderer: THREE.WebGLRenderer
  ground: THREE.Mesh
  /** Call each frame with target world position */
  updateCamera: (targetX: number, targetZ: number) => void
  /** Resize handler */
  resize: (w: number, h: number) => void
  /** Dispose all resources */
  dispose: () => void
}

/**
 * Create the full Three.js scene with isometric camera.
 */
export function createScene(canvas: HTMLCanvasElement, mapW: number, mapH: number): SceneContext {
  // ─── Renderer ──────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setClearColor(0x2a1f14) // dark brown wasteland sky

  const w = canvas.clientWidth || 1024
  const h = canvas.clientHeight || 768
  renderer.setSize(w, h, false)

  // ─── Scene ─────────────────────────────────────────────
  const scene = new THREE.Scene()

  // Fog for atmosphere
  scene.fog = new THREE.FogExp2(0x5a4a38, 0.008)

  // ─── Orthographic Camera (isometric) ──────────────────
  const aspect = w / h
  const camera = new THREE.OrthographicCamera(
    -CAMERA_ZOOM * aspect, CAMERA_ZOOM * aspect,
    CAMERA_ZOOM, -CAMERA_ZOOM,
    0.1, 500,
  )
  // Position camera for isometric view:
  // Classic isometric: rotate 45° around Y, tilt ~35.26°
  // We place camera at an offset and use lookAt
  const camDist = 80
  const camAngleH = Math.PI / 4   // 45° horizontal
  const camAngleV = Math.atan(1 / Math.sqrt(2)) // ~35.26° tilt
  camera.position.set(
    camDist * Math.cos(camAngleV) * Math.sin(camAngleH),
    camDist * Math.sin(camAngleV),
    camDist * Math.cos(camAngleV) * Math.cos(camAngleH),
  )
  camera.lookAt(0, 0, 0)
  camera.updateProjectionMatrix()

  // ─── Lighting ──────────────────────────────────────────
  // Ambient — dusty wasteland atmosphere
  const ambient = new THREE.AmbientLight(0xc9a87c, 0.6)
  scene.add(ambient)

  // Directional sun — harsh wasteland light
  const sun = new THREE.DirectionalLight(0xffeedd, 1.2)
  sun.position.set(30, 50, 20)
  sun.castShadow = true
  sun.shadow.mapSize.width = 2048
  sun.shadow.mapSize.height = 2048
  sun.shadow.camera.near = 0.5
  sun.shadow.camera.far = 200
  const shadowSize = Math.max(mapW, mapH) * 0.6
  sun.shadow.camera.left = -shadowSize
  sun.shadow.camera.right = shadowSize
  sun.shadow.camera.top = shadowSize
  sun.shadow.camera.bottom = -shadowSize
  scene.add(sun)

  // Hemisphere light — sky/ground color blend
  const hemi = new THREE.HemisphereLight(0xb8956e, 0x3d2817, 0.4)
  scene.add(hemi)

  // ─── Ground plane ──────────────────────────────────────
  const groundGeo = new THREE.PlaneGeometry(mapW + 20, mapH + 20)
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x8b7355,
    roughness: 0.95,
    metalness: 0.0,
  })
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.position.set(mapW / 2, -0.01, mapH / 2)
  ground.receiveShadow = true
  scene.add(ground)

  // Add some ground detail — darker patches (ruin marks)
  for (let i = 0; i < 30; i++) {
    const pw = 2 + Math.random() * 6
    const ph = 2 + Math.random() * 4
    const patchGeo = new THREE.PlaneGeometry(pw, ph)
    const patchMat = new THREE.MeshStandardMaterial({
      color: 0x6b5b45,
      roughness: 1.0,
      metalness: 0,
    })
    const patch = new THREE.Mesh(patchGeo, patchMat)
    patch.rotation.x = -Math.PI / 2
    patch.position.set(
      Math.random() * mapW,
      0.001,
      Math.random() * mapH,
    )
    patch.receiveShadow = true
    scene.add(patch)
  }

  // ─── Camera follow state ──────────────────────────────
  let camTargetX = mapW / 2
  let camTargetZ = mapH / 2
  let camCurrentX = camTargetX
  let camCurrentZ = camTargetZ

  function updateCamera(targetX: number, targetZ: number) {
    camTargetX = targetX
    camTargetZ = targetZ
    camCurrentX = lerp(camCurrentX, camTargetX, CAMERA_FOLLOW_SPEED)
    camCurrentZ = lerp(camCurrentZ, camTargetZ, CAMERA_FOLLOW_SPEED)

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
