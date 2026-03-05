/**
 * Core Three.js 3D rendering engine for Warzone FPP (Cops vs Robbers FPS).
 *
 * Manages the entire Three.js scene: renderer, camera, lighting, world geometry,
 * entity rendering, first-person weapon view, and visual effects.
 *
 * All Three.js state is encapsulated inside the factory closure.
 */

import * as THREE from 'three'
import type { GameState, TileMap, Soldier, Bullet, Prop } from './types'
import { WALL_COLORS } from './types'
import {
  WALL_HEIGHT, PLAYER_HEIGHT,
  FOV, CAMERA_NEAR, CAMERA_FAR,
  SCREEN_W, SCREEN_H, CAPTURE_R,
  TPP_DISTANCE, TPP_HEIGHT, TPP_LERP,
  WEAPONS,
} from './constants'
import {
  preloadCommonModels, getModelSync, isModelReady,
  getStaticWeaponModel, getCharacterModel,
} from './modelManager'
import './assets' // asset definitions loaded via modelManager
import {
  createSoldierMesh, createVehicleMesh, createPickupMesh,
  createCapturePointMesh, cpTeamColor,
} from './threeEntityMeshes'
import {
  syncBRZone as _syncBRZone,
  syncBRSupplyDrops as _syncBRSupplyDrops,
  syncBRWeaponPickups as _syncBRWeaponPickups,
  syncBRTraps as _syncBRTraps,
} from './threeBRVisuals'
import type { ZoneRef } from './threeBRVisuals'

// ─── Helpers ──────────────────────────────────────────────

const _tmpMatrix = new THREE.Matrix4()
const _tmpColor = new THREE.Color()

/** Track which groups have been upgraded with FBX models */
const fbxLoadedGroups = new WeakSet<THREE.Group>()

/** Shared geometries (created once, reused) */
const sharedGeo = {
  soldierBody: new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8),
  soldierHead: new THREE.SphereGeometry(0.25, 8, 6),
  bulletSphere: new THREE.SphereGeometry(0.06, 6, 4),
  pickupBox:   new THREE.BoxGeometry(0.5, 0.5, 0.5),
  pickupOcta:  new THREE.OctahedronGeometry(0.35),
  flagPole:    new THREE.CylinderGeometry(0.04, 0.04, 4, 6),
  flagBox:     new THREE.BoxGeometry(0.8, 0.5, 0.05),
  capRing:     new THREE.RingGeometry(CAPTURE_R - 0.3, CAPTURE_R, 32),
}

// ─── Factory ──────────────────────────────────────────────

export function createThreeEngine(container: HTMLDivElement) {
  // ─── Renderer ──────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(SCREEN_W, SCREEN_H)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  container.appendChild(renderer.domElement)

  // ─── Preload models ─────────────────────────────────────
  preloadCommonModels()

  // ─── Scene ─────────────────────────────────────────────
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#87CEEB')
  scene.fog = new THREE.Fog('#87CEEB', 50, 300)

  // ─── Camera ────────────────────────────────────────────
  const camera = new THREE.PerspectiveCamera(FOV, SCREEN_W / SCREEN_H, CAMERA_NEAR, CAMERA_FAR)
  camera.rotation.order = 'YXZ'
  scene.add(camera)

  // ─── Lighting ──────────────────────────────────────────
  const ambientLight = new THREE.AmbientLight('#b0b0c0', 0.5)
  scene.add(ambientLight)

  const sunLight = new THREE.DirectionalLight('#fff5e0', 1.2)
  sunLight.position.set(80, 120, 60)
  sunLight.castShadow = true
  sunLight.shadow.mapSize.set(2048, 2048)
  sunLight.shadow.camera.left   = -100
  sunLight.shadow.camera.right  =  100
  sunLight.shadow.camera.top    =  100
  sunLight.shadow.camera.bottom = -100
  sunLight.shadow.camera.near   = 0.5
  sunLight.shadow.camera.far    = 300
  scene.add(sunLight)
  scene.add(sunLight.target)

  const hemiLight = new THREE.HemisphereLight('#87CEEB', '#4a5e2e', 0.3)
  scene.add(hemiLight)

  // ─── Groups ────────────────────────────────────────────
  const worldGroup  = new THREE.Group()
  const entityGroup = new THREE.Group()
  scene.add(worldGroup)
  scene.add(entityGroup)

  // ─── Entity mesh pools ─────────────────────────────────
  const soldierMeshes: Map<number, THREE.Group>  = new Map()
  const vehicleMeshes: Map<number, THREE.Group>  = new Map()
  const pickupMeshes:  Map<number, THREE.Mesh>   = new Map()
  const capPointMeshes: Map<number, THREE.Group>  = new Map()

  const bulletGroup = new THREE.Group()
  entityGroup.add(bulletGroup)

  // ─── BR entity pools ──────────────────────────────────
  const zoneRef: ZoneRef = { mesh: null }
  const supplyDropMeshes: Map<number, THREE.Group> = new Map()
  const weaponPickupMeshes: Map<number, THREE.Mesh> = new Map()
  const trapMeshes: Map<number, THREE.Mesh> = new Map()
  // brMinimapGroup reserved for future minimap overlay

  // ─── TPP camera state ─────────────────────────────────
  const tppCamPos = new THREE.Vector3()
  const tppCamTarget = new THREE.Vector3()
  let tppInitialized = false

  // ─── Weapon (first-person) ────────────────────────────
  const weaponGroup = new THREE.Group()
  weaponGroup.position.set(0.3, -0.25, -0.5)
  camera.add(weaponGroup)

  const weaponMat = new THREE.MeshStandardMaterial({ color: '#2a2a2a', roughness: 0.5, metalness: 0.4 })
  const wBarrel = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.5), weaponMat)
  wBarrel.position.set(0, 0.03, -0.25)
  wBarrel.name = 'fallbackBarrel'
  weaponGroup.add(wBarrel)
  const wBody = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.3), weaponMat)
  wBody.position.set(0, -0.04, 0)
  wBody.name = 'fallbackBody'
  weaponGroup.add(wBody)
  const wGrip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.06), weaponMat)
  wGrip.position.set(0, -0.12, 0.05)
  wGrip.name = 'fallbackGrip'
  weaponGroup.add(wGrip)

  let currentWeaponModel: THREE.Group | null = null
  let currentWeaponName = ''

  /** Swap the first-person weapon model when the weapon changes. */
  function updateWeaponModel(weaponName: string): void {
    if (weaponName === currentWeaponName) return
    currentWeaponName = weaponName

    // Remove old FBX model if any
    if (currentWeaponModel) {
      weaponGroup.remove(currentWeaponModel)
      currentWeaponModel = null
    }

    // Find weapon def to get model filename
    const wDef = WEAPONS.find(w => w.name === weaponName)
    const modelFile = wDef?.model
    if (modelFile) {
      const smFile = getStaticWeaponModel(modelFile)
      const fbx = getModelSync(smFile)
      if (fbx) {
        // Scale to fit in first-person view (~0.3m)
        const box = new THREE.Box3().setFromObject(fbx)
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z, 0.01)
        const scale = 0.35 / maxDim
        fbx.scale.multiplyScalar(scale)
        fbx.rotation.y = Math.PI  // Face forward
        currentWeaponModel = fbx
        weaponGroup.add(fbx)
        // Hide fallback geometry
        wBarrel.visible = false; wBody.visible = false; wGrip.visible = false
        return
      }
    }
    // Show fallback geometry
    wBarrel.visible = true; wBody.visible = true; wGrip.visible = true
  }

  // Muzzle flash light (initially invisible)
  const muzzleLight = new THREE.PointLight(0xffaa00, 0, 8)
  muzzleLight.position.set(0, 0.03, -0.52)
  weaponGroup.add(muzzleLight)

  // ─── Internal state ────────────────────────────────────
  let weaponRecoil    = 0
  let muzzleFlashTimer = 0
  let _damageFlash     = 0
  let pickupRotation   = 0

  // ─── Weapon initial transform (for recoil reset) ──────
  const weaponRestPos = weaponGroup.position.clone()
  const weaponRestRot = weaponGroup.rotation.clone()

  // ═══════════════════════════════════════════════════════
  // buildWorld
  // ═══════════════════════════════════════════════════════

  function buildWorld(state: GameState): void {
    // Clear previous world
    worldGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh) {
        obj.geometry?.dispose()
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose())
        } else {
          (obj.material as THREE.Material)?.dispose()
        }
      }
    })
    worldGroup.clear()

    const tm = state.tileMap
    const ts = tm.tileSize
    const worldW = tm.w * ts
    const worldD = tm.h * ts

    // ── Ground plane ─────────────────────────────────────
    const groundGeo = new THREE.PlaneGeometry(worldW, worldD)
    const groundMat = new THREE.MeshStandardMaterial({
      color: '#4a6a2e', roughness: 0.9, metalness: 0,
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.set(worldW / 2, 0, worldD / 2)
    ground.receiveShadow = true
    worldGroup.add(ground)

    // ── Walls via InstancedMesh (one per wall type) ──────
    buildWalls(tm, ts)

    // ── Roads ────────────────────────────────────────────
    buildRoads(state.roads, ts)

    // ── Props ────────────────────────────────────────────
    buildProps(state.props)

    // Move sun target to world centre
    sunLight.target.position.set(worldW / 2, 0, worldD / 2)
    sunLight.position.set(worldW / 2 + 80, 120, worldD / 2 + 60)
  }

  function buildWalls(tm: TileMap, ts: number): void {
    // Count instances per wall type
    const counts = new Map<number, number>()
    for (let r = 0; r < tm.h; r++) {
      for (let c = 0; c < tm.w; c++) {
        const v = tm.data[r * tm.w + c]
        if (v > 0) counts.set(v, (counts.get(v) ?? 0) + 1)
      }
    }

    const wallGeo = new THREE.BoxGeometry(ts, WALL_HEIGHT, ts)

    // Create one InstancedMesh per wall type
    const instancedMap = new Map<number, THREE.InstancedMesh>()
    const indexMap = new Map<number, number>() // current index per type

    for (const [wallType, count] of counts) {
      const colorHex = WALL_COLORS[wallType] ?? '#808080'
      const mat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.7,
        metalness: 0.1,
      })
      const iMesh = new THREE.InstancedMesh(wallGeo, mat, count)
      iMesh.castShadow = true
      iMesh.receiveShadow = true
      instancedMap.set(wallType, iMesh)
      indexMap.set(wallType, 0)
    }

    // Fill transforms
    for (let r = 0; r < tm.h; r++) {
      for (let c = 0; c < tm.w; c++) {
        const v = tm.data[r * tm.w + c]
        if (v <= 0) continue
        const iMesh = instancedMap.get(v)!
        const idx = indexMap.get(v)!
        _tmpMatrix.makeTranslation(
          (c + 0.5) * ts,
          WALL_HEIGHT / 2,
          (r + 0.5) * ts,
        )
        iMesh.setMatrixAt(idx, _tmpMatrix)
        indexMap.set(v, idx + 1)
      }
    }

    for (const iMesh of instancedMap.values()) {
      iMesh.instanceMatrix.needsUpdate = true
      worldGroup.add(iMesh)
    }
  }

  function buildRoads(roads: { x: number; y: number; w: number; h: number }[], _ts: number): void {
    if (!roads || roads.length === 0) return

    const roadMat = new THREE.MeshStandardMaterial({
      color: '#3a3a3a', roughness: 0.95, metalness: 0,
    })

    for (const rd of roads) {
      const geo = new THREE.PlaneGeometry(rd.w, rd.h)
      const mesh = new THREE.Mesh(geo, roadMat)
      mesh.rotation.x = -Math.PI / 2
      mesh.position.set(rd.x + rd.w / 2, 0.02, rd.y + rd.h / 2)
      mesh.receiveShadow = true
      worldGroup.add(mesh)
    }
  }

  /** Map of prop index → current placeholder mesh (replaced when FBX loads) */
  const propPlaceholders = new Map<number, THREE.Object3D>()

  function buildProps(props: Prop[]): void {
    if (!props || props.length === 0) return

    for (let i = 0; i < props.length; i++) {
      const prop = props[i]
      const h = 1.5
      const posX = prop.x + prop.w / 2
      const posZ = prop.y + prop.h / 2

      // Try to load FBX model if available
      const modelFile = prop.model
      if (modelFile) {
        const fbx = getModelSync(modelFile)
        if (fbx) {
          // Scale the model to roughly fit the prop bounding box
          const box = new THREE.Box3().setFromObject(fbx)
          const size = box.getSize(new THREE.Vector3())
          const maxDim = Math.max(size.x, size.z, 0.01)
          const targetSize = Math.max(prop.w, prop.h) * 0.8
          const scale = targetSize / maxDim
          fbx.scale.multiplyScalar(scale)
          fbx.position.set(posX, 0, posZ)
          fbx.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true
              child.receiveShadow = true
            }
          })
          worldGroup.add(fbx)
          propPlaceholders.set(i, fbx)
          continue
        }
      }

      // Fallback: procedural box
      const geo = new THREE.BoxGeometry(prop.w, h, prop.h)
      const mat = new THREE.MeshStandardMaterial({
        color: prop.color || '#888888', roughness: 0.7, metalness: 0.1,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(posX, h / 2, posZ)
      mesh.castShadow = true
      mesh.receiveShadow = true
      worldGroup.add(mesh)
      propPlaceholders.set(i, mesh)
    }
  }

  /**
   * Deferred model swap — called each frame to upgrade placeholder boxes
   * to FBX models as they finish loading asynchronously.
   */
  let _lastPropSwapFrame = 0
  function tryUpgradeProps(state: GameState): void {
    // Only check every 30 frames (~1 second) to avoid perf hit
    _lastPropSwapFrame++
    if (_lastPropSwapFrame < 30) return
    _lastPropSwapFrame = 0

    for (let i = 0; i < state.props.length; i++) {
      const prop = state.props[i]
      const modelFile = prop.model
      if (!modelFile || !isModelReady(modelFile)) continue
      const existing = propPlaceholders.get(i)
      if (!existing) continue
      // Skip if already an FBX (has children, not a single Mesh)
      if (existing.children && existing.children.length > 0 && !(existing instanceof THREE.Mesh)) continue

      const fbx = getModelSync(modelFile)
      if (!fbx) continue

      const posX = prop.x + prop.w / 2
      const posZ = prop.y + prop.h / 2

      const box = new THREE.Box3().setFromObject(fbx)
      const size = box.getSize(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.z, 0.01)
      const targetSize = Math.max(prop.w, prop.h) * 0.8
      const scale = targetSize / maxDim
      fbx.scale.multiplyScalar(scale)
      fbx.position.set(posX, 0, posZ)

      // Swap
      worldGroup.remove(existing)
      if (existing instanceof THREE.Mesh) {
        existing.geometry?.dispose()
        ;(existing.material as THREE.Material)?.dispose()
      }
      worldGroup.add(fbx)
      propPlaceholders.set(i, fbx)
    }
  }

  // ═══════════════════════════════════════════════════════
  // Entity sync helpers
  // ═══════════════════════════════════════════════════════

  // ── Soldiers ───────────────────────────────────────────

  function syncSoldiers(state: GameState, localPlayerIdx: number): void {
    const seen = new Set<number>()

    for (const s of state.soldiers) {
      const idx = s.playerIndex
      seen.add(idx)

      // Skip local player — we see from their eyes
      if (idx === localPlayerIdx) continue

      // Skip dead soldiers – hide them
      if (!s.alive) {
        const existing = soldierMeshes.get(idx)
        if (existing) existing.visible = false
        continue
      }

      let group = soldierMeshes.get(idx)
      if (!group) {
        group = createSoldierMesh(s, sharedGeo, fbxLoadedGroups)
        entityGroup.add(group)
        soldierMeshes.set(idx, group)
      }

      group.visible = true
      group.position.set(s.x, 0, s.y)
      group.rotation.y = -s.angle
    }

    // Remove meshes for soldiers no longer present
    for (const [idx, group] of soldierMeshes) {
      if (!seen.has(idx)) {
        entityGroup.remove(group)
        soldierMeshes.delete(idx)
      }
    }
  }

  // ── Vehicles ──────────────────────────────────────────

  function syncVehicles(state: GameState): void {
    const seen = new Set<number>()

    for (let i = 0; i < state.vehicles.length; i++) {
      const v = state.vehicles[i]
      seen.add(i)

      if (!v.alive) {
        const existing = vehicleMeshes.get(i)
        if (existing) existing.visible = false
        continue
      }

      let group = vehicleMeshes.get(i)
      if (!group) {
        group = createVehicleMesh(v, fbxLoadedGroups)
        entityGroup.add(group)
        vehicleMeshes.set(i, group)
      }

      group.visible = true
      const yPos = v.type === 'helicopter' ? 8 : 0.0
      group.position.set(v.x, yPos, v.y)
      group.rotation.y = -v.angle

      // Spin helicopter rotors
      if (v.type === 'helicopter') {
        const mainRotor = group.getObjectByName('mainRotor')
        if (mainRotor) mainRotor.rotation.z += 0.3
        const tailRotor = group.getObjectByName('tailRotor')
        if (tailRotor) tailRotor.rotation.z += 0.5
      }
    }

    // Remove stale
    for (const [idx, group] of vehicleMeshes) {
      if (!seen.has(idx)) {
        entityGroup.remove(group)
        vehicleMeshes.delete(idx)
      }
    }
  }

  // ── Pickups ───────────────────────────────────────────

  function syncPickups(state: GameState): void {
    const seen = new Set<number>()
    pickupRotation += 0.02

    for (let i = 0; i < state.pickups.length; i++) {
      const p = state.pickups[i]
      seen.add(i)

      if (!p.alive) {
        const existing = pickupMeshes.get(i)
        if (existing) existing.visible = false
        continue
      }

      let mesh = pickupMeshes.get(i)
      if (!mesh) {
        mesh = createPickupMesh(p, sharedGeo)
        entityGroup.add(mesh)
        pickupMeshes.set(i, mesh)
      }

      mesh.visible = true
      mesh.position.set(p.x, 0.5 + Math.sin(pickupRotation + i) * 0.15, p.y)
      mesh.rotation.y = pickupRotation
    }

    // Remove stale
    for (const [idx, mesh] of pickupMeshes) {
      if (!seen.has(idx)) {
        entityGroup.remove(mesh)
        pickupMeshes.delete(idx)
      }
    }
  }

  // ── Bullets ───────────────────────────────────────────

  const bulletMat = new THREE.MeshBasicMaterial({ color: '#ffee44' })
  const bulletTrailMat = new THREE.MeshBasicMaterial({ color: '#ffaa22', transparent: true, opacity: 0.5 })

  function syncBullets(state: GameState): void {
    // Clear previous frame's bullets
    while (bulletGroup.children.length > 0) {
      bulletGroup.remove(bulletGroup.children[0])
    }

    const bulletHeight = PLAYER_HEIGHT * 0.9

    for (const b of state.bullets) {
      // Bullet head
      const mesh = new THREE.Mesh(sharedGeo.bulletSphere, bulletMat)
      mesh.position.set(b.x, bulletHeight, b.y)
      bulletGroup.add(mesh)

      // Short trail behind the bullet (opposite direction of travel)
      const trailLen = 0.4
      const speed = Math.sqrt(b.dx * b.dx + b.dy * b.dy)
      if (speed > 0.01) {
        const nx = -b.dx / speed
        const ny = -b.dy / speed
        const trailGeo = new THREE.CylinderGeometry(0.015, 0.015, trailLen, 4)
        const trail = new THREE.Mesh(trailGeo, bulletTrailMat)
        // Orient the cylinder along the travel direction
        const angle = Math.atan2(ny, nx)
        trail.rotation.z = Math.PI / 2
        trail.rotation.order = 'YXZ'
        trail.position.set(
          b.x + nx * trailLen / 2,
          bulletHeight,
          b.y + ny * trailLen / 2,
        )
        // Rotate the trail to face the correct direction in the XZ plane
        trail.rotation.y = -angle
        bulletGroup.add(trail)
      }
    }
  }

  // ── Capture Points ────────────────────────────────────

  function syncCapturePoints(state: GameState): void {
    const seen = new Set<number>()

    for (const cp of state.capturePoints) {
      seen.add(cp.id)

      let group = capPointMeshes.get(cp.id)
      if (!group) {
        group = createCapturePointMesh(cp, sharedGeo)
        entityGroup.add(group)
        capPointMeshes.set(cp.id, group)
      }

      group.position.set(cp.x, 0, cp.y)

      // Update team colour dynamically
      const ring = group.getObjectByName('cpRing') as THREE.Mesh | undefined
      if (ring) {
        const mat = ring.material as THREE.MeshBasicMaterial
        _tmpColor.set(cpTeamColor(cp.team))
        mat.color.copy(_tmpColor)
        mat.opacity = 0.25 + cp.progress * 0.4
      }
      const flag = group.getObjectByName('cpFlag') as THREE.Mesh | undefined
      if (flag) {
        const mat = flag.material as THREE.MeshStandardMaterial
        _tmpColor.set(cpTeamColor(cp.team))
        mat.color.copy(_tmpColor)
        mat.emissive.copy(_tmpColor)
      }
    }

    // Remove stale
    for (const [id, group] of capPointMeshes) {
      if (!seen.has(id)) {
        entityGroup.remove(group)
        capPointMeshes.delete(id)
      }
    }
  }

  // ═══════════════════════════════════════════════════════
  // Camera
  // ═══════════════════════════════════════════════════════

  function updateCamera(player: Soldier, yaw: number, pitch: number): void {
    const isTPP = player.cameraPerspective === 'tpp'

    // Eye-level position
    let eyeHeight = PLAYER_HEIGHT

    // If riding a vehicle, raise camera
    if (player.vehicleIndex >= 0) {
      eyeHeight = PLAYER_HEIGHT + 1.5
    }

    if (isTPP) {
      // ── Third-Person Perspective ──────────────────────
      const targetX = player.x
      const targetZ = player.y
      const targetY = eyeHeight

      // Camera orbits behind and above player
      const camX = targetX - Math.sin(yaw) * TPP_DISTANCE
      const camZ = targetZ + Math.cos(yaw) * TPP_DISTANCE
      const camY = targetY + TPP_HEIGHT

      if (!tppInitialized) {
        tppCamPos.set(camX, camY, camZ)
        tppCamTarget.set(targetX, targetY, targetZ)
        tppInitialized = true
      } else {
        tppCamPos.lerp(new THREE.Vector3(camX, camY, camZ), TPP_LERP)
        tppCamTarget.lerp(new THREE.Vector3(targetX, targetY, targetZ), TPP_LERP)
      }

      camera.position.copy(tppCamPos)
      camera.lookAt(tppCamTarget)

      // Show weapon group in a different position for TPP
      weaponGroup.visible = false

      // Show local player model in TPP
      let selfMesh = soldierMeshes.get(player.playerIndex)
      if (!selfMesh) {
        selfMesh = createSoldierMesh(player, sharedGeo, fbxLoadedGroups)
        entityGroup.add(selfMesh)
        soldierMeshes.set(player.playerIndex, selfMesh)
      }
      selfMesh.visible = true
      selfMesh.position.set(player.x, 0, player.y)
      selfMesh.rotation.y = -player.angle
    } else {
      // ── First-Person Perspective ──────────────────────
      camera.position.set(player.x, eyeHeight, player.y)
      camera.rotation.y = -yaw
      camera.rotation.x = pitch
      camera.rotation.z = 0
      weaponGroup.visible = true

      // Dead: drift camera upward
      if (!player.alive) {
        camera.position.y += 3
        camera.rotation.x = -0.4
      }
    }
  }

  // ═══════════════════════════════════════════════════════
  // First-person weapon
  // ═══════════════════════════════════════════════════════

  function updateWeapon(): void {
    // Recoil spring-back
    if (weaponRecoil > 0) {
      weaponRecoil = Math.max(0, weaponRecoil - 0.08)
    }

    // Apply recoil offset
    weaponGroup.position.x = weaponRestPos.x
    weaponGroup.position.y = weaponRestPos.y - weaponRecoil * 0.02
    weaponGroup.position.z = weaponRestPos.z + weaponRecoil * 0.06
    weaponGroup.rotation.x = weaponRestRot.x - weaponRecoil * 0.08
    weaponGroup.rotation.y = weaponRestRot.y
    weaponGroup.rotation.z = weaponRestRot.z

    // Muzzle flash brightness
    if (muzzleFlashTimer > 0) {
      muzzleLight.intensity = 3 * (muzzleFlashTimer / 3)
    } else {
      muzzleLight.intensity = 0
    }
  }

  // ═══════════════════════════════════════════════════════
  // Explosion / splash effects
  // ═══════════════════════════════════════════════════════

  const activeExplosions: { mesh: THREE.Mesh; life: number }[] = []

  function spawnExplosion(x: number, z: number): void {
    const geo = new THREE.SphereGeometry(0.5, 8, 6)
    const mat = new THREE.MeshBasicMaterial({
      color: '#ff6600',
      transparent: true,
      opacity: 0.9,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(x, 1.0, z)
    entityGroup.add(mesh)
    activeExplosions.push({ mesh, life: 12 })
  }

  function tickExplosions(): void {
    for (let i = activeExplosions.length - 1; i >= 0; i--) {
      const e = activeExplosions[i]
      e.life--
      const t = 1 - e.life / 12
      const scale = 1 + t * 4
      e.mesh.scale.set(scale, scale, scale)
      ;(e.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 - t)
      if (e.life <= 0) {
        entityGroup.remove(e.mesh)
        e.mesh.geometry.dispose()
        ;(e.mesh.material as THREE.Material).dispose()
        activeExplosions.splice(i, 1)
      }
    }
  }

  // Track bullets from prior frame to detect expiring splash bullets
  let prevBullets: Bullet[] = []

  function detectExplosions(state: GameState): void {
    // Find splash bullets that existed last frame but not this frame
    const currentSet = new Set<string>()
    for (const b of state.bullets) {
      currentSet.add(`${b.owner}_${b.x.toFixed(1)}_${b.y.toFixed(1)}`)
    }

    for (const pb of prevBullets) {
      if (pb.splash && pb.splash > 0) {
        const key = `${pb.owner}_${pb.x.toFixed(1)}_${pb.y.toFixed(1)}`
        if (!currentSet.has(key) && pb.life <= 1) {
          spawnExplosion(pb.x, pb.y)
        }
      }
    }

    prevBullets = state.bullets.map((b) => ({ ...b }))
  }

  // ─── BR visual state ──────────────────────────────────
  const brWeaponPickupRotation = { value: 0 }

  // ═══════════════════════════════════════════════════════
  // syncFrame — main update & render
  // ═══════════════════════════════════════════════════════

  function syncFrame(
    state: GameState,
    playerIdx: number,
    yaw: number,
    pitch: number,
  ): void {
    const player = state.soldiers[playerIdx]
    if (player) {
      updateCamera(player, yaw, pitch)
      // Update weapon model when weapon changes
      const wName = player.weapons[player.weaponIndex] || ''
      updateWeaponModel(wName)
      // ADS FOV zoom
      if (player.isAiming) {
        const targetFov = player.adsFov ?? FOV
        camera.fov += (targetFov - camera.fov) * 0.15
      } else {
        camera.fov += (FOV - camera.fov) * 0.15
      }
      camera.updateProjectionMatrix()
    }

    syncSoldiers(state, playerIdx)
    syncVehicles(state)
    syncPickups(state)
    syncBullets(state)
    syncCapturePoints(state)
    detectExplosions(state)
    tickExplosions()
    updateWeapon()

    // Upgrade prop placeholders to FBX models as they load
    tryUpgradeProps(state)

    // Try to upgrade soldier meshes to FBX models
    tryUpgradeSoldiers(state, playerIdx)

    // BR visuals
    if (state.brState) {
      _syncBRZone(state, entityGroup, zoneRef)
      _syncBRSupplyDrops(state, entityGroup, supplyDropMeshes)
      _syncBRWeaponPickups(state, entityGroup, weaponPickupMeshes, brWeaponPickupRotation)
      _syncBRTraps(state, entityGroup, trapMeshes)
    }

    // Decay muzzle flash timer
    if (muzzleFlashTimer > 0) muzzleFlashTimer--

    // Decay damage flash
    if (_damageFlash > 0) _damageFlash = Math.max(0, _damageFlash - 0.04)

    renderer.render(scene, camera)
  }

  /** Try to upgrade soldier placeholder meshes to FBX character models */
  let _lastSoldierSwapFrame = 0
  function tryUpgradeSoldiers(state: GameState, localPlayerIdx: number): void {
    _lastSoldierSwapFrame++
    if (_lastSoldierSwapFrame < 60) return
    _lastSoldierSwapFrame = 0

    for (const s of state.soldiers) {
      if (s.playerIndex === localPlayerIdx) continue
      const group = soldierMeshes.get(s.playerIndex)
      if (!group || fbxLoadedGroups.has(group)) continue
      const charModel = getCharacterModel(s.team, s.playerIndex)
      if (!isModelReady(charModel)) continue
      const fbx = getModelSync(charModel)
      if (!fbx) continue
      // Remove old children
      while (group.children.length > 0) {
        const child = group.children[0]
        group.remove(child)
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose()
          ;(child.material as THREE.Material)?.dispose()
        }
      }
      fbx.scale.setScalar(0.01)
      fbx.traverse((ch: THREE.Object3D) => {
        if (ch instanceof THREE.Mesh) {
          ch.castShadow = true
          ch.receiveShadow = true
          const mat = ch.material as THREE.MeshStandardMaterial
          if (mat && mat.color) {
            const tint = s.team === 0 ? new THREE.Color('#ff6644') : new THREE.Color('#4488ff')
            mat.color.lerp(tint, 0.15)
          }
        }
      })
      group.add(fbx)
      fbxLoadedGroups.add(group)
    }
  }

  // ═══════════════════════════════════════════════════════
  // triggerShoot
  // ═══════════════════════════════════════════════════════

  function triggerShoot(_weaponName: string): void {
    weaponRecoil = 1
    muzzleFlashTimer = 3
  }

  // ═══════════════════════════════════════════════════════
  // triggerDamageFlash
  // ═══════════════════════════════════════════════════════

  function triggerDamageFlash(): void {
    _damageFlash = 1
  }

  // ═══════════════════════════════════════════════════════
  // resize
  // ═══════════════════════════════════════════════════════

  function resize(w: number, h: number): void {
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }

  // ═══════════════════════════════════════════════════════
  // dispose
  // ═══════════════════════════════════════════════════════

  function dispose(): void {
    // Remove canvas from DOM
    if (renderer.domElement.parentElement) {
      renderer.domElement.parentElement.removeChild(renderer.domElement)
    }

    // Dispose all active explosions
    for (const e of activeExplosions) {
      e.mesh.geometry.dispose()
      ;(e.mesh.material as THREE.Material).dispose()
    }
    activeExplosions.length = 0

    // Traverse and dispose all scene objects
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh) {
        obj.geometry?.dispose()
        if (Array.isArray(obj.material)) {
          for (const m of obj.material) m.dispose()
        } else if (obj.material) {
          (obj.material as THREE.Material).dispose()
        }
      }
      if (obj instanceof THREE.Sprite) {
        obj.material.map?.dispose()
        obj.material.dispose()
      }
    })

    // Clear mesh maps
    soldierMeshes.clear()
    vehicleMeshes.clear()
    pickupMeshes.clear()
    capPointMeshes.clear()
    supplyDropMeshes.clear()
    weaponPickupMeshes.clear()
    trapMeshes.clear()
    zoneRef.mesh = null
    tppInitialized = false

    // Dispose renderer
    renderer.dispose()
  }

  // ═══════════════════════════════════════════════════════
  // getDomElement
  // ═══════════════════════════════════════════════════════

  function getDomElement(): HTMLCanvasElement {
    return renderer.domElement
  }

  // ═══════════════════════════════════════════════════════
  // Public API
  // ═══════════════════════════════════════════════════════

  return {
    buildWorld,
    syncFrame,
    triggerShoot,
    triggerDamageFlash,
    get damageFlash() { return _damageFlash },
    resize,
    dispose,
    getDomElement,
  }
}

export type ThreeEngine = ReturnType<typeof createThreeEngine>
