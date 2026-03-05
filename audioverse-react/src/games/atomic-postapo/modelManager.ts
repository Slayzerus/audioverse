/**
 * Model loading & caching manager for AtomicPostApo.
 *
 * Loads GLB models (Post-Apocalyptic pack) and FBX models (POLYGON Heist characters).
 * Clones instances efficiently using Object3D.clone() from cached originals.
 */
import * as THREE from 'three'
// @ts-expect-error — three/examples/jsm re-exports
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
// @ts-expect-error — three/examples/jsm re-exports
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { logger } from '../../utils/logger'
const log = logger.scoped('modelManager')

const glbCache = new Map<string, THREE.Group>()
const fbxCache = new Map<string, THREE.Group>()
const gltfLoader = new GLTFLoader()
const fbxLoader = new FBXLoader()

/**
 * Load a GLB model (returns cached clone if already loaded)
 */
export async function loadGLB(path: string): Promise<THREE.Group> {
  const cached = glbCache.get(path)
  if (cached) return cached.clone()

  return new Promise((resolve, reject) => {
    gltfLoader.load(
      path,
      (gltf: { scene: THREE.Group }) => {
        const model = gltf.scene
        // Enable shadows on all meshes
        model.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })
        glbCache.set(path, model)
        resolve(model.clone())
      },
      undefined,
      (err: unknown) => {
        log.warn(`Failed to load GLB: ${path}`, err)
        reject(err)
      },
    )
  })
}

/**
 * Load an FBX model (returns cached clone if already loaded)
 */
export async function loadFBX(path: string): Promise<THREE.Group> {
  const cached = fbxCache.get(path)
  if (cached) return cached.clone()

  return new Promise((resolve, reject) => {
    fbxLoader.load(
      path,
      (model: THREE.Group) => {
        model.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })
        fbxCache.set(path, model)
        resolve(model.clone())
      },
      undefined,
      (err: unknown) => {
        log.warn(`Failed to load FBX: ${path}`, err)
        reject(err)
      },
    )
  })
}

/**
 * Create a simple colored box as a fallback when models can't load
 */
export function createFallbackBox(
  w: number, h: number, d: number, color: number,
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, h, d)
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.1 })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

/**
 * Create a capsule-like shape for characters (cylinder + sphere top)
 */
export function createCharacterMesh(color: number, radius = 0.3, height = 1.2): THREE.Group {
  const group = new THREE.Group()

  // Body cylinder
  const bodyGeo = new THREE.CylinderGeometry(radius, radius * 0.9, height, 8)
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = height / 2
  body.castShadow = true
  group.add(body)

  // Head sphere
  const headGeo = new THREE.SphereGeometry(radius * 0.7, 8, 6)
  const headMat = new THREE.MeshStandardMaterial({ color: 0xf5deb3, roughness: 0.6 })
  const head = new THREE.Mesh(headGeo, headMat)
  head.position.y = height + radius * 0.5
  head.castShadow = true
  group.add(head)

  return group
}

/**
 * Create a simple enemy mesh based on kind
 */
export function createEnemyMesh(kind: string, color: number): THREE.Group {
  const group = new THREE.Group()

  if (kind === 'deathclaw') {
    // Large hulking shape
    const bodyGeo = new THREE.BoxGeometry(1.0, 2.0, 0.8)
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 1.0
    body.castShadow = true
    group.add(body)
    // Horns
    const hornGeo = new THREE.ConeGeometry(0.1, 0.5, 4)
    const hornMat = new THREE.MeshStandardMaterial({ color: 0x333333 })
    for (const side of [-0.3, 0.3]) {
      const horn = new THREE.Mesh(hornGeo, hornMat)
      horn.position.set(side, 2.2, 0)
      horn.rotation.z = side > 0 ? -0.3 : 0.3
      horn.castShadow = true
      group.add(horn)
    }
  } else if (kind === 'feral_dog') {
    // Low quadruped
    const bodyGeo = new THREE.BoxGeometry(0.4, 0.4, 0.9)
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.35
    body.castShadow = true
    group.add(body)
    // Head
    const headGeo = new THREE.BoxGeometry(0.25, 0.25, 0.3)
    const head = new THREE.Mesh(headGeo, bodyMat)
    head.position.set(0, 0.45, 0.5)
    head.castShadow = true
    group.add(head)
  } else if (kind === 'radscorpion') {
    // Flat wide body
    const bodyGeo = new THREE.BoxGeometry(0.8, 0.3, 1.0)
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.2
    body.castShadow = true
    group.add(body)
    // Tail
    const tailGeo = new THREE.ConeGeometry(0.08, 0.8, 4)
    const tailMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 })
    const tail = new THREE.Mesh(tailGeo, tailMat)
    tail.position.set(0, 0.7, -0.5)
    tail.rotation.x = 0.4
    tail.castShadow = true
    group.add(tail)
  } else {
    // Mutant / raider — humanoid
    return createCharacterMesh(color, 0.3, kind === 'mutant' ? 1.4 : 1.1)
  }

  return group
}

/**
 * Create a simple bullet mesh
 */
export function createBulletMesh(color = 0xffd700): THREE.Mesh {
  const geo = new THREE.SphereGeometry(0.08, 6, 4)
  const mat = new THREE.MeshBasicMaterial({ color })
  return new THREE.Mesh(geo, mat)
}

/**
 * Create a radiation zone visual (translucent green cylinder)
 */
export function createRadZoneMesh(radius: number): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(radius, radius, 0.5, 16)
  const mat = new THREE.MeshBasicMaterial({
    color: 0x32c832,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.y = 0.25
  return mesh
}

/**
 * Create a loot box mesh with glow effect
 */
export function createLootMesh(item: string): THREE.Group {
  const group = new THREE.Group()
  const colors: Record<string, number> = {
    health: 0x00ff00, ammo: 0xffaa00, armor: 0x4488ff,
    coin: 0xffd700, stimpak: 0x00ffcc, radaway: 0xff6600,
    weapon_upgrade: 0xff00ff,
  }
  const color = colors[item] || 0xffffff

  const boxGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4)
  const boxMat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.5 })
  const box = new THREE.Mesh(boxGeo, boxMat)
  box.position.y = 0.3
  box.castShadow = true
  group.add(box)

  // Glow ring
  const ringGeo = new THREE.RingGeometry(0.3, 0.5, 16)
  const ringMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const ring = new THREE.Mesh(ringGeo, ringMat)
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.02
  group.add(ring)

  return group
}

/**
 * Create a campfire mesh (orange point light + mesh)
 */
export function createCampfireMesh(): THREE.Group {
  const group = new THREE.Group()

  // Log base
  const logGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6)
  const logMat = new THREE.MeshStandardMaterial({ color: 0x4a2a0a, roughness: 0.9 })
  for (let i = 0; i < 4; i++) {
    const log = new THREE.Mesh(logGeo, logMat)
    log.rotation.z = Math.PI / 2
    log.rotation.y = (i / 4) * Math.PI
    log.position.y = 0.08
    log.castShadow = true
    group.add(log)
  }

  // Fire light
  const fireLight = new THREE.PointLight(0xff6600, 2, 8)
  fireLight.position.y = 0.5
  group.add(fireLight)

  // Flame (cone)
  const flameGeo = new THREE.ConeGeometry(0.15, 0.5, 6)
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.7 })
  const flame = new THREE.Mesh(flameGeo, flameMat)
  flame.position.y = 0.4
  group.add(flame)

  return group
}

/** Clear all caches (for restart) */
export function clearModelCache() {
  glbCache.clear()
  fbxCache.clear()
}
