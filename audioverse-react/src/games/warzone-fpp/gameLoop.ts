/**
 * Main game-tick logic for the Warzone FPP game — 3D FPS.
 *
 * Handles: soldier movement (angle-based FPS), tile-based wall collision,
 * weapon firing, bullet physics, all game modes, mode-specific interactions,
 * pickups, vehicles, capture points, round system, win conditions.
 */
import type { GameState, Soldier, TileMap } from './types'
import { ALL_ATTACHMENTS } from './weaponCustomization'
import {
  MOVE_SPD, SPRINT_SPD, PLAYER_R, BULLET_R,
  WEAPONS, TANK_CANNON, TANK_SPD, JEEP_SPD, HELI_SPD,
  RESPAWN_TIME, CAPTURE_R, CAPTURE_TIME, TICKET_BLEED_INTERVAL,
  PICKUP_RESPAWN, SOLDIER_ARMOR,
  MODE_MODIFIERS,
  CROUCH_SPD, PRONE_SPD,
  CROUCH_RECOIL, PRONE_RECOIL, CROUCH_HITBOX, PRONE_HITBOX,
  BANDAGE_TIME, BANDAGE_HEAL, BANDAGES_START, BLEED_MOVE_PENALTY,
  BR_ZONE_PHASES, BR_SUPPLY_DROP_INTERVAL, BR_SUPPLY_DROP_FALL_SPEED,
  BR_MAX_SUPPLY_DROPS, BR_SUPPLY_WEAPONS, BR_TRAP_TRIGGER_RADIUS,
} from './constants'
import { dist, clamp } from './helpers'
import { getInput } from './input'
import { botAI } from './botAI'
import { spawnPos } from './mapGenerator'
import { handleModeInteract, scoreRound, applyDamage, applySplash, checkWinConditions } from './gameLoopCombat'

// ─── ADS (Aim Down Sights) Constants ─────────────────────
const ADS_BASE_FOV = 55          // Default ADS FOV (no scope)
const ADS_SPREAD_MULT = 0.4      // ADS tightens spread to 40% of hipfire
const ADS_MOVE_PENALTY = 0.7     // Movement slows to 70% while ADS
const ADS_STAMINA_DRAIN = 0.15   // Stamina drain per tick (when enabled)
void ADS_STAMINA_DRAIN // reserved for future use

// ─── Aim Assist Constants ────────────────────────────────
const AIMASSIST_SEMI_ANGLE = 0.15    // Radians (~8.5°) — sticky aim cone
const AIMASSIST_SEMI_PULL = 0.02     // Per-tick angular pull toward target
const AIMASSIST_FULL_ANGLE = 0.4     // Radians (~23°) — auto-snap cone
const AIMASSIST_FULL_SNAP = 0.08     // Per-tick snap speed toward target
const AIMASSIST_MAX_RANGE = 120      // Maximum range for aim assist (metres)
const AIMASSIST_HEADSHOT_OFFSET = 0.35 // How much higher than center full aim assist locks (still requires manual headshot)

/** Get the ADS FOV for a weapon considering equipped scope */
function getAdsFov(s: Soldier): number {
  const wName = s.weapons[s.weaponIndex]
  const loadout = s.loadout[wName]
  if (loadout?.scope) {
    const att = ALL_ATTACHMENTS.find(a => a.id === loadout.scope)
    if (att?.mods.zoomFov) return att.mods.zoomFov
  }
  // Default zoom by weapon type
  if (wName === 'Sniper') return 25
  if (wName === 'Rifle' || wName === 'Bandit Rifle') return 50
  return ADS_BASE_FOV
}

/** Find the best aim assist target for a soldier */
function findAimAssistTarget(s: Soldier, st: GameState): number {
  let bestIdx = -1
  let bestAngleDiff = Infinity
  const maxAngle = s.aimAssist === 'full' ? AIMASSIST_FULL_ANGLE : AIMASSIST_SEMI_ANGLE

  for (const target of st.soldiers) {
    if (!target.alive || target.team === s.team || target.playerIndex === s.playerIndex) continue
    const dx = target.x - s.x
    const dy = target.y - s.y
    const d = Math.sqrt(dx * dx + dy * dy)
    if (d > AIMASSIST_MAX_RANGE || d < 1) continue

    // Angle to target in XZ plane
    const angleToTarget = Math.atan2(dx, -dy)
    let diff = angleToTarget - s.angle
    // Normalize to [-PI, PI]
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2

    if (Math.abs(diff) < maxAngle && Math.abs(diff) < bestAngleDiff) {
      bestAngleDiff = Math.abs(diff)
      bestIdx = target.playerIndex
    }
  }
  return bestIdx
}

let shootCooldowns = new Map<number, number>()

export function resetCooldowns(): void {
  shootCooldowns = new Map()
}

// ─── Tile collision ──────────────────────────────────────
/** Check if a circle at (px,py) with given radius overlaps any wall tile */
function hitsWall(tm: TileMap, px: number, py: number, radius: number): boolean {
  const { w, h, tileSize: ts, data } = tm
  // Check corners of bounding box
  for (let dx = -radius; dx <= radius; dx += radius || 0.01) {
    for (let dy = -radius; dy <= radius; dy += radius || 0.01) {
      const tx = Math.floor((px + dx) / ts)
      const ty = Math.floor((py + dy) / ts)
      if (tx < 0 || ty < 0 || tx >= w || ty >= h) continue
      if (data[ty * w + tx] > 0) return true
    }
  }
  return false
}

/** Slide collision: try full move, then X-only, then Y-only */
function tileCollide(
  tm: TileMap, ox: number, oy: number,
  nx: number, ny: number, radius: number,
): [number, number] {
  if (!hitsWall(tm, nx, ny, radius)) return [nx, ny]
  if (!hitsWall(tm, nx, oy, radius)) return [nx, oy]
  if (!hitsWall(tm, ox, ny, radius)) return [ox, ny]
  return [ox, oy]
}

/** Check if a bullet position is inside a wall tile */
function bulletHitsWall(tm: TileMap, bx: number, by: number): boolean {
  const tx = Math.floor(bx / tm.tileSize)
  const ty = Math.floor(by / tm.tileSize)
  if (tx < 0 || ty < 0 || tx >= tm.w || ty >= tm.h) return true
  return tm.data[ty * tm.w + tx] > 0
}

// ─── Vehicle speed ───────────────────────────────────────
function vehicleSpeed(type: string): number {
  switch (type) {
    case 'tank':       return TANK_SPD
    case 'jeep':       return JEEP_SPD
    case 'helicopter': return HELI_SPD
    default:           return JEEP_SPD
  }
}
import type { GamepadSnapshot } from '../../pages/games/mini/useGamepads'

// ═════════════════════════════════════════════════════════
// Main tick
// ═════════════════════════════════════════════════════════
export function gameTick(st: GameState, pads: GamepadSnapshot[]): void {
  if (st.gameOver) return
  st.frame++

  const tm = st.tileMap
  const worldW = tm.w * tm.tileSize
  const worldH = tm.h * tm.tileSize

  // ─── Soldiers ──────────────────────────────────────────
  // Determine mode modifiers
  const mod = MODE_MODIFIERS[st.modeModifier === 'arcade' ? 'arcade' : 'realistic']

  for (const s of st.soldiers) {
    // Apply mode modifiers to soldier
    s.maxHp = mod.hp
    s.armor = Math.min(s.armor, mod.armor)

    if (!s.alive) {
      // BR: no respawn — eliminated soldiers stay dead
      if (st.mode === 'battle-royale') continue
      s.respawnTimer--
      if (s.respawnTimer <= 0) {
        const pos = spawnPos(s.team, st.capturePoints, tm)
        s.x = pos.x; s.y = pos.y
        s.hp = s.maxHp; s.alive = true
        s.vehicleIndex = -1; s.killStreak = 0
        s.armor = mod.armor; s.isSprinting = false
        s.bleeding = false; s.bleedRate = 0
        s.isBandaging = false; s.bandageProgress = 0
        s.bandages = BANDAGES_START
      }
      continue
    }

    const inp = s.isBot ? botAI(s, st) : getInput(s, pads)
    const inVehicle = s.vehicleIndex >= 0 ? st.vehicles[s.vehicleIndex] : null

    // Sprint — blocked while crouching, prone, or ADS
    const canSprint = !inVehicle && (inp.mx !== 0 || inp.my !== 0) &&
      s.posture === 'stand' && !inp.aim
    s.isSprinting = inp.sprint && canSprint

    // ── Posture (crouch/prone) ──────────────────────────
    s.posture = inp.posture || 'stand'
    let moveSpd = MOVE_SPD
    let recoilMult = 1.0
    let hitboxMult = 1.0
    if (s.posture === 'crouch') {
      moveSpd = CROUCH_SPD
      recoilMult = CROUCH_RECOIL
      hitboxMult = CROUCH_HITBOX
      s.isSprinting = false   // Can never sprint while crouched
    } else if (s.posture === 'prone') {
      moveSpd = PRONE_SPD
      recoilMult = PRONE_RECOIL
      hitboxMult = PRONE_HITBOX
      s.isSprinting = false   // Can never sprint while prone
    }

    // ── ADS (Aim Down Sights) ───────────────────────────
    s.isAiming = inp.aim && !s.isSprinting && !s.isBandaging && !inVehicle
    if (s.isAiming) {
      s.adsFov = getAdsFov(s)
      recoilMult *= ADS_SPREAD_MULT   // Much tighter spread while ADS
    } else {
      s.adsFov = 75
    }

    // ── Aim Assist ──────────────────────────────────────
    if (s.aimAssist !== 'none' && !s.isBot) {
      if (s.isAiming) {
        // Find or maintain aim assist target
        const target = findAimAssistTarget(s, st)
        s.aimAssistTarget = target

        if (target >= 0) {
          const t = st.soldiers.find(sol => sol.playerIndex === target)
          if (t && t.alive) {
            const dx = t.x - s.x
            const dy = t.y - s.y
            const angleToTarget = Math.atan2(dx, -dy)
            let diff = angleToTarget - s.angle
            while (diff > Math.PI) diff -= Math.PI * 2
            while (diff < -Math.PI) diff += Math.PI * 2

            if (s.aimAssist === 'semi') {
              // Semi: gentle pull toward target (sticky aim)
              s.angle += diff * AIMASSIST_SEMI_PULL
            } else if (s.aimAssist === 'full') {
              // Full: snap to target upper chest (not head — still requires manual headshot)
              s.angle += diff * AIMASSIST_FULL_SNAP
              // Slight pitch assists, but don't lock onto head
              const dist2d = Math.sqrt(dx * dx + dy * dy)
              if (dist2d > 1) {
                const targetPitch = Math.atan2(AIMASSIST_HEADSHOT_OFFSET, dist2d)
                const pitchDiff = targetPitch - s.pitch
                s.pitch += pitchDiff * AIMASSIST_FULL_SNAP * 0.5
              }
            }
          }
        }
      } else {
        s.aimAssistTarget = -1
      }
    }

    // ── Bleeding ──────────────────────────────────────────
    if (s.bleeding && s.bleedRate > 0) {
      s.hp -= s.bleedRate
      if (s.hp <= 0) {
        s.hp = 0; s.alive = false; s.deaths++
        s.respawnTimer = RESPAWN_TIME; s.killStreak = 0
        s.bleeding = false; s.bleedRate = 0
        st.killFeed.unshift({ text: `🩸 ${s.name} bled out`, time: st.frame })
        if (st.killFeed.length > 6) st.killFeed.pop()
        continue
      }
    }

    // ── Bandaging ───────────────────────────────────────
    if (inp.bandage && s.bleeding && s.bandages > 0 && !s.isSprinting) {
      s.isBandaging = true
      s.bandageProgress += (100 / BANDAGE_TIME)
      if (s.bandageProgress >= 100) {
        s.bleeding = false; s.bleedRate = 0
        s.isBandaging = false; s.bandageProgress = 0
        s.bandages--
        s.hp = Math.min(s.maxHp, s.hp + BANDAGE_HEAL)
      }
    } else {
      // Cancel bandaging if key released or started sprinting
      if (s.isBandaging) { s.isBandaging = false; s.bandageProgress = 0 }
    }

    // FPS movement (relative to soldier.angle)
    let baseSpd = inVehicle ? vehicleSpeed(inVehicle.type) : (s.isSprinting ? SPRINT_SPD : moveSpd)
    // Bleeding slows you down
    if (s.bleeding) baseSpd *= BLEED_MOVE_PENALTY
    // Bandaging: can barely move
    if (s.isBandaging) baseSpd *= 0.2
    // ADS slows movement
    if (s.isAiming) baseSpd *= ADS_MOVE_PENALTY
    const spd = baseSpd
    const fwd = -inp.my
    const strafe = inp.mx
    const moveX = (Math.sin(s.angle) * fwd + Math.cos(s.angle) * strafe) * spd
    const moveY = (-Math.cos(s.angle) * fwd + Math.sin(s.angle) * strafe) * spd

    let nx = s.x + moveX
    let ny = s.y + moveY
    nx = clamp(nx, PLAYER_R * hitboxMult, worldW - PLAYER_R * hitboxMult)
    ny = clamp(ny, PLAYER_R * hitboxMult, worldH - PLAYER_R * hitboxMult)

    const [fx, fy] = tileCollide(tm, s.x, s.y, nx, ny, PLAYER_R * hitboxMult)
    s.x = fx; s.y = fy

    // If in vehicle, move vehicle too
    if (inVehicle) {
      inVehicle.x = fx; inVehicle.y = fy
      inVehicle.angle = s.angle
    }

    // Weapon switching
    if (inp.weaponSwitch === -2) {
      s.weaponIndex = (s.weaponIndex + s.weapons.length - 1) % s.weapons.length
    } else if (inp.weaponSwitch >= 0 && inp.weaponSwitch < s.weapons.length) {
      s.weaponIndex = inp.weaponSwitch
    }

    // ── Shoot ────────────────────────────────────────────
    const cd = shootCooldowns.get(s.playerIndex) ?? 0
    if (inp.shoot && st.frame > cd && !s.isSprinting) {
      const wName = inVehicle?.type === 'tank' ? 'Tank Cannon' : s.weapons[s.weaponIndex]
      let w = wName === 'Tank Cannon' ? TANK_CANNON : (WEAPONS.find(wd => wd.name === wName) || WEAPONS[0])
      // Apply mode modifiers
      w = { ...w,
        dmg: Math.round(w.dmg * mod.bulletDmg),
        bulletSpeed: w.bulletSpeed * mod.bulletSpeed,
        spread: w.spread ? w.spread * recoilMult : undefined,
      }
      const spread = w.spread || 0
      const pellets = w.pellets || 1
      const offset = PLAYER_R * hitboxMult + 0.3

      for (let p = 0; p < pellets; p++) {
        const angleH = s.angle + (spread ? (Math.random() - 0.5) * spread : 0)
        const pitch = s.pitch || 0
        st.bullets.push({
          x: s.x + Math.sin(angleH) * offset,
          y: s.y - Math.cos(angleH) * offset,
          dx: Math.sin(angleH) * Math.cos(pitch) * w.bulletSpeed,
          dy: -Math.cos(angleH) * Math.cos(pitch) * w.bulletSpeed,
          life: w.lifetime,
          team: s.team, owner: s.playerIndex, dmg: w.dmg,
          weapon: wName, splash: w.splash,
        })
      }
      shootCooldowns.set(s.playerIndex, st.frame + w.fireRate)
    }

    // ── Vehicle interaction (F key) ──────────────────────
    if (inp.interact) {
      if (inVehicle) {
        s.vehicleIndex = -1; inVehicle.rider = -1
      } else {
        for (let vi = 0; vi < st.vehicles.length; vi++) {
          const v = st.vehicles[vi]
          if (v.alive && v.rider < 0 && dist(s, v) < 5) {
            s.vehicleIndex = vi; v.rider = s.playerIndex; v.team = s.team; break
          }
        }
      }

      // ── Mode-specific interactions ─────────────────────
      handleModeInteract(st, s)
    }

    // ── Pickup collection ────────────────────────────────
    for (const pk of st.pickups) {
      if (!pk.alive || dist(s, pk) > 3) continue
      switch (pk.type) {
        case 'health':
          if (s.hp < s.maxHp) { s.hp = Math.min(s.maxHp, s.hp + pk.amount); pk.alive = false; pk.respawnTimer = PICKUP_RESPAWN }
          break
        case 'ammo':
          s.score += 25; pk.alive = false; pk.respawnTimer = PICKUP_RESPAWN
          break
        case 'armor':
          if (s.armor < SOLDIER_ARMOR) { s.armor = Math.min(SOLDIER_ARMOR, s.armor + pk.amount); pk.alive = false; pk.respawnTimer = PICKUP_RESPAWN }
          break
      }
    }
  }

  // ─── Bullets ───────────────────────────────────────────
  for (let i = st.bullets.length - 1; i >= 0; i--) {
    const b = st.bullets[i]
    b.x += b.dx; b.y += b.dy; b.life--

    // Out of bounds or expired
    if (b.x < 0 || b.x > worldW || b.y < 0 || b.y > worldH || b.life <= 0) {
      if (b.splash && b.life <= 0) applySplash(st, b)
      st.bullets.splice(i, 1); continue
    }

    // Wall hit
    if (bulletHitsWall(tm, b.x, b.y)) {
      if (b.splash) applySplash(st, b)
      st.bullets.splice(i, 1); continue
    }

    // Direct hit on soldier
    let hit = false
    for (const s of st.soldiers) {
      if (!s.alive || s.team === b.team) continue
      const hitR = s.vehicleIndex >= 0 ? 2 : PLAYER_R
      if (dist(s, b) < hitR + BULLET_R) {
        applyDamage(st, s, b)
        st.bullets.splice(i, 1)
        hit = true; break
      }
    }
    if (hit) continue
  }

  // ─── Capture points (conquest / coop-assault) ─────────
  if (st.mode === 'conquest' || st.mode === 'coop-assault') {
    for (const cp of st.capturePoints) {
      const nearby = [0, 0]
      for (const s of st.soldiers) { if (s.alive && dist(s, cp) < CAPTURE_R) nearby[s.team]++ }

      if (nearby[0] > 0 && nearby[1] === 0 && cp.team !== 0) {
        cp.progress = Math.min(cp.progress + 1, CAPTURE_TIME)
        if (cp.progress >= CAPTURE_TIME) {
          cp.team = 0; cp.progress = 0
          st.soldiers.filter(s => s.team === 0 && s.alive && dist(s, cp) < CAPTURE_R).forEach(s => { s.captures++; s.gems++; s.score += 200 })
        }
      } else if (nearby[1] > 0 && nearby[0] === 0 && cp.team !== 1) {
        cp.progress = Math.min(cp.progress + 1, CAPTURE_TIME)
        if (cp.progress >= CAPTURE_TIME) {
          cp.team = 1; cp.progress = 0
          st.soldiers.filter(s => s.team === 1 && s.alive && dist(s, cp) < CAPTURE_R).forEach(s => { s.captures++; s.gems++; s.score += 200 })
        }
      } else {
        cp.progress = Math.max(0, cp.progress - 1)
      }
    }
  }

  // ─── Bomb mode: plant / defuse tick ────────────────────
  if (st.mode === 'bomb' && st.bombSites) {
    for (const site of st.bombSites) {
      if (site.detonated) continue
      // Planting: team 0 (robbers) interact near site
      if (!site.planted && site.planter >= 0) {
        site.plantProgress++
        if (site.plantProgress >= 150) {
          site.planted = true; site.planter = -1; site.plantProgress = 0
          st.killFeed.unshift({ text: `💣 Bomb planted at ${site.label}!`, time: st.frame })
          if (st.killFeed.length > 6) st.killFeed.pop()
        }
      }
      // Defusing: team 1 (cops) interact near site
      if (site.planted && !site.detonated && site.defuser >= 0) {
        site.defuseProgress++
        if (site.defuseProgress >= 150) {
          site.planted = false; site.defuser = -1; site.defuseProgress = 0
          st.killFeed.unshift({ text: `🛡️ Bomb defused at ${site.label}!`, time: st.frame })
          if (st.killFeed.length > 6) st.killFeed.pop()
          scoreRound(st, 1) // cops score
        }
      }
      // Detonation timer (200 ticks after plant)
      if (site.planted && !site.detonated) {
        site.plantProgress++
        if (site.plantProgress >= 200) {
          site.detonated = true
          // Kill nearby soldiers
          for (const s of st.soldiers) {
            if (s.alive && dist(s, site) < 10) { s.hp = 0; s.alive = false; s.respawnTimer = RESPAWN_TIME }
          }
          scoreRound(st, 0) // robbers score
        }
      }
      // Reset planters/defusers if they moved away
      if (site.planter >= 0) {
        const p = st.soldiers.find(s => s.playerIndex === site.planter)
        if (!p || !p.alive || dist(p, site) > 3) { site.planter = -1; site.plantProgress = 0 }
      }
      if (site.defuser >= 0) {
        const d = st.soldiers.find(s => s.playerIndex === site.defuser)
        if (!d || !d.alive || dist(d, site) > 3) { site.defuser = -1; site.defuseProgress = 0 }
      }
    }
  }

  // ─── Heist mode: loot movement + extraction ────────────
  if (st.mode === 'heist' && st.lootBags && st.lootExtraction) {
    for (const bag of st.lootBags) {
      if (bag.extracted) continue
      // Carrier moves the bag
      if (bag.carrier >= 0) {
        const carrier = st.soldiers.find(s => s.playerIndex === bag.carrier)
        if (carrier && carrier.alive) {
          bag.x = carrier.x; bag.y = carrier.y
          // Check extraction
          if (dist(bag, st.lootExtraction) < 5) {
            bag.extracted = true; bag.carrier = -1
            if (carrier) { carrier.carryingLoot = undefined; carrier.score += 500; carrier.gems++ }
            st.killFeed.unshift({ text: `💰 ${bag.label} extracted!`, time: st.frame })
            if (st.killFeed.length > 6) st.killFeed.pop()
          }
        } else {
          // Carrier died, drop bag
          bag.carrier = -1
          if (carrier) carrier.carryingLoot = undefined
        }
      }
    }
    // All bags extracted = robbers win round
    if (st.lootBags.every(b => b.extracted)) scoreRound(st, 0)
    // All robbers dead = cops win round
    if (st.soldiers.filter(s => s.team === 0).every(s => !s.alive)) scoreRound(st, 1)
  }

  // ─── CTF mode: flag pickup / capture ───────────────────
  if (st.mode === 'ctf' && st.flags) {
    for (const flag of st.flags) {
      // Carrier moves the flag
      if (flag.carrier >= 0) {
        const carrier = st.soldiers.find(s => s.playerIndex === flag.carrier)
        if (carrier && carrier.alive) {
          flag.x = carrier.x; flag.y = carrier.y
          // Check capture: return enemy flag to your own flag's base
          const ownFlag = st.flags.find(f => f.team === carrier.team)
          if (ownFlag && ownFlag.atBase && dist(carrier, { x: ownFlag.baseX, y: ownFlag.baseY }) < 5) {
            // Score!
            carrier.captures++; carrier.score += 300; carrier.gems++
            flag.x = flag.baseX; flag.y = flag.baseY; flag.carrier = -1; flag.atBase = true
            carrier.carryingFlag = undefined
            st.killFeed.unshift({ text: `🚩 ${carrier.name} captured the flag!`, time: st.frame })
            if (st.killFeed.length > 6) st.killFeed.pop()
            // Check win: first to 3 captures
            const teamCaptures = st.soldiers.filter(s => s.team === carrier.team).reduce((a, s) => a + s.captures, 0)
            if (teamCaptures >= 3) { st.gameOver = true; st.winTeam = carrier.team }
          }
        } else {
          // Carrier died → drop flag at position
          flag.carrier = -1; flag.atBase = false
          if (carrier) carrier.carryingFlag = undefined
        }
      }
      // Auto-pickup: enemy walks over dropped or base flag
      if (flag.carrier < 0) {
        for (const s of st.soldiers) {
          if (!s.alive || s.team === flag.team || s.carryingFlag !== undefined) continue
          if (dist(s, flag) < 3) {
            flag.carrier = s.playerIndex; flag.atBase = false
            s.carryingFlag = flag.team
            st.killFeed.unshift({ text: `🚩 ${s.name} picked up the flag!`, time: st.frame })
            if (st.killFeed.length > 6) st.killFeed.pop()
            break
          }
        }
        // Return your own flag if teammate walks over it
        if (flag.carrier < 0 && !flag.atBase) {
          for (const s of st.soldiers) {
            if (!s.alive || s.team !== flag.team) continue
            if (dist(s, flag) < 3) {
              flag.x = flag.baseX; flag.y = flag.baseY; flag.atBase = true
              st.killFeed.unshift({ text: `🚩 ${s.name} returned the flag!`, time: st.frame })
              if (st.killFeed.length > 6) st.killFeed.pop()
              break
            }
          }
        }
      }
    }
  }

  // ─── Escort mode: VIP extraction ──────────────────────
  if (st.mode === 'escort' && st.vip) {
    const vipSoldier = st.soldiers.find(s => s.playerIndex === st.vip!.soldier || s.isVip)
    if (vipSoldier && vipSoldier.alive) {
      if (dist(vipSoldier, { x: st.vip.extractionX, y: st.vip.extractionY }) < 5) {
        st.vip.extracted = true; st.gameOver = true; st.winTeam = 0
      }
    }
  }

  // ─── Convoy mode: waypoint progress ───────────────────
  if (st.mode === 'convoy' && st.convoy) {
    const cv = st.convoy
    const cvVehicle = st.vehicles[cv.vehicleIndex]
    if (cvVehicle && cvVehicle.alive) {
      const wp = cv.waypoints[cv.currentWaypoint]
      if (wp && dist(cvVehicle, wp) < 8) {
        wp.reached = true
        cv.currentWaypoint++
        if (cv.currentWaypoint >= cv.waypoints.length) {
          cv.completed = true; st.gameOver = true; st.winTeam = 0
        }
      }
    } else if (cvVehicle && !cvVehicle.alive) {
      // Convoy destroyed
      st.gameOver = true; st.winTeam = 1
    }
  }

  // ─── Race mode: checkpoint progress ───────────────────
  if (st.mode === 'race' && st.raceState) {
    const rs = st.raceState
    for (const s of st.soldiers) {
      if (!s.alive || s.vehicleIndex < 0) continue
      const v = st.vehicles[s.vehicleIndex]
      if (!v) continue
      let prog = rs.progress.get(s.playerIndex)
      if (!prog) { prog = { lap: 0, nextCp: 0 }; rs.progress.set(s.playerIndex, prog) }

      const cp = rs.checkpoints[prog.nextCp]
      if (cp && dist(v, cp) < cp.radius) {
        prog.nextCp++
        if (prog.nextCp >= rs.checkpoints.length) {
          prog.nextCp = 0; prog.lap++
          if (prog.lap >= rs.laps) {
            rs.finished.set(s.playerIndex, st.frame)
            // First to finish wins
            if (!st.gameOver) { st.gameOver = true; st.winTeam = s.team }
          }
        }
      }
    }
  }

  // ─── Survival mode: wave spawning ─────────────────────
  if (st.mode === 'survival' && st.survivalState) {
    const sv = st.survivalState
    // Count living enemies
    const livingEnemies = st.soldiers.filter(s => s.team === 1 && s.alive).length
    if (livingEnemies === 0 && sv.enemiesRemaining <= 0) {
      sv.wave++
      if (sv.wave > sv.maxWaves) {
        st.gameOver = true; st.winTeam = 0; return
      }
      sv.waveSize = Math.floor(sv.waveSize * 1.3)
      sv.enemiesRemaining = sv.waveSize
      st.killFeed.unshift({ text: `⚔️ Wave ${sv.wave}!`, time: st.frame })
      if (st.killFeed.length > 6) st.killFeed.pop()
    }
    // Spawn enemies over time
    if (sv.enemiesRemaining > 0) {
      sv.spawnTimer--
      if (sv.spawnTimer <= 0) {
        sv.spawnTimer = 30 // spawn every ~1 second
        sv.enemiesRemaining--
        const pos = spawnPos(1, st.capturePoints, tm)
        const botIdx = 200 + st.frame
        st.soldiers.push({
          x: pos.x, y: pos.y,
          angle: Math.random() * Math.PI * 2, pitch: 0,
          hp: 80 + sv.wave * 10, maxHp: 80 + sv.wave * 10, alive: true,
          team: 1, playerIndex: botIdx, name: `Wave${sv.wave}`,
          input: { type: 'keyboard', group: -1 }, isBot: true,
          kills: 0, deaths: 0, captures: 0, score: 0,
          respawnTimer: 0, vehicleIndex: -1,
          color: '#ff4444',
          coins: 0, gems: 0, stars: 0,
          weaponIndex: 0, weapons: ['Rifle', 'SMG', 'Shotgun'],
          armor: 0, killStreak: 0, isSprinting: false,
          posture: 'stand',
          bleeding: false, bleedRate: 0, isBandaging: false, bandageProgress: 0, bandages: 3,
          loadout: {},
          isAiming: false, adsFov: 75, adsStaminaDrain: false,
          aimAssist: 'none', aimAssistTarget: -1,
          sensitivity: 5,
        })
      }
    }
    // All players dead = game over
    if (st.soldiers.filter(s => s.team === 0).every(s => !s.alive)) {
      st.gameOver = true; st.winTeam = 1
    }
  }

  // ─── Battle Royale mode ─────────────────────────────────
  if (st.mode === 'battle-royale' && st.brState) {
    const br = st.brState

    // Update alive count
    br.aliveCount = st.soldiers.filter(s => s.alive && !s.brEliminated).length

    // ── Zone shrinking ──────────────────────────────────
    const zone = br.zone
    if (zone.phaseTimer > 0) {
      zone.phaseTimer--
    } else if (zone.radius > zone.targetRadius) {
      // Shrink
      zone.radius = Math.max(zone.targetRadius, zone.radius - zone.shrinkRate)
      // Move center toward target
      const dcx = zone.targetCenterX - zone.centerX
      const dcy = zone.targetCenterY - zone.centerY
      const dLen = Math.sqrt(dcx * dcx + dcy * dcy)
      if (dLen > 0.5) {
        zone.centerX += (dcx / dLen) * zone.shrinkRate * 0.3
        zone.centerY += (dcy / dLen) * zone.shrinkRate * 0.3
      }

      // Check if shrink complete → advance phase
      if (zone.radius <= zone.targetRadius + 0.1) {
        zone.phase++
        if (zone.phase < BR_ZONE_PHASES.length) {
          const nextPhase = BR_ZONE_PHASES[zone.phase]
          const maxRadius = Math.min(tm.w, tm.h) * tm.tileSize * 0.48
          zone.targetRadius = maxRadius * nextPhase.targetRadiusPct
          zone.shrinkRate = nextPhase.shrinkRate
          zone.damagePerTick = nextPhase.damage
          zone.phaseTimer = nextPhase.waitTicks
          // New random target center (within zone)
          zone.targetCenterX = zone.centerX + (Math.random() - 0.5) * zone.targetRadius * 0.4
          zone.targetCenterY = zone.centerY + (Math.random() - 0.5) * zone.targetRadius * 0.4
          // Clamp to world bounds
          zone.targetCenterX = Math.max(zone.targetRadius, Math.min(worldW - zone.targetRadius, zone.targetCenterX))
          zone.targetCenterY = Math.max(zone.targetRadius, Math.min(worldH - zone.targetRadius, zone.targetCenterY))
          st.killFeed.unshift({ text: `⚠️ Zone Phase ${zone.phase + 1} — circle shrinking!`, time: st.frame })
          if (st.killFeed.length > 6) st.killFeed.pop()
        }
      }
    }

    // ── Zone damage to soldiers outside ─────────────────
    for (const s of st.soldiers) {
      if (!s.alive) continue
      const dx = s.x - zone.centerX
      const dy = s.y - zone.centerY
      const distFromCenter = Math.sqrt(dx * dx + dy * dy)
      if (distFromCenter > zone.radius) {
        s.hp -= zone.damagePerTick
        if (s.hp <= 0) {
          s.hp = 0; s.alive = false; s.deaths++
          s.brEliminated = true
          s.brPlacement = br.aliveCount
          br.placements.push(s.playerIndex)
          s.killStreak = 0
          st.killFeed.unshift({ text: `🌀 ${s.name} was consumed by the storm`, time: st.frame })
          if (st.killFeed.length > 6) st.killFeed.pop()
        }
      }
    }

    // ── Supply drops ────────────────────────────────────
    if (st.frame >= br.nextSupplyDrop && br.supplyDrops.filter(d => !d.looted).length < BR_MAX_SUPPLY_DROPS) {
      // Spawn new supply drop inside zone
      const dropAngle = Math.random() * Math.PI * 2
      const dropDist = Math.random() * zone.radius * 0.7
      const dropX = zone.centerX + Math.cos(dropAngle) * dropDist
      const dropY = zone.centerY + Math.sin(dropAngle) * dropDist
      const dropWeapons = [BR_SUPPLY_WEAPONS[Math.floor(Math.random() * BR_SUPPLY_WEAPONS.length)]]
      br.supplyDrops.push({
        x: dropX, y: dropY,
        altitude: 30,
        landed: false,
        looted: false,
        contents: {
          weapons: dropWeapons,
          armor: 50,
          bandages: 2,
        },
        id: br.supplyDrops.length,
      })
      br.nextSupplyDrop = st.frame + BR_SUPPLY_DROP_INTERVAL
      st.killFeed.unshift({ text: `📦 Supply drop incoming!`, time: st.frame })
      if (st.killFeed.length > 6) st.killFeed.pop()
    }

    // Descend active drops
    for (const drop of br.supplyDrops) {
      if (drop.looted || drop.landed) continue
      drop.altitude = Math.max(0, drop.altitude - BR_SUPPLY_DROP_FALL_SPEED)
      if (drop.altitude <= 0) {
        drop.landed = true
      }
    }

    // Loot supply drops (interact key near landed crate)
    for (const s of st.soldiers) {
      if (!s.alive) continue
      const inp = s.isBot ? botAI(s, st) : getInput(s, pads)
      if (!inp.interact) continue
      for (const drop of br.supplyDrops) {
        if (!drop.landed || drop.looted) continue
        if (dist(s, drop) < 4) {
          drop.looted = true
          // Give weapons
          for (const wName of drop.contents.weapons) {
            if (!s.weapons.includes(wName)) {
              s.weapons.push(wName)
            }
          }
          s.armor = Math.min(100, s.armor + drop.contents.armor)
          s.bandages += drop.contents.bandages
          s.score += 150
          st.killFeed.unshift({ text: `📦 ${s.name} looted a supply drop!`, time: st.frame })
          if (st.killFeed.length > 6) st.killFeed.pop()
          break
        }
      }
    }

    // ── Weapon pickups on the ground ────────────────────
    for (const s of st.soldiers) {
      if (!s.alive) continue
      for (const wp of br.weaponPickups) {
        if (!wp.alive) continue
        if (dist(s, wp) < 3) {
          wp.alive = false
          if (!s.weapons.includes(wp.weaponName)) {
            s.weapons.push(wp.weaponName)
          }
          s.score += 25
          break // one pickup per tick
        }
      }
    }

    // ── Trap mechanics ──────────────────────────────────
    for (const trap of br.traps) {
      if (!trap.armed || trap.triggered) continue
      for (const s of st.soldiers) {
        if (!s.alive) continue
        if (trap.owner === s.playerIndex) continue // don't trigger own traps
        if (trap.team >= 0 && trap.team === s.team) continue
        if (dist(s, trap) < BR_TRAP_TRIGGER_RADIUS) {
          trap.triggered = true
          trap.armed = false
          s.hp -= trap.damage
          if (trap.type === 'bear-trap') {
            // Bear trap also causes bleed
            s.bleeding = true
            s.bleedRate = 0.8
          }
          st.killFeed.unshift({ text: `💥 ${s.name} triggered a ${trap.type}!`, time: st.frame })
          if (st.killFeed.length > 6) st.killFeed.pop()
          if (s.hp <= 0) {
            s.hp = 0; s.alive = false; s.deaths++
            s.brEliminated = true
            s.brPlacement = br.aliveCount
            br.placements.push(s.playerIndex)
            s.killStreak = 0
            const killerName = trap.owner >= 0
              ? (st.soldiers.find(k => k.playerIndex === trap.owner)?.name ?? '?')
              : 'a trap'
            st.killFeed.unshift({ text: `${killerName} [${trap.type}] ${s.name}`, time: st.frame })
            if (st.killFeed.length > 6) st.killFeed.pop()
            if (trap.owner >= 0) {
              const killer = st.soldiers.find(k => k.playerIndex === trap.owner)
              if (killer) { killer.kills++; killer.score += 100 }
            }
          }
          break
        }
      }
    }
  }

  // ─── Ticket bleed (conquest) ───────────────────────────
  if (st.mode === 'conquest' && st.frame % TICKET_BLEED_INTERVAL === 0) {
    const owned = [0, 0]
    st.capturePoints.forEach(cp => { if (cp.team >= 0) owned[cp.team]++ })
    if (owned[0] > owned[1]) st.tickets[1] = Math.max(0, st.tickets[1] - 1)
    else if (owned[1] > owned[0]) st.tickets[0] = Math.max(0, st.tickets[0] - 1)
  }

  // ─── Vehicle respawn ──────────────────────────────────
  for (const v of st.vehicles) {
    if (!v.alive) {
      v.respawnTimer--
      if (v.respawnTimer <= 0) {
        v.alive = true; v.hp = v.maxHp; v.rider = -1; v.team = -1
        v.x = v.spawnX; v.y = v.spawnY
      }
    }
  }

  // ─── Pickup respawn ───────────────────────────────────
  for (const pk of st.pickups) {
    if (!pk.alive) { pk.respawnTimer--; if (pk.respawnTimer <= 0) pk.alive = true }
  }

  // ─── Win conditions ───────────────────────────────────
  checkWinConditions(st)
}
