/**
 * FBX model loading & caching for Warzone FPP.
 *
 * Loads Polygon Heist pack models from public/assets/models/.
 * Provides clone-based instancing for props, characters, weapons, vehicles.
 * Falls back to procedural geometry when a model fails to load.
 */
import * as THREE from 'three'
// @ts-expect-error — three/examples/jsm re-exports
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'

import { ASSET_BASE, VEHICLE_DEFS, CHARACTER_MODELS, TEXTURES } from './assets'

// ─── Caches ──────────────────────────────────────────────
const fbxCache = new Map<string, THREE.Group>()
const textureCache = new Map<string, THREE.Texture>()
const fbxLoader = new FBXLoader()
const textureLoader = new THREE.TextureLoader()

/** Track which models we already attempted (avoid re-trying failures) */
const attempted = new Set<string>()
const failed = new Set<string>()

// ─── Subdirectory mapping ─────────────────────────────────
function getSubdir(modelFilename: string): string {
  if (modelFilename.startsWith('SK_Character_')) return 'Characters'
  if (modelFilename.startsWith('SK_Veh_')) return 'SkeletalVehicles'
  if (modelFilename.startsWith('SK_Wep_')) return 'Skeletal_Weapons'
  // Static meshes/items/props/env are all in FBX subfolder
  return 'FBX'
}

function getFullPath(modelFilename: string): string {
  const subdir = getSubdir(modelFilename)
  return `${ASSET_BASE}/${subdir}/${modelFilename}`
}

// ─── Global scale for Polygon Heist models ───────────────
// These FBX models are typically exported in centimetre units;
// we need to scale them to metre-scale in the Three.js world.
const MODEL_SCALE = 0.01

// ─── Texture loading ─────────────────────────────────────
const _texturesLoaded = { value: false }

export function preloadTextures(): void {
  if (_texturesLoaded.value) return
  _texturesLoaded.value = true
  for (const tex of TEXTURES) {
    if (textureCache.has(tex)) continue
    const path = `${ASSET_BASE}/Textures/${tex}`
    textureLoader.load(
      path,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        textureCache.set(tex, texture)
      },
      undefined,
      () => { /* texture load failure is non-critical */ },
    )
  }
}

/** Get a preloaded texture (or null) */
export function getTexture(name: string): THREE.Texture | null {
  return textureCache.get(name) ?? null
}

// ─── FBX loading (async) ─────────────────────────────────

export async function loadModel(modelFilename: string): Promise<THREE.Group | null> {
  if (failed.has(modelFilename)) return null

  const cached = fbxCache.get(modelFilename)
  if (cached) return cached.clone()

  if (attempted.has(modelFilename)) {
    // Still loading — wait briefly or return null
    return null
  }

  attempted.add(modelFilename)
  const fullPath = getFullPath(modelFilename)

  return new Promise<THREE.Group | null>((resolve) => {
    fbxLoader.load(
      fullPath,
      (model: THREE.Group) => {
        model.scale.setScalar(MODEL_SCALE)
        model.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true
            child.receiveShadow = true
            // Apply first available texture if the mesh has no texture
            if (child.material) {
              const mat = child.material as THREE.MeshStandardMaterial
              if (!mat.map) {
                // Try to assign main character/env texture based on model prefix
                const texName = guessTexture(modelFilename)
                const tex = texName ? textureCache.get(texName) : null
                if (tex) {
                  mat.map = tex
                  mat.needsUpdate = true
                }
              }
            }
          }
        })
        fbxCache.set(modelFilename, model)
        resolve(model.clone())
      },
      undefined,
      () => {
        failed.add(modelFilename)
        resolve(null)
      },
    )
  })
}

/** Fire-and-forget preload for a model. Does not return the result. */
export function preloadModel(modelFilename: string): void {
  if (fbxCache.has(modelFilename) || attempted.has(modelFilename)) return
  loadModel(modelFilename).catch(() => { /* swallow */ })
}

/** Synchronous clone — returns a clone if the model is already cached, or null. */
export function getModelSync(modelFilename: string): THREE.Group | null {
  const cached = fbxCache.get(modelFilename)
  if (cached) return cached.clone()
  // Trigger background load so it'll be ready next frame
  preloadModel(modelFilename)
  return null
}

/** Check if a model is cached and ready for sync cloning. */
export function isModelReady(modelFilename: string): boolean {
  return fbxCache.has(modelFilename)
}

// ─── Texture guessing heuristic ──────────────────────────
function guessTexture(modelFilename: string): string | null {
  if (modelFilename.startsWith('SK_Character_') || modelFilename.startsWith('SM_Item_Hair')
      || modelFilename.startsWith('SM_Item_Mask')) {
    return 'PolygonHeist_Texture_01_A.png'
  }
  if (modelFilename.startsWith('SM_Env_') || modelFilename.startsWith('SM_Prop_')) {
    return 'PolygonHeist_Texture_02_A.png'
  }
  if (modelFilename.startsWith('SK_Wep_') || modelFilename.startsWith('SM_Wep_')) {
    return 'PolygonHeist_Texture_03_A.png'
  }
  if (modelFilename.startsWith('SK_Veh_')) {
    return 'PolygonHeist_Texture_04_A.png'
  }
  return null
}

// ─── Batch preloading for game start ─────────────────────

/** Preload common models used in every match. */
export function preloadCommonModels(): void {
  preloadTextures()

  // Preload character models (first few for quicker start)
  for (const cm of CHARACTER_MODELS.slice(0, 4)) {
    preloadModel(cm)
  }

  // Preload static weapon models (used in first-person view & ground pickups)
  const commonWeapons = [
    'SM_Wep_RifleSwat_01.fbx', 'SM_Wep_SMG_01.fbx', 'SM_Wep_PistolSwat_01.fbx',
    'SM_Wep_Shotgun_01.fbx', 'SM_Wep_SniperSwat_01.fbx',
    'SM_Wep_PistolBandit_01.fbx', 'SM_Wep_RifleBandit_01.fbx',
    'SM_Wep_Grenade_01.fbx', 'SM_Wep_Flashbang_01.fbx',
  ]
  for (const w of commonWeapons) {
    preloadModel(w)
  }

  // Preload common props
  const commonProps = [
    'SM_Prop_Desk_01.fbx', 'SM_Prop_Desk_02.fbx',
    'SM_Prop_ATM_01.fbx', 'SM_Prop_Box_01.fbx',
    'SM_Prop_Table_01.fbx', 'SM_Prop_Couch_01.fbx',
    'SM_Prop_Plant_01.fbx', 'SM_Prop_Plant_02.fbx',
    'SM_Prop_DisplayCase_01.fbx', 'SM_Prop_SafeDepositBoxes_01.fbx',
    'SM_Prop_Camera_01.fbx', 'SM_Prop_Statue_01.fbx',
    'SM_Prop_RopeBarrier_01.fbx', 'SM_Prop_MetalDetector_01.fbx',
    'SM_Prop_Computer_01.fbx', 'SM_Prop_Seat_01.fbx',
    'SM_Prop_Shelf_01.fbx', 'SM_Prop_Sign_Bank_01.fbx',
    'SM_Prop_GoldBar_01.fbx', 'SM_Prop_VaultTrolley_01.fbx',
    'SM_Prop_TellerDesk_01.fbx', 'SM_Prop_Drawers_01.fbx',
    'SM_Prop_Pillar_01.fbx', 'SM_Prop_Rug_01.fbx',
    'SM_Prop_Bin_01.fbx', 'SM_Prop_WaterCooler_01.fbx',
  ]
  for (const p of commonProps) {
    preloadModel(p)
  }

  // Preload vehicle models
  for (const vDef of Object.values(VEHICLE_DEFS)) {
    preloadModel(vDef.model)
  }

  // Preload env models (doors, walls, vault elements)
  const envModels = [
    'SM_Env_VaultDoor_Frame_01.fbx', 'SM_Env_VaultGate_Frame_01.fbx',
    'SM_Env_Door_01.fbx', 'SM_Env_Door_02.fbx', 'SM_Env_Door_Glass_01.fbx',
    'SM_Env_Pillar_01.fbx', 'SM_Env_Pillar_02.fbx',
    'SM_Env_Stairway_01.fbx', 'SM_Env_Railing_01.fbx',
    'SM_Env_Flag_Pole_01.fbx', 'SM_Env_Ceiling_Light_01.fbx',
  ]
  for (const e of envModels) {
    preloadModel(e)
  }

  // Preload item models
  const itemModels = [
    'SM_Item_HealthKit_01.fbx', 'SM_Item_AmmoPack_01.fbx',
    'SM_Item_Briefcase_01.fbx', 'SM_Item_DuffleBag_01.fbx',
    'SM_Item_Bomb_01.fbx', 'SM_Item_Crowbar_01.fbx',
    'SM_Item_Handcuffs_01.fbx', 'SM_Item_WalkieTalkie_01.fbx',
  ]
  for (const item of itemModels) {
    preloadModel(item)
  }
}

// ─── Weapon model name mapping ───────────────────────────
// Map weapon definition model names (SK_) to static mesh equivalents (SM_)

const SK_TO_SM: Record<string, string> = {
  'SK_Wep_RifleSwat_01.fbx': 'SM_Wep_RifleSwat_01.fbx',
  'SK_Wep_RifleBandit_01.fbx': 'SM_Wep_RifleBandit_01.fbx',
  'SK_Wep_SMG_01.fbx': 'SM_Wep_SMG_01.fbx',
  'SK_Wep_Shotgun_01.fbx': 'SM_Wep_Shotgun_01.fbx',
  'SK_Wep_SniperSwat_01.fbx': 'SM_Wep_SniperSwat_01.fbx',
  'SK_Wep_PistolSwat_01.fbx': 'SM_Wep_PistolSwat_01.fbx',
  'SK_Wep_PistolBandit_01.fbx': 'SM_Wep_PistolBandit_01.fbx',
  'SK_Wep_Grenade_Base_01.fbx': 'SM_Wep_Grenade_01.fbx',
  'SK_Wep_Flashbang_Base_01.fbx': 'SM_Wep_Flashbang_01.fbx',
}

/** Get the static mesh (SM_) variant for first-person weapon view */
export function getStaticWeaponModel(skeletalName: string): string {
  return SK_TO_SM[skeletalName] || skeletalName.replace('SK_', 'SM_').replace('_Base_', '_')
}

/** Get character model based on team and index. */
export function getCharacterModel(team: number, index: number): string {
  if (team === 1) {
    // Police/SWAT team
    const policeModels = CHARACTER_MODELS.filter(m =>
      m.includes('SWAT') || m.includes('FBI'))
    return policeModels[index % policeModels.length]
  }
  // Robbers
  const robberModels = CHARACTER_MODELS.filter(m =>
    m.includes('Overall') || m.includes('Shirt') || m.includes('SuitVest'))
  return robberModels[index % robberModels.length]
}
