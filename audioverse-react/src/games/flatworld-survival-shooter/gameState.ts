/**
 * gameState.ts — Core game loop logic: physics, player updates, inventory,
 * crafting, mining, building, item drops, day/night cycle.
 */

import {
  B, I, BLOCKS, ITEMS, RECIPES,
  type FlatWorldState, type PlayerState, type InvSlot, type VehicleState,
  GRAVITY, MAX_FALL, MOVE_SPEED, JUMP_VEL,
  DAY_LENGTH, HUNGER_INTERVAL, STARVE_INTERVAL, ITEM_DESPAWN, ITEM_MAGNET_RANGE,
  MELEE_RANGE, MELEE_COOLDOWN, INVINCIBLE_TICKS, MINE_RANGE, PLACE_RANGE,
  RESPAWN_TICKS, type Recipe, PLAYER_H,
  CROUCH_HEIGHT, PRONE_HEIGHT, CROUCH_SPEED_MULT, PRONE_SPEED_MULT,
  VEHICLE_DEFS,
} from './types'

// ─── Input Actions ────────────────────────────────────────
export interface PlayerActions {
  left: boolean
  right: boolean
  jump: boolean
  crouch: boolean       // toggle crouch
  prone: boolean        // toggle prone
  attack: boolean       // LMB equivalent: mine/attack
  place: boolean        // RMB equivalent: place block / use item
  hotbar: number        // -1 = no change, 0-9 = select slot
  scrollDir: number     // -1/0/+1 hotbar scroll
  cursorX: number       // world coords of cursor
  cursorY: number
  interact: boolean     // E key: interact with workbench/furnace/chest
  openInventory: boolean
  dropItem: boolean
  enterVehicle: boolean // F key: enter/exit vehicle
}

export const EMPTY_ACTIONS: PlayerActions = {
  left: false, right: false, jump: false,
  crouch: false, prone: false,
  attack: false, place: false,
  hotbar: -1, scrollDir: 0,
  cursorX: 0, cursorY: 0,
  interact: false, openInventory: false, dropItem: false,
  enterVehicle: false,
}

// ─── Physics Helpers ──────────────────────────────────────
function isSolid(world: number[][], x: number, y: number, w: number, h: number): boolean {
  if (x < 0 || x >= w || y < 0 || y >= h) return true
  const block = world[y]?.[x]
  if (block === undefined) return true
  const def = BLOCKS[block]
  return def ? def.solid : false
}

function isPlatform(world: number[][], x: number, y: number, w: number, h: number): boolean {
  if (x < 0 || x >= w || y < 0 || y >= h) return false
  return world[y]?.[x] === B.PLATFORM
}

function isClimbable(world: number[][], x: number, y: number, w: number, h: number): boolean {
  if (x < 0 || x >= w || y < 0 || y >= h) return false
  const block = world[y]?.[x]
  return block === B.LADDER || block === B.WATER
}

function isLiquid(world: number[][], x: number, y: number, w: number, h: number): boolean {
  if (x < 0 || x >= w || y < 0 || y >= h) return false
  const block = world[y]?.[x]
  return block === B.WATER || block === B.LAVA
}

// ─── Entity-tile collision ────────────────────────────────
function moveEntity(
  world: number[][], ex: number, ey: number, ew: number, eh: number,
  vx: number, vy: number, ww: number, wh: number
): { x: number; y: number; vx: number; vy: number; onGround: boolean } {
  let nx = ex + vx
  let ny = ey + vy
  let onGround = false
  let nvx = vx
  let nvy = vy

  // Horizontal collision
  const halfW = ew / 2
  {
    // Check tiles in new X range
    const minTy = Math.floor(ey)
    const maxTy = Math.floor(ey + eh - 0.01)
    const checkX = vx > 0 ? Math.floor(nx + halfW) : Math.floor(nx - halfW)
    for (let ty = minTy; ty <= maxTy; ty++) {
      if (isSolid(world, checkX, ty, ww, wh)) {
        if (vx > 0) nx = checkX - halfW - 0.001
        else nx = checkX + 1 + halfW + 0.001
        nvx = 0
        break
      }
    }
  }

  // Vertical collision
  {
    const minTx = Math.floor(nx - halfW + 0.05)
    const maxTx = Math.floor(nx + halfW - 0.05)
    if (nvy >= 0) {
      // Moving down
      const footY = Math.floor(ny + eh)
      for (let tx = minTx; tx <= maxTx; tx++) {
        if (isSolid(world, tx, footY, ww, wh)) {
          ny = footY - eh
          nvy = 0
          onGround = true
          break
        }
        // Platform: only collide when falling onto from above
        if (isPlatform(world, tx, footY, ww, wh) && Math.floor(ey + eh - 0.01) < footY) {
          ny = footY - eh
          nvy = 0
          onGround = true
          break
        }
      }
    } else {
      // Moving up
      const headY = Math.floor(ny)
      for (let tx = minTx; tx <= maxTx; tx++) {
        if (isSolid(world, tx, headY, ww, wh)) {
          ny = headY + 1
          nvy = 0
          break
        }
      }
    }
  }

  // Clamp to world
  if (nx - halfW < 0) { nx = halfW; nvx = 0 }
  if (nx + halfW > ww) { nx = ww - halfW; nvx = 0 }

  return { x: nx, y: ny, vx: nvx, vy: nvy, onGround }
}

// ─── Inventory Helpers ────────────────────────────────────
export function addToInventory(inv: InvSlot[], itemId: number, count: number): number {
  if (itemId < 0 || count <= 0) return count
  const maxStack = ITEMS[itemId]?.stackSize ?? 99
  let remaining = count

  // First, try to stack with existing
  for (const slot of inv) {
    if (remaining <= 0) break
    if (slot.id === itemId && slot.count < maxStack) {
      const add = Math.min(remaining, maxStack - slot.count)
      slot.count += add
      remaining -= add
    }
  }

  // Then, fill empty slots
  for (const slot of inv) {
    if (remaining <= 0) break
    if (slot.id < 0 || slot.count <= 0) {
      const add = Math.min(remaining, maxStack)
      slot.id = itemId
      slot.count = add
      remaining -= add
    }
  }

  return remaining
}

export function removeFromInventory(inv: InvSlot[], itemId: number, count: number): boolean {
  // Check if we have enough
  let total = 0
  for (const slot of inv) if (slot.id === itemId) total += slot.count
  if (total < count) return false

  let remaining = count
  for (const slot of inv) {
    if (remaining <= 0) break
    if (slot.id === itemId) {
      const take = Math.min(remaining, slot.count)
      slot.count -= take
      remaining -= take
      if (slot.count <= 0) { slot.id = -1; slot.count = 0 }
    }
  }
  return true
}

export function countInInventory(inv: InvSlot[], itemId: number): number {
  return inv.reduce((sum, s) => s.id === itemId ? sum + s.count : sum, 0)
}

// ─── Crafting Helpers ─────────────────────────────────────
export function getAvailableStation(p: PlayerState, world: number[][], ww: number, wh: number): Set<string> {
  const stations = new Set<string>(['hand'])
  const cx = Math.floor(p.x), cy = Math.floor(p.y + p.height / 2)
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const tx = cx + dx, ty = cy + dy
      if (tx < 0 || tx >= ww || ty < 0 || ty >= wh) continue
      const block = world[ty][tx]
      if (block === B.WORKBENCH) stations.add('workbench')
      if (block === B.FURNACE) stations.add('furnace')
      if (block === B.ANVIL) stations.add('anvil')
    }
  }
  return stations
}

export function getAvailableRecipes(p: PlayerState, world: number[][], ww: number, wh: number): Recipe[] {
  const stations = getAvailableStation(p, world, ww, wh)
  return RECIPES.filter(r => {
    if (!stations.has(r.station)) return false
    // Check all ingredients
    return r.ingredients.every(([id, cnt]) => countInInventory(p.inventory, id) >= cnt)
  })
}

export function craftRecipe(p: PlayerState, recipe: Recipe): boolean {
  // Verify ingredients
  for (const [id, cnt] of recipe.ingredients) {
    if (countInInventory(p.inventory, id) < cnt) return false
  }
  // Remove ingredients
  for (const [id, cnt] of recipe.ingredients) {
    removeFromInventory(p.inventory, id, cnt)
  }
  // Add result
  addToInventory(p.inventory, recipe.result, recipe.count)
  return true
}

// ─── Main Tick ────────────────────────────────────────────
export function tick(state: FlatWorldState, actions: PlayerActions[]): void {
  const { world, config } = state
  const ww = config.worldWidth, wh = config.worldHeight
  state.frame++

  // ── Day/Night Cycle ──────────────────────────────────
  if (config.mode === 'survival' || config.mode === 'coop-survival') {
    state.time = (state.time + 1) % DAY_LENGTH
  }

  // ── Update Players ───────────────────────────────────
  for (let pi = 0; pi < state.players.length; pi++) {
    const p = state.players[pi]
    const a = actions[pi] || EMPTY_ACTIONS

    if (!p.alive) {
      p.respawnTimer--
      if (p.respawnTimer <= 0) {
        respawnPlayer(p, state)
      }
      continue
    }

    // Invincibility timer
    if (p.invincibleTimer > 0) p.invincibleTimer--

    // Speed/strength buffs
    if (p.speedTimer > 0) { p.speedTimer--; if (p.speedTimer <= 0) p.speedMult = 1 }
    if (p.strengthTimer > 0) { p.strengthTimer--; if (p.strengthTimer <= 0) p.strengthMult = 1 }

    // Attack cooldown
    if (p.attackCooldown > 0) p.attackCooldown--

    // Hunger
    if (config.mode === 'survival') {
      if (state.frame % HUNGER_INTERVAL === 0 && p.hunger > 0) p.hunger--
      if (p.hunger <= 0 && state.frame % STARVE_INTERVAL === 0) {
        p.hp -= 1
        if (p.hp <= 0) killPlayer(p, state, -1)
      }
      // Natural regen when hunger > 75%
      if (p.hunger > p.maxHunger * 0.75 && state.frame % 60 === 0 && p.hp < p.maxHp) p.hp++
    }

    // ── Stance Changes ────────────────────────────
    if (a.crouch) {
      p.stance = p.stance === 'crouching' ? 'standing' : 'crouching'
    }
    if (a.prone) {
      p.stance = p.stance === 'prone' ? 'standing' : 'prone'
    }
    // Can't be prone/crouching while jumping
    if (!p.onGround && p.stance !== 'standing' && p.vehicleId < 0) {
      p.stance = 'standing'
    }
    // Update height based on stance
    if (p.vehicleId < 0) {
      const targetH = p.stance === 'crouching' ? CROUCH_HEIGHT : p.stance === 'prone' ? PRONE_HEIGHT : PLAYER_H
      if (p.height !== targetH) {
        const diff = p.height - targetH
        p.height = targetH
        p.y += diff // keep feet position
      }
    }

    // ── Enter / Exit Vehicle ────────────────────────
    if (a.enterVehicle) {
      if (p.vehicleId >= 0) {
        // Exit vehicle
        const veh = state.vehicles.find(v => v.id === p.vehicleId)
        if (veh) { veh.rider = -1 }
        p.vehicleId = -1
        p.height = PLAYER_H
        p.stance = 'standing'
        p.y -= 1 // pop player up a bit
      } else {
        // Try entering nearest vehicle
        let bestV: VehicleState | null = null
        let bestD = 3
        for (const v of state.vehicles) {
          if (!v.alive || v.rider >= 0) continue
          const d = Math.hypot(v.x - p.x, v.y - p.y)
          if (d < bestD) { bestD = d; bestV = v }
        }
        if (bestV) {
          bestV.rider = pi
          p.vehicleId = bestV.id
          p.stance = 'standing'
        }
        // Or try placing a vehicle from inventory
        if (!bestV) {
          const heldSlot = p.inventory[p.hotbar]
          if (heldSlot?.id >= 0) {
            const itemDef = ITEMS[heldSlot.id]
            if (itemDef?.vehicle && itemDef.vehicleType) {
              const vdef = VEHICLE_DEFS[itemDef.vehicleType]
              if (vdef) {
                const vid = state.nextVehicleId++
                const newV: VehicleState = {
                  id: vid, type: itemDef.vehicleType,
                  x: p.x + p.facing * 2, y: p.y,
                  vx: 0, vy: 0,
                  hp: vdef.hp, maxHp: vdef.hp,
                  fuel: vdef.fuelMax,
                  tilt: 0, rider: pi,
                  onGround: false, alive: true,
                }
                state.vehicles.push(newV)
                p.vehicleId = vid
                heldSlot.count--
                if (heldSlot.count <= 0) { heldSlot.id = -1; heldSlot.count = 0 }
              }
            }
          }
        }
      }
    }

    // ── Movement ────────────────────────────────────
    const inVehicle = p.vehicleId >= 0
    const vehicle = inVehicle ? state.vehicles.find(v => v.id === p.vehicleId) : null

    if (inVehicle && vehicle && vehicle.alive) {
      // ── Vehicle Movement ──────────────────────────
      const vdef = VEHICLE_DEFS[vehicle.type]
      if (vdef.flying) {
        // Flying: up/down/left/right
        if (a.left) { vehicle.vx -= vdef.speed * 0.3; vehicle.tilt = Math.max(-1, vehicle.tilt - vdef.tiltSpeed) }
        else if (a.right) { vehicle.vx += vdef.speed * 0.3; vehicle.tilt = Math.min(1, vehicle.tilt + vdef.tiltSpeed) }
        else { vehicle.vx *= 0.95; vehicle.tilt *= 0.9 }
        if (a.jump) vehicle.vy -= vdef.speed * 0.25
        else vehicle.vy += GRAVITY * 0.5
        vehicle.vx = Math.max(-vdef.speed, Math.min(vdef.speed, vehicle.vx))
        vehicle.vy = Math.max(-vdef.speed * 0.7, Math.min(MAX_FALL * 0.5, vehicle.vy))
      } else if (vdef.watercraft) {
        // Boat: only on water surface
        if (a.left) { vehicle.vx -= vdef.speed * 0.2; vehicle.tilt = Math.max(-1, vehicle.tilt - vdef.tiltSpeed) }
        else if (a.right) { vehicle.vx += vdef.speed * 0.2; vehicle.tilt = Math.min(1, vehicle.tilt + vdef.tiltSpeed) }
        else { vehicle.vx *= 0.96; vehicle.tilt *= 0.9 }
        vehicle.vx = Math.max(-vdef.speed, Math.min(vdef.speed, vehicle.vx))
        // Float on water
        const waterY = Math.floor(vehicle.y + vdef.height)
        const onWater = isLiquid(world, Math.floor(vehicle.x), waterY, ww, wh)
        if (onWater) { vehicle.vy = -0.02 } else { vehicle.vy += GRAVITY }
        vehicle.vy = Math.max(-0.1, Math.min(MAX_FALL * 0.3, vehicle.vy))
      } else {
        // Ground: Elastomania-style tilt
        if (a.left) { vehicle.tilt = Math.max(-1, vehicle.tilt - vdef.tiltSpeed); p.facing = -1 }
        else if (a.right) { vehicle.tilt = Math.min(1, vehicle.tilt + vdef.tiltSpeed); p.facing = 1 }
        else { vehicle.tilt *= 0.92 }
        // Tilt drives speed (Elastomania: lean to accelerate)
        vehicle.vx += vehicle.tilt * vdef.speed * 0.15
        vehicle.vx *= 0.97 // friction
        vehicle.vx = Math.max(-vdef.speed, Math.min(vdef.speed, vehicle.vx))
        // Jump with vehicle
        if (a.jump && vehicle.onGround) vehicle.vy = -JUMP_VEL * 0.6
        vehicle.vy += GRAVITY
        if (vehicle.vy > MAX_FALL) vehicle.vy = MAX_FALL
      }

      // Move vehicle with collision
      const vr = moveEntity(world, vehicle.x, vehicle.y, vdef.width, vdef.height, vehicle.vx, vehicle.vy, ww, wh)
      vehicle.x = vr.x; vehicle.y = vr.y
      vehicle.vx = vr.vx; vehicle.vy = vr.vy
      vehicle.onGround = vr.onGround

      // Fuel consumption
      vehicle.fuel--
      if (vehicle.fuel <= 0) {
        // Out of fuel — eject
        vehicle.rider = -1
        p.vehicleId = -1
        p.height = PLAYER_H
        p.stance = 'standing'
        p.y = vehicle.y - PLAYER_H
      }

      // Sync player position to vehicle
      if (p.vehicleId >= 0) {
        p.x = vehicle.x
        p.y = vehicle.y - 0.1
        p.vx = vehicle.vx
        p.vy = vehicle.vy
        p.onGround = vehicle.onGround
      }
    } else {
      // ── Normal on-foot movement ───────────────────
    const onLadder = isClimbable(world, Math.floor(p.x), Math.floor(p.y + p.height * 0.5), ww, wh)
    const inWater = isLiquid(world, Math.floor(p.x), Math.floor(p.y + p.height * 0.5), ww, wh)
    const stanceMult = p.stance === 'crouching' ? CROUCH_SPEED_MULT : p.stance === 'prone' ? PRONE_SPEED_MULT : 1
    const speed = MOVE_SPEED * p.speedMult * stanceMult * (inWater ? 0.6 : 1)

    if (a.left) { p.vx = -speed; p.facing = -1 }
    else if (a.right) { p.vx = speed; p.facing = 1 }
    else p.vx *= 0.7

    if (Math.abs(p.vx) < 0.001) p.vx = 0

    // Jump / climb (can't jump while prone)
    if (a.jump && p.stance !== 'prone') {
      if (onLadder || inWater) {
        p.vy = -MOVE_SPEED * 0.8 // climb up
      } else if (p.onGround) {
        p.vy = -JUMP_VEL * (p.stance === 'crouching' ? 0.7 : 1)
        p.stance = 'standing' // stand up on jump
      }
    }

    // Gravity (reduced in water/on ladder)
    const grav = (onLadder || inWater) ? GRAVITY * 0.2 : GRAVITY
    p.vy += grav
    if (p.vy > MAX_FALL) p.vy = MAX_FALL
    if ((onLadder || inWater) && !a.jump && p.vy > 0.02) p.vy = 0.02

    // Move with collision
    const result = moveEntity(world, p.x, p.y, p.width, p.height, p.vx, p.vy, ww, wh)
    p.x = result.x; p.y = result.y
    p.vx = result.vx; p.vy = result.vy
    p.onGround = result.onGround
    } // end normal movement

    // Fall into void
    if (p.y > wh + 5) killPlayer(p, state, -1)

    // Lava damage
    if (isLiquid(world, Math.floor(p.x), Math.floor(p.y + p.height * 0.5), ww, wh)) {
      const block = world[Math.floor(p.y + p.height * 0.5)]?.[Math.floor(p.x)]
      if (block === B.LAVA && state.frame % 10 === 0) {
        p.hp -= 5
        if (p.hp <= 0) killPlayer(p, state, -1)
      }
    }

    // Cactus damage
    {
      const minTx = Math.floor(p.x - p.width / 2)
      const maxTx = Math.floor(p.x + p.width / 2)
      const minTy = Math.floor(p.y)
      const maxTy = Math.floor(p.y + p.height)
      for (let ty = minTy; ty <= maxTy; ty++) {
        for (let tx = minTx; tx <= maxTx; tx++) {
          if (tx >= 0 && tx < ww && ty >= 0 && ty < wh && world[ty][tx] === B.CACTUS) {
            if (state.frame % 20 === 0 && p.invincibleTimer <= 0) {
              damagePlayer(p, 3, state)
            }
          }
        }
      }
    }

    // ── Hotbar Selection ────────────────────────────
    if (a.hotbar >= 0 && a.hotbar < 10) p.hotbar = a.hotbar
    if (a.scrollDir !== 0) {
      p.hotbar = (p.hotbar + a.scrollDir + 10) % 10
    }

    // ── Mining ──────────────────────────────────────
    if (a.attack) {
      const cx = Math.floor(a.cursorX)
      const cy = Math.floor(a.cursorY)
      const dist = Math.hypot(cx - p.x, cy - (p.y + p.height / 2))

      if (dist <= MINE_RANGE && cx >= 0 && cx < ww && cy >= 0 && cy < wh) {
        const block = world[cy][cx]
        if (block !== B.AIR && block !== B.WATER && block !== B.LAVA) {
          const def = BLOCKS[block]
          if (def && def.hardness > 0) {
            // Check if same target
            if (!p.mineTarget || p.mineTarget.x !== cx || p.mineTarget.y !== cy) {
              p.mineTarget = { x: cx, y: cy }
              p.mineProgress = 0
            }

            // Calculate mine speed
            const heldItem = p.inventory[p.hotbar]
            const heldDef = heldItem?.id >= 0 ? ITEMS[heldItem.id] : null
            let speed = 1.0
            if (heldDef?.mineSpeed && heldDef.toolType === def.toolType) {
              speed = heldDef.mineSpeed
              // Tool level check
              if (heldDef.toolLevel !== undefined && heldDef.toolLevel >= def.toolLevel) {
                speed *= 1.0  // can mine
              } else if (def.toolLevel > 0) {
                speed = 0.1 // wrong tool level = very slow
              }
            } else if (def.toolLevel > 0) {
              speed = 0.1 // need specific tool
            }

            p.mineProgress += speed

            // Mining particles
            if (state.frame % 5 === 0) {
              spawnParticles(state, cx + 0.5, cy + 0.5, def.color, 3)
            }

            if (p.mineProgress >= def.hardness) {
              // Break block
              world[cy][cx] = B.AIR
              p.mineTarget = null
              p.mineProgress = 0

              // Drop item
              if (def.drop >= 0) {
                spawnDrop(state, cx + 0.5, cy + 0.2, def.drop, def.dropCount)
              }

              // Random bonus drops from leaves
              if (block === B.LEAVES && Math.random() < 0.1) {
                spawnDrop(state, cx + 0.5, cy + 0.2, I.APPLE, 1)
              }
            }
          }
        } else {
          p.mineTarget = null
          p.mineProgress = 0
        }
      } else {
        p.mineTarget = null
        p.mineProgress = 0
      }
    } else {
      p.mineTarget = null
      p.mineProgress = 0
    }

    // ── Place Block / Use Item ──────────────────────
    if (a.place) {
      const cx = Math.floor(a.cursorX)
      const cy = Math.floor(a.cursorY)
      const dist = Math.hypot(cx - p.x, cy - (p.y + p.height / 2))

      if (dist <= PLACE_RANGE && cx >= 0 && cx < ww && cy >= 0 && cy < wh) {
        const heldSlot = p.inventory[p.hotbar]
        if (heldSlot?.id >= 0) {
          const itemDef = ITEMS[heldSlot.id]

          if (itemDef?.placeable && itemDef.placeBlock !== undefined) {
            // Place block
            if (world[cy][cx] === B.AIR) {
              // Check not overlapping player
              const playerMinX = Math.floor(p.x - p.width / 2)
              const playerMaxX = Math.floor(p.x + p.width / 2)
              const playerMinY = Math.floor(p.y)
              const playerMaxY = Math.floor(p.y + p.height)
              const overlaps = cx >= playerMinX && cx <= playerMaxX && cy >= playerMinY && cy <= playerMaxY

              if (!overlaps) {
                world[cy][cx] = itemDef.placeBlock
                heldSlot.count--
                if (heldSlot.count <= 0) { heldSlot.id = -1; heldSlot.count = 0 }
              }
            }
          } else if (itemDef?.heal && p.attackCooldown <= 0) {
            // Use healing item
            p.hp = Math.min(p.maxHp, p.hp + (itemDef.heal || 0))
            heldSlot.count--
            if (heldSlot.count <= 0) { heldSlot.id = -1; heldSlot.count = 0 }
            p.attackCooldown = 15
          } else if (itemDef?.hunger && p.attackCooldown <= 0) {
            // Eat food
            p.hunger = Math.min(p.maxHunger, p.hunger + (itemDef.hunger || 0))
            heldSlot.count--
            if (heldSlot.count <= 0) { heldSlot.id = -1; heldSlot.count = 0 }
            p.attackCooldown = 15
          } else if (itemDef?.speedBoost && p.attackCooldown <= 0) {
            p.speedMult = itemDef.speedBoost
            p.speedTimer = 600
            heldSlot.count--
            if (heldSlot.count <= 0) { heldSlot.id = -1; heldSlot.count = 0 }
            p.attackCooldown = 15
          } else if (itemDef?.throwable && p.attackCooldown <= 0) {
            // Throw grenade/dynamite
            const dx = a.cursorX - p.x
            const dy = a.cursorY - (p.y + p.height * 0.3)
            const len = Math.hypot(dx, dy) || 1
            state.projectiles.push({
              x: p.x, y: p.y + p.height * 0.3,
              vx: (dx / len) * 0.2, vy: (dy / len) * 0.2 - 0.1,
              owner: pi, damage: itemDef.damage || 30,
              color: itemDef.color, gravity: true, life: 120,
            })
            heldSlot.count--
            if (heldSlot.count <= 0) { heldSlot.id = -1; heldSlot.count = 0 }
            p.attackCooldown = MELEE_COOLDOWN
          } else if (itemDef?.ranged && p.attackCooldown <= 0) {
            // Shoot ranged weapon
            const ammoId = itemDef.ammoId
            if (ammoId && countInInventory(p.inventory, ammoId) > 0) {
              removeFromInventory(p.inventory, ammoId, 1)
              const dx = a.cursorX - p.x
              const dy = a.cursorY - (p.y + p.height * 0.3)
              const len = Math.hypot(dx, dy) || 1
              const spd = (itemDef.projectileSpeed || 12) * 0.02
              state.projectiles.push({
                x: p.x + p.facing * 0.5, y: p.y + p.height * 0.3,
                vx: (dx / len) * spd, vy: (dy / len) * spd,
                owner: pi, damage: itemDef.damage || 10,
                color: '#ff0', gravity: false, life: 200,
              })
              p.attackCooldown = MELEE_COOLDOWN
            }
          }
        }
      }
    }

    // ── Melee Attack ────────────────────────────────
    if (a.attack && p.attackCooldown <= 0) {
      const heldSlot = p.inventory[p.hotbar]
      const heldDef = heldSlot?.id >= 0 ? ITEMS[heldSlot.id] : null
      const isMelee = heldDef?.toolType === 'sword' || heldDef?.toolType === 'axe' || heldDef?.toolType === 'pickaxe' || heldDef?.toolType === 'shovel' || !heldDef

      // Check stance-weapon compatibility (swords can't be used prone)
      const stanceBlocked = p.stance === 'prone' && heldDef?.proneUsable === false

      if (isMelee && !stanceBlocked) {
        const dmg = (heldDef?.damage || 2) * p.strengthMult

        // Hit enemies
        for (const e of state.enemies) {
          if (!e.alive) continue
          const dist = Math.hypot(e.x - p.x, e.y - (p.y + p.height / 2))
          if (dist < MELEE_RANGE) {
            e.hp -= dmg
            e.vx += p.facing * 0.15
            e.vy -= 0.1
            spawnParticles(state, e.x, e.y + e.height / 2, '#f00', 5)
            if (e.hp <= 0) {
              killEnemy(e, state, pi)
            }
            p.attackCooldown = MELEE_COOLDOWN
            break
          }
        }

        // Hit other players (VS modes)
        if (config.mode === 'deathmatch' || config.mode === 'team-deathmatch') {
          for (let oi = 0; oi < state.players.length; oi++) {
            if (oi === pi) continue
            const o = state.players[oi]
            if (!o.alive) continue
            if (config.mode === 'team-deathmatch' && o.team === p.team) continue
            const dist = Math.hypot(o.x - p.x, o.y - (p.y + p.height / 2))
            if (dist < MELEE_RANGE && o.invincibleTimer <= 0) {
              damagePlayer(o, dmg, state)
              o.vx += p.facing * 0.15
              o.vy -= 0.1
              if (o.hp <= 0) killPlayer(o, state, pi)
              p.attackCooldown = MELEE_COOLDOWN
              break
            }
          }
        }
      }
    }

    // ── Drop Item ───────────────────────────────────
    if (a.dropItem && p.inventory[p.hotbar]?.id >= 0) {
      const slot = p.inventory[p.hotbar]
      spawnDrop(state, p.x + p.facing * 1.5, p.y + p.height * 0.3, slot.id, 1)
      slot.count--
      if (slot.count <= 0) { slot.id = -1; slot.count = 0 }
    }
  }

  // ── Update Item Drops ────────────────────────────────
  for (let i = state.drops.length - 1; i >= 0; i--) {
    const d = state.drops[i]
    d.life--
    if (d.life <= 0) { state.drops.splice(i, 1); continue }

    // Gravity
    d.vy += GRAVITY
    if (d.vy > MAX_FALL) d.vy = MAX_FALL

    const newY = d.y + d.vy
    const tileBelow = Math.floor(newY + 0.5)
    const tx = Math.floor(d.x)
    if (isSolid(world, tx, tileBelow, config.worldWidth, config.worldHeight)) {
      d.vy = 0
    } else {
      d.y = newY
    }

    // Magnet to nearby players
    for (const p of state.players) {
      if (!p.alive) continue
      const dist = Math.hypot(d.x - p.x, d.y - (p.y + p.height / 2))
      if (dist < ITEM_MAGNET_RANGE) {
        // Move toward player
        const dx = p.x - d.x
        const dy = (p.y + p.height / 2) - d.y
        const len = Math.hypot(dx, dy) || 1
        d.x += (dx / len) * 0.12
        d.y += (dy / len) * 0.12

        // Pickup
        if (dist < 0.5) {
          const leftover = addToInventory(p.inventory, d.itemId, d.count)
          if (leftover <= 0) {
            state.drops.splice(i, 1)
          } else {
            d.count = leftover
          }
          break
        }
      }
    }
  }

  // ── Update Particles ─────────────────────────────────
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i]
    p.x += p.vx; p.y += p.vy
    p.vy += GRAVITY * 0.5
    p.life--
    if (p.life <= 0) state.particles.splice(i, 1)
  }

  // ── Update Projectiles ───────────────────────────────
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const proj = state.projectiles[i]
    if (proj.gravity) proj.vy += GRAVITY * 0.5
    proj.x += proj.vx; proj.y += proj.vy
    proj.life--

    if (proj.life <= 0) {
      // Explode if throwable
      handleExplosion(state, proj)
      state.projectiles.splice(i, 1)
      continue
    }

    // Off world
    if (proj.x < -1 || proj.x > config.worldWidth + 1 || proj.y < -1 || proj.y > config.worldHeight + 1) {
      state.projectiles.splice(i, 1); continue
    }

    // Hit block
    const bx = Math.floor(proj.x), by = Math.floor(proj.y)
    if (isSolid(world, bx, by, config.worldWidth, config.worldHeight)) {
      handleExplosion(state, proj)
      state.projectiles.splice(i, 1)
      continue
    }

    // Hit entities
    // Hit players
    for (let pi = 0; pi < state.players.length; pi++) {
      const p = state.players[pi]
      if (!p.alive || pi === proj.owner || p.invincibleTimer > 0) continue
      if (config.mode === 'team-deathmatch' && proj.owner >= 0) {
        const shooter = state.players[proj.owner]
        if (shooter && shooter.team === p.team) continue
      }
      if (proj.x > p.x - p.width / 2 && proj.x < p.x + p.width / 2 &&
          proj.y > p.y && proj.y < p.y + p.height) {
        damagePlayer(p, proj.damage, state)
        if (p.hp <= 0) killPlayer(p, state, proj.owner)
        state.projectiles.splice(i, 1)
        break
      }
    }
    // Hit enemies
    if (proj.owner >= 0 && state.projectiles[i]) {
      for (const e of state.enemies) {
        if (!e.alive) continue
        if (proj.x > e.x - e.width / 2 && proj.x < e.x + e.width / 2 &&
            proj.y > e.y && proj.y < e.y + e.height) {
          e.hp -= proj.damage
          spawnParticles(state, e.x, e.y + e.height / 2, '#f00', 3)
          if (e.hp <= 0) killEnemy(e, state, proj.owner)
          state.projectiles.splice(i, 1)
          break
        }
      }
    }
  }

  // ── Update Vehicles (unoccupied physics) ────────────
  for (let i = state.vehicles.length - 1; i >= 0; i--) {
    const v = state.vehicles[i]
    if (!v.alive) { state.vehicles.splice(i, 1); continue }
    if (v.rider >= 0) continue // driven by player tick above
    const vdef = VEHICLE_DEFS[v.type]
    // Apply gravity to unoccupied vehicles
    if (!vdef.flying) {
      v.vy += GRAVITY
      if (v.vy > MAX_FALL) v.vy = MAX_FALL
      v.vx *= 0.95
      const vr = moveEntity(world, v.x, v.y, vdef.width, vdef.height, v.vx, v.vy, ww, wh)
      v.x = vr.x; v.y = vr.y; v.vx = vr.vx; v.vy = vr.vy; v.onGround = vr.onGround
    }
    // Lava damage
    if (isLiquid(world, Math.floor(v.x), Math.floor(v.y + vdef.height * 0.5), ww, wh)) {
      const block = world[Math.floor(v.y + vdef.height * 0.5)]?.[Math.floor(v.x)]
      if (block === B.LAVA && state.frame % 15 === 0) {
        v.hp -= 10
        if (v.hp <= 0) {
          v.alive = false
          if (v.rider >= 0 && v.rider < state.players.length) {
            const rider = state.players[v.rider]
            rider.vehicleId = -1
            rider.height = PLAYER_H
            rider.stance = 'standing'
          }
          spawnParticles(state, v.x, v.y, '#f80', 15)
        }
      }
    }
    // Void
    if (v.y > wh + 5) { v.alive = false }
  }

  // ── Win Condition ────────────────────────────────────
  if (!state.gameOver) {
    if (config.mode === 'deathmatch' || config.mode === 'team-deathmatch') {
      for (const p of state.players) {
        if (p.kills >= config.killsToWin) {
          state.gameOver = true
          state.winner = p.index
          p.stars++
          break
        }
      }
    }
  }
}

// ─── Helper Functions ──────────────────────────────────────
function damagePlayer(p: PlayerState, dmg: number, state: FlatWorldState) {
  // Armor reduction
  const totalArmor = p.armor.reduce((sum, id) => {
    if (id >= 0) { const def = ITEMS[id]; return sum + (def?.armor || 0) }
    return sum
  }, 0)
  const reduction = totalArmor * 0.04 // 4% per armor point
  const actualDmg = Math.max(1, Math.round(dmg * (1 - reduction)))
  p.hp -= actualDmg
  p.invincibleTimer = INVINCIBLE_TICKS
  spawnParticles(state, p.x, p.y + p.height * 0.3, '#f00', 4)
}

function killPlayer(victim: PlayerState, state: FlatWorldState, killerIndex: number) {
  victim.alive = false
  victim.respawnTimer = RESPAWN_TICKS
  victim.deaths++
  victim.streak = 0

  // Eject from vehicle
  if (victim.vehicleId >= 0) {
    const veh = state.vehicles.find(v => v.id === victim.vehicleId)
    if (veh) veh.rider = -1
    victim.vehicleId = -1
    victim.height = PLAYER_H
    victim.stance = 'standing'
  }

  // Drop some items
  for (let i = 0; i < victim.inventory.length; i++) {
    const slot = victim.inventory[i]
    if (slot.id >= 0 && Math.random() < 0.3) {
      spawnDrop(state, victim.x + (Math.random() - 0.5) * 2, victim.y, slot.id, slot.count)
      slot.id = -1; slot.count = 0
    }
  }

  // Award killer
  if (killerIndex >= 0 && killerIndex < state.players.length) {
    const killer = state.players[killerIndex]
    killer.kills++
    killer.streak++
    killer.coins++
    if (killer.streak > killer.bestStreak) killer.bestStreak = killer.streak
    if (killer.streak > 0 && killer.streak % 3 === 0) killer.gems++
  }

  spawnParticles(state, victim.x, victim.y + victim.height / 2, victim.color, 15)
}

function respawnPlayer(p: PlayerState, state: FlatWorldState) {
  const { worldWidth: ww, worldHeight: wh } = state.config
  // Find surface near center
  const sx = Math.floor(ww * (0.3 + Math.random() * 0.4))
  let sy = 0
  for (let y = 0; y < wh; y++) {
    if (state.world[y][sx] !== B.AIR && state.world[y][sx] !== B.WATER) {
      sy = y - 2
      break
    }
  }
  p.x = sx; p.y = sy
  p.vx = 0; p.vy = 0
  p.hp = p.maxHp
  p.hunger = p.maxHunger
  p.alive = true
  p.invincibleTimer = INVINCIBLE_TICKS * 3
  p.mineTarget = null; p.mineProgress = 0
  p.stance = 'standing'; p.vehicleId = -1; p.height = PLAYER_H
}

function killEnemy(e: import('./types').EnemyState, state: FlatWorldState, killerIndex: number) {
  e.alive = false
  const def = (await_enemy_types())[e.type]
  if (def) {
    // Drop items
    for (const [itemId, count, chance] of def.drops) {
      if (Math.random() < chance) {
        spawnDrop(state, e.x, e.y + e.height / 2, itemId, count)
      }
    }
    // Award XP as coins
    if (killerIndex >= 0 && killerIndex < state.players.length) {
      state.players[killerIndex].coins += def.xp
    }
  }
  if (def?.boss) state.bossAlive = false
  spawnParticles(state, e.x, e.y + e.height / 2, def?.color || '#0f0', 15)
}

// Avoid circular deps by lazy import
function await_enemy_types() {
// Intentional require() to break circular dependency between gameState and types
// eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ENEMY_TYPES } = require('./types')
  return ENEMY_TYPES as Record<string, import('./types').EnemyDef>
}

function spawnDrop(state: FlatWorldState, x: number, y: number, itemId: number, count: number) {
  state.drops.push({
    x, y, vy: -0.08,
    itemId, count,
    life: ITEM_DESPAWN,
    magnet: -1,
  })
}

export function spawnParticles(state: FlatWorldState, x: number, y: number, color: string, count: number) {
  for (let i = 0; i < count; i++) {
    state.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.8) * 0.12,
      color,
      life: 20 + Math.floor(Math.random() * 20),
      maxLife: 40,
      size: 0.1 + Math.random() * 0.15,
    })
  }
}

function handleExplosion(state: FlatWorldState, proj: import('./types').Projectile) {
  // Check if projectile is a throwable (has significant damage and gravity)
  if (proj.damage >= 25 && proj.gravity) {
    const radius = proj.damage >= 50 ? 5 : proj.damage >= 35 ? 3 : 2
    const cx = Math.floor(proj.x), cy = Math.floor(proj.y)
    const { worldWidth: ww, worldHeight: wh } = state.config

    // Destroy blocks
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy > radius * radius) continue
        const bx = cx + dx, by = cy + dy
        if (bx < 0 || bx >= ww || by < 0 || by >= wh) continue
        const block = state.world[by][bx]
        if (block !== B.AIR && block !== B.BEDROCK) {
          const def = BLOCKS[block]
          if (def && def.hardness > 0) {
            state.world[by][bx] = B.AIR
            if (def.drop >= 0 && Math.random() < 0.5) {
              spawnDrop(state, bx + 0.5, by + 0.5, def.drop, 1)
            }
          }
        }
      }
    }

    // Damage nearby entities
    for (const p of state.players) {
      if (!p.alive) continue
      const dist = Math.hypot(p.x - proj.x, (p.y + p.height / 2) - proj.y)
      if (dist < radius + 1) {
        const dmg = Math.round(proj.damage * (1 - dist / (radius + 2)))
        damagePlayer(p, dmg, state)
        if (p.hp <= 0) killPlayer(p, state, proj.owner)
      }
    }
    for (const e of state.enemies) {
      if (!e.alive) continue
      const dist = Math.hypot(e.x - proj.x, (e.y + e.height / 2) - proj.y)
      if (dist < radius + 1) {
        e.hp -= Math.round(proj.damage * (1 - dist / (radius + 2)))
        if (e.hp <= 0) killEnemy(e, state, proj.owner)
      }
    }

    spawnParticles(state, proj.x, proj.y, '#f80', 20)
    spawnParticles(state, proj.x, proj.y, '#ff0', 15)
  }
}
