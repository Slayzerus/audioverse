/**
 * renderer.ts — Three.js 2.5D renderer for Flatworld Survival.
 *
 * Renders the block world using InstancedMesh (cubes) with an orthographic
 * camera from the side, giving a Terraria-like 2.5D perspective.
 *
 * Assets referenced:
 *   World:      public/assets/models/Low-Poly/Post-Apocalyptic World/
 *   Characters: public/assets/models/POLYGON_Heist_SourceFiles_v4/
 */

import * as THREE from 'three'
import {
  B, BLOCKS, ITEMS, ENEMY_TYPES, type FlatWorldState, type PlayerState,
  type EnemyState, type Particle, type VehicleState, TILE, DAY_LENGTH, PLAYER_W,
  VEHICLE_DEFS,
} from './types'
import { getSkyBrightness, isNight } from './combat'

// ─── Configuration ────────────────────────────────────────
const VIEW_W = 44          // tiles visible horizontally
const VIEW_H = 28          // tiles visible vertically
const MAX_INSTANCES = 2500  // max visible blocks per type group
const BLOCK_DEPTH = 0.5     // Z depth of block cubes

// Color groups — blocks sharing the same material
const BLOCK_COLORS: Record<number, string> = {}
for (const [id, def] of Object.entries(BLOCKS)) {
  BLOCK_COLORS[Number(id)] = def.color
}

// ─── Renderer Class ───────────────────────────────────────
export class FlatworldRenderer {
  private renderer!: THREE.WebGLRenderer
  private scene!: THREE.Scene
  private camera!: THREE.OrthographicCamera

  // Block rendering
  private blockGeom!: THREE.BoxGeometry
  private blockMeshes: Map<string, THREE.InstancedMesh> = new Map()
  private blockMaterials: Map<string, THREE.MeshLambertMaterial> = new Map()

  // Entity meshes
  private playerMeshes: THREE.Group[] = []
  private enemyMeshes: Map<number, THREE.Group> = new Map()
  private vehicleMeshes: Map<number, THREE.Group> = new Map()
  private projectileMesh!: THREE.InstancedMesh
  private dropMesh!: THREE.InstancedMesh
  private particleMesh!: THREE.InstancedMesh

  // Lighting
  private ambientLight!: THREE.AmbientLight
  private sunLight!: THREE.DirectionalLight
  private skyPlane!: THREE.Mesh

  // State
  private lastCamX = -999
  private lastCamY = -999
  private dirty = true
  private disposed = false

  // Cursor
  private cursorMesh!: THREE.Mesh
  private mineProgressMesh!: THREE.Mesh

  init(canvas: HTMLCanvasElement) {
    // ── Renderer ───────────────────────────────────
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0x1a1a2e)

    // ── Scene ──────────────────────────────────────
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(0x1a1a2e, 0.003)

    // ── Camera (orthographic side view) ────────────
    const aspect = canvas.width / canvas.height
    const halfW = VIEW_W / 2
    const halfH = halfW / aspect
    this.camera = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.1, 100)
    this.camera.position.set(0, 0, 30)
    this.camera.lookAt(0, 0, 0)

    // ── Lighting ───────────────────────────────────
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    this.scene.add(this.ambientLight)

    this.sunLight = new THREE.DirectionalLight(0xffeedd, 0.8)
    this.sunLight.position.set(10, 20, 15)
    this.scene.add(this.sunLight)

    // ── Sky background plane ───────────────────────
    const skyGeom = new THREE.PlaneGeometry(200, 200)
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x3060c0, side: THREE.DoubleSide })
    this.skyPlane = new THREE.Mesh(skyGeom, skyMat)
    this.skyPlane.position.z = -5
    this.scene.add(this.skyPlane)

    // ── Block geometry (shared) ────────────────────
    this.blockGeom = new THREE.BoxGeometry(TILE, TILE, BLOCK_DEPTH)

    // ── Cursor ─────────────────────────────────────
    const cursorGeom = new THREE.BoxGeometry(TILE + 0.05, TILE + 0.05, 0.1)
    const cursorMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.6 })
    this.cursorMesh = new THREE.Mesh(cursorGeom, cursorMat)
    this.cursorMesh.position.z = 1
    this.scene.add(this.cursorMesh)

    // Mine progress indicator
    const mineGeom = new THREE.PlaneGeometry(TILE, 0.1)
    const mineMat = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.8 })
    this.mineProgressMesh = new THREE.Mesh(mineGeom, mineMat)
    this.mineProgressMesh.position.z = 2
    this.scene.add(this.mineProgressMesh)

    // ── Projectile instances ───────────────────────
    const projGeom = new THREE.SphereGeometry(0.08, 4, 4)
    const projMat = new THREE.MeshBasicMaterial({ color: 0xffff00 })
    this.projectileMesh = new THREE.InstancedMesh(projGeom, projMat, 200)
    this.projectileMesh.count = 0
    this.scene.add(this.projectileMesh)

    // ── Item drop instances ────────────────────────
    const dropGeom = new THREE.BoxGeometry(0.25, 0.25, 0.25)
    const dropMat = new THREE.MeshLambertMaterial({ color: 0xcccccc })
    this.dropMesh = new THREE.InstancedMesh(dropGeom, dropMat, 200)
    this.dropMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(200 * 3), 3)
    this.dropMesh.count = 0
    this.scene.add(this.dropMesh)

    // ── Particle instances ─────────────────────────
    const partGeom = new THREE.BoxGeometry(0.1, 0.1, 0.1)
    const partMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
    this.particleMesh = new THREE.InstancedMesh(partGeom, partMat, 500)
    this.particleMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(500 * 3), 3)
    this.particleMesh.count = 0
    this.scene.add(this.particleMesh)
  }

  resize(w: number, h: number) {
    this.renderer.setSize(w, h, false)
    const aspect = w / h
    const halfW = VIEW_W / 2
    const halfH = halfW / aspect
    this.camera.left = -halfW
    this.camera.right = halfW
    this.camera.top = halfH
    this.camera.bottom = -halfH
    this.camera.updateProjectionMatrix()
    this.dirty = true
  }

  markDirty() {
    this.dirty = true
  }

  // ─── Render Frame ───────────────────────────────────────
  render(state: FlatWorldState, activePlayer: number, cursorTileX: number, cursorTileY: number) {
    if (this.disposed) return

    const player = state.players[activePlayer]
    if (!player) return

    // Camera follow
    const camX = player.x
    const camY = player.y + player.height / 2 - 2
    this.camera.position.x = camX
    this.camera.position.y = -camY // Invert Y (Three.js Y-up, our world Y-down)

    // Sky follow
    this.skyPlane.position.x = camX
    this.skyPlane.position.y = -camY

    // Check if we need to rebuild blocks
    const dx = Math.abs(camX - this.lastCamX)
    const dy = Math.abs(camY - this.lastCamY)
    if (dx > 1 || dy > 1 || this.dirty) {
      this.rebuildBlocks(state, camX, camY)
      this.lastCamX = camX
      this.lastCamY = camY
      this.dirty = false
    }

    // Update lighting (day/night)
    this.updateLighting(state.time)

    // Update cursor
    this.cursorMesh.position.x = cursorTileX + 0.5
    this.cursorMesh.position.y = -(cursorTileY + 0.5)

    // Mine progress
    if (player.mineTarget) {
      this.mineProgressMesh.visible = true
      const block = state.world[player.mineTarget.y]?.[player.mineTarget.x]
      const def = BLOCKS[block]
      const progress = def ? Math.min(1, player.mineProgress / def.hardness) : 0
      this.mineProgressMesh.position.x = player.mineTarget.x + 0.5
      this.mineProgressMesh.position.y = -(player.mineTarget.y + 1.05)
      this.mineProgressMesh.scale.x = progress
    } else {
      this.mineProgressMesh.visible = false
    }

    // Update entities
    this.updatePlayers(state.players)
    this.updateEnemies(state.enemies)
    this.updateVehicles(state.vehicles)
    this.updateProjectiles(state.projectiles)
    this.updateDrops(state.drops)
    this.updateParticles(state.particles)

    this.renderer.render(this.scene, this.camera)
  }

  // ─── Rebuild Visible Blocks ─────────────────────────────
  private rebuildBlocks(state: FlatWorldState, camX: number, camY: number) {
    const { world, config } = state
    const ww = config.worldWidth, wh = config.worldHeight

    const minX = Math.max(0, Math.floor(camX - VIEW_W / 2 - 2))
    const maxX = Math.min(ww - 1, Math.floor(camX + VIEW_W / 2 + 2))
    const minY = Math.max(0, Math.floor(camY - VIEW_H / 2 - 2))
    const maxY = Math.min(wh - 1, Math.floor(camY + VIEW_H / 2 + 2))

    // Collect blocks by color
    const colorGroups: Map<string, { x: number; y: number; topColor?: string }[]> = new Map()

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const block = world[y][x]
        if (block === B.AIR) continue

        const def = BLOCKS[block]
        if (!def) continue

        const color = def.color
        if (!colorGroups.has(color)) colorGroups.set(color, [])
        colorGroups.get(color)!.push({ x, y, topColor: def.topColor })
      }
    }

    // Remove old meshes
    for (const [, mesh] of this.blockMeshes) {
      this.scene.remove(mesh)
      mesh.dispose()
    }
    this.blockMeshes.clear()

    // Create new meshes
    const matrix = new THREE.Matrix4()

    for (const [colorStr, blocks] of colorGroups) {
      const count = Math.min(blocks.length, MAX_INSTANCES)
      const mat = this.getOrCreateMaterial(colorStr)
      const mesh = new THREE.InstancedMesh(this.blockGeom, mat, count)
      mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3)

      const color = new THREE.Color()

      for (let i = 0; i < count; i++) {
        const b = blocks[i]
        matrix.makeTranslation(b.x + 0.5, -(b.y + 0.5), 0)
        mesh.setMatrixAt(i, matrix)

        // If block has a special top color and the block above is air, use top color
        if (b.topColor) {
          const above = b.y > 0 ? (state.world[b.y - 1]?.[b.x] ?? B.AIR) : B.AIR
          if (above === B.AIR || BLOCKS[above]?.transparent) {
            color.set(b.topColor)
          } else {
            color.set(colorStr)
          }
        } else {
          color.set(colorStr)
        }
        mesh.setColorAt(i, color)
      }

      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true

      this.scene.add(mesh)
      this.blockMeshes.set(colorStr + '_' + Math.random(), mesh)
    }
  }

  private getOrCreateMaterial(color: string): THREE.MeshLambertMaterial {
    if (!this.blockMaterials.has(color)) {
      const mat = new THREE.MeshLambertMaterial({ color: new THREE.Color(color), vertexColors: true })
      this.blockMaterials.set(color, mat)
    }
    return this.blockMaterials.get(color)!
  }

  // ─── Update Lighting ───────────────────────────────────
  private updateLighting(time: number) {
    const brightness = getSkyBrightness(time)

    this.ambientLight.intensity = 0.15 + brightness * 0.5
    this.sunLight.intensity = brightness * 0.8

    // Sky color
    const night = isNight(time)
    const skyColor = night ? new THREE.Color(0x0a0e1a) : new THREE.Color(0x4080d0).lerp(new THREE.Color(0xff8040), brightness < 0.5 ? 1 - brightness * 2 : 0)
    ;(this.skyPlane.material as THREE.MeshBasicMaterial).color.copy(skyColor)
    this.renderer.setClearColor(skyColor)

    // Sun position (rotates around)
    const angle = (time / DAY_LENGTH) * Math.PI * 2 - Math.PI / 2
    this.sunLight.position.set(Math.cos(angle) * 20, Math.sin(angle) * 20, 15)

    // Sun color
    const sunColor = brightness > 0.8 ? new THREE.Color(0xffeedd) : new THREE.Color(0xff6030)
    this.sunLight.color.copy(sunColor)
  }

  // ─── Update Players ────────────────────────────────────
  private updatePlayers(players: PlayerState[]) {
    // Ensure we have mesh groups for each player
    while (this.playerMeshes.length < players.length) {
      const group = this.createPlayerMesh(players[this.playerMeshes.length]?.color || '#fff')
      this.scene.add(group)
      this.playerMeshes.push(group)
    }

    for (let i = 0; i < players.length; i++) {
      const p = players[i]
      const mesh = this.playerMeshes[i]

      if (!p.alive) {
        mesh.visible = false
        continue
      }

      mesh.visible = true
      // Blink during invincibility
      if (p.invincibleTimer > 0) {
        mesh.visible = Math.floor(p.invincibleTimer / 3) % 2 === 0
      }

      mesh.position.x = p.x
      mesh.position.y = -(p.y + p.height / 2)
      mesh.position.z = 0.5
      mesh.scale.x = p.facing

      // Stance: scale body mesh
      const body = mesh.children[0] as THREE.Mesh
      const head = mesh.children[1] as THREE.Mesh
      const weapon = mesh.children[2] as THREE.Mesh
      if (p.stance === 'crouching') {
        if (body) body.scale.y = 0.65
        if (head) head.position.y = 0.3
        if (weapon) weapon.position.y = -0.15
      } else if (p.stance === 'prone') {
        if (body) { body.scale.y = 0.3; body.scale.x = 1.8 }
        if (head) head.position.y = 0.0
        if (weapon) { weapon.position.y = -0.25; weapon.position.x = 0.8 }
      } else {
        if (body) { body.scale.y = 1; body.scale.x = 1 }
        if (head) head.position.y = 0.55
        if (weapon) { weapon.position.set(0.5, 0, 0.2) }
      }

      // Update color
      if (body) (body.material as THREE.MeshLambertMaterial).color.set(p.color)
    }
  }

  private createPlayerMesh(color: string): THREE.Group {
    const group = new THREE.Group()

    // Body
    const bodyGeom = new THREE.BoxGeometry(PLAYER_W * 0.8, 1.0, 0.4)
    const bodyMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(color) })
    const body = new THREE.Mesh(bodyGeom, bodyMat)
    body.position.y = -0.1
    group.add(body)

    // Head
    const headGeom = new THREE.SphereGeometry(0.22, 8, 8)
    const headMat = new THREE.MeshLambertMaterial({ color: 0xffcc99 })
    const head = new THREE.Mesh(headGeom, headMat)
    head.position.y = 0.55
    group.add(head)

    // Weapon (line)
    const weapGeom = new THREE.BoxGeometry(0.6, 0.06, 0.06)
    const weapMat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa })
    const weapon = new THREE.Mesh(weapGeom, weapMat)
    weapon.position.set(0.5, 0, 0.2)
    group.add(weapon)

    return group
  }

  // ─── Update Enemies ─────────────────────────────────────
  private updateEnemies(enemies: EnemyState[]) {
    // Hide unused meshes
    const usedIds = new Set<number>()

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i]
      if (!e.alive) continue

      usedIds.add(i)

      if (!this.enemyMeshes.has(i)) {
        const group = this.createEnemyMesh(e)
        this.scene.add(group)
        this.enemyMeshes.set(i, group)
      }

      const mesh = this.enemyMeshes.get(i)!
      mesh.visible = true
      mesh.position.x = e.x
      mesh.position.y = -(e.y + e.height / 2)
      mesh.position.z = 0.5
      mesh.scale.x = e.facing
    }

    // Remove unused
    for (const [id, mesh] of this.enemyMeshes) {
      if (!usedIds.has(id)) {
        this.scene.remove(mesh)
        this.enemyMeshes.delete(id)
      }
    }
  }

  private createEnemyMesh(e: EnemyState): THREE.Group {
    const group = new THREE.Group()
    const def = ENEMY_TYPES[e.type]
    const color = def?.color || '#0f0'

    const bodyGeom = new THREE.BoxGeometry(e.width * 0.8, e.height * 0.8, 0.4)
    const bodyMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(color) })
    const body = new THREE.Mesh(bodyGeom, bodyMat)
    group.add(body)

    // Boss: bigger, glowing
    if (def?.boss) {
      const glowGeom = new THREE.BoxGeometry(e.width + 0.2, e.height + 0.2, 0.1)
      const glowMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.3 })
      const glow = new THREE.Mesh(glowGeom, glowMat)
      group.add(glow)
    }

    // HP bar
    const hpBarBg = new THREE.Mesh(
      new THREE.PlaneGeometry(e.width, 0.08),
      new THREE.MeshBasicMaterial({ color: 0x333333 })
    )
    hpBarBg.position.y = e.height / 2 + 0.15
    hpBarBg.position.z = 0.3
    group.add(hpBarBg)

    const hpBar = new THREE.Mesh(
      new THREE.PlaneGeometry(e.width, 0.08),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    )
    hpBar.position.y = e.height / 2 + 0.15
    hpBar.position.z = 0.31
    hpBar.name = 'hpBar'
    group.add(hpBar)

    return group
  }

  // ─── Update Projectiles ─────────────────────────────────
  private updateProjectiles(projectiles: FlatWorldState['projectiles']) {
    const matrix = new THREE.Matrix4()
    const count = Math.min(projectiles.length, 200)
    this.projectileMesh.count = count

    for (let i = 0; i < count; i++) {
      const p = projectiles[i]
      matrix.makeTranslation(p.x, -p.y, 1)
      this.projectileMesh.setMatrixAt(i, matrix)
    }
    if (count > 0) this.projectileMesh.instanceMatrix.needsUpdate = true
  }

  // ─── Update Drops ───────────────────────────────────────
  private updateDrops(drops: FlatWorldState['drops']) {
    const matrix = new THREE.Matrix4()
    const color = new THREE.Color()
    const count = Math.min(drops.length, 200)
    this.dropMesh.count = count

    for (let i = 0; i < count; i++) {
      const d = drops[i]
      // Bob animation
      const bob = Math.sin(d.life * 0.1) * 0.05
      matrix.makeTranslation(d.x, -(d.y + bob), 0.5)
      this.dropMesh.setMatrixAt(i, matrix)

      const itemDef = ITEMS[d.itemId]
      color.set(itemDef?.color || '#fff')
      this.dropMesh.setColorAt(i, color)
    }
    if (count > 0) {
      this.dropMesh.instanceMatrix.needsUpdate = true
      if (this.dropMesh.instanceColor) this.dropMesh.instanceColor.needsUpdate = true
    }
  }

  // ─── Update Particles ──────────────────────────────────
  private updateParticles(particles: Particle[]) {
    const matrix = new THREE.Matrix4()
    const color = new THREE.Color()
    const count = Math.min(particles.length, 500)
    this.particleMesh.count = count

    for (let i = 0; i < count; i++) {
      const p = particles[i]
      const scale = p.size * (p.life / p.maxLife)
      matrix.makeScale(scale, scale, scale)
      matrix.setPosition(p.x, -p.y, 1.5)
      this.particleMesh.setMatrixAt(i, matrix)

      color.set(p.color)
      this.particleMesh.setColorAt(i, color)
    }
    if (count > 0) {
      this.particleMesh.instanceMatrix.needsUpdate = true
      if (this.particleMesh.instanceColor) this.particleMesh.instanceColor.needsUpdate = true
    }
  }

  // ─── Update Vehicles ─────────────────────────────────
  private updateVehicles(vehicles: VehicleState[]) {
    const usedIds = new Set<number>()

    for (const v of vehicles) {
      if (!v.alive) continue
      usedIds.add(v.id)

      if (!this.vehicleMeshes.has(v.id)) {
        const group = this.createVehicleMesh(v)
        this.scene.add(group)
        this.vehicleMeshes.set(v.id, group)
      }

      const mesh = this.vehicleMeshes.get(v.id)!
      const vdef = VEHICLE_DEFS[v.type]
      mesh.visible = true
      mesh.position.x = v.x
      mesh.position.y = -(v.y + vdef.height / 2)
      mesh.position.z = 0.3
      mesh.rotation.z = -v.tilt * 0.3 // tilt visualization
    }

    // Remove unused
    for (const [id, mesh] of this.vehicleMeshes) {
      if (!usedIds.has(id)) {
        this.scene.remove(mesh)
        this.vehicleMeshes.delete(id)
      }
    }
  }

  private createVehicleMesh(v: VehicleState): THREE.Group {
    const group = new THREE.Group()
    const vdef = VEHICLE_DEFS[v.type]

    // Body
    const bodyGeom = new THREE.BoxGeometry(vdef.width * 0.9, vdef.height * 0.7, 0.5)
    const bodyMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(vdef.color) })
    group.add(new THREE.Mesh(bodyGeom, bodyMat))

    if (vdef.flying) {
      // Rotor/wing
      const wingGeom = new THREE.BoxGeometry(vdef.width * 1.2, 0.08, 0.08)
      const wingMat = new THREE.MeshBasicMaterial({ color: 0x888888 })
      const wing = new THREE.Mesh(wingGeom, wingMat)
      wing.position.y = vdef.height * 0.4
      group.add(wing)
    } else if (vdef.watercraft) {
      // Hull shape
      const hullGeom = new THREE.BoxGeometry(vdef.width, vdef.height * 0.3, 0.6)
      const hullMat = new THREE.MeshLambertMaterial({ color: 0x5a3a1a })
      const hull = new THREE.Mesh(hullGeom, hullMat)
      hull.position.y = -vdef.height * 0.3
      group.add(hull)
    } else {
      // Wheels for ground vehicles
      const wheelGeom = new THREE.SphereGeometry(vdef.height * 0.25, 6, 6)
      const wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 })
      for (const wx of [-vdef.width * 0.35, vdef.width * 0.35]) {
        const wheel = new THREE.Mesh(wheelGeom, wheelMat)
        wheel.position.set(wx, -vdef.height * 0.3, 0.3)
        group.add(wheel)
      }
    }

    // HP bar
    const hpBg = new THREE.Mesh(
      new THREE.PlaneGeometry(vdef.width * 0.8, 0.08),
      new THREE.MeshBasicMaterial({ color: 0x333333 })
    )
    hpBg.position.y = vdef.height * 0.5 + 0.15; hpBg.position.z = 0.3
    group.add(hpBg)

    const hpBar = new THREE.Mesh(
      new THREE.PlaneGeometry(vdef.width * 0.8, 0.08),
      new THREE.MeshBasicMaterial({ color: 0x00cc00 })
    )
    hpBar.position.y = vdef.height * 0.5 + 0.15; hpBar.position.z = 0.31
    hpBar.name = 'hpBar'
    group.add(hpBar)

    return group
  }

  // ─── Split-Screen Render ────────────────────────────────
  renderSplitScreen(
    state: FlatWorldState,
    playerIndices: number[],
    cursorTileX: number, cursorTileY: number,
    canvasW: number, canvasH: number,
  ) {
    if (this.disposed) return
    const count = playerIndices.length
    if (count <= 1) {
      // Single player — normal render
      this.render(state, playerIndices[0] ?? 0, cursorTileX, cursorTileY)
      return
    }

    this.renderer.setScissorTest(true)
    this.renderer.autoClear = false
    this.renderer.clear()

    // Update shared entities (blocks, drops, particles, enemies, vehicles)
    // We only rebuild blocks once based on first player
    const p0 = state.players[playerIndices[0]]
    if (p0) {
      const camX = p0.x
      const camY = p0.y + p0.height / 2 - 2
      const dx = Math.abs(camX - this.lastCamX)
      const dy = Math.abs(camY - this.lastCamY)
      if (dx > 1 || dy > 1 || this.dirty) {
        this.rebuildBlocks(state, camX, camY)
        this.lastCamX = camX; this.lastCamY = camY; this.dirty = false
      }
    }

    this.updateLighting(state.time)
    this.updatePlayers(state.players)
    this.updateEnemies(state.enemies)
    this.updateVehicles(state.vehicles)
    this.updateProjectiles(state.projectiles)
    this.updateDrops(state.drops)
    this.updateParticles(state.particles)

    for (let vi = 0; vi < count; vi++) {
      const pi = playerIndices[vi]
      const player = state.players[pi]
      if (!player) continue

      // Calculate viewport
      let vpX: number, vpY: number, vpW: number, vpH: number
      if (count === 2) {
        // Side by side
        vpW = canvasW / 2
        vpH = canvasH
        vpX = vi * vpW
        vpY = 0
      } else if (count <= 4) {
        // 2x2 grid
        vpW = canvasW / 2
        vpH = canvasH / 2
        vpX = (vi % 2) * vpW
        vpY = (vi < 2 ? canvasH / 2 : 0) // top row first
      } else {
        // 2 rows, distribute evenly
        const cols = Math.ceil(count / 2)
        vpW = canvasW / cols
        vpH = canvasH / 2
        const row = vi < cols ? 0 : 1
        const col = vi < cols ? vi : vi - cols
        vpX = col * vpW
        vpY = row === 0 ? canvasH / 2 : 0
      }

      // Set viewport + scissor
      this.renderer.setViewport(vpX, vpY, vpW, vpH)
      this.renderer.setScissor(vpX, vpY, vpW, vpH)

      // Adjust camera to follow this player
      const camX = player.x
      const camY = player.y + player.height / 2 - 2
      this.camera.position.x = camX
      this.camera.position.y = -camY
      this.skyPlane.position.x = camX
      this.skyPlane.position.y = -camY

      // Update camera aspect for this viewport
      const aspect = vpW / vpH
      const halfW = VIEW_W / 2
      const halfH = halfW / aspect
      this.camera.left = -halfW; this.camera.right = halfW
      this.camera.top = halfH; this.camera.bottom = -halfH
      this.camera.updateProjectionMatrix()

      // Cursor (only for first viewport)
      if (vi === 0) {
        this.cursorMesh.position.x = cursorTileX + 0.5
        this.cursorMesh.position.y = -(cursorTileY + 0.5)
        this.cursorMesh.visible = true
      } else {
        this.cursorMesh.visible = false
      }

      // Mine progress for this player
      if (player.mineTarget) {
        this.mineProgressMesh.visible = vi === 0
        if (vi === 0) {
          const block = state.world[player.mineTarget.y]?.[player.mineTarget.x]
          const def = BLOCKS[block]
          const progress = def ? Math.min(1, player.mineProgress / def.hardness) : 0
          this.mineProgressMesh.position.x = player.mineTarget.x + 0.5
          this.mineProgressMesh.position.y = -(player.mineTarget.y + 1.05)
          this.mineProgressMesh.scale.x = progress
        }
      } else if (vi === 0) {
        this.mineProgressMesh.visible = false
      }

      this.renderer.render(this.scene, this.camera)
    }

    // Reset
    this.renderer.setScissorTest(false)
    this.renderer.autoClear = true
    this.renderer.setViewport(0, 0, canvasW, canvasH)
  }

  // ─── Screen → World coordinate conversion ──────────────
  screenToWorld(screenX: number, screenY: number, canvas: HTMLCanvasElement): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect()
    const ndcX = ((screenX - rect.left) / rect.width) * 2 - 1
    const ndcY = -((screenY - rect.top) / rect.height) * 2 + 1

    const worldX = this.camera.position.x + ndcX * (this.camera.right - this.camera.left) / 2
    const worldY = -(this.camera.position.y + ndcY * (this.camera.top - this.camera.bottom) / 2)

    return { x: worldX, y: worldY }
  }

  // ─── Dispose ────────────────────────────────────────────
  dispose() {
    this.disposed = true

    for (const [, mesh] of this.blockMeshes) {
      this.scene.remove(mesh)
      mesh.geometry.dispose()
      ;(mesh.material as THREE.Material).dispose()
    }
    this.blockMeshes.clear()
    this.blockMaterials.forEach(m => m.dispose())
    this.blockMaterials.clear()

    for (const mesh of this.playerMeshes) this.scene.remove(mesh)
    for (const [, mesh] of this.enemyMeshes) this.scene.remove(mesh)
    for (const [, mesh] of this.vehicleMeshes) this.scene.remove(mesh)
    this.vehicleMeshes.clear()

    this.scene.remove(this.projectileMesh)
    this.scene.remove(this.dropMesh)
    this.scene.remove(this.particleMesh)
    this.scene.remove(this.cursorMesh)
    this.scene.remove(this.mineProgressMesh)
    this.scene.remove(this.skyPlane)

    this.blockGeom.dispose()
    this.renderer.dispose()
  }
}
