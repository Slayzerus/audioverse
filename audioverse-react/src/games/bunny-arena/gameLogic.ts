/**
 * gameLogic.ts — Physics tick for BunnyGame 3D.
 *
 * All gameplay runs in screen coordinates (Y down) matching the original.
 * The scene sync layer handles the Y-flip for Three.js positioning.
 */
import type { GameState, Bunny, Vec2 } from './types'
import type { PlayerSlot } from '../../pages/games/mini/types'
import { PLAYER_COLORS } from '../../pages/games/mini/types'
import { isBot } from '../../pages/games/mini/botAI'
import { gamepadDir } from '../../pages/games/mini/inputMaps'
import {
  DT, MOVE_TORQUE, JUMP_IMPULSE, KICK_IMPULSE,
  GRAB_BREAK_VEL, HEAD_DEATH_VEL, BODY_DEATH_VEL,
  BODY_RADIUS, HEAD_RADIUS, LEG_LEN,
  FRICTION, AIR_FRICTION, BOUNCE,
  WORLD_W, WORLD_H, FLOOR_Y,
  BIKE_MAX_SPEED, BIKE_ACCEL, BIKE_BRAKE, BIKE_MOUNT_RANGE, BIKE_TILT_SPEED,
  BALL_BOUNCE, BALL_FRICTION, BALL_KILL_SPEED,
  SPRING_FORCE, TRAP_CYCLE,
} from './constants'
import type { LevelData } from './levelGenerator'

// ── Helpers ───────────────────────────────────────────────

export function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

// ── Create a bunny from a PlayerSlot ──────────────────────

export function createBunny(p: PlayerSlot, spawnX: number, livesConfig: number): Bunny {
  const cy = FLOOR_Y - BODY_RADIUS - LEG_LEN
  return {
    index: p.index,
    name: p.name,
    color: p.color || PLAYER_COLORS[p.index % PLAYER_COLORS.length],
    input: p.input,
    alive: true,
    lives: livesConfig,
    score: 0,
    head: { pos: { x: spawnX, y: cy - BODY_RADIUS - HEAD_RADIUS }, vel: { x: 0, y: 0 }, radius: HEAD_RADIUS, mass: 0.5, grounded: false },
    torso: { pos: { x: spawnX, y: cy }, vel: { x: 0, y: 0 }, radius: BODY_RADIUS, mass: 2, grounded: false },
    pelvis: { pos: { x: spawnX, y: cy + BODY_RADIUS }, vel: { x: 0, y: 0 }, radius: BODY_RADIUS * 0.8, mass: 1.5, grounded: false },
    pose: 0,
    poseTarget: 0,
    grabbing: false,
    grabPoint: null,
    mounted: false,
    mountedBikeIndex: -1,
    bikeDir: 1,
    bikeSpeed: 0,
    bikeWheelAngle: 0,
    moveX: 0,
    actionA: false,
    actionB: false,
    actionLB: false,
    respawnTimer: 0,
    deathFlash: 0,
    kingTimer: 0,
  }
}

// ── Init game state ───────────────────────────────────────

export function initGameState(
  players: PlayerSlot[],
  mode: string,
  gravity: number,
  livesConfig: number,
  levelData: LevelData,
  aiDifficulty: number = 1,
): GameState {
  const spacing = WORLD_W / (players.length + 1)
  const bunnies = players.map((p, i) => createBunny(p, spacing * (i + 1), livesConfig))
  return {
    bunnies,
    platforms: levelData.platforms,
    spikes: levelData.spikes,
    bikes: levelData.bikes,
    coins: levelData.coins,
    checkpoints: levelData.checkpoints,
    kingZone: levelData.kingZone,
    balls: levelData.balls,
    looseSpikes: levelData.looseSpikes,
    traps: levelData.traps,
    mode,
    gravity,
    frame: 0,
    gameOver: false,
    winner: -1,
    countdown: 3,
    aiDifficulty,
  }
}

// ── Kill a bunny ──────────────────────────────────────────

function killBunny(b: Bunny, st: GameState) {
  // Dismount bike on death
  if (b.mounted && b.mountedBikeIndex >= 0 && b.mountedBikeIndex < st.bikes.length) {
    st.bikes[b.mountedBikeIndex].occupied = false
    b.mounted = false
    b.mountedBikeIndex = -1
    b.bikeSpeed = 0
  }
  b.alive = false
  b.lives--
  b.deathFlash = 30
  b.respawnTimer = b.lives > 0 ? 120 : 0
  b.head.vel = { x: (Math.random() - 0.5) * 200, y: -200 }
  b.torso.vel = { x: (Math.random() - 0.5) * 100, y: -150 }
  b.pelvis.vel = { x: (Math.random() - 0.5) * 150, y: -100 }
}

// ── Dismount bike ─────────────────────────────────────────

function dismountBike(b: Bunny, st: GameState) {
  if (!b.mounted || b.mountedBikeIndex < 0) return
  const bike = st.bikes[b.mountedBikeIndex]
  bike.occupied = false
  bike.tilt = 0
  b.mounted = false
  b.mountedBikeIndex = -1
  // Eject bunny upward slightly
  b.torso.vel.y = -80
  b.head.vel.y = -60
  b.bikeSpeed = 0
}

// ── Input state (passed from component) ───────────────────

export interface InputSnapshot {
  keys: Set<string>
  pads: Array<{
    index: number; up: boolean; down: boolean; left: boolean; right: boolean
    a: boolean; b: boolean; x: boolean; y: boolean; lb: boolean
  }>
  /** Keyboard key-to-group lookup: key → { group, dx } */
  keyLookup: Map<string, { group: number; dir: { dx: number; dy: number } }>
}

// ── Main tick ─────────────────────────────────────────────

export function gameTick(
  st: GameState,
  input: InputSnapshot,
  motorcycle: boolean,
) {
  st.frame++

  // Countdown
  if (st.countdown > 0) {
    if (st.frame % 60 === 0) st.countdown--
    return
  }

  // ── Tick traps ────────────────────────────────────────
  for (const trap of st.traps) {
    trap.timer = (trap.timer + 1) % TRAP_CYCLE
    if (trap.type === 'spring') {
      // Spring activates in a burst phase
      trap.active = trap.timer > TRAP_CYCLE - 15
      trap.phase = trap.active ? (trap.timer - (TRAP_CYCLE - 15)) / 15 : 0
    } else if (trap.type === 'crusher') {
      // Crusher cycles: slow rise, fast smash
      const half = TRAP_CYCLE / 2
      if (trap.timer < half) {
        trap.phase = trap.timer / half // rising
        trap.active = false
      } else {
        trap.phase = 1 - (trap.timer - half) / (half * 0.3)
        trap.active = trap.timer >= half && trap.timer < half + 10
      }
      trap.phase = clamp(trap.phase, 0, 1)
    } else {
      // Pit: always active (hazard zone)
      trap.active = true
      trap.phase = 0.5 + Math.sin(st.frame * 0.05) * 0.3
    }
  }

  // ── Tick physics balls ────────────────────────────────
  for (const ball of st.balls) {
    ball.vy += st.gravity * DT
    ball.vx *= BALL_FRICTION
    ball.x += ball.vx * DT
    ball.y += ball.vy * DT
    ball.grounded = false

    // Floor collision
    if (ball.y + ball.radius > FLOOR_Y) {
      ball.y = FLOOR_Y - ball.radius
      ball.vy *= -BALL_BOUNCE
      ball.grounded = true
      ball.vx *= 0.95
    }

    // Wall bouncing
    if (ball.x - ball.radius < 0) { ball.x = ball.radius; ball.vx = Math.abs(ball.vx) * BALL_BOUNCE }
    if (ball.x + ball.radius > WORLD_W) { ball.x = WORLD_W - ball.radius; ball.vx = -Math.abs(ball.vx) * BALL_BOUNCE }

    // Platform collision for balls
    for (const plat of st.platforms) {
      const cx = clamp(ball.x, plat.x, plat.x + plat.w)
      const cy = clamp(ball.y, plat.y, plat.y + plat.h)
      const ddx = ball.x - cx
      const ddy = ball.y - cy
      const d = Math.hypot(ddx, ddy)
      if (d < ball.radius && d > 0) {
        const overlap = ball.radius - d
        ball.x += (ddx / d) * overlap
        ball.y += (ddy / d) * overlap
        if (Math.abs(ddy) > Math.abs(ddx)) {
          ball.vy *= -BALL_BOUNCE
          if (ddy < 0) { ball.grounded = true; ball.vx *= 0.95 }
        } else {
          ball.vx *= -BALL_BOUNCE
        }
      }
    }

    // Ball vs ball collision
    for (const other of st.balls) {
      if (other === ball) continue
      const dx = ball.x - other.x
      const dy = ball.y - other.y
      const dd = Math.hypot(dx, dy)
      const minD = ball.radius + other.radius
      if (dd < minD && dd > 0) {
        const overlap = minD - dd
        const nx = dx / dd, ny = dy / dd
        const totalMass = ball.mass + other.mass
        ball.x += nx * overlap * (other.mass / totalMass)
        ball.y += ny * overlap * (other.mass / totalMass)
        other.x -= nx * overlap * (ball.mass / totalMass)
        other.y -= ny * overlap * (ball.mass / totalMass)
        // Elastic-ish collision
        const relVx = ball.vx - other.vx
        const relVy = ball.vy - other.vy
        const dot = relVx * nx + relVy * ny
        if (dot > 0) {
          ball.vx -= dot * nx * (other.mass / totalMass) * 1.5
          ball.vy -= dot * ny * (other.mass / totalMass) * 1.5
          other.vx += dot * nx * (ball.mass / totalMass) * 1.5
          other.vy += dot * ny * (ball.mass / totalMass) * 1.5
        }
      }
    }
  }

  // ── Tick loose spikes ─────────────────────────────────
  for (const ls of st.looseSpikes) {
    ls.vy += st.gravity * DT
    ls.vx *= 0.99
    ls.x += ls.vx * DT
    ls.y += ls.vy * DT
    ls.angle += ls.vx * DT * 0.05

    // Floor
    if (ls.y + ls.h > FLOOR_Y) {
      ls.y = FLOOR_Y - ls.h
      ls.vy *= -0.3
      ls.vx *= 0.85
    }
    // Walls
    if (ls.x < 0) { ls.x = 0; ls.vx = Math.abs(ls.vx) * 0.5 }
    if (ls.x + ls.w > WORLD_W) { ls.x = WORLD_W - ls.w; ls.vx = -Math.abs(ls.vx) * 0.5 }

    // Platform collision
    for (const plat of st.platforms) {
      const cx = clamp(ls.x + ls.w / 2, plat.x, plat.x + plat.w)
      const cy = clamp(ls.y + ls.h / 2, plat.y, plat.y + plat.h)
      const ddx = ls.x + ls.w / 2 - cx
      const ddy = ls.y + ls.h / 2 - cy
      const d = Math.hypot(ddx, ddy)
      if (d < ls.w * 0.6) {
        if (Math.abs(ddy) > Math.abs(ddx)) {
          ls.vy *= -0.3
          if (ddy < 0) ls.vx *= 0.85
        } else {
          ls.vx *= -0.3
        }
      }
    }
  }

  for (const b of st.bunnies) {
    if (!b.alive) {
      if (b.respawnTimer > 0) {
        b.respawnTimer--
        if (b.respawnTimer <= 0 && b.lives > 0) {
          const sx = WORLD_W / (st.bunnies.length + 1) * (b.index + 1)
          const cy = FLOOR_Y - BODY_RADIUS - LEG_LEN - 60
          b.head.pos = { x: sx, y: cy - BODY_RADIUS - HEAD_RADIUS }
          b.torso.pos = { x: sx, y: cy }
          b.pelvis.pos = { x: sx, y: cy + BODY_RADIUS }
          b.head.vel = { x: 0, y: 0 }
          b.torso.vel = { x: 0, y: 0 }
          b.pelvis.vel = { x: 0, y: 0 }
          b.alive = true
          b.pose = 0
          b.poseTarget = 0
          b.grabbing = false
          b.grabPoint = null
          b.deathFlash = 0
          b.mounted = false
          b.mountedBikeIndex = -1
          b.bikeSpeed = 0
        }
      }
      continue
    }

    // ── Input ──────────────────────────────────────────

    b.moveX = 0
    b.actionA = false
    b.actionB = false
    b.actionLB = false

    const slot: PlayerSlot = { index: b.index, name: b.name, color: b.color, input: b.input, joined: true, ready: true }

    if (isBot(slot)) {
      // ── AI with difficulty-dependent behaviour ───────
      const diff = st.aiDifficulty

      const reactionChance = [0.5, 0.75, 0.95, 1.0][diff] ?? 0.75
      if (Math.random() > reactionChance) continue

      const nearestEnemy = st.bunnies
        .filter(o => o.index !== b.index && o.alive)
        .sort((a, c) => dist(a.torso.pos, b.torso.pos) - dist(c.torso.pos, b.torso.pos))[0]

      if (nearestEnemy) {
        const d = dist(nearestEnemy.torso.pos, b.torso.pos)
        const dx = nearestEnemy.torso.pos.x - b.torso.pos.x
        const dy = nearestEnemy.torso.pos.y - b.torso.pos.y

        b.moveX = dx > 0 ? 1 : -1

        const isGrounded = [b.head, b.torso, b.pelvis].some(p => p.grounded)

        // AI also mounts bikes when nearby and not mounted
        if (motorcycle && !b.mounted) {
          for (let bi = 0; bi < st.bikes.length; bi++) {
            const bike = st.bikes[bi]
            if (bike.occupied) continue
            if (dist(b.torso.pos, { x: bike.x + bike.w / 2, y: bike.y }) < BIKE_MOUNT_RANGE + 10) {
              b.actionB = true // mount
              break
            }
          }
        }

        if (b.mounted) {
          // AI on bike: just drive toward enemy
          b.moveX = dx > 0 ? 1 : -1
          b.actionA = true // accelerate
          // Dismount if stuck
          if (Math.abs(b.bikeSpeed) < 10 && Math.random() < 0.01) b.actionB = true
        } else if (diff === 0) {
          b.actionA = d < 100 || Math.random() < 0.02
          b.actionLB = d < 40 && Math.random() < 0.3
        } else if (diff === 1) {
          const kickRange = d > 30 && d < 80
          b.actionA = kickRange || (d < 120 && Math.random() < 0.06)
          b.actionLB = d < 50 && Math.random() < 0.4
        } else if (diff === 2) {
          const inKickRange = d > 25 && d < 70
          const goodAngle = Math.abs(dx) > Math.abs(dy) * 0.5
          b.actionA = inKickRange && goodAngle
          if (isGrounded && dy < -40) b.actionA = true
          b.actionLB = d < 40 && Math.random() < 0.5
          if (d < 20 && b.pose > 0.5) b.moveX = dx > 0 ? -1 : 1
        } else {
          const speed = Math.hypot(b.torso.vel.x, b.torso.vel.y)
          const inKickRange = d > 20 && d < 65
          const hasSpeed = speed > 60
          const goodAngle = Math.abs(dx) > Math.abs(dy) * 0.7
          b.actionA = inKickRange && hasSpeed && goodAngle
          if (isGrounded && dy < -30) b.actionA = true
          b.actionLB = d < 35
          if (nearestEnemy.pose > 0.6 && d < 60) {
            b.actionA = true
            b.moveX = dx > 0 ? -1 : 1
          }
        }

        // ── Mode-specific AI behaviour ──────────────
        if (st.mode === 'sumo') {
          const centerX = WORLD_W / 2
          const enemyFromCenter = nearestEnemy.torso.pos.x - centerX
          if (Math.abs(enemyFromCenter) > 100) {
            b.moveX = enemyFromCenter > 0 ? 1 : -1
          }
        } else if (st.mode === 'king' && st.kingZone) {
          if (d > 120) {
            const zoneCenter = st.kingZone.x + st.kingZone.w / 2
            b.moveX = b.torso.pos.x < zoneCenter ? 1 : -1
          }
        } else if (st.mode === 'race' && st.checkpoints.length > 0) {
          const nextCp = st.checkpoints.find(cp => {
            const atCp = Math.abs(b.torso.pos.x - (cp.x + cp.w / 2)) < cp.w &&
                          Math.abs(b.torso.pos.y - (cp.y + cp.h / 2)) < cp.h
            return !atCp
          })
          if (nextCp) {
            b.moveX = b.torso.pos.x < nextCp.x + nextCp.w / 2 ? 1 : -1
            if (nextCp.y < b.torso.pos.y - 30 && isGrounded) b.actionA = true
          }
        }
      } else {
        b.moveX = Math.random() < 0.5 ? -1 : 1
      }
    } else if (b.input.type === 'gamepad') {
      const gp = input.pads.find(p => p.index === (b.input as { type: 'gamepad'; padIndex: number }).padIndex)
      if (gp) {
        const dir = gamepadDir(gp)
        if (dir) b.moveX = dir.dx
        b.actionA = gp.a
        b.actionB = gp.b
        b.actionLB = gp.lb
      }
    } else if (b.input.type === 'keyboard') {
      const keys = input.keys
      const group = (b.input as { type: 'keyboard'; group: number }).group
      for (const [key, info] of input.keyLookup) {
        if (!keys.has(key)) continue
        if (info.group !== group) continue
        if (info.dir.dx !== 0) b.moveX = info.dir.dx
      }
      const actionKeys = [' ', 'Enter', 'u', '0']
      if (actionKeys[group] && keys.has(actionKeys[group])) b.actionA = true
      // B action: down arrow / 's' / 'j' / '5' depending on group
      const bKeys = ['s', 'ArrowDown', 'j', '5']
      if (bKeys[group] && keys.has(bKeys[group])) b.actionB = true
      if (keys.has('Shift')) b.actionLB = true
    }

    // ═══════════════════════════════════════════════════
    // ── MOTORCYCLE SYSTEM ─────────────────────────────
    // ═══════════════════════════════════════════════════
    if (motorcycle) {
      // ── Mount / Dismount with B button ──────────────
      if (b.actionB && !b.mounted) {
        // Try to mount a nearby bike
        for (let bi = 0; bi < st.bikes.length; bi++) {
          const bike = st.bikes[bi]
          if (bike.occupied) continue
          const bikeCX = bike.x + bike.w / 2
          const bikeCY = bike.y + bike.h / 2
          if (dist(b.torso.pos, { x: bikeCX, y: bikeCY }) < BIKE_MOUNT_RANGE) {
            b.mounted = true
            b.mountedBikeIndex = bi
            b.bikeDir = b.moveX >= 0 ? 1 : -1
            b.bikeSpeed = 0
            bike.occupied = true
            // Snap bunny onto bike
            b.torso.pos.x = bikeCX
            b.torso.pos.y = bike.y - BODY_RADIUS
            b.torso.vel = { x: 0, y: 0 }
            b.head.vel = { x: 0, y: 0 }
            b.pelvis.vel = { x: 0, y: 0 }
            break
          }
        }
      } else if (b.actionB && b.mounted) {
        // Dismount
        dismountBike(b, st)
      }

      // ── Mounted controls ──────────────────────────────
      if (b.mounted && b.mountedBikeIndex >= 0) {
        const bike = st.bikes[b.mountedBikeIndex]

        // Direction from moveX
        if (b.moveX !== 0) b.bikeDir = b.moveX > 0 ? 1 : -1

        // A = accelerate, no A = coast/brake
        if (b.actionA) {
          b.bikeSpeed += b.bikeDir * BIKE_ACCEL * DT
        } else if (Math.abs(b.bikeSpeed) > 5) {
          // Gradual slowdown when not pressing
          b.bikeSpeed -= Math.sign(b.bikeSpeed) * BIKE_BRAKE * 0.3 * DT
        } else {
          b.bikeSpeed = 0
        }

        // Clamp speed
        b.bikeSpeed = clamp(b.bikeSpeed, -BIKE_MAX_SPEED, BIKE_MAX_SPEED)

        // Move bike
        bike.x += b.bikeSpeed * DT
        bike.x = clamp(bike.x, 0, WORLD_W - bike.w)

        // Bike visual tilt toward direction
        const targetTilt = b.bikeSpeed * 0.001
        bike.tilt += (targetTilt - bike.tilt) * BIKE_TILT_SPEED * DT

        // Update wheel angle for visual spin
        b.bikeWheelAngle += b.bikeSpeed * DT * 0.15

        // Snap bunny to bike position
        const bx = bike.x + bike.w / 2
        const by = bike.y - BODY_RADIUS
        b.torso.pos.x = bx
        b.torso.pos.y = by
        b.head.pos.x = bx
        b.head.pos.y = by - BODY_RADIUS - HEAD_RADIUS
        b.pelvis.pos.x = bx
        b.pelvis.pos.y = by + BODY_RADIUS * 0.5
        b.torso.vel.x = b.bikeSpeed
        b.torso.vel.y = 0
        b.head.vel = { x: b.bikeSpeed * 0.8, y: 0 }
        b.pelvis.vel = { x: b.bikeSpeed * 0.9, y: 0 }

        // Bike on platforms
        let onPlatform = false
        for (const plat of st.platforms) {
          if (bike.x + bike.w > plat.x && bike.x < plat.x + plat.w &&
              bike.y + bike.h >= plat.y && bike.y + bike.h <= plat.y + 10) {
            bike.y = plat.y - bike.h
            onPlatform = true
          }
        }
        // Bike gravity if not on platform
        if (!onPlatform && bike.y + bike.h < FLOOR_Y) {
          bike.y += st.gravity * DT * DT * 30
        }
        if (bike.y + bike.h > FLOOR_Y) {
          bike.y = FLOOR_Y - bike.h
        }

        // Override pose: seated on bike
        b.pose = 0.6
        b.poseTarget = 0.6

        // Skip normal physics for mounted bunnies
        // But still check spikes & out-of-bounds
        for (const spike of st.spikes) {
          for (const part of [b.head, b.torso, b.pelvis]) {
            const cx = clamp(part.pos.x, spike.x, spike.x + spike.w)
            const cy = clamp(part.pos.y, spike.y, spike.y + spike.h)
            if (dist(part.pos, { x: cx, y: cy }) < part.radius + 4) {
              killBunny(b, st)
              break
            }
          }
          if (!b.alive) break
        }
        if (b.torso.pos.y > WORLD_H + 50 || b.torso.pos.x < -50 || b.torso.pos.x > WORLD_W + 50) {
          killBunny(b, st)
        }

        // Mounted bunny — coin, checkpoint, king zone collection still works below
        // Skip the rest of normal physics
        if (b.alive && b.mounted) {
          // Coin collection
          for (const coin of st.coins) {
            if (coin.collected) continue
            if (dist(b.torso.pos, { x: coin.x, y: coin.y }) < BODY_RADIUS + 10) {
              coin.collected = true
              b.score++
            }
          }
          // Checkpoint (race)
          if (st.mode === 'race') {
            for (const cp of st.checkpoints) {
              const cx = cp.x + cp.w / 2
              const cy = cp.y + cp.h / 2
              if (Math.abs(b.torso.pos.x - cx) < cp.w / 2 + BODY_RADIUS &&
                  Math.abs(b.torso.pos.y - cy) < cp.h / 2 + BODY_RADIUS) {
                if (cp.index + 1 > b.score) b.score = cp.index + 1
              }
            }
          }
          // King zone
          if (st.mode === 'king' && st.kingZone) {
            const kz = st.kingZone
            const inZone = b.torso.pos.x > kz.x && b.torso.pos.x < kz.x + kz.w &&
                           b.torso.pos.y > kz.y && b.torso.pos.y < kz.y + kz.h
            if (inZone) { b.kingTimer += DT; b.score = Math.floor(b.kingTimer) }
          }
          // Bike-ram: mounted bunny can ram others
          for (const other of st.bunnies) {
            if (other.index === b.index || !other.alive) continue
            const d2 = dist(b.torso.pos, other.torso.pos)
            if (d2 < BODY_RADIUS * 2 + 8 && Math.abs(b.bikeSpeed) > 80) {
              // Ram effect
              other.torso.vel.x += b.bikeSpeed * 0.8
              other.torso.vel.y -= 120
              other.head.vel.x += b.bikeSpeed * 0.6
              other.head.vel.y -= 80
            }
          }
          if (b.deathFlash > 0) b.deathFlash--
          continue // skip normal physics for this mounted bunny
        }
      }
    }

    // ── Pose animation (only when NOT mounted) ─────────
    b.poseTarget = b.actionA ? 1 : 0
    b.pose += (b.poseTarget - b.pose) * 0.2

    // ── Movement (rolling torque) ───────────────────────

    const parts = [b.head, b.torso, b.pelvis]
    const isGrounded = parts.some(p => p.grounded)
    const moveMul = isGrounded ? MOVE_TORQUE : MOVE_TORQUE * 0.3
    const frict = isGrounded ? FRICTION : AIR_FRICTION

    for (const part of parts) {
      part.vel.y += st.gravity * DT
      part.vel.x += b.moveX * moveMul * DT / part.mass
      part.vel.x *= frict

      if (b.actionA && isGrounded && part === b.torso) {
        part.vel.y = JUMP_IMPULSE
        b.head.vel.y = JUMP_IMPULSE * 0.8
        b.pelvis.vel.y = JUMP_IMPULSE * 0.7
      }
      if (b.actionA && !isGrounded && part === b.pelvis) {
        part.vel.y += KICK_IMPULSE * DT
      }

      part.pos.x += part.vel.x * DT
      part.pos.y += part.vel.y * DT
      part.grounded = false
    }

    // ── Body constraints ────────────────────────────────

    const headTorsoD = dist(b.head.pos, b.torso.pos)
    const targetHTD = BODY_RADIUS + HEAD_RADIUS
    if (headTorsoD > targetHTD * 1.2) {
      const dx = b.head.pos.x - b.torso.pos.x
      const dy = b.head.pos.y - b.torso.pos.y
      const d = headTorsoD || 1
      const correction = (headTorsoD - targetHTD) * 0.5
      b.head.pos.x -= (dx / d) * correction
      b.head.pos.y -= (dy / d) * correction
      b.torso.pos.x += (dx / d) * correction * 0.3
      b.torso.pos.y += (dy / d) * correction * 0.3
    }

    const torsoPelvisD = dist(b.torso.pos, b.pelvis.pos)
    const targetTPD = BODY_RADIUS * 1.5
    if (torsoPelvisD > targetTPD * 1.2) {
      const dx = b.pelvis.pos.x - b.torso.pos.x
      const dy = b.pelvis.pos.y - b.torso.pos.y
      const d = torsoPelvisD || 1
      const correction = (torsoPelvisD - targetTPD) * 0.5
      b.pelvis.pos.x -= (dx / d) * correction
      b.pelvis.pos.y -= (dy / d) * correction
      b.torso.pos.x += (dx / d) * correction * 0.3
      b.torso.pos.y += (dy / d) * correction * 0.3
    }

    // ── Grab ────────────────────────────────────────────

    if (b.actionLB && !b.grabbing) {
      for (const plat of st.platforms) {
        const cx = clamp(b.torso.pos.x, plat.x, plat.x + plat.w)
        const cy = clamp(b.torso.pos.y, plat.y, plat.y + plat.h)
        if (dist(b.torso.pos, { x: cx, y: cy }) < BODY_RADIUS + 16) {
          b.grabbing = true
          b.grabPoint = { x: cx, y: cy }
          break
        }
      }
      if (!b.grabbing) {
        for (const other of st.bunnies) {
          if (other.index === b.index || !other.alive) continue
          if (dist(b.torso.pos, other.torso.pos) < BODY_RADIUS * 2 + 16) {
            b.grabbing = true
            b.grabPoint = { x: other.torso.pos.x, y: other.torso.pos.y }
            break
          }
        }
      }
    } else if (!b.actionLB) {
      b.grabbing = false
      b.grabPoint = null
    }

    if (b.grabbing && b.grabPoint) {
      const gd = dist(b.torso.pos, b.grabPoint)
      if (gd > GRAB_BREAK_VEL * DT) {
        b.grabbing = false
        b.grabPoint = null
      } else {
        b.torso.vel.x += (b.grabPoint.x - b.torso.pos.x) * 0.03
        b.torso.vel.y += (b.grabPoint.y - b.torso.pos.y) * 0.03
      }
    }

    // ── Platform collision ──────────────────────────────

    for (const part of parts) {
      for (const plat of st.platforms) {
        const cx = clamp(part.pos.x, plat.x, plat.x + plat.w)
        const cy = clamp(part.pos.y, plat.y, plat.y + plat.h)
        const ddx = part.pos.x - cx
        const ddy = part.pos.y - cy
        const d = Math.hypot(ddx, ddy)
        if (d < part.radius) {
          const overlap = part.radius - d
          if (d > 0) {
            part.pos.x += (ddx / d) * overlap
            part.pos.y += (ddy / d) * overlap
          } else {
            part.pos.y -= overlap
          }
          if (Math.abs(ddy) > Math.abs(ddx)) {
            part.vel.y *= -BOUNCE
            if (ddy < 0) part.grounded = true
          } else {
            part.vel.x *= -BOUNCE
          }
        }
      }
    }

    // ── Spike collision ─────────────────────────────────

    for (const spike of st.spikes) {
      for (const part of parts) {
        const cx = clamp(part.pos.x, spike.x, spike.x + spike.w)
        const cy = clamp(part.pos.y, spike.y, spike.y + spike.h)
        if (dist(part.pos, { x: cx, y: cy }) < part.radius + 4) {
          killBunny(b, st)
          break
        }
      }
      if (!b.alive) break
    }

    // ── Loose spike collision ───────────────────────────
    if (b.alive) {
      for (const ls of st.looseSpikes) {
        const lsCX = ls.x + ls.w / 2
        const lsCY = ls.y + ls.h / 2
        for (const part of parts) {
          if (dist(part.pos, { x: lsCX, y: lsCY }) < part.radius + 6) {
            killBunny(b, st)
            // Scatter the spike
            ls.vx += (Math.random() - 0.5) * 100
            ls.vy -= 80
            break
          }
        }
        if (!b.alive) break
      }
    }

    // ── Physics ball collision with bunny ────────────────
    if (b.alive) {
      for (const ball of st.balls) {
        const d = dist(b.torso.pos, { x: ball.x, y: ball.y })
        const minD = BODY_RADIUS + ball.radius
        if (d < minD) {
          // Push each other
          const nx = (b.torso.pos.x - ball.x) / (d || 1)
          const ny = (b.torso.pos.y - ball.y) / (d || 1)
          const overlap = minD - d
          b.torso.pos.x += nx * overlap * 0.4
          b.torso.pos.y += ny * overlap * 0.4
          ball.x -= nx * overlap * 0.6
          ball.y -= ny * overlap * 0.6

          // Velocity exchange
          const relSpeed = Math.hypot(ball.vx - b.torso.vel.x, ball.vy - b.torso.vel.y)
          b.torso.vel.x += nx * relSpeed * 0.3
          b.torso.vel.y += ny * relSpeed * 0.3
          ball.vx -= nx * relSpeed * 0.3
          ball.vy -= ny * relSpeed * 0.3

          // Kill if ball is moving fast enough
          if (relSpeed > BALL_KILL_SPEED && ball.mass > 2) {
            killBunny(b, st)
            break
          }
        }
      }
    }

    // ── Trap collision ──────────────────────────────────
    if (b.alive) {
      for (const trap of st.traps) {
        const inTrap = b.torso.pos.x > trap.x && b.torso.pos.x < trap.x + trap.w &&
                       b.torso.pos.y > trap.y && b.torso.pos.y < trap.y + trap.h
        if (!inTrap) continue

        if (trap.type === 'spring' && trap.active) {
          // Launch bunny upward
          b.torso.vel.y = SPRING_FORCE
          b.head.vel.y = SPRING_FORCE * 0.8
          b.pelvis.vel.y = SPRING_FORCE * 0.7
        } else if (trap.type === 'crusher' && trap.active) {
          killBunny(b, st)
          break
        } else if (trap.type === 'pit') {
          // Slow damage — kill after brief contact
          killBunny(b, st)
          break
        }
      }
    }

    // ── Head/body impact death ───────────────────────────

    if (b.alive) {
      const headSpeed = Math.hypot(b.head.vel.x, b.head.vel.y)
      if (headSpeed > HEAD_DEATH_VEL && b.head.grounded) killBunny(b, st)
      const bodySpeed = Math.hypot(b.torso.vel.x, b.torso.vel.y)
      if (bodySpeed > BODY_DEATH_VEL && b.torso.grounded) killBunny(b, st)
    }

    // ── Bunny vs bunny ──────────────────────────────────

    for (const other of st.bunnies) {
      if (other.index <= b.index || !other.alive || !b.alive) continue
      const d = dist(b.torso.pos, other.torso.pos)
      const minD = BODY_RADIUS * 2
      if (d < minD) {
        const overlap = minD - d
        const dx = (b.torso.pos.x - other.torso.pos.x) / (d || 1)
        const dy = (b.torso.pos.y - other.torso.pos.y) / (d || 1)
        b.torso.pos.x += dx * overlap * 0.5
        b.torso.pos.y += dy * overlap * 0.5
        other.torso.pos.x -= dx * overlap * 0.5
        other.torso.pos.y -= dy * overlap * 0.5
        const relVx = b.torso.vel.x - other.torso.vel.x
        const relVy = b.torso.vel.y - other.torso.vel.y
        b.torso.vel.x -= relVx * 0.5
        b.torso.vel.y -= relVy * 0.5
        other.torso.vel.x += relVx * 0.5
        other.torso.vel.y += relVy * 0.5
      }
    }

    // ── Out of bounds ───────────────────────────────────

    if (b.torso.pos.y > WORLD_H + 50 || b.torso.pos.x < -50 || b.torso.pos.x > WORLD_W + 50) {
      killBunny(b, st)
    }

    // ── Coin collection ─────────────────────────────────

    for (const coin of st.coins) {
      if (coin.collected) continue
      if (dist(b.torso.pos, { x: coin.x, y: coin.y }) < BODY_RADIUS + 8) {
        coin.collected = true
        b.score++
      }
    }

    // ── Checkpoint collection (race mode) ─────────────────

    if (st.mode === 'race') {
      for (const cp of st.checkpoints) {
        const cx = cp.x + cp.w / 2
        const cy = cp.y + cp.h / 2
        if (Math.abs(b.torso.pos.x - cx) < cp.w / 2 + BODY_RADIUS &&
            Math.abs(b.torso.pos.y - cy) < cp.h / 2 + BODY_RADIUS) {
          if (cp.index + 1 > b.score) b.score = cp.index + 1
        }
      }
    }

    // ── King zone timer (king mode) ──────────────────────

    if (st.mode === 'king' && st.kingZone) {
      const kz = st.kingZone
      const inZone = b.torso.pos.x > kz.x && b.torso.pos.x < kz.x + kz.w &&
                     b.torso.pos.y > kz.y && b.torso.pos.y < kz.y + kz.h
      if (inZone) {
        b.kingTimer += DT
        b.score = Math.floor(b.kingTimer)
      }
    }

    // ── Death flash ─────────────────────────────────────

    if (b.deathFlash > 0) b.deathFlash--
  }

  // ── Bunny pushing balls ─────────────────────────────────
  // (Bunnies that kick or grab can shove balls)
  for (const b of st.bunnies) {
    if (!b.alive) continue
    for (const ball of st.balls) {
      // Allow bunny to "kick" balls when in plank pose
      if (b.pose > 0.5) {
        const legReach = BODY_RADIUS + LEG_LEN
        const d = dist(b.pelvis.pos, { x: ball.x, y: ball.y })
        if (d < legReach + ball.radius) {
          const nx = (ball.x - b.pelvis.pos.x) / (d || 1)
          const ny = (ball.y - b.pelvis.pos.y) / (d || 1)
          const kickForce = 200 + Math.abs(b.torso.vel.x) * 0.5
          ball.vx += nx * kickForce * DT
          ball.vy += ny * kickForce * DT
        }
      }
    }
  }

  // ── Win condition ───────────────────────────────────────

  if (!st.gameOver) {
    const alive = st.bunnies.filter(b => b.alive || b.lives > 0)

    if ((st.mode === 'arena' || st.mode === 'sumo') && alive.length <= 1 && st.bunnies.length > 1) {
      st.gameOver = true
      st.winner = alive[0]?.index ?? -1
    }

    if (st.mode === 'puzzle' && st.coins.length > 0 && st.coins.every(c => c.collected)) {
      st.gameOver = true
      let best = st.bunnies[0]
      for (const b of st.bunnies) if (b.score > best.score) best = b
      st.winner = best.index
    }

    if (st.mode === 'race' && st.checkpoints.length > 0) {
      const finishIndex = st.checkpoints.length
      const winner = st.bunnies.find(b => b.score >= finishIndex)
      if (winner) {
        st.gameOver = true
        st.winner = winner.index
      }
    }

    if (st.mode === 'king') {
      const kingWinner = st.bunnies.find(b => b.kingTimer >= 30)
      if (kingWinner) {
        st.gameOver = true
        st.winner = kingWinner.index
      }
    }
  }
}
