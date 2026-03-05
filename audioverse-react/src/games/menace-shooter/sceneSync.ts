/**
 * sceneSync.ts — Sync Menace 3D game state to Three.js objects.
 *
 * Loads GLB models from the Post-Apocalyptic World asset pack,
 * creates procedural meshes for buildings/roads/water,
 * and updates all positions every frame.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { SceneContext } from './sceneSetup'
import type { GameState, Vehicle, PropType } from './types'
import { PLAYER_RADIUS } from './constants'

// ── Asset base path ─────────────────────────────────────
const BASE = '/assets/models/Low-Poly/Post-Apocalyptic World/'

const MODEL_PATHS: Record<string, string> = {
  barrel: `${BASE}3. Models/gltf/barrel.glb`,
  tire: `${BASE}3. Models/gltf/tire.glb`,
  wall: `${BASE}3. Models/gltf/wall_1.glb`,
  barricade: `${BASE}3. Models/gltf/wooden_spike_barricade.glb`,
  electric_pole: `${BASE}3. Models/gltf/electric_pole_1.glb`,
  car: `${BASE}3. Models/gltf/car.glb`,
  car_wreck: `${BASE}PLUS/gltf/car_wreck_1.glb`,
  gas_station: `${BASE}PLUS/gltf/gas_Station_building_1.glb`,
  pharmacy: `${BASE}PLUS/gltf/pharmacy_building.glb`,
  bunker: `${BASE}PLUS/Textured Models/gltf/Bunker1.glb`,
  tree_1: `${BASE}PLUS/Plain Models/gltf/tree_1_a.glb`,
  tree_2: `${BASE}PLUS/Plain Models/gltf/tree_2_a.glb`,
  tree_3: `${BASE}PLUS/Plain Models/gltf/tree_3_a.glb`,
  bush: `${BASE}FREE/gltf/bush_1.glb`,
  burning_barrel: `${BASE}PLUS/Plain Models/gltf/burning_barell.glb`,
  rubble: `${BASE}PLUS/gltf/rubble_1.glb`,
  spike: `${BASE}PLUS/gltf/spike.glb`,
  road_barrier: `${BASE}FREE/gltf/road_barrier.glb`,
  campfire: `${BASE}PLUS/Plain Models/gltf/campfire.glb`,
  crate: `${BASE}3. Models/gltf/box_1.glb`,
  medpack: `${BASE}FREE/gltf/medpack_1.glb`,
  propane: `${BASE}PLUS/gltf/propane_tank.glb`,
  pickup_truck: `${BASE}PLUS/Plain Models/gltf/pickup_1.glb`,
  tent: `${BASE}PLUS/Plain Models/gltf/tent.glb`,
  dumpster: `${BASE}PLUS/gltf/barrel_damaged_blue.glb`,
}

// ── Cache & loader ────────────────────────────────────────
const loader = new GLTFLoader()
const modelCache = new Map<string, THREE.Object3D>()
const loadPromises = new Map<string, Promise<THREE.Object3D>>()

function loadModel(key: string): Promise<THREE.Object3D> {
  if (modelCache.has(key)) return Promise.resolve(modelCache.get(key)!)
  if (loadPromises.has(key)) return loadPromises.get(key)!

  const path = MODEL_PATHS[key]
  if (!path) return Promise.resolve(new THREE.Object3D())

  const prom = new Promise<THREE.Object3D>((resolve) => {
    loader.load(
      path,
      (gltf) => {
        const obj = gltf.scene
        obj.traverse(child => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })
        modelCache.set(key, obj)
        resolve(obj)
      },
      undefined,
      () => {
        // Fallback: empty object
        const fallback = new THREE.Object3D()
        modelCache.set(key, fallback)
        resolve(fallback)
      },
    )
  })
  loadPromises.set(key, prom)
  return prom
}

function getModelClone(key: string): THREE.Object3D {
  const cached = modelCache.get(key)
  if (cached) return cached.clone()
  return new THREE.Object3D() // Not loaded yet — placeholder
}

// ── Materials ─────────────────────────────────────────────
function buildingMat(color: string) {
  return new THREE.MeshStandardMaterial({
    color, roughness: 0.85, metalness: 0.1,
  })
}

const roadMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.95, metalness: 0 })
const waterMat = new THREE.MeshStandardMaterial({
  color: 0x2a6e5e, roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.75,
})
const parkMat = new THREE.MeshStandardMaterial({ color: 0x4a6e3a, roughness: 0.95, metalness: 0 })
const bulletMat = new THREE.MeshStandardMaterial({ color: 0xffdd44, emissive: 0xff8800, emissiveIntensity: 0.8, metalness: 0.5, roughness: 0.3 })
const explosionMat = new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 2, transparent: true, opacity: 0.7 })
const policeMat = new THREE.MeshStandardMaterial({ color: 0x3344cc, roughness: 0.6, metalness: 0.2 })
const npcMat = new THREE.MeshStandardMaterial({ color: 0x886644, roughness: 0.7, metalness: 0.1 })

const pickupColors: Record<string, number> = {
  pistol: 0xcccccc, shotgun: 0x996633, machinegun: 0x449944, rocket: 0xcc4444,
  flamethrower: 0xff6600, health: 0x44cc44, armor: 0x4488ff, speed: 0xffcc00,
  coins: 0xffdd00, gems: 0xaa44ff,
}

// ── Shared geometries ─────────────────────────────────────
const bulletGeo = new THREE.SphereGeometry(0.6, 6, 4)
const explosionGeo = new THREE.SphereGeometry(1, 12, 8)
const pickupGeo = new THREE.OctahedronGeometry(2, 0)

// ── Scene Sync State ──────────────────────────────────────
export interface SyncState {
  initialized: boolean
  groundPlane: THREE.Mesh | null
  buildingMeshes: THREE.Mesh[]
  roadMeshes: THREE.Mesh[]
  waterMeshes: THREE.Mesh[]
  parkMeshes: THREE.Mesh[]
  propObjects: THREE.Object3D[]
  playerMeshes: (THREE.Group | null)[]
  vehicleMeshes: (THREE.Group | null)[]
  npcMeshes: THREE.Group[]
  bulletMeshes: THREE.Mesh[]
  explosionMeshes: THREE.Mesh[]
  policeMeshes: THREE.Group[]
  pickupMeshes: THREE.Group[]
  missionMarkers: THREE.Mesh[]
  dirty: boolean
}

export function createSyncState(): SyncState {
  return {
    initialized: false,
    groundPlane: null,
    buildingMeshes: [],
    roadMeshes: [],
    waterMeshes: [],
    parkMeshes: [],
    propObjects: [],
    playerMeshes: [],
    vehicleMeshes: [],
    npcMeshes: [],
    bulletMeshes: [],
    explosionMeshes: [],
    policeMeshes: [],
    pickupMeshes: [],
    missionMarkers: [],
    dirty: true,
  }
}

// ── Preload key models ────────────────────────────────────
export async function preloadModels() {
  const keys = [
    'barrel', 'tire', 'barricade', 'electric_pole', 'car',
    'car_wreck', 'bush', 'tree_1', 'tree_2', 'tree_3',
    'burning_barrel', 'rubble', 'spike', 'campfire', 'crate',
    'dumpster', 'medpack', 'road_barrier', 'pickup_truck',
    'gas_station', 'pharmacy', 'bunker',
  ]
  await Promise.all(keys.map(k => loadModel(k)))
}

// ── Create procedural character ───────────────────────────
function createCharacter(color: number | string, scale = 1): THREE.Group {
  const g = new THREE.Group()
  const c = new THREE.Color(color)

  // Body (capsule-like)
  const bodyGeo = new THREE.CylinderGeometry(PLAYER_RADIUS * 0.5 * scale, PLAYER_RADIUS * 0.6 * scale, PLAYER_RADIUS * 2 * scale, 8)
  const bodyMat = new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, metalness: 0.1 })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = PLAYER_RADIUS * 1.2 * scale
  body.castShadow = true
  g.add(body)

  // Head
  const headGeo = new THREE.SphereGeometry(PLAYER_RADIUS * 0.4 * scale, 8, 6)
  const headMat = new THREE.MeshStandardMaterial({ color: 0xddbb88, roughness: 0.7, metalness: 0 })
  const head = new THREE.Mesh(headGeo, headMat)
  head.position.y = PLAYER_RADIUS * 2.5 * scale
  head.castShadow = true
  g.add(head)

  // Direction indicator (nose / gun arm)
  const armGeo = new THREE.BoxGeometry(PLAYER_RADIUS * 0.2 * scale, PLAYER_RADIUS * 0.2 * scale, PLAYER_RADIUS * 1.2 * scale)
  const arm = new THREE.Mesh(armGeo, bodyMat)
  arm.position.set(0, PLAYER_RADIUS * 1.3 * scale, PLAYER_RADIUS * 0.8 * scale)
  arm.castShadow = true
  g.add(arm)

  return g
}

// ── Create procedural vehicle ─────────────────────────────
function createVehicleMesh(v: Vehicle): THREE.Group {
  const g = new THREE.Group()
  const color = new THREE.Color(v.color)
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.3 })

  if (v.kind === 'helicopter') {
    // Fuselage
    const fuse = new THREE.Mesh(new THREE.BoxGeometry(v.width * 0.8, 4, v.length * 0.9), mat)
    fuse.position.y = 2
    fuse.castShadow = true
    g.add(fuse)
    // Tail boom
    const tail = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, v.length * 0.5), mat)
    tail.position.set(0, 3, -v.length * 0.6)
    g.add(tail)
    // Main rotor
    const rotorGeo = new THREE.BoxGeometry(v.width * 2, 0.3, 1.5)
    const rotorMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.3, metalness: 0.7 })
    const rotor = new THREE.Mesh(rotorGeo, rotorMat)
    rotor.position.y = 5; rotor.name = 'rotor'
    g.add(rotor)
    return g
  }

  if (v.kind === 'boat') {
    // Hull
    const hull = new THREE.Mesh(new THREE.BoxGeometry(v.width, 2, v.length), mat)
    hull.position.y = 0.5
    hull.castShadow = true
    g.add(hull)
    // Windshield
    const windshield = new THREE.Mesh(
      new THREE.BoxGeometry(v.width * 0.6, 2, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x88aacc, transparent: true, opacity: 0.5, metalness: 0.5 }),
    )
    windshield.position.set(0, 2.5, v.length * 0.15)
    g.add(windshield)
    return g
  }

  // Ground vehicles (car/truck/bike/tank)
  const bodyH = v.kind === 'tank' ? 4 : v.kind === 'truck' ? 5 : 3
  const bodyGeo = new THREE.BoxGeometry(v.width, bodyH, v.length)
  const body = new THREE.Mesh(bodyGeo, mat)
  body.position.y = bodyH / 2 + 1
  body.castShadow = true
  g.add(body)

  if (v.kind === 'tank') {
    // Turret
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.5, 2.5, 8), mat)
    turret.position.y = bodyH + 2.5
    turret.castShadow = true
    g.add(turret)
    // Barrel
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.3 }),
    )
    barrel.rotation.x = Math.PI / 2
    barrel.position.set(0, bodyH + 2.5, v.length * 0.5)
    g.add(barrel)
  } else {
    // Windshield
    const windshield = new THREE.Mesh(
      new THREE.BoxGeometry(v.width * 0.8, bodyH * 0.5, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x88aacc, transparent: true, opacity: 0.5, metalness: 0.5 }),
    )
    windshield.position.set(0, bodyH + 1, v.length * 0.2)
    g.add(windshield)
  }

  // Wheels
  if (v.kind !== 'tank') {
    const wheelGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.8, 8)
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 })
    const positions = [
      [-v.width / 2 - 0.3, 1.2, v.length * 0.3],
      [v.width / 2 + 0.3, 1.2, v.length * 0.3],
      [-v.width / 2 - 0.3, 1.2, -v.length * 0.3],
      [v.width / 2 + 0.3, 1.2, -v.length * 0.3],
    ]
    for (const [wx, wy, wz] of positions) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat)
      wheel.position.set(wx, wy, wz)
      wheel.rotation.z = Math.PI / 2
      wheel.castShadow = true
      g.add(wheel)
    }
  } else {
    // Tank treads (simplified)
    const treadGeo = new THREE.BoxGeometry(1.5, 2, v.length * 0.9)
    const treadMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 })
    const tL = new THREE.Mesh(treadGeo, treadMat)
    tL.position.set(-v.width / 2 - 0.5, 1.5, 0)
    g.add(tL)
    const tR = new THREE.Mesh(treadGeo, treadMat)
    tR.position.set(v.width / 2 + 0.5, 1.5, 0)
    g.add(tR)
  }

  return g
}

// ── Prop to model key mapping ─────────────────────────────
function propModelKey(t: PropType): string {
  switch (t) {
    case 'barrel': return 'barrel'
    case 'tire': return 'tire'
    case 'rubble': return 'rubble'
    case 'dumpster': return 'dumpster'
    case 'burning_barrel': return 'burning_barrel'
    case 'barricade': return 'barricade'
    case 'electric_pole': return 'electric_pole'
    case 'tree': return `tree_${(Math.floor(Math.random() * 3) + 1)}`
    case 'bush': return 'bush'
    case 'campfire': return 'campfire'
    case 'spike': return 'spike'
    case 'car_wreck': return 'car_wreck'
    case 'crate': return 'crate'
  }
}

// ── Initialize static scene (buildings, roads, etc.) ──────
export function initStaticScene(ctx: SceneContext, st: GameState, sync: SyncState) {
  const { scene } = ctx

  // ── Ground plane ────────────────────────────────────────
  const groundGeo = new THREE.PlaneGeometry(st.level.worldW, st.level.worldH)
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x665544, roughness: 0.95, metalness: 0 })
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.position.set(st.level.worldW / 2, -0.05, st.level.worldH / 2)
  ground.receiveShadow = true
  scene.add(ground)
  sync.groundPlane = ground

  // ── Roads ───────────────────────────────────────────────
  for (const road of st.level.roads) {
    const geo = new THREE.PlaneGeometry(road.w, road.h)
    const mesh = new THREE.Mesh(geo, roadMat)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.set(road.x + road.w / 2, 0.02, road.y + road.h / 2)
    mesh.receiveShadow = true
    scene.add(mesh)
    sync.roadMeshes.push(mesh)

    // Road stripes
    if (road.w > road.h) {
      // Horizontal road — dashed center line
      for (let sx = road.x + 10; sx < road.x + road.w; sx += 20) {
        const stripe = new THREE.Mesh(
          new THREE.PlaneGeometry(8, 0.8),
          new THREE.MeshStandardMaterial({ color: 0x888866, roughness: 0.8 }),
        )
        stripe.rotation.x = -Math.PI / 2
        stripe.position.set(sx, 0.04, road.y + road.h / 2)
        scene.add(stripe)
      }
    } else {
      for (let sy = road.y + 10; sy < road.y + road.h; sy += 20) {
        const stripe = new THREE.Mesh(
          new THREE.PlaneGeometry(0.8, 8),
          new THREE.MeshStandardMaterial({ color: 0x888866, roughness: 0.8 }),
        )
        stripe.rotation.x = -Math.PI / 2
        stripe.position.set(road.x + road.w / 2, 0.04, sy)
        scene.add(stripe)
      }
    }
  }

  // ── Buildings ───────────────────────────────────────────
  for (const b of st.level.buildings) {
    const geo = new THREE.BoxGeometry(b.w, b.height, b.h)
    const mat = buildingMat(b.color)
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(b.x + b.w / 2, b.height / 2, b.y + b.h / 2)
    mesh.castShadow = true
    mesh.receiveShadow = true
    scene.add(mesh)
    sync.buildingMeshes.push(mesh)

    // Roof detail — flat darker plane on top
    const roofGeo = new THREE.PlaneGeometry(b.w * 0.95, b.h * 0.95)
    const roofMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(b.color).multiplyScalar(0.7), roughness: 0.9,
    })
    const roof = new THREE.Mesh(roofGeo, roofMat)
    roof.rotation.x = -Math.PI / 2
    roof.position.set(b.x + b.w / 2, b.height + 0.05, b.y + b.h / 2)
    scene.add(roof)

    // Window dots on side faces
    const windowColor = Math.random() < 0.6 ? 0x334455 : 0xddcc88
    const wMat = new THREE.MeshStandardMaterial({
      color: windowColor, emissive: windowColor === 0xddcc88 ? 0xaa8844 : 0x000000,
      emissiveIntensity: 0.4, roughness: 0.5,
    })
    const wGeo = new THREE.PlaneGeometry(2, 2.5)

    for (let floor = 0; floor < b.floors; floor++) {
      const yPos = floor * (b.height / b.floors) + (b.height / b.floors) * 0.5
      // Front face windows
      for (let wx = b.x + 5; wx < b.x + b.w - 3; wx += 8) {
        const win = new THREE.Mesh(wGeo, wMat)
        win.position.set(wx, yPos, b.y + b.h + 0.1)
        scene.add(win)
      }
      // Right side windows
      for (let wz = b.y + 5; wz < b.y + b.h - 3; wz += 8) {
        const win = new THREE.Mesh(wGeo, wMat)
        win.rotation.y = Math.PI / 2
        win.position.set(b.x + b.w + 0.1, yPos, wz)
        scene.add(win)
      }
    }
  }

  // ── Water zones ─────────────────────────────────────────
  for (const wz of st.level.waterZones) {
    const geo = new THREE.PlaneGeometry(wz.w, wz.h)
    const mesh = new THREE.Mesh(geo, waterMat.clone())
    mesh.rotation.x = -Math.PI / 2
    mesh.position.set(wz.x + wz.w / 2, 0.1, wz.y + wz.h / 2)
    mesh.receiveShadow = true
    scene.add(mesh)
    sync.waterMeshes.push(mesh)
  }

  // ── Parks ───────────────────────────────────────────────
  for (const pk of st.level.parks) {
    const geo = new THREE.PlaneGeometry(pk.w, pk.h)
    const mesh = new THREE.Mesh(geo, parkMat)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.set(pk.x + pk.w / 2, 0.03, pk.y + pk.h / 2)
    mesh.receiveShadow = true
    scene.add(mesh)
    sync.parkMeshes.push(mesh)
  }

  // ── Props (GLB or fallback) ─────────────────────────────
  for (const prop of st.level.props) {
    const key = propModelKey(prop.type)
    const obj = getModelClone(key)

    // Scale down models to fit game scale
    let s = 4
    if (prop.type === 'tree') s = 8
    else if (prop.type === 'bush') s = 3
    else if (prop.type === 'electric_pole') s = 6
    else if (prop.type === 'car_wreck') s = 5
    else if (prop.type === 'barricade') s = 4
    obj.scale.setScalar(s)

    obj.position.set(prop.x, 0, prop.y)
    obj.rotation.y = prop.angle

    // Fallback if model didn't load: colored box
    if (obj.children.length === 0) {
      const fallbackGeo = new THREE.BoxGeometry(3, 3, 3)
      const fallbackMat = new THREE.MeshStandardMaterial({ color: 0x886644, roughness: 0.9 })
      const fallback = new THREE.Mesh(fallbackGeo, fallbackMat)
      fallback.position.y = 1.5
      fallback.castShadow = true
      obj.add(fallback)
    }

    scene.add(obj)
    sync.propObjects.push(obj)
  }

  sync.initialized = true
}

// ── Create / update dynamic meshes per frame ──────────────
export function syncScene(ctx: SceneContext, st: GameState, sync: SyncState) {
  const { scene } = ctx

  // ── Players ─────────────────────────────────────────────
  // Ensure enough player meshes
  while (sync.playerMeshes.length < st.players.length) {
    sync.playerMeshes.push(null)
  }
  for (let i = 0; i < st.players.length; i++) {
    const p = st.players[i]
    if (!p.alive) {
      if (sync.playerMeshes[i]) {
        sync.playerMeshes[i]!.visible = false
      }
      continue
    }
    // In vehicle — hide character
    if (p.inVehicle !== null) {
      if (sync.playerMeshes[i]) sync.playerMeshes[i]!.visible = false
      continue
    }

    if (!sync.playerMeshes[i]) {
      const mesh = createCharacter(p.color)
      scene.add(mesh)
      sync.playerMeshes[i] = mesh
    }
    const mesh = sync.playerMeshes[i]!
    mesh.visible = true
    mesh.position.set(p.x, p.z, p.y)
    mesh.rotation.y = -p.angle + Math.PI / 2
  }

  // ── Vehicles ────────────────────────────────────────────
  while (sync.vehicleMeshes.length < st.vehicles.length) {
    sync.vehicleMeshes.push(null)
  }
  for (let i = 0; i < st.vehicles.length; i++) {
    const v = st.vehicles[i]
    if (!sync.vehicleMeshes[i]) {
      const mesh = createVehicleMesh(v)
      scene.add(mesh)
      sync.vehicleMeshes[i] = mesh
    }
    const mesh = sync.vehicleMeshes[i]!
    mesh.visible = v.hp > 0
    mesh.position.set(v.x, v.altitude || 0, v.y)
    mesh.rotation.y = -v.angle + Math.PI / 2

    // Spin helicopter rotor
    if (v.kind === 'helicopter') {
      const rotor = mesh.getObjectByName('rotor')
      if (rotor) {
        rotor.rotation.y += v.driver !== null ? 0.4 : 0.05
      }
    }
  }

  // ── NPCs ────────────────────────────────────────────────
  // Grow/shrink pool
  while (sync.npcMeshes.length < st.npcs.length) {
    const mesh = createCharacter(npcMat.color.getHex(), 0.8)
    scene.add(mesh)
    sync.npcMeshes.push(mesh)
  }
  while (sync.npcMeshes.length > st.npcs.length) {
    const m = sync.npcMeshes.pop()!
    scene.remove(m)
    disposeGroup(m)
  }
  for (let i = 0; i < st.npcs.length; i++) {
    const npc = st.npcs[i]
    sync.npcMeshes[i].position.set(npc.x, 0, npc.y)
    sync.npcMeshes[i].rotation.y = -npc.angle + Math.PI / 2
  }

  // ── Police ──────────────────────────────────────────────
  while (sync.policeMeshes.length < st.police.length) {
    const mesh = createCharacter(policeMat.color.getHex(), 0.9)
    scene.add(mesh)
    sync.policeMeshes.push(mesh)
  }
  while (sync.policeMeshes.length > st.police.length) {
    const m = sync.policeMeshes.pop()!
    scene.remove(m)
    disposeGroup(m)
  }
  for (let i = 0; i < st.police.length; i++) {
    const po = st.police[i]
    sync.policeMeshes[i].position.set(po.x, 0, po.y)
    sync.policeMeshes[i].rotation.y = -po.angle + Math.PI / 2
    sync.policeMeshes[i].scale.setScalar(po.type === 'swat' ? 1.3 : 1)
  }

  // ── Bullets ─────────────────────────────────────────────
  while (sync.bulletMeshes.length < st.bullets.length) {
    const mesh = new THREE.Mesh(bulletGeo, bulletMat.clone())
    mesh.castShadow = false
    scene.add(mesh)
    sync.bulletMeshes.push(mesh)
  }
  while (sync.bulletMeshes.length > st.bullets.length) {
    const m = sync.bulletMeshes.pop()!
    scene.remove(m)
    m.geometry.dispose()
  }
  for (let i = 0; i < st.bullets.length; i++) {
    const b = st.bullets[i]
    sync.bulletMeshes[i].position.set(b.x, b.z + 2, b.y)
    const scale = b.weaponType === 'rocket' ? 3 : b.weaponType === 'flamethrower' ? 2 : 1
    sync.bulletMeshes[i].scale.setScalar(scale)

    // Color by weapon type
    const bm = sync.bulletMeshes[i].material as THREE.MeshStandardMaterial
    if (b.weaponType === 'rocket') { bm.color.set(0xff4400); bm.emissive.set(0xff2200) }
    else if (b.weaponType === 'flamethrower') { bm.color.set(0xff8800); bm.emissive.set(0xff4400) }
    else if (b.weaponType === 'shotgun') { bm.color.set(0xffcc44); bm.emissive.set(0xaa6600) }
    else { bm.color.set(0xffdd44); bm.emissive.set(0xff8800) }
  }

  // ── Explosions ──────────────────────────────────────────
  while (sync.explosionMeshes.length < st.explosions.length) {
    const mesh = new THREE.Mesh(explosionGeo, explosionMat.clone())
    scene.add(mesh)
    sync.explosionMeshes.push(mesh)
  }
  while (sync.explosionMeshes.length > st.explosions.length) {
    const m = sync.explosionMeshes.pop()!
    scene.remove(m)
  }
  for (let i = 0; i < st.explosions.length; i++) {
    const ex = st.explosions[i]
    const progress = 1 - ex.timer / ex.maxTimer
    sync.explosionMeshes[i].position.set(ex.x, ex.z + 3, ex.y)
    sync.explosionMeshes[i].scale.setScalar(ex.radius * (0.3 + progress * 0.7))
    const em = sync.explosionMeshes[i].material as THREE.MeshStandardMaterial
    em.opacity = 0.8 * (1 - progress)
  }

  // ── Pickups ─────────────────────────────────────────────
  while (sync.pickupMeshes.length < st.pickups.length) {
    const g = new THREE.Group()
    const mat2 = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x444444, emissiveIntensity: 0.6, roughness: 0.3 })
    const mesh = new THREE.Mesh(pickupGeo, mat2)
    mesh.castShadow = true
    g.add(mesh)
    scene.add(g)
    sync.pickupMeshes.push(g)
  }
  for (let i = 0; i < st.pickups.length; i++) {
    const pk = st.pickups[i]
    const g = sync.pickupMeshes[i]
    g.visible = !pk.collected
    g.position.set(pk.x, 3 + Math.sin(st.frame * 0.05 + i) * 1.5, pk.y)
    g.rotation.y = st.frame * 0.03 + i
    // Color
    const mesh = g.children[0] as THREE.Mesh
    const mat2 = mesh.material as THREE.MeshStandardMaterial
    mat2.color.set(pickupColors[pk.kind] || 0xffffff)
    mat2.emissive.set(pickupColors[pk.kind] || 0x444444)
  }

  // ── Mission markers ─────────────────────────────────────
  while (sync.missionMarkers.length < st.missions.length * 2) {
    const geo = new THREE.ConeGeometry(3, 8, 4)
    const mat2 = new THREE.MeshStandardMaterial({ color: 0x44ff44, emissive: 0x22aa22, emissiveIntensity: 0.8, transparent: true, opacity: 0.7 })
    const mesh = new THREE.Mesh(geo, mat2)
    mesh.castShadow = false
    scene.add(mesh)
    sync.missionMarkers.push(mesh)
  }
  for (let i = 0; i < st.missions.length; i++) {
    const m = st.missions[i]
    const startMarker = sync.missionMarkers[i * 2]
    const endMarker = sync.missionMarkers[i * 2 + 1]

    startMarker.visible = m.active && m.assignedTo === null
    startMarker.position.set(m.x, 15 + Math.sin(st.frame * 0.04) * 3, m.y)
    startMarker.rotation.x = Math.PI // point downward
    startMarker.rotation.y = st.frame * 0.02

    endMarker.visible = m.active && m.assignedTo !== null
    endMarker.position.set(m.targetX, 15 + Math.sin(st.frame * 0.04 + 1) * 3, m.targetY)
    endMarker.rotation.x = Math.PI
    endMarker.rotation.y = st.frame * 0.02
    const mat3 = endMarker.material as THREE.MeshStandardMaterial
    mat3.color.set(0xffaa00); mat3.emissive.set(0xaa6600)
  }

  // ── Water animation ─────────────────────────────────────
  for (const wm of sync.waterMeshes) {
    wm.position.y = 0.1 + Math.sin(st.frame * 0.02) * 0.3
  }

  // ── Day/Night cycle lighting ────────────────────────────
  updateDayNight(ctx, st.dayNightCycle)

  // ── Destroyed buildings visibility ──────────────────────
  for (let i = 0; i < st.level.buildings.length && i < sync.buildingMeshes.length; i++) {
    sync.buildingMeshes[i].visible = !st.level.buildings[i].destroyed
  }
}

// ── Day/Night cycle ───────────────────────────────────────
function updateDayNight(ctx: SceneContext, cycle: number) {
  // cycle 0..1: 0=dawn, 0.25=noon, 0.5=dusk, 0.75=midnight
  const sunIntensity = Math.max(0.15, Math.cos(cycle * Math.PI * 2) * 0.5 + 0.5)
  ctx.dirLight.intensity = 0.3 + sunIntensity * 1.2

  const ambientBase = 0.15 + sunIntensity * 0.5
  ctx.ambientLight.intensity = ambientBase

  // Sky color shift
  const skyR = 0.35 + sunIntensity * 0.35
  const skyG = 0.30 + sunIntensity * 0.20
  const skyB = 0.25 + sunIntensity * 0.25
  ctx.scene.background = new THREE.Color(skyR, skyG, skyB)
  if (ctx.scene.fog instanceof THREE.FogExp2) {
    ctx.scene.fog.color.set(skyR, skyG, skyB)
  }
}

// ── Dispose helpers ───────────────────────────────────────
function disposeGroup(g: THREE.Group | THREE.Object3D) {
  g.traverse(obj => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose()
      if (obj.material instanceof THREE.Material) obj.material.dispose()
      if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
    }
  })
}

export function disposeSyncState(scene: THREE.Scene, sync: SyncState) {
  const removeAll = (arr: (THREE.Object3D | null)[]) => {
    for (const obj of arr) {
      if (!obj) continue
      scene.remove(obj)
      disposeGroup(obj)
    }
    arr.length = 0
  }

  if (sync.groundPlane) { scene.remove(sync.groundPlane); sync.groundPlane = null }
  removeAll(sync.buildingMeshes)
  removeAll(sync.roadMeshes)
  removeAll(sync.waterMeshes)
  removeAll(sync.parkMeshes)
  removeAll(sync.propObjects)
  removeAll(sync.playerMeshes)
  removeAll(sync.vehicleMeshes)
  removeAll(sync.npcMeshes)
  removeAll(sync.bulletMeshes)
  removeAll(sync.explosionMeshes)
  removeAll(sync.policeMeshes)
  removeAll(sync.pickupMeshes)
  removeAll(sync.missionMarkers)
}
