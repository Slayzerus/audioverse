/**
 * Battle Royale visual sync functions for the Three.js Warzone FPP engine.
 * Extracted from threeEngine.ts for modularity.
 */

import * as THREE from 'three'
import type { GameState } from './types'

/** Mutable reference to the BR zone mesh (owned by threeEngine). */
export interface ZoneRef { mesh: THREE.Mesh | null }

export function syncBRZone(
  state: GameState,
  entityGroup: THREE.Group,
  zoneRef: ZoneRef,
): void {
  if (!state.brState) return
  const zone = state.brState.zone

  if (!zoneRef.mesh) {
    // Create a large transparent ring representing the zone boundary
    const geo = new THREE.RingGeometry(1, 1.1, 128)
    const mat = new THREE.MeshBasicMaterial({
      color: '#ff4400',
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    })
    zoneRef.mesh = new THREE.Mesh(geo, mat)
    zoneRef.mesh.rotation.x = -Math.PI / 2
    zoneRef.mesh.position.y = 0.15
    entityGroup.add(zoneRef.mesh)
  }

  // Update zone ring geometry to match current radius
  zoneRef.mesh.geometry.dispose()
  const innerR = Math.max(0, zone.radius - 0.5)
  const outerR = zone.radius + 2
  zoneRef.mesh.geometry = new THREE.RingGeometry(innerR, outerR, 128)
  zoneRef.mesh.position.set(zone.centerX, 0.15, zone.centerY)

  // Pulsing opacity based on phase
  const pulse = 0.15 + Math.sin(Date.now() * 0.003) * 0.1
  ;(zoneRef.mesh.material as THREE.MeshBasicMaterial).opacity = pulse + zone.phase * 0.03
}

export function syncBRSupplyDrops(
  state: GameState,
  entityGroup: THREE.Group,
  supplyDropMeshes: Map<number, THREE.Group>,
): void {
  if (!state.brState) return
  const seen = new Set<number>()

  for (const drop of state.brState.supplyDrops) {
    seen.add(drop.id)
    if (drop.looted) {
      const existing = supplyDropMeshes.get(drop.id)
      if (existing) existing.visible = false
      continue
    }

    let group = supplyDropMeshes.get(drop.id)
    if (!group) {
      group = new THREE.Group()
      // Crate body
      const crateMat = new THREE.MeshStandardMaterial({ color: '#8B6914', roughness: 0.9 })
      const crate = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1, 1.5), crateMat)
      crate.castShadow = true
      group.add(crate)
      // Parachute (when falling)
      const chuteMat = new THREE.MeshStandardMaterial({
        color: '#ff8800', transparent: true, opacity: 0.7, side: THREE.DoubleSide,
      })
      const chute = new THREE.Mesh(new THREE.SphereGeometry(2, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), chuteMat)
      chute.position.y = 2
      chute.name = 'parachute'
      group.add(chute)
      // Glow beacon
      const beaconMat = new THREE.MeshBasicMaterial({ color: '#ffaa00', transparent: true, opacity: 0.6 })
      const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 30, 4), beaconMat)
      beacon.position.y = 15
      beacon.name = 'beacon'
      group.add(beacon)
      entityGroup.add(group)
      supplyDropMeshes.set(drop.id, group)
    }

    group.visible = true
    group.position.set(drop.x, drop.altitude, drop.y)

    // Hide parachute and beacon once landed
    const chute = group.getObjectByName('parachute')
    if (chute) chute.visible = drop.altitude > 0.5
    const beacon = group.getObjectByName('beacon')
    if (beacon) beacon.visible = true
  }

  for (const [id, group] of supplyDropMeshes) {
    if (!seen.has(id)) {
      entityGroup.remove(group)
      supplyDropMeshes.delete(id)
    }
  }
}

export function syncBRWeaponPickups(
  state: GameState,
  entityGroup: THREE.Group,
  weaponPickupMeshes: Map<number, THREE.Mesh>,
  brWeaponPickupRotation: { value: number },
): void {
  if (!state.brState) return
  const seen = new Set<number>()
  brWeaponPickupRotation.value += 0.03

  const rarityColors: Record<string, string> = {
    common: '#cccccc',
    uncommon: '#44cc44',
    rare: '#4488ff',
    epic: '#aa44ff',
    legendary: '#ffaa00',
  }

  for (const wp of state.brState.weaponPickups) {
    seen.add(wp.id)
    if (!wp.alive) {
      const existing = weaponPickupMeshes.get(wp.id)
      if (existing) existing.visible = false
      continue
    }

    let mesh = weaponPickupMeshes.get(wp.id)
    if (!mesh) {
      const color = rarityColors[wp.rarity] || '#ffffff'
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.4,
        roughness: 0.3,
        metalness: 0.5,
      })
      mesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.25), mat)
      mesh.castShadow = true
      entityGroup.add(mesh)
      weaponPickupMeshes.set(wp.id, mesh)
    }

    mesh.visible = true
    const bob = Math.sin(brWeaponPickupRotation.value + wp.id * 0.7) * 0.1
    mesh.position.set(wp.x, 0.4 + bob, wp.y)
    mesh.rotation.y = brWeaponPickupRotation.value * 0.5
  }

  for (const [id, mesh] of weaponPickupMeshes) {
    if (!seen.has(id)) {
      entityGroup.remove(mesh)
      weaponPickupMeshes.delete(id)
    }
  }
}

export function syncBRTraps(
  state: GameState,
  entityGroup: THREE.Group,
  trapMeshes: Map<number, THREE.Mesh>,
): void {
  if (!state.brState) return
  const seen = new Set<number>()

  const trapColors: Record<string, string> = {
    'mine': '#ff2200',
    'spike': '#888888',
    'bear-trap': '#aa6633',
    'c4': '#44ff44',
  }

  for (const trap of state.brState.traps) {
    seen.add(trap.id)
    if (trap.triggered) {
      const existing = trapMeshes.get(trap.id)
      if (existing) existing.visible = false
      continue
    }

    let mesh = trapMeshes.get(trap.id)
    if (!mesh) {
      const col = trapColors[trap.type] || '#ff0000'
      const mat = new THREE.MeshStandardMaterial({
        color: col, roughness: 0.7, metalness: 0.3,
        transparent: true, opacity: 0.6,
      })
      // Different shapes per trap type
      let geo: THREE.BufferGeometry
      switch (trap.type) {
        case 'mine':
          geo = new THREE.CylinderGeometry(0.4, 0.4, 0.15, 8)
          break
        case 'spike':
          geo = new THREE.ConeGeometry(0.2, 0.8, 6)
          break
        case 'bear-trap':
          geo = new THREE.TorusGeometry(0.3, 0.08, 6, 12)
          break
        case 'c4':
          geo = new THREE.BoxGeometry(0.3, 0.15, 0.5)
          break
        default:
          geo = new THREE.BoxGeometry(0.3, 0.3, 0.3)
      }
      mesh = new THREE.Mesh(geo, mat)
      mesh.castShadow = false
      entityGroup.add(mesh)
      trapMeshes.set(trap.id, mesh)
    }

    mesh.visible = true
    mesh.position.set(trap.x, trap.type === 'spike' ? 0.4 : 0.08, trap.y)
  }

  for (const [id, mesh] of trapMeshes) {
    if (!seen.has(id)) {
      entityGroup.remove(mesh)
      trapMeshes.delete(id)
    }
  }
}
