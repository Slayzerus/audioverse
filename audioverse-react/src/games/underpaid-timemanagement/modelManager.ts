/**
 * Model loading & caching for Underpaid Time Management.
 *
 * Loads GLTF models (Tiny Treats Collection) and FBX (Mixamo characters).
 * Clones instances efficiently via Object3D.clone() from cached originals.
 */
import * as THREE from 'three'
// @ts-expect-error — three/examples/jsm re-exports
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
// @ts-expect-error — three/examples/jsm re-exports
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { logger } from '../../utils/logger'

const log = logger.scoped('ModelManager')

const gltfCache = new Map<string, THREE.Group>()
const fbxCache = new Map<string, THREE.Group>()
const animCache = new Map<string, THREE.AnimationClip>()
const gltfLoader = new GLTFLoader()
const fbxLoader = new FBXLoader()

// ─── GLTF model loading ────────────────────────────────
export async function loadGLTF(path: string): Promise<THREE.Group> {
  const cached = gltfCache.get(path)
  if (cached) return cached.clone()

  return new Promise((resolve, reject) => {
    gltfLoader.load(
      path,
      (gltf: { scene: THREE.Group }) => {
        const model = gltf.scene
        model.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })
        gltfCache.set(path, model)
        resolve(model.clone())
      },
      undefined,
      (err: unknown) => {
        log.warn(`Failed to load GLTF: ${path}`, err)
        reject(err)
      },
    )
  })
}

// ─── FBX model loading ─────────────────────────────────
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

// ─── FBX animation clip loading ─────────────────────────
export async function loadAnimClip(path: string): Promise<THREE.AnimationClip> {
  const cached = animCache.get(path)
  if (cached) return cached.clone()

  return new Promise((resolve, reject) => {
    fbxLoader.load(
      path,
      (model: THREE.Group & { animations?: THREE.AnimationClip[] }) => {
        const clip = model.animations?.[0]
        if (!clip) { reject(new Error(`No animation found in ${path}`)); return }
        animCache.set(path, clip)
        resolve(clip.clone())
      },
      undefined,
      (err: unknown) => {
        log.warn(`Failed to load anim FBX: ${path}`, err)
        reject(err)
      },
    )
  })
}

// ─── Character with animation mixer ────────────────────
export interface CharacterHandle {
  group: THREE.Group
  mixer: THREE.AnimationMixer
  actions: Map<string, THREE.AnimationAction>
  currentAction: string | null
}

export async function loadCharacter(
  modelPath: string,
  animPaths: Record<string, string>,
): Promise<CharacterHandle> {
  const group = await loadFBX(modelPath)

  // Normalize scale (Mixamo models are ~100 units tall, we want ~1.4)
  const box = new THREE.Box3().setFromObject(group)
  const height = box.max.y - box.min.y
  const targetHeight = 1.4
  const s = targetHeight / height
  group.scale.set(s, s, s)

  const mixer = new THREE.AnimationMixer(group)
  const actions = new Map<string, THREE.AnimationAction>()

  // Load skeleton animation from the base model if any
  const baseGroup = fbxCache.get(modelPath)
  if (baseGroup) {
    const baseFBX = baseGroup as THREE.Group & { animations?: THREE.AnimationClip[] }
    if (baseFBX.animations?.length) {
      const clip = baseFBX.animations[0]
      const action = mixer.clipAction(clip)
      actions.set('idle', action)
      action.play()
    }
  }

  // Load additional animation clips
  for (const [name, path] of Object.entries(animPaths)) {
    if (name === 'idle' && actions.has('idle')) continue
    try {
      const clip = await loadAnimClip(path)
      const action = mixer.clipAction(clip)
      actions.set(name, action)
    } catch (err) {
      log.warn(`Skipped animation ${name}:`, err)
    }
  }

  return { group, mixer, actions, currentAction: 'idle' }
}

export function playAnim(handle: CharacterHandle, name: string, fadeDuration = 0.3): void {
  if (handle.currentAction === name) return
  const action = handle.actions.get(name)
  if (!action) return

  const prev = handle.currentAction ? handle.actions.get(handle.currentAction) : null
  if (prev) prev.fadeOut(fadeDuration)

  action.reset().fadeIn(fadeDuration).play()
  handle.currentAction = name
}

// ─── Fallback geometry builders ─────────────────────────
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

export function createFallbackCharacter(color: number): THREE.Group {
  const group = new THREE.Group()
  const bodyGeo = new THREE.CylinderGeometry(0.3, 0.25, 1.0, 8)
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = 0.5
  body.castShadow = true
  group.add(body)

  const headGeo = new THREE.SphereGeometry(0.2, 8, 6)
  const headMat = new THREE.MeshStandardMaterial({ color: 0xf5deb3, roughness: 0.6 })
  const head = new THREE.Mesh(headGeo, headMat)
  head.position.y = 1.15
  head.castShadow = true
  group.add(head)

  // Chef hat (small cylinder + sphere)
  const hatGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.25, 8)
  const hatMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
  const hat = new THREE.Mesh(hatGeo, hatMat)
  hat.position.y = 1.42
  hat.castShadow = true
  group.add(hat)

  const hatTopGeo = new THREE.SphereGeometry(0.18, 8, 6)
  const hatTop = new THREE.Mesh(hatTopGeo, hatMat)
  hatTop.position.y = 1.55
  group.add(hatTop)

  return group
}

export function createFireMesh(): THREE.Group {
  const group = new THREE.Group()
  const flameGeo = new THREE.ConeGeometry(0.3, 0.8, 8)
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.8 })
  const flame = new THREE.Mesh(flameGeo, flameMat)
  flame.position.y = 0.6
  group.add(flame)

  const innerGeo = new THREE.ConeGeometry(0.15, 0.5, 6)
  const innerMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true, opacity: 0.9 })
  const inner = new THREE.Mesh(innerGeo, innerMat)
  inner.position.y = 0.55
  group.add(inner)

  const fireLight = new THREE.PointLight(0xff6600, 3, 5)
  fireLight.position.y = 0.8
  group.add(fireLight)

  return group
}

export function createIngredientMesh(color: number): THREE.Group {
  const group = new THREE.Group()
  const geo = new THREE.SphereGeometry(0.15, 8, 6)
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.0 })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.y = 0.15
  mesh.castShadow = true
  group.add(mesh)
  return group
}

export function createPlateMesh(): THREE.Group {
  const group = new THREE.Group()
  const geo = new THREE.CylinderGeometry(0.3, 0.25, 0.06, 12)
  const mat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3, metalness: 0.1 })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.y = 0.03
  mesh.castShadow = true
  group.add(mesh)
  return group
}

/** Clear all caches (for restart) */
export function clearModelCache() {
  gltfCache.clear()
  fbxCache.clear()
  animCache.clear()
}
