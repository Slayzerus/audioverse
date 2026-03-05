import type { GameConfig } from '../../pages/games/mini/types'
/**
 * gameLogic.ts — Full game simulation for Menace 3D (Post-Apocalyptic GTA2).
 *
 * Handles: player movement (on-foot & vehicle), shooting, vehicle physics
 * (cars, trucks, bikes, tanks, helicopters, boats), NPC AI, police AI,
 * missions, pickups, explosions, collisions, scoring, wanted system.
 */
import type {
  GameState, Player, Vehicle, NPC, Pickup,
  Mission, Vec2, WeaponType, VehicleKind, PickupKind, MissionType,
} from './types'
import type { PlayerSlot } from '../../pages/games/mini/types'
import { PLAYER_COLORS } from '../../pages/games/mini/types'
import { generateLevel } from './mapGenerator'
import {
  DT, PLAYER_RADIUS, PLAYER_SPEED, PLAYER_HP, PLAYER_ARMOR_MAX,
  VEHICLE_FRICTION, VEHICLE_DEFS, HELI_LIFT_SPEED, HELI_MAX_ALT,
  WEAPON_INFO, WEAPON_AMMO, BULLET_LIFETIME,
  EXPLOSION_RADIUS, EXPLOSION_DURATION,
  NPC_SPEED, NPC_FLEE_SPEED, NPC_HP, NPC_SPAWN_MAX,
  POLICE_SPEED, POLICE_SHOOT_RANGE, POLICE_HP, MAX_WANTED, WANTED_DECAY_TIME,
  MISSION_TIMER_DEFAULT, CITY_SIZES,
  SCORE_NPC_KILL, SCORE_PLAYER_KILL, SCORE_VEHICLE_DESTROY, LEVEL_UP_STARS,
  DAY_CYCLE_SPEED, VEHICLE_COLORS,
} from './constants'
import {
  dist, clamp, rng, rngInt, pick,
  collidesBuilding, isOnWater, pushOutBuildings,
  type InputSnapshot,
} from './menaceHelpers'
import { botAI, isBotAction } from './menaceBotAI'

// Re-export helpers & types that external consumers depend on
export { dist, clamp } from './menaceHelpers'
export type { InputSnapshot } from './menaceHelpers'

// ── Create player ─────────────────────────────────────────
function createPlayer(p: PlayerSlot, spawnX: number, spawnY: number): Player {
  return {
    x: spawnX, y: spawnY, z: 0,
    angle: 0, hp: PLAYER_HP, maxHp: PLAYER_HP, armor: 0,
    alive: true, inVehicle: null,
    weapon: { type: 'pistol', ammo: 24 },
    lastShot: 0,
    score: 0, kills: 0, wanted: 0, wantedTimer: 0,
    coins: 0, gems: 0, starPts: 0, level: 1,
    color: p.color || PLAYER_COLORS[p.index % PLAYER_COLORS.length],
    name: p.name, pIndex: p.index,
    input: p.input as Player['input'],
    comboTimer: 0, comboCount: 0,
    respawnTimer: 0, speedBoost: 0, moveSpeed: PLAYER_SPEED,
  }
}

// ── Spawn vehicles ────────────────────────────────────────
function spawnVehicles(spawns: Vec2[], count: number): Vehicle[] {
  const vehicles: Vehicle[] = []
  const kinds: VehicleKind[] = ['car', 'car', 'car', 'truck', 'bike', 'bike']
  for (let i = 0; i < Math.min(count, spawns.length); i++) {
    const sp = spawns[i]
    const kind = pick(kinds)
    const def = VEHICLE_DEFS[kind]
    vehicles.push({
      x: sp.x, y: sp.y, z: 0,
      angle: Math.random() * Math.PI * 2,
      speed: 0, hp: def.hp, maxHp: def.hp,
      kind, color: pick(VEHICLE_COLORS),
      driver: null,
      width: def.w, length: def.l,
      maxSpeed: def.maxSpeed, accel: def.accel,
      steerRate: def.steer, mass: def.mass,
      altitude: 0, targetAltitude: 0, inWater: false,
    })
  }
  // Ensure at least one tank, one helicopter, one boat
  const special: VehicleKind[] = ['tank', 'helicopter', 'boat']
  for (const kind of special) {
    if (vehicles.length < spawns.length) {
      const sp = spawns[vehicles.length % spawns.length]
      const def = VEHICLE_DEFS[kind]
      vehicles.push({
        x: sp.x, y: sp.y, z: 0,
        angle: Math.random() * Math.PI * 2,
        speed: 0, hp: def.hp, maxHp: def.hp,
        kind, color: pick(VEHICLE_COLORS),
        driver: null,
        width: def.w, length: def.l,
        maxSpeed: def.maxSpeed, accel: def.accel,
        steerRate: def.steer, mass: def.mass,
        altitude: kind === 'helicopter' ? 0 : 0,
        targetAltitude: 0,
        inWater: kind === 'boat',
      })
    }
  }
  return vehicles
}

// ── Spawn NPCs ────────────────────────────────────────────
function spawnNPCs(ww: number, wh: number, count: number, st: GameState): NPC[] {
  const npcs: NPC[] = []
  for (let i = 0; i < count; i++) {
    let x: number, y: number
    let tries = 0
    do {
      x = rng(60, ww - 60)
      y = rng(60, wh - 60)
      tries++
    } while (collidesBuilding(x, y, 4, st) && tries < 20)
    const a = Math.random() * Math.PI * 2
    npcs.push({
      x, y, angle: a,
      dx: Math.cos(a) * NPC_SPEED * DT, dy: Math.sin(a) * NPC_SPEED * DT,
      timer: rngInt(120, 360), hp: NPC_HP,
      state: 'wander', modelVariant: rngInt(0, 4),
    })
  }
  return npcs
}

// ── Spawn pickups ─────────────────────────────────────────
function spawnPickups(spawns: Vec2[], count: number): Pickup[] {
  const kinds: PickupKind[] = ['pistol', 'shotgun', 'machinegun', 'rocket', 'flamethrower', 'health', 'health', 'armor', 'coins', 'gems']
  const pickups: Pickup[] = []
  for (let i = 0; i < Math.min(count, spawns.length); i++) {
    pickups.push({
      x: spawns[i].x, y: spawns[i].y,
      kind: pick(kinds),
      respawnTimer: 0, collected: false,
    })
  }
  return pickups
}

// ── Generate missions ─────────────────────────────────────
function generateMissions(mode: string, ww: number, wh: number): Mission[] {
  if (mode === 'coop-heist') {
    const types: MissionType[] = ['steal', 'deliver', 'destroy', 'assassinate', 'survive']
    const descs: Record<MissionType, string[]> = {
      steal: ['Steal the supplies', 'Grab the loot'],
      deliver: ['Deliver cargo', 'Transport goods'],
      destroy: ['Blow up raiders', 'Destroy outpost'],
      assassinate: ['Eliminate the warlord', 'Take out the boss'],
      survive: ['Survive the wave', 'Hold the position'],
      race: ['Race to the checkpoint'],
    }
    return Array.from({ length: 5 }, (_, i) => {
      const t = pick(types)
      return {
        id: i,
        x: rng(200, ww - 200), y: rng(200, wh - 200),
        targetX: rng(200, ww - 200), targetY: rng(200, wh - 200),
        type: t, desc: pick(descs[t]),
        active: true, assignedTo: null,
        reward: { coins: rngInt(10, 30), gems: rngInt(1, 5), starPts: rngInt(15, 40) },
        timeLimit: t === 'survive' ? 30 : 0,
        timer: 0,
      }
    })
  }
  // Free-roam: occasional missions appear
  return Array.from({ length: 3 }, (_, i) => ({
    id: i,
    x: rng(200, ww - 200), y: rng(200, wh - 200),
    targetX: rng(200, ww - 200), targetY: rng(200, wh - 200),
    type: pick(['deliver', 'destroy', 'steal'] as MissionType[]),
    desc: pick(['Deliver supplies', 'Raid the camp', 'Salvage parts']),
    active: true, assignedTo: null,
    reward: { coins: rngInt(8, 20), gems: rngInt(1, 3), starPts: rngInt(10, 25) },
    timeLimit: 0, timer: 0,
  }))
}

// ── Init game state ───────────────────────────────────────
export function initGameState(
  players: PlayerSlot[],
  config: GameConfig,
): GameState {
  const size = CITY_SIZES[(config.citySize as string) || 'medium'] || 2400
  const mode = (config.gameMode as string) || 'free-roam'
  const level = generateLevel(size, players.length)

  // Temp state for collision checks during NPC spawning
  const tempState = { level } as GameState

  const pls = players.map((p, i) => {
    const sp = level.spawnPoints[i % level.spawnPoints.length]
    return createPlayer(p, sp.x, sp.y)
  })

  const vehicles = spawnVehicles(level.vehicleSpawns, Math.floor(size / 60))
  const npcs = spawnNPCs(level.worldW, level.worldH, Math.min(30, Math.floor(size / 60)), tempState)
  const pickups = spawnPickups(level.pickupSpawns, Math.floor(size / 80))
  const missions = generateMissions(mode, level.worldW, level.worldH)

  return {
    players: pls,
    vehicles,
    npcs,
    bullets: [],
    explosions: [],
    pickups,
    police: [],
    missions,
    level,
    mode,
    timer: mode === 'vs-rampage' ? MISSION_TIMER_DEFAULT : 0,
    frame: 0,
    gameOver: false,
    winner: null,
    dayNightCycle: 0.1, // start at early morning
    weatherIntensity: Math.random() * 0.3,
  }
}

// ── Kill player ───────────────────────────────────────────
function killPlayer(p: Player, st: GameState) {
  // Eject from vehicle
  if (p.inVehicle !== null && p.inVehicle < st.vehicles.length) {
    st.vehicles[p.inVehicle].driver = null
    p.inVehicle = null
  }
  p.alive = false
  p.hp = 0
  p.armor = 0
  p.respawnTimer = 180 // 3 seconds
}

// ── Respawn player ────────────────────────────────────────
function respawnPlayer(p: Player, st: GameState) {
  const sp = st.level.spawnPoints[p.pIndex % st.level.spawnPoints.length]
  p.x = sp.x + rng(-20, 20)
  p.y = sp.y + rng(-20, 20)
  p.z = 0
  p.hp = p.maxHp
  p.alive = true
  p.armor = 0
  p.weapon = { type: 'pistol', ammo: 24 }
  p.wanted = Math.max(0, p.wanted - 2)
}

// ── Damage player (armor absorbs first) ───────────────────
function damagePlayer(p: Player, amount: number, st: GameState, killerIndex?: number) {
  if (!p.alive) return
  let dmg = amount
  if (p.armor > 0) {
    const absorbed = Math.min(p.armor, dmg * 0.7)
    p.armor -= absorbed
    dmg -= absorbed
  }
  p.hp -= dmg
  if (p.hp <= 0) {
    killPlayer(p, st)
    if (killerIndex !== undefined) {
      const killer = st.players.find(pp => pp.pIndex === killerIndex)
      if (killer) {
        killer.kills++
        killer.score += SCORE_PLAYER_KILL
        killer.coins += 5
        killer.starPts += 20
        killer.comboCount++
        killer.comboTimer = 120
      }
    }
  }
}

// ── Spawn explosion ───────────────────────────────────────
function spawnExplosion(st: GameState, x: number, y: number, damage: number, radius?: number) {
  st.explosions.push({
    x, y, z: 0,
    radius: radius || EXPLOSION_RADIUS,
    timer: EXPLOSION_DURATION,
    maxTimer: EXPLOSION_DURATION,
    damage,
  })
}

// ── Main game tick ────────────────────────────────────────
export function gameTick(st: GameState, input: InputSnapshot, now: number) {
  if (st.gameOver) return
  st.frame++

  // ── Day/Night cycle ─────────────────────────────────────
  st.dayNightCycle = (st.dayNightCycle + DAY_CYCLE_SPEED) % 1

  // ── Timer (vs-rampage) ──────────────────────────────────
  if (st.mode === 'vs-rampage') {
    st.timer -= DT
    if (st.timer <= 0) {
      st.gameOver = true
      const best = st.players.reduce((a, b) => a.kills > b.kills ? a : b)
      st.winner = best.name
      return
    }
  }

  // ── Bot AI ──────────────────────────────────────────────
  for (const p of st.players) {
    botAI(p, st, input)
  }

  // ── Player input & movement ─────────────────────────────
  for (const p of st.players) {
    // Respawn timer
    if (!p.alive) {
      if (p.respawnTimer > 0) {
        p.respawnTimer--
        if (p.respawnTimer <= 0) respawnPlayer(p, st)
      }
      continue
    }

    // Speed boost decay
    if (p.speedBoost > 0) p.speedBoost--

    // Combo decay
    if (p.comboTimer > 0) p.comboTimer-- ; else p.comboCount = 0

    // Wanted decay
    if (p.wantedTimer > 0) {
      p.wantedTimer--
    } else if (p.wanted > 0) {
      p.wanted = Math.max(0, p.wanted - 1)
      p.wantedTimer = WANTED_DECAY_TIME
    }

    // Level up
    if (p.starPts >= p.level * LEVEL_UP_STARS) {
      p.starPts -= p.level * LEVEL_UP_STARS
      p.level++
      p.maxHp += 10
      p.hp = p.maxHp
    }

    const act = (a: string) => isBotAction(p, a, input)

    if (p.inVehicle !== null) {
      // ── DRIVING ─────────────────────────────────────────
      const vi = p.inVehicle
      const v = st.vehicles[vi]
      if (!v) { p.inVehicle = null; continue }

      if (v.kind === 'helicopter') {
        // ── Helicopter controls ───────────────────────────
        if (act('up')) v.targetAltitude = Math.min(HELI_MAX_ALT, v.targetAltitude + HELI_LIFT_SPEED * DT)
        if (act('down')) v.targetAltitude = Math.max(0, v.targetAltitude - HELI_LIFT_SPEED * DT * 2)
        // Altitude interpolation
        v.altitude += (v.targetAltitude - v.altitude) * 3 * DT
        if (v.altitude < 0.5) v.altitude = 0

        // Horizontal movement (always free movement for helicopters)
        const accelForce = v.accel * DT
        let ax = 0, ay = 0
        if (act('left')) ax -= 1
        if (act('right')) ax += 1
        // Forward/back based on existing angle or just up/down
        if (v.altitude > 2) {
          // Free fly: WASD = move in world directions
          if (act('up')) ay -= 1
          if (act('down')) ay += 1
        }

        if (ax || ay) {
          const len = Math.hypot(ax, ay)
          v.x += (ax / len) * accelForce * 3
          v.y += (ay / len) * accelForce * 3
          v.angle = Math.atan2(ay, ax)
        }
        v.speed *= 0.95 // air friction
        v.x += Math.cos(v.angle) * v.speed * DT
        v.y += Math.sin(v.angle) * v.speed * DT

        // Shooting from helicopter
        if (act('shoot') && p.weapon && p.weapon.ammo > 0) {
          const info = WEAPON_INFO[p.weapon.type]
          if (now - p.lastShot > info.fireRate) {
            p.lastShot = now
            p.weapon.ammo--
            for (let pi = 0; pi < info.projectiles; pi++) {
              const spread = (Math.random() - 0.5) * info.spread
              const bAngle = v.angle + spread
              st.bullets.push({
                x: v.x, y: v.y, z: v.altitude,
                dx: Math.cos(bAngle) * info.speed * DT,
                dy: Math.sin(bAngle) * info.speed * DT,
                owner: p.pIndex, damage: info.damage,
                life: BULLET_LIFETIME, weaponType: p.weapon.type,
              })
            }
            if (p.weapon.ammo <= 0) p.weapon = null
          }
        }
      } else if (v.kind === 'boat') {
        // ── Boat controls ─────────────────────────────────
        const accelForce = act('up') ? v.accel : act('down') ? -v.accel * 0.5 : 0
        v.speed += accelForce * DT
        v.speed *= 0.98 // water friction
        v.speed = clamp(v.speed, -v.maxSpeed * 0.3, v.maxSpeed)

        const canSteer = Math.abs(v.speed) > 5
        if (act('left') && canSteer) v.angle -= v.steerRate * DT
        if (act('right') && canSteer) v.angle += v.steerRate * DT

        v.x += Math.cos(v.angle) * v.speed * DT
        v.y += Math.sin(v.angle) * v.speed * DT

        // Boats can only be on water
        v.inWater = isOnWater(v.x, v.y, st)
        if (!v.inWater) {
          v.speed *= 0.8 // slow down quickly on land
        }
      } else {
        // ── Ground vehicle (car/truck/bike/tank) ──────────
        const accelForce = act('up') ? v.accel : act('down') ? -v.accel * 0.6 : 0
        v.speed += accelForce * DT
        v.speed *= VEHICLE_FRICTION
        v.speed = clamp(v.speed, -v.maxSpeed * 0.3, v.maxSpeed)

        // Handbrake (shoot while driving)
        if (act('shoot') && !p.weapon) v.speed *= 0.93

        const canSteer = Math.abs(v.speed) > 8
        if (act('left') && canSteer) v.angle -= v.steerRate * DT * (v.speed > 0 ? 1 : -1)
        if (act('right') && canSteer) v.angle += v.steerRate * DT * (v.speed > 0 ? 1 : -1)

        // Move
        const newX = v.x + Math.cos(v.angle) * v.speed * DT
        const newY = v.y + Math.sin(v.angle) * v.speed * DT

        // Building collision
        if (!collidesBuilding(newX, newY, v.width * 0.6, st)) {
          v.x = newX; v.y = newY
        } else {
          v.speed *= -0.3 // bounce back
          v.hp -= Math.abs(v.speed) * 0.05
        }

        // Water check (non-boats die in water)
        if (isOnWater(v.x, v.y, st)) {
          v.hp -= 2
          v.speed *= 0.5
        }

        // World bounds
        v.x = clamp(v.x, 0, st.level.worldW)
        v.y = clamp(v.y, 0, st.level.worldH)

        // Shoot from vehicle (if has weapon and not using handbrake)
        if (act('shoot') && p.weapon && p.weapon.ammo > 0) {
          const info = WEAPON_INFO[p.weapon.type]
          if (now - p.lastShot > info.fireRate) {
            p.lastShot = now
            p.weapon.ammo--
            for (let pi = 0; pi < info.projectiles; pi++) {
              const spread = (Math.random() - 0.5) * info.spread
              const bAngle = v.angle + spread
              st.bullets.push({
                x: v.x + Math.cos(v.angle) * v.length * 0.5,
                y: v.y + Math.sin(v.angle) * v.length * 0.5,
                z: 3,
                dx: Math.cos(bAngle) * info.speed * DT,
                dy: Math.sin(bAngle) * info.speed * DT,
                owner: p.pIndex, damage: info.damage,
                life: BULLET_LIFETIME, weaponType: p.weapon.type,
              })
            }
            if (p.weapon.ammo <= 0) p.weapon = null
          }
        }

        // Tank special: auto-shoot with tank gun
        if (v.kind === 'tank' && act('shoot')) {
          if (now - p.lastShot > 1200) {
            p.lastShot = now
            st.bullets.push({
              x: v.x + Math.cos(v.angle) * v.length * 0.6,
              y: v.y + Math.sin(v.angle) * v.length * 0.6,
              z: 5,
              dx: Math.cos(v.angle) * 400 * DT,
              dy: Math.sin(v.angle) * 400 * DT,
              owner: p.pIndex, damage: 120,
              life: 80, weaponType: 'rocket',
            })
          }
        }

        // Hit NPCs while driving
        if (Math.abs(v.speed) > 30) {
          for (let ni = st.npcs.length - 1; ni >= 0; ni--) {
            if (dist(v, st.npcs[ni]) < v.width + 4) {
              st.npcs[ni].hp -= 100
              if (st.npcs[ni].hp <= 0) {
                st.npcs.splice(ni, 1)
                p.wanted = Math.min(MAX_WANTED, p.wanted + 1)
                p.wantedTimer = WANTED_DECAY_TIME
                p.score += SCORE_NPC_KILL
                p.comboCount++; p.comboTimer = 120
              }
            }
          }
        }

        // Hit other vehicles
        for (let oi = 0; oi < st.vehicles.length; oi++) {
          if (oi === vi) continue
          const ov = st.vehicles[oi]
          if (dist(v, ov) < (v.width + ov.width) * 0.6 && Math.abs(v.speed) > 30) {
            const impactDmg = Math.abs(v.speed) * 0.3 * (v.mass / ov.mass)
            ov.hp -= impactDmg
            v.speed *= 0.4
            if (ov.hp <= 0 && ov.driver === null) {
              spawnExplosion(st, ov.x, ov.y, 50)
              p.score += SCORE_VEHICLE_DESTROY
              p.gems++
            }
          }
        }

        // Hit players on foot
        for (const other of st.players) {
          if (other.pIndex === p.pIndex || !other.alive || other.inVehicle !== null) continue
          if (dist(v, other) < v.width + PLAYER_RADIUS && Math.abs(v.speed) > 20) {
            damagePlayer(other, Math.abs(v.speed) * 0.5, st, p.pIndex)
            v.speed *= 0.7
          }
        }
      }

      // Sync player pos to vehicle
      p.x = v.x; p.y = v.y; p.z = v.altitude || 0; p.angle = v.angle

      // Vehicle destroy
      if (v.hp <= 0) {
        spawnExplosion(st, v.x, v.y, 60)
        v.driver = null
        p.inVehicle = null
        p.hp -= 20
        if (p.hp <= 0) killPlayer(p, st)
        // Reset vehicle
        v.hp = v.maxHp * 0.3
        v.speed = 0
      }

      // Exit vehicle
      if (act('enter') && st.frame % 15 === 0) {
        v.driver = null
        p.inVehicle = null
        p.x = v.x + Math.cos(v.angle + Math.PI / 2) * (v.width + 5)
        p.y = v.y + Math.sin(v.angle + Math.PI / 2) * (v.width + 5)
        p.z = 0
        // Helicopter: take damage if exiting high
        if (v.kind === 'helicopter' && v.altitude > 10) {
          damagePlayer(p, v.altitude * 2, st)
        }
        v.altitude = 0; v.targetAltitude = 0
      }

    } else {
      // ── ON FOOT ─────────────────────────────────────────
      let mx = 0, my = 0
      if (act('up')) my -= 1
      if (act('down')) my += 1
      if (act('left')) mx -= 1
      if (act('right')) mx += 1

      const sprinting = act('sprint')
      const speed = p.moveSpeed * (sprinting ? 1.6 : 1) * (p.speedBoost > 0 ? 1.5 : 1) * DT

      if (mx || my) {
        const len = Math.hypot(mx, my)
        const nx = p.x + (mx / len) * speed
        const ny = p.y + (my / len) * speed
        const pushed = pushOutBuildings(nx, ny, PLAYER_RADIUS, st)
        p.x = clamp(pushed.x, 0, st.level.worldW)
        p.y = clamp(pushed.y, 0, st.level.worldH)
        p.angle = Math.atan2(my, mx)
      }

      // Water damage on foot
      if (isOnWater(p.x, p.y, st)) {
        damagePlayer(p, 0.5, st)
      }

      // ── Shooting ────────────────────────────────────────
      if (act('shoot') && p.weapon && p.weapon.ammo > 0) {
        const info = WEAPON_INFO[p.weapon.type]
        if (now - p.lastShot > info.fireRate) {
          p.lastShot = now
          p.weapon.ammo--
          for (let pi = 0; pi < info.projectiles; pi++) {
            const spread = (Math.random() - 0.5) * info.spread
            const bAngle = p.angle + spread
            st.bullets.push({
              x: p.x + Math.cos(p.angle) * PLAYER_RADIUS * 2,
              y: p.y + Math.sin(p.angle) * PLAYER_RADIUS * 2,
              z: 2,
              dx: Math.cos(bAngle) * info.speed * DT,
              dy: Math.sin(bAngle) * info.speed * DT,
              owner: p.pIndex, damage: info.damage,
              life: BULLET_LIFETIME, weaponType: p.weapon.type,
            })
          }
          if (p.weapon.ammo <= 0) p.weapon = null
        }
      }

      // ── Enter vehicle ───────────────────────────────────
      if (act('enter') && st.frame % 15 === 0) {
        let closest = -1, cd = 40
        st.vehicles.forEach((v, vi) => {
          const d = dist(p, v)
          if (d < cd && v.driver === null && v.hp > 0) {
            // Boat: must be near water; Helicopter: anywhere; Others: not in water
            if (v.kind === 'boat' && !isOnWater(v.x, v.y, st)) return
            if (v.kind !== 'boat' && v.kind !== 'helicopter' && isOnWater(v.x, v.y, st)) return
            cd = d; closest = vi
          }
        })
        if (closest >= 0) {
          p.inVehicle = closest
          st.vehicles[closest].driver = p.pIndex
        }
      }

      // ── Pickup items ────────────────────────────────────
      if (act('pickup') && st.frame % 10 === 0) {
        for (const pk of st.pickups) {
          if (pk.collected || dist(p, pk) > 24) continue
          applyPickup(pk, p)
          pk.collected = true
          pk.respawnTimer = 600 // respawn after 10s
          break
        }
      }
    }
  }

  // ── Bullets ─────────────────────────────────────────────
  for (let bi = st.bullets.length - 1; bi >= 0; bi--) {
    const b = st.bullets[bi]
    b.x += b.dx; b.y += b.dy; b.life--

    if (b.life <= 0 || b.x < 0 || b.x > st.level.worldW || b.y < 0 || b.y > st.level.worldH) {
      // Rocket explosion on timeout
      if (b.weaponType === 'rocket') spawnExplosion(st, b.x, b.y, b.damage * 0.5)
      st.bullets.splice(bi, 1); continue
    }

    // Building collision
    if (collidesBuilding(b.x, b.y, 2, st)) {
      if (b.weaponType === 'rocket') spawnExplosion(st, b.x, b.y, b.damage)
      st.bullets.splice(bi, 1); continue
    }

    // Hit players
    let bulletConsumed = false
    for (const p of st.players) {
      if (p.pIndex === b.owner || !p.alive) continue
      const hitR = p.inVehicle !== null ? 16 : PLAYER_RADIUS + 3
      if (dist(b, p) < hitR) {
        if (b.weaponType === 'rocket') {
          spawnExplosion(st, b.x, b.y, b.damage, 30)
        } else {
          damagePlayer(p, b.damage, st, b.owner)
        }
        st.bullets.splice(bi, 1); bulletConsumed = true; break
      }
    }
    if (bulletConsumed) continue

    // Hit NPCs
    for (let ni = st.npcs.length - 1; ni >= 0; ni--) {
      if (dist(b, st.npcs[ni]) < 8) {
        st.npcs[ni].hp -= b.damage
        if (st.npcs[ni].hp <= 0) {
          st.npcs.splice(ni, 1)
          const shooter = st.players.find(pp => pp.pIndex === b.owner)
          if (shooter) {
            shooter.wanted = Math.min(MAX_WANTED, shooter.wanted + 1)
            shooter.wantedTimer = WANTED_DECAY_TIME
            shooter.score += SCORE_NPC_KILL
          }
        } else {
          // NPC starts fleeing
          st.npcs[ni].state = 'flee'
          const fleeAngle = Math.atan2(st.npcs[ni].y - b.y, st.npcs[ni].x - b.x)
          st.npcs[ni].dx = Math.cos(fleeAngle) * NPC_FLEE_SPEED * DT
          st.npcs[ni].dy = Math.sin(fleeAngle) * NPC_FLEE_SPEED * DT
          st.npcs[ni].timer = 120
        }
        if (b.weaponType === 'rocket') spawnExplosion(st, b.x, b.y, b.damage * 0.3, 20)
        st.bullets.splice(bi, 1); break
      }
    }

    // Hit vehicles
    for (const v of st.vehicles) {
      if (v.driver === b.owner || v.hp <= 0) continue
      if (dist(b, v) < v.width + 2) {
        v.hp -= b.damage
        if (v.hp <= 0) {
          spawnExplosion(st, v.x, v.y, 40)
          if (v.driver !== null) {
            const driverP = st.players.find(pp => pp.pIndex === v.driver)
            if (driverP) {
              v.driver = null; driverP.inVehicle = null
              damagePlayer(driverP, 30, st, b.owner)
            }
          }
          const shooter = st.players.find(pp => pp.pIndex === b.owner)
          if (shooter) { shooter.score += SCORE_VEHICLE_DESTROY; shooter.gems++ }
        }
        if (b.weaponType === 'rocket') spawnExplosion(st, b.x, b.y, b.damage * 0.5, 25)
        st.bullets.splice(bi, 1); break
      }
    }

    // Hit police
    for (let pi = st.police.length - 1; pi >= 0; pi--) {
      if (dist(b, st.police[pi]) < 10) {
        st.police[pi].hp -= b.damage
        if (st.police[pi].hp <= 0) {
          st.police.splice(pi, 1)
          const shooter = st.players.find(pp => pp.pIndex === b.owner)
          if (shooter) {
            shooter.wanted = Math.min(MAX_WANTED, shooter.wanted + 1)
            shooter.wantedTimer = WANTED_DECAY_TIME
            shooter.score += 15
          }
        }
        st.bullets.splice(bi, 1); break
      }
    }
  }

  // ── Explosions ──────────────────────────────────────────
  for (let ei = st.explosions.length - 1; ei >= 0; ei--) {
    const ex = st.explosions[ei]
    ex.timer--
    // Damage on first frame only
    if (ex.timer === ex.maxTimer - 1) {
      for (const p of st.players) {
        if (!p.alive) continue
        const d = dist(ex, p)
        if (d < ex.radius) {
          const falloff = 1 - d / ex.radius
          damagePlayer(p, ex.damage * falloff, st)
        }
      }
      // Damage NPCs
      for (let ni = st.npcs.length - 1; ni >= 0; ni--) {
        if (dist(ex, st.npcs[ni]) < ex.radius) {
          st.npcs.splice(ni, 1)
        }
      }
      // Damage vehicles
      for (const v of st.vehicles) {
        if (dist(ex, v) < ex.radius) {
          v.hp -= ex.damage * 0.5
        }
      }
      // Damage props
      for (let pi = st.level.props.length - 1; pi >= 0; pi--) {
        const prop = st.level.props[pi]
        if (prop.destructible && dist(ex, prop) < ex.radius) {
          prop.hp -= ex.damage
          if (prop.hp <= 0) st.level.props.splice(pi, 1)
        }
      }
    }
    if (ex.timer <= 0) st.explosions.splice(ei, 1)
  }

  // ── NPCs ────────────────────────────────────────────────
  for (const npc of st.npcs) {
    npc.x += npc.dx; npc.y += npc.dy; npc.timer--

    // Flee from nearby bullets/explosions
    if (npc.state === 'wander') {
      for (const p of st.players) {
        if (!p.alive) continue
        if (dist(npc, p) < 60) {
          npc.state = 'flee'
          const fleeAngle = Math.atan2(npc.y - p.y, npc.x - p.x)
          npc.dx = Math.cos(fleeAngle) * NPC_FLEE_SPEED * DT
          npc.dy = Math.sin(fleeAngle) * NPC_FLEE_SPEED * DT
          npc.timer = 90
        }
      }
    }

    // Building collision for NPCs
    if (collidesBuilding(npc.x, npc.y, 4, st)) {
      npc.dx = -npc.dx; npc.dy = -npc.dy
      npc.x += npc.dx * 5; npc.y += npc.dy * 5
    }

    if (npc.timer <= 0 || npc.x < 10 || npc.x > st.level.worldW - 10 ||
        npc.y < 10 || npc.y > st.level.worldH - 10) {
      const a = Math.random() * Math.PI * 2
      const spd = npc.state === 'flee' ? NPC_FLEE_SPEED : NPC_SPEED
      npc.dx = Math.cos(a) * spd * DT
      npc.dy = Math.sin(a) * spd * DT
      npc.timer = rngInt(120, 360)
      npc.state = 'wander'
      npc.x = clamp(npc.x, 20, st.level.worldW - 20)
      npc.y = clamp(npc.y, 20, st.level.worldH - 20)
    }
    npc.angle = Math.atan2(npc.dy, npc.dx)
  }

  // ── Police AI ───────────────────────────────────────────
  for (const p of st.players) {
    if (!p.alive || p.wanted <= 0) continue
    const pCount = st.police.filter(po => po.target === p.pIndex).length
    const desired = Math.min(p.wanted * 2, 8)
    if (pCount < desired && st.frame % 60 === 0) {
      const spawnAngle = Math.random() * Math.PI * 2
      const spawnDist = 400
      st.police.push({
        x: p.x + Math.cos(spawnAngle) * spawnDist,
        y: p.y + Math.sin(spawnAngle) * spawnDist,
        angle: 0, speed: POLICE_SPEED,
        target: p.pIndex, hp: POLICE_HP,
        type: p.wanted >= 4 ? 'swat' : p.wanted >= 2 ? 'car' : 'foot',
        shootTimer: 0, vehicleIndex: null,
      })
    }
  }

  for (let pi = st.police.length - 1; pi >= 0; pi--) {
    const po = st.police[pi]
    const target = st.players.find(pp => pp.pIndex === po.target)
    if (!target || !target.alive || target.wanted <= 0) {
      st.police.splice(pi, 1); continue
    }

    const a = Math.atan2(target.y - po.y, target.x - po.x)
    po.angle = a
    const spd = po.type === 'car' ? POLICE_SPEED * 1.3 : po.type === 'swat' ? POLICE_SPEED * 1.5 : POLICE_SPEED
    po.x += Math.cos(a) * spd * DT
    po.y += Math.sin(a) * spd * DT

    // Police shoot
    const d = dist(po, target)
    if (d < POLICE_SHOOT_RANGE) {
      po.shootTimer--
      if (po.shootTimer <= 0) {
        po.shootTimer = Math.floor(600 / 60) // ~600ms in frames
        st.bullets.push({
          x: po.x, y: po.y, z: 2,
          dx: Math.cos(a) * 400 * DT,
          dy: Math.sin(a) * 400 * DT,
          owner: -1, damage: 8,
          life: 60, weaponType: 'pistol',
        })
      }
    }

    // Ram target
    if (d < 14) {
      damagePlayer(target, 0.3, st)
    }
  }

  // ── Missions ────────────────────────────────────────────
  for (const m of st.missions) {
    if (!m.active) continue

    // Timer missions
    if (m.timeLimit > 0 && m.assignedTo !== null) {
      m.timer += DT
      if (m.timer >= m.timeLimit) {
        if (m.type === 'survive') {
          // Survived! Complete mission
          const p = st.players.find(pp => pp.pIndex === m.assignedTo)
          if (p) {
            p.coins += m.reward.coins; p.gems += m.reward.gems
            p.starPts += m.reward.starPts; p.score += m.reward.coins * 10
          }
          m.active = false
        } else {
          // Failed
          m.active = false
        }
      }
    }

    for (const p of st.players) {
      if (!p.alive) continue
      // Accept mission
      if (m.assignedTo === null && dist(p, m) < 30) {
        m.assignedTo = p.pIndex
      }
      // Complete mission
      if (m.assignedTo === p.pIndex && dist(p, { x: m.targetX, y: m.targetY }) < 30) {
        m.active = false
        p.coins += m.reward.coins; p.gems += m.reward.gems
        p.starPts += m.reward.starPts; p.score += m.reward.coins * 10
      }
    }
  }

  // ── Respawn pickups ─────────────────────────────────────
  for (const pk of st.pickups) {
    if (pk.collected) {
      pk.respawnTimer--
      if (pk.respawnTimer <= 0) {
        pk.collected = false
        // Randomize kind on respawn
        const kinds: PickupKind[] = ['pistol', 'shotgun', 'machinegun', 'rocket', 'health', 'armor', 'coins']
        pk.kind = pick(kinds)
      }
    }
  }

  // ── Respawn NPCs ────────────────────────────────────────
  if (st.npcs.length < NPC_SPAWN_MAX && st.frame % 120 === 0) {
    const newNpcs = spawnNPCs(st.level.worldW, st.level.worldH, 1, st)
    st.npcs.push(...newNpcs)
  }

  // ── Game over check ─────────────────────────────────────
  if (st.mode === 'coop-heist' && st.missions.every(m => !m.active)) {
    st.gameOver = true
    st.winner = 'Heist Complete!'
  }
  if (st.mode !== 'vs-rampage' && st.mode !== 'free-roam' && st.mode !== 'coop-heist') {
    const alive = st.players.filter(p => p.alive)
    if (st.players.length > 1 && alive.length <= 1) {
      st.gameOver = true
      st.winner = alive[0]?.name || null
    }
  }
}

// ── Apply pickup to player ────────────────────────────────
function applyPickup(pk: Pickup, p: Player) {
  switch (pk.kind) {
    case 'health': p.hp = Math.min(p.maxHp, p.hp + 30); break
    case 'armor': p.armor = Math.min(PLAYER_ARMOR_MAX, p.armor + 40); break
    case 'speed': p.speedBoost = 300; break
    case 'coins': p.coins += rngInt(5, 15); break
    case 'gems': p.gems += rngInt(1, 4); break
    case 'pistol': case 'shotgun': case 'machinegun': case 'rocket': case 'flamethrower':
      p.weapon = { type: pk.kind as WeaponType, ammo: WEAPON_AMMO[pk.kind as WeaponType] }
      break
  }
}
