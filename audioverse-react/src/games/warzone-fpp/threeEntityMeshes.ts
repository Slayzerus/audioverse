/**
 * Entity mesh creation functions for the Three.js Warzone FPP engine.
 * Extracted from threeEngine.ts for modularity.
 */

import * as THREE from 'three'
import type { Soldier, Vehicle, Pickup, CapturePoint } from './types'
import { getModelSync, getCharacterModel } from './modelManager'

/** Shape of the shared geometry pool from threeEngine */
export interface SharedGeo {
  soldierBody: THREE.CylinderGeometry
  soldierHead: THREE.SphereGeometry
  bulletSphere: THREE.SphereGeometry
  pickupBox: THREE.BoxGeometry
  pickupOcta: THREE.OctahedronGeometry
  flagPole: THREE.CylinderGeometry
  flagBox: THREE.BoxGeometry
  capRing: THREE.RingGeometry
}

export function cpTeamColor(team: number): string {
  if (team === 0) return '#cc3333'
  if (team === 1) return '#3366ff'
  return '#999999'
}

export function createSoldierMesh(
  s: Soldier,
  sharedGeo: SharedGeo,
  fbxLoadedGroups: WeakSet<THREE.Group>,
): THREE.Group {
  const group = new THREE.Group()

  // Try to load FBX character model
  const charModel = getCharacterModel(s.team, s.playerIndex)
  const fbx = getModelSync(charModel)
  if (fbx) {
    // Scale: models are ~170cm in FBX units → 0.01 scale → 1.7 units
    fbx.scale.setScalar(0.01)
    fbx.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        // Tint team colour slightly
        const mat = child.material as THREE.MeshStandardMaterial
        if (mat && mat.color) {
          const tint = s.team === 0 ? new THREE.Color('#ff6644') : new THREE.Color('#4488ff')
          mat.color.lerp(tint, 0.15)
        }
      }
    })
    group.add(fbx)
    fbxLoadedGroups.add(group)
  } else {
    // Fallback: procedural geometry
    const bodyColor = s.team === 0 ? '#333333' : '#2244AA'
    const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.8 })
    const body = new THREE.Mesh(sharedGeo.soldierBody, bodyMat)
    body.position.y = 0.6
    body.castShadow = true
    group.add(body)

    const skinMat = new THREE.MeshStandardMaterial({ color: '#d4a574', roughness: 0.7 })
    const head = new THREE.Mesh(sharedGeo.soldierHead, skinMat)
    head.position.y = 1.45
    head.castShadow = true
    group.add(head)

    const armbandColor = s.team === 0 ? '#cc3333' : '#3366ff'
    const armband = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.08, 8),
      new THREE.MeshStandardMaterial({ color: armbandColor, emissive: armbandColor, emissiveIntensity: 0.3 }),
    )
    armband.position.y = 0.95
    group.add(armband)
  }

  return group
}

export function createVehicleMesh(
  v: Vehicle,
  fbxLoadedGroups: WeakSet<THREE.Group>,
): THREE.Group {
  const group = new THREE.Group()

  // Try FBX model first
  const modelFile = v.model
  if (modelFile) {
    const fbx = getModelSync(modelFile)
    if (fbx) {
      // Scale to ~3m length
      const box = new THREE.Box3().setFromObject(fbx)
      const size = box.getSize(new THREE.Vector3())
      const targetLen = v.type === 'tank' ? 4.0 : v.type === 'helicopter' ? 5.0 : 3.5
      const scale = targetLen / Math.max(size.x, size.z, 0.01)
      fbx.scale.multiplyScalar(scale)
      fbx.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      group.add(fbx)
      fbxLoadedGroups.add(group)
      return group
    }
  }

  // Fallback: procedural geometry
  const teamColor = v.team === 0 ? '#553333' : v.team === 1 ? '#334466' : '#666666'
  const mat = new THREE.MeshStandardMaterial({ color: teamColor, roughness: 0.5, metalness: 0.3 })

  switch (v.type) {
    case 'jeep': {
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.0, 1.5), mat)
      chassis.position.y = 0.5
      chassis.castShadow = true
      group.add(chassis)

      // Windshield
      const glassMat = new THREE.MeshStandardMaterial({ color: '#88bbdd', transparent: true, opacity: 0.6 })
      const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 1.2), glassMat)
      windshield.position.set(0.8, 1.0, 0)
      group.add(windshield)

      // Wheels (4)
      const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.15, 8)
      const wheelMat = new THREE.MeshStandardMaterial({ color: '#1a1a1a' })
      const offsets: [number, number, number][] = [
        [-0.8, 0.3, 0.8], [-0.8, 0.3, -0.8],
        [0.8, 0.3, 0.8],  [0.8, 0.3, -0.8],
      ]
      for (const [wx, wy, wz] of offsets) {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat)
        wheel.rotation.x = Math.PI / 2
        wheel.position.set(wx, wy, wz)
        group.add(wheel)
      }
      break
    }

    case 'tank': {
      const hull = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.2, 2.0), mat)
      hull.position.y = 0.6
      hull.castShadow = true
      group.add(hull)

      // Turret
      const turretMat = new THREE.MeshStandardMaterial({ color: teamColor, roughness: 0.4, metalness: 0.5 })
      const turret = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 1.2), turretMat)
      turret.position.set(0.2, 1.5, 0)
      turret.castShadow = true
      group.add(turret)

      // Barrel
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 2.0, 8),
        new THREE.MeshStandardMaterial({ color: '#3a3a3a' }),
      )
      barrel.rotation.z = Math.PI / 2
      barrel.position.set(1.5, 1.5, 0)
      group.add(barrel)

      // Tracks (2 flattened boxes)
      const trackMat = new THREE.MeshStandardMaterial({ color: '#2a2a2a' })
      const leftTrack = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.6, 0.3), trackMat)
      leftTrack.position.set(0, 0.3, 1.1)
      group.add(leftTrack)
      const rightTrack = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.6, 0.3), trackMat)
      rightTrack.position.set(0, 0.3, -1.1)
      group.add(rightTrack)
      break
    }

    case 'helicopter': {
      // Fuselage (elongated ellipsoid approximation via scaled sphere)
      const fuselage = new THREE.Mesh(
        new THREE.SphereGeometry(1.0, 12, 8),
        mat,
      )
      fuselage.scale.set(2.0, 0.7, 0.8)
      fuselage.castShadow = true
      group.add(fuselage)

      // Tail boom
      const tailMat = new THREE.MeshStandardMaterial({ color: teamColor, roughness: 0.6 })
      const tail = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.3, 0.3), tailMat)
      tail.position.set(-2.2, 0.2, 0)
      group.add(tail)

      // Main rotor disc
      const rotorMat = new THREE.MeshStandardMaterial({
        color: '#aaaaaa', transparent: true, opacity: 0.4, side: THREE.DoubleSide,
      })
      const rotor = new THREE.Mesh(new THREE.CircleGeometry(2.5, 16), rotorMat)
      rotor.rotation.x = -Math.PI / 2
      rotor.position.y = 0.9
      rotor.name = 'mainRotor'
      group.add(rotor)

      // Tail rotor
      const tailRotor = new THREE.Mesh(
        new THREE.CircleGeometry(0.5, 8),
        rotorMat,
      )
      tailRotor.position.set(-3.4, 0.3, 0.2)
      tailRotor.name = 'tailRotor'
      group.add(tailRotor)
      break
    }
  }

  return group
}

export function createPickupMesh(p: Pickup, sharedGeo: SharedGeo): THREE.Mesh {
  let geo: THREE.BufferGeometry
  let color: string
  let emissive: string

  switch (p.type) {
    case 'health':
      geo = sharedGeo.pickupBox
      color = '#22cc44'
      emissive = '#116622'
      break
    case 'ammo':
      geo = sharedGeo.pickupBox
      color = '#cccc22'
      emissive = '#666611'
      break
    case 'armor':
      geo = sharedGeo.pickupOcta
      color = '#3366ff'
      emissive = '#1133aa'
      break
    default:
      geo = sharedGeo.pickupBox
      color = '#ffffff'
      emissive = '#444444'
  }

  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: 0.5,
    roughness: 0.3,
    metalness: 0.2,
  })
  return new THREE.Mesh(geo, mat)
}

export function createCapturePointMesh(cp: CapturePoint, sharedGeo: SharedGeo): THREE.Group {
  const group = new THREE.Group()

  // Ground ring
  const ringMat = new THREE.MeshBasicMaterial({
    color: cpTeamColor(cp.team),
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
  })
  const ring = new THREE.Mesh(sharedGeo.capRing, ringMat)
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.05
  ring.name = 'cpRing'
  group.add(ring)

  // Flag pole
  const poleMat = new THREE.MeshStandardMaterial({ color: '#888888', metalness: 0.5 })
  const pole = new THREE.Mesh(sharedGeo.flagPole, poleMat)
  pole.position.y = 2.0
  group.add(pole)

  // Flag
  const flagMat = new THREE.MeshStandardMaterial({
    color: cpTeamColor(cp.team),
    emissive: cpTeamColor(cp.team),
    emissiveIntensity: 0.2,
    side: THREE.DoubleSide,
  })
  const flag = new THREE.Mesh(sharedGeo.flagBox, flagMat)
  flag.position.set(0.45, 3.6, 0)
  flag.name = 'cpFlag'
  group.add(flag)

  // Label sprite
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 36px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(cp.label || `CP${cp.id}`, 128, 44)
  const tex = new THREE.CanvasTexture(canvas)
  const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true })
  const sprite = new THREE.Sprite(spriteMat)
  sprite.scale.set(3, 0.75, 1)
  sprite.position.y = 5
  group.add(sprite)

  return group
}
