/**
 * combat.ts — Enemy AI, spawning, boss logic, wave management.
 */

import {
  ENEMY_TYPES, type EnemyState, type FlatWorldState,
  BLOCKS, GRAVITY, MAX_FALL, ENEMY_SPAWN_RANGE, ENEMY_MAX_RANGE,
  ENEMY_CAP, WAVE_INTERVAL, BOSS_WAVE_INTERVAL, MIDNIGHT, DUSK, DAWN,
  DAY_LENGTH, MELEE_RANGE,
} from './types'
import { spawnParticles } from './gameState'

// ─── Time Helpers ─────────────────────────────────────────
export function isNight(time: number): boolean {
  return time > DUSK - 1000 || time < DAWN + 2000
}

export function getDayProgress(time: number): number {
  return time / DAY_LENGTH
}

export function getSkyBrightness(time: number): number {
  // 0=dark, 1=bright
  if (time >= DAWN && time < 3000) return time / 3000    // sunrise
  if (time >= 3000 && time < DUSK - 2000) return 1.0     // day
  if (time >= DUSK - 2000 && time < DUSK) return 1.0 - (time - (DUSK - 2000)) / 2000 * 0.7  // sunset
  if (time >= DUSK && time < MIDNIGHT) return 0.3         // night
  if (time >= MIDNIGHT) return 0.3 - (time - MIDNIGHT) / (DAY_LENGTH - MIDNIGHT) * 0.0  // late night
  return 0.3
}

// ─── Solid check ──────────────────────────────────────────
function isSolid(world: number[][], x: number, y: number, w: number, h: number): boolean {
  if (x < 0 || x >= w || y < 0 || y >= h) return true
  const block = world[y]?.[x]
  if (block === undefined) return true
  const def = BLOCKS[block]
  return def ? def.solid : false
}

// ─── Enemy Movement ───────────────────────────────────────
function moveEnemy(
  world: number[][], e: EnemyState, ww: number, wh: number
) {
  const halfW = e.width / 2
  let nx = e.x + e.vx
  let ny = e.y + e.vy
  let onGround = false

  // Horizontal collision
  {
    const minTy = Math.floor(e.y)
    const maxTy = Math.floor(e.y + e.height - 0.01)
    const checkX = e.vx > 0 ? Math.floor(nx + halfW) : Math.floor(nx - halfW)
    for (let ty = minTy; ty <= maxTy; ty++) {
      if (isSolid(world, checkX, ty, ww, wh)) {
        if (e.vx > 0) nx = checkX - halfW - 0.001
        else nx = checkX + 1 + halfW + 0.001
        e.vx = 0
        break
      }
    }
  }

  // Vertical collision
  {
    const minTx = Math.floor(nx - halfW + 0.05)
    const maxTx = Math.floor(nx + halfW - 0.05)
    if (e.vy >= 0) {
      const footY = Math.floor(ny + e.height)
      for (let tx = minTx; tx <= maxTx; tx++) {
        if (isSolid(world, tx, footY, ww, wh)) {
          ny = footY - e.height
          e.vy = 0
          onGround = true
          break
        }
      }
    } else {
      const headY = Math.floor(ny)
      for (let tx = minTx; tx <= maxTx; tx++) {
        if (isSolid(world, headY, tx, ww, wh)) {
          ny = headY + 1
          e.vy = 0
          break
        }
      }
    }
  }

  e.x = Math.max(halfW, Math.min(ww - halfW, nx))
  e.y = ny
  e.onGround = onGround
}

// ─── Enemy AI ─────────────────────────────────────────────
function updateEnemyAI(
  e: EnemyState, state: FlatWorldState
) {
  const def = ENEMY_TYPES[e.type]
  if (!def || !e.alive) return

  const { players, world, config } = state
  const ww = config.worldWidth, wh = config.worldHeight

  // Find nearest alive player
  let nearestDist = Infinity
  let nearestIdx = 0
  for (let i = 0; i < players.length; i++) {
    if (!players[i].alive) continue
    const d = Math.hypot(players[i].x - e.x, players[i].y - e.y)
    if (d < nearestDist) { nearestDist = d; nearestIdx = i }
  }
  e.targetPlayer = nearestIdx
  const target = players[nearestIdx]
  if (!target || !target.alive) return

  const dx = target.x - e.x
  const dy = target.y - e.y

  // Face toward target
  e.facing = dx > 0 ? 1 : -1

  // Movement
  const speed = def.speed * 0.03

  if (nearestDist > MELEE_RANGE * 0.8 || def.ranged) {
    // Move toward player
    e.vx = e.facing * speed
  } else {
    e.vx *= 0.5
  }

  // Jump over obstacles
  if (e.onGround) {
    const aheadX = Math.floor(e.x + e.facing * 1.2)
    const feetY = Math.floor(e.y + e.height)
    // Wall ahead?
    if (isSolid(world, aheadX, feetY - 1, ww, wh) && !isSolid(world, aheadX, feetY - 2, ww, wh)) {
      e.vy = -def.jumpForce * 0.025
    }
    // Pit ahead? Jump over
    if (!isSolid(world, aheadX, feetY, ww, wh) && !isSolid(world, aheadX, feetY + 1, ww, wh) && nearestDist < 10) {
      e.vy = -def.jumpForce * 0.02
    }
  }

  // Gravity
  e.vy += GRAVITY
  if (e.vy > MAX_FALL) e.vy = MAX_FALL

  // Movement
  moveEnemy(world, e, ww, wh)

  // Attack cooldown
  if (e.attackCooldown > 0) e.attackCooldown--

  // Melee attack
  if (!def.ranged && nearestDist < MELEE_RANGE && e.attackCooldown <= 0 && target.invincibleTimer <= 0) {
    target.hp -= def.damage
    target.invincibleTimer = 30
    target.vx += e.facing * 0.1
    target.vy -= 0.08
    spawnParticles(state, target.x, target.y + target.height * 0.3, '#f00', 4)
    e.attackCooldown = 40

    if (target.hp <= 0) {
      target.alive = false
      target.respawnTimer = 180
      target.deaths++
      target.streak = 0
      spawnParticles(state, target.x, target.y + target.height / 2, target.color, 15)
    }
  }

  // Ranged attack
  if (def.ranged && nearestDist < 15 && nearestDist > 3 && e.attackCooldown <= 0) {
    const len = Math.hypot(dx, dy) || 1
    state.projectiles.push({
      x: e.x + e.facing * 0.5,
      y: e.y + e.height * 0.4,
      vx: (dx / len) * 0.15,
      vy: (dy / len) * 0.15,
      owner: -1,
      damage: def.damage,
      color: def.projectileColor || '#ff0',
      gravity: false,
      life: 150,
    })
    e.attackCooldown = 60
  }

  // Boss special: phase transitions
  if (def.boss && e.phase !== undefined) {
    const hpRatio = e.hp / e.maxHp
    const newPhase = hpRatio > 0.66 ? 0 : hpRatio > 0.33 ? 1 : 2
    if (newPhase > e.phase) {
      e.phase = newPhase
      // Phase transition: speed increase, spawn adds
      if (newPhase === 1) {
        // Spawn minions
        for (let i = 0; i < 3; i++) {
          spawnEnemy(state, e.type === 'zombie_king' ? 'mutant' : 'spider', e.x + (Math.random() - 0.5) * 5, e.y)
        }
      } else if (newPhase === 2) {
        // Enrage: faster attacks
        e.attackCooldown = 0
      }
    }
  }

  // Despawn if too far from all players
  if (nearestDist > ENEMY_MAX_RANGE * 2) e.alive = false
}

// ─── Spawn Enemy ──────────────────────────────────────────
export function spawnEnemy(state: FlatWorldState, type: string, x: number, y: number) {
  const def = ENEMY_TYPES[type]
  if (!def) return

  state.enemies.push({
    type,
    x, y,
    vx: 0, vy: 0,
    hp: def.hp, maxHp: def.hp,
    width: def.width, height: def.height,
    facing: Math.random() > 0.5 ? 1 : -1,
    onGround: false,
    attackCooldown: 60,
    targetPlayer: 0,
    alive: true,
    phase: def.boss ? 0 : undefined,
  })
}

// ─── Enemy Spawning Logic ─────────────────────────────────
export function updateEnemySpawning(state: FlatWorldState) {
  const { config, players, enemies, time, frame } = state
  const ww = config.worldWidth, wh = config.worldHeight

  // Remove dead enemies
  state.enemies = state.enemies.filter(e => e.alive)

  // Update living enemies
  for (const e of state.enemies) {
    updateEnemyAI(e, state)
  }

  // ── Survival mode: spawn enemies based on day/night ──
  if (config.mode === 'survival') {
    if (state.spawnCooldown > 0) { state.spawnCooldown--; return }
    const aliveEnemies = enemies.filter(e => e.alive && !ENEMY_TYPES[e.type]?.boss).length
    if (aliveEnemies >= ENEMY_CAP) return

    const diffMult = config.difficulty === 'hard' ? 1.5 : config.difficulty === 'easy' ? 0.5 : 1

    if (isNight(time)) {
      // Night: spawn surface enemies
      if (frame % Math.floor(120 / diffMult) === 0) {
        const p = players[Math.floor(Math.random() * players.length)]
        if (!p.alive) return
        const spawnX = p.x + (Math.random() > 0.5 ? 1 : -1) * (ENEMY_SPAWN_RANGE + Math.random() * 10)
        let spawnY = 0
        for (let y = 0; y < wh; y++) {
          if (isSolid(state.world, Math.floor(spawnX), y, ww, wh)) {
            spawnY = y - 2
            break
          }
        }
        if (spawnX > 0 && spawnX < ww) {
          const types = ['mutant', 'mutant', 'raider', 'skeleton', 'slime']
          const type = types[Math.floor(Math.random() * types.length)]
          spawnEnemy(state, type, spawnX, spawnY)
        }
      }
    } else {
      // Day: spawn only underground enemies occasionally
      if (frame % Math.floor(300 / diffMult) === 0) {
        const p = players[Math.floor(Math.random() * players.length)]
        if (!p.alive) return
        // Only if player is underground
        if (p.y > config.surfaceY + 10) {
          const spawnX = p.x + (Math.random() > 0.5 ? 1 : -1) * (8 + Math.random() * 8)
          const spawnY = p.y + (Math.random() - 0.5) * 6
          if (spawnX > 0 && spawnX < ww && !isSolid(state.world, Math.floor(spawnX), Math.floor(spawnY), ww, wh)) {
            spawnEnemy(state, Math.random() > 0.5 ? 'spider' : 'slime', spawnX, spawnY)
          }
        }
      }
    }

    // Boss spawn: every 5th night
    const day = Math.floor(state.frame / DAY_LENGTH)
    if (day > 0 && day % 5 === 0 && time === MIDNIGHT && !state.bossAlive) {
      const p = players[0]
      if (p?.alive) {
        const bossType = day % 10 === 0 ? 'mech_boss' : 'zombie_king'
        spawnEnemy(state, bossType, p.x + 20, p.y - 5)
        state.bossAlive = true
      }
    }
  }

  // ── Coop Survival: wave-based ────────────────────────
  if (config.mode === 'coop-survival') {
    state.waveTimer++
    if (state.waveTimer >= WAVE_INTERVAL) {
      state.waveTimer = 0
      state.waveNum++

      const diffMult = config.difficulty === 'hard' ? 1.5 : config.difficulty === 'easy' ? 0.5 : 1
      const count = Math.floor((3 + state.waveNum * 1.5) * diffMult)

      for (let i = 0; i < count; i++) {
        const p = players[Math.floor(Math.random() * players.length)]
        if (!p?.alive) continue
        const spawnX = p.x + (Math.random() > 0.5 ? 1 : -1) * (ENEMY_SPAWN_RANGE + Math.random() * 10)
        let spawnY = 0
        for (let y = 0; y < wh; y++) {
          if (isSolid(state.world, Math.floor(spawnX), y, ww, wh)) {
            spawnY = y - 2
            break
          }
        }
        const types = ['mutant', 'raider', 'skeleton', 'spider', 'slime']
        const type = types[Math.floor(Math.random() * types.length)]
        if (spawnX > 0 && spawnX < ww) {
          spawnEnemy(state, type, spawnX, spawnY)
        }
      }

      // Boss every N waves
      if (state.waveNum % BOSS_WAVE_INTERVAL === 0) {
        const p = players[0]
        if (p?.alive) {
          spawnEnemy(state, state.waveNum % 10 === 0 ? 'mech_boss' : 'zombie_king', p.x + 15, p.y - 5)
          state.bossAlive = true
        }
      }
    }

    // Game over if all players dead
    if (state.players.every(p => !p.alive && p.respawnTimer <= 0)) {
      state.gameOver = true
    }
  }
}
