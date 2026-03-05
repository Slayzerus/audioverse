/**
 * Game logic tick for AtomicPostApo — runs at ~60fps.
 *
 * Handles: player movement, shooting, VATS, item usage,
 * enemy AI & combat, bullet physics, loot, radiation,
 * campfire healing, area clearing, win conditions, survival waves.
 */
import * as THREE from 'three'
import type { GameState, Player, Enemy, EnemyKind } from './types'
import type { PlayerInput, GamepadState } from './input'
import { getInput } from './input'
import {
  PLAYER_R, PLAYER_SPEED, SPRINT_SPEED, BULLET_R,
  INTERACT_RANGE, VATS_DURATION, VATS_CD, AREAS_TO_WIN, WEAPONS,
  ENEMY_STATS,
} from './constants'
import {
  dist2, slideMove, getObstacles, rectContains, normalize,
  rng, rngI,
} from './helpers'
import { createEnemyMesh } from './modelManager'
import { ENEMY_COLORS } from './assets'

// ─── Scene mesh references (set from component) ────────
export interface SceneMeshes {
  playerMeshes: Map<number, THREE.Object3D>
  enemyMeshes: Map<number, THREE.Object3D>
  lootMeshes: Map<number, THREE.Object3D>
  bulletGroup: THREE.Group
  scene: THREE.Scene
}

/**
 * Main game tick — called each frame with dt (ms)
 */
export function gameTick(
  st: GameState,
  dt: number,
  pads: GamepadState[],
  meshes: SceneMeshes | null,
): void {
  if (st.gameOver) return
  if (dt > 100) dt = 100

  // VATS slow-mo
  const anyVats = st.players.some(p => p.alive && p.vatsTimer > 0)
  const speed = anyVats ? 0.4 : 1
  const adt = dt * speed // adjusted delta time
  st.time += adt

  // Precompute obstacles (use cache when available)
  const obstacles = st.cachedObstacles ?? getObstacles(st.buildings, st.walls, st.props)
  if (!st.cachedObstacles) st.cachedObstacles = obstacles

  // Edge-detection: keys just pressed this frame
  const justPressed = new Set<string>()
  // (populated per-player below)

  // ─── Update players ────────────────────────────────────
  for (const p of st.players) {
    if (!p.alive) continue
    p.shootCd = Math.max(0, p.shootCd - adt)
    p.vatsCd = Math.max(0, p.vatsCd - adt)
    p.vatsTimer = Math.max(0, p.vatsTimer - adt)
    p.interactCd = Math.max(0, p.interactCd - adt)

    // Bot AI — bots use keyboard group -1 as sentinel
    let input: PlayerInput
    const isBot = p.input.type === 'keyboard' && p.input.group === -1
    if (isBot) {
      input = botAI(p, st)
    } else {
      input = getInput(p.input, pads)
    }

    // Sprint
    p.sprint = input.sprint && (input.mx !== 0 || input.my !== 0)
    const moveSpd = p.sprint ? SPRINT_SPEED : PLAYER_SPEED
    const dtSec = adt / 1000

    // Move with isometric direction correction
    if (input.mx || input.my) {
      const norm = normalize({ x: input.mx, y: input.my })
      // In isometric, we map screen input directly to world XZ
      const dx = norm.x * moveSpd * dtSec
      const dy = norm.y * moveSpd * dtSec
      p.angle = Math.atan2(norm.y, norm.x)

      const newPos = slideMove(p.x, p.y, dx, dy, PLAYER_R, obstacles, st.mapW, st.mapH)
      p.x = newPos.x
      p.y = newPos.y
    }

    // Shoot
    const weapon = WEAPONS[p.weaponIdx] || WEAPONS[0]
    if (input.shoot && p.shootCd <= 0 && p.ammo >= weapon.ammoPerShot && !p.sprint) {
      p.ammo -= weapon.ammoPerShot
      p.shootCd = weapon.fireRate

      for (let proj = 0; proj < weapon.projectiles; proj++) {
        const spreadAngle = p.angle + rng(-weapon.spread, weapon.spread)
        const bx = p.x + Math.cos(spreadAngle) * (PLAYER_R + 0.2)
        const by = p.y + Math.sin(spreadAngle) * (PLAYER_R + 0.2)
        st.bullets.push({
          id: st.bulletNextId++,
          x: bx, y: by, z: 0.6,
          dx: Math.cos(spreadAngle) * weapon.bulletSpeed,
          dy: Math.sin(spreadAngle) * weapon.bulletSpeed,
          owner: p.idx,
          life: weapon.range,
          damage: weapon.damage * (p.vatsTimer > 0 ? 1.5 : 1),
          weaponIdx: p.weaponIdx,
        })
      }
    }

    // Interact — loot
    if (input.interact && p.interactCd <= 0) {
      p.interactCd = 300
      for (const lb of st.loot) {
        if (lb.open) continue
        if (dist2(p, { x: lb.x, y: lb.y }) < INTERACT_RANGE) {
          lb.open = true
          switch (lb.item) {
            case 'health':   p.hp = Math.min(p.maxHp, p.hp + lb.value); break
            case 'ammo':     p.ammo += lb.value; break
            case 'armor':    p.armor = Math.min(p.maxArmor, p.armor + lb.value); break
            case 'coin':     p.coins += lb.value; break
            case 'stimpak':  p.stimpaks += 1; break
            case 'radaway':  p.radaway += 1; break
            case 'weapon_upgrade':
              p.weaponIdx = Math.min(WEAPONS.length - 1, p.weaponIdx + 1)
              break
          }
          // Remove mesh
          if (meshes) {
            const lootMesh = meshes.lootMeshes.get(lb.id)
            if (lootMesh) {
              meshes.scene.remove(lootMesh)
              meshes.lootMeshes.delete(lb.id)
            }
          }
          break
        }
      }
    }

    // VATS ability
    if (input.ability && p.vatsCd <= 0) {
      p.vatsTimer = VATS_DURATION
      p.vatsCd = VATS_CD
    }

    // Use stimpak (edge-triggered — only on first frame of press)
    if (input.useStimpak && p.stimpaks > 0 && p.hp < p.maxHp && (isBot || !st.prevKeys.has('stimpak_' + p.idx))) {
      p.stimpaks--
      p.hp = Math.min(p.maxHp, p.hp + 50)
    }
    if (input.useStimpak) justPressed.add('stimpak_' + p.idx)

    // Use radaway (edge-triggered)
    if (input.useRadaway && p.radaway > 0 && p.radiation > 0 && (isBot || !st.prevKeys.has('radaway_' + p.idx))) {
      p.radaway--
      p.radiation = Math.max(0, p.radiation - 30)
    }
    if (input.useRadaway) justPressed.add('radaway_' + p.idx)

    // Weapon switch (edge-triggered)
    if (input.weaponNext && !st.prevKeys.has('wpnN_' + p.idx)) {
      p.weaponIdx = (p.weaponIdx + 1) % WEAPONS.length
    }
    if (input.weaponNext) justPressed.add('wpnN_' + p.idx)
    if (input.weaponPrev && !st.prevKeys.has('wpnP_' + p.idx)) {
      p.weaponIdx = (p.weaponIdx - 1 + WEAPONS.length) % WEAPONS.length
    }
    if (input.weaponPrev) justPressed.add('wpnP_' + p.idx)

    // Radiation damage
    for (const rz of st.radZones) {
      if (dist2(p, { x: rz.x, y: rz.y }) < rz.r) {
        p.radiation += rz.intensity * dtSec * 0.1
        p.hp -= rz.intensity * dtSec
      }
    }

    // Campfire healing
    for (const cf of st.campfires) {
      if (dist2(p, { x: cf.x, y: cf.y }) < 2.5) {
        p.hp = Math.min(p.maxHp, p.hp + cf.healPerSec * dtSec)
      }
    }

    // Death check
    if (p.hp <= 0) { p.hp = 0; p.alive = false }

    // Update 3D mesh position
    if (meshes) {
      const pm = meshes.playerMeshes.get(p.idx)
      if (pm) {
        pm.position.set(p.x, 0, p.y)
        pm.rotation.y = -p.angle + Math.PI / 2
        pm.visible = p.alive
      }
    }
  }

  // ─── Update bullets ────────────────────────────────────
  for (let i = st.bullets.length - 1; i >= 0; i--) {
    const b = st.bullets[i]
    const dtSec = adt / 1000
    b.x += b.dx * dtSec
    b.y += b.dy * dtSec
    b.life -= adt

    if (b.x < 0 || b.x > st.mapW || b.y < 0 || b.y > st.mapH || b.life <= 0) {
      st.bullets.splice(i, 1); continue
    }

    // Hit building
    let hit = false
    for (const bl of st.buildings) {
      if (rectContains(bl.x - bl.w / 2, bl.y - bl.h / 2, bl.w, bl.h, b.x, b.y)) {
        hit = true; break
      }
    }
    if (hit) { st.bullets.splice(i, 1); continue }

    // Hit enemy
    for (const e of st.enemies) {
      if (e.dead) continue
      const er = e.kind === 'deathclaw' ? 0.6 : e.kind === 'radscorpion' ? 0.5 : 0.35
      if (dist2(b, e) < er + BULLET_R) {
        e.hp -= b.damage
        hit = true
        if (e.hp <= 0) {
          e.dead = true
          const killer = st.players.find(p2 => p2.idx === b.owner)
          if (killer) {
            killer.kills++
            killer.coins += e.kind === 'deathclaw' ? 30 : e.kind === 'radscorpion' ? 15 : 5
            if (e.kind === 'deathclaw') killer.gems += 5
          }
          st.killFeed.push({
            text: `${killer?.name || '?'} killed ${e.kind}`,
            time: st.time,
            color: killer?.color || '#fff',
          })
          // Remove mesh from scene and clean up
          if (meshes) {
            const em = meshes.enemyMeshes.get(e.id)
            if (em) {
              meshes.scene.remove(em)
              em.traverse(obj => {
                if (obj instanceof THREE.Mesh) {
                  obj.geometry.dispose()
                  if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
                  else obj.material.dispose()
                }
              })
              meshes.enemyMeshes.delete(e.id)
            }
          }
        }
        break
      }
    }
    if (hit) { st.bullets.splice(i, 1); continue }

    // Hit player (VS mode)
    if (st.mode === 'vs-wasteland') {
      for (const p of st.players) {
        if (!p.alive || p.idx === b.owner) continue
        if (dist2(b, p) < PLAYER_R + BULLET_R) {
          let dmg = b.damage
          if (p.armor > 0) {
            const absorbed = Math.min(p.armor, dmg * 0.4)
            p.armor -= absorbed
            dmg *= 0.6
          }
          p.hp -= dmg
          hit = true
          if (p.hp <= 0) {
            p.hp = 0; p.alive = false
            const killer = st.players.find(p2 => p2.idx === b.owner)
            if (killer) killer.kills++
            st.killFeed.push({
              text: `${killer?.name || '?'} killed ${p.name}`,
              time: st.time,
              color: killer?.color || '#fff',
            })
          }
          break
        }
      }
      if (hit) { st.bullets.splice(i, 1) }
    }
  }

  // ─── Update enemies ────────────────────────────────────
  for (const e of st.enemies) {
    if (e.dead) continue
    const dtSec = adt / 1000
    e.timer += adt
    e.attackCd = Math.max(0, e.attackCd - adt)

    // Find nearest alive player
    let nearest: Player | null = null
    let nd = Infinity
    for (const p of st.players) {
      if (!p.alive) continue
      const d = dist2(p, e)
      if (d < nd) { nd = d; nearest = p }
    }

    if (nearest && nd < e.alertRange) {
      // Chase
      const dx = nearest.x - e.x
      const dy = nearest.y - e.y
      const l = Math.hypot(dx, dy)
      if (l > 0.5) {
        const moveX = (dx / l) * e.speed * dtSec
        const moveY = (dy / l) * e.speed * dtSec
        const newPos = slideMove(e.x, e.y, moveX, moveY, 0.3, obstacles, st.mapW, st.mapH)
        e.x = newPos.x
        e.y = newPos.y
      }
      // Melee attack
      if (nd < 1.2 && e.attackCd <= 0) {
        const stats = ENEMY_STATS[e.kind]
        e.attackCd = stats?.attackCd || 1000
        let dmg = e.damage
        if (nearest.armor > 0) {
          const absorbed = Math.min(nearest.armor, dmg * 0.3)
          nearest.armor -= absorbed
          dmg *= 0.7
        }
        nearest.hp -= dmg
        if (nearest.hp <= 0) { nearest.hp = 0; nearest.alive = false }
      }
    } else {
      // Wander (with collision detection)
      if (e.timer > 2000 + Math.random() * 1000) {
        e.dir = { x: rng(-1, 1), y: rng(-1, 1) }
        e.timer = 0
      }
      const norm = normalize(e.dir)
      const wanderSpeed = e.speed * 0.3 * dtSec
      const newPos = slideMove(e.x, e.y, norm.x * wanderSpeed, norm.y * wanderSpeed, 0.3, obstacles, st.mapW, st.mapH)
      e.x = newPos.x
      e.y = newPos.y
    }

    // Update 3D position
    if (meshes) {
      const em = meshes.enemyMeshes.get(e.id)
      if (em) {
        em.position.set(e.x, 0, e.y)
        if (nearest && nd < e.alertRange) {
          em.rotation.y = -Math.atan2(nearest.y - e.y, nearest.x - e.x) + Math.PI / 2
        }
      }
    }
  }

  // ─── Area cleared check ────────────────────────────────
  for (const area of st.areas) {
    if (area.cleared) continue
    const areaEnemies = st.enemies.filter(e =>
      !e.dead && rectContains(area.x, area.y, area.w, area.h, e.x, e.y)
    )
    if (areaEnemies.length === 0) {
      area.cleared = true
      for (const p of st.players) {
        if (p.alive && rectContains(area.x, area.y, area.w, area.h, p.x, p.y)) {
          p.gems += 3
          p.areasCleared++
        }
      }
      st.killFeed.push({
        text: `${area.name} CLEARED!`,
        time: st.time,
        color: '#0f0',
      })
    }
  }

  // ─── Survival mode — wave spawning ─────────────────────
  if (st.mode === 'coop-survival') {
    const aliveEnemies = st.enemies.filter(e => !e.dead).length
    if (aliveEnemies === 0) {
      st.wave++
      const kinds: Array<{ kind: EnemyKind; count: number }> = [
        { kind: 'raider', count: 3 + st.wave * 2 },
        { kind: 'mutant', count: 2 + st.wave },
        { kind: 'feral_dog', count: 1 + st.wave },
      ]
      if (st.wave >= 3) kinds.push({ kind: 'radscorpion', count: Math.floor(st.wave / 3) })
      if (st.wave >= 5) kinds.push({ kind: 'deathclaw', count: 1 })

      for (const { kind, count } of kinds) {
        const stats = ENEMY_STATS[kind]
        if (!stats) continue
        for (let i = 0; i < count; i++) {
          // Spawn at map edges
          const side = rngI(0, 4)
          let sx = 0, sy = 0
          switch (side) {
            case 0: sx = rng(0, st.mapW); sy = 1; break
            case 1: sx = rng(0, st.mapW); sy = st.mapH - 1; break
            case 2: sx = 1; sy = rng(0, st.mapH); break
            case 3: sx = st.mapW - 1; sy = rng(0, st.mapH); break
          }
          const enemy: Enemy = {
            id: st.enemyNextId++,
            x: sx, y: sy,
            hp: stats.hp, maxHp: stats.hp,
            kind: kind,
            area: -1,
            dir: { x: rng(-1, 1), y: rng(-1, 1) },
            timer: 0,
            attackCd: stats.attackCd,
            alertRange: stats.alertRange + st.wave * 2,
            speed: stats.speed,
            damage: stats.damage,
            dead: false,
          }
          st.enemies.push(enemy)

          // Add 3D mesh
          if (meshes) {
            const color = ENEMY_COLORS[kind] || 0xff0000
            const mesh = createEnemyMesh(kind, color)
            mesh.position.set(sx, 0, sy)
            meshes.scene.add(mesh)
            meshes.enemyMeshes.set(enemy.id, mesh)
          }
        }
      }

      st.killFeed.push({
        text: `Wave ${st.wave}!`,
        time: st.time,
        color: '#ff0',
      })
    }
  }

  // ─── Win condition ─────────────────────────────────────
  const alive = st.players.filter(p => p.alive)

  if (st.mode === 'vs-wasteland') {
    if (alive.length <= 1 && st.players.length > 1) {
      st.gameOver = true
      st.winner = alive[0]?.idx ?? null
      if (alive[0]) alive[0].stars += 5
    }
  } else if (st.mode === 'explore') {
    const totalCleared = st.areas.filter(a => a.cleared).length
    if (totalCleared >= AREAS_TO_WIN) {
      st.gameOver = true
      st.winner = -1
      for (const p of st.players) if (p.alive) p.stars += 3
    }
    if (alive.length === 0) { st.gameOver = true; st.winner = null }
  } else {
    // Coop survival — no natural win, just survive
    if (alive.length === 0) { st.gameOver = true; st.winner = null }
  }

  // ─── Update edge-detection state ────────────────────────
  st.prevKeys = justPressed

  // ─── Trim old kill feed ────────────────────────────────
  if (st.killFeed.length > 0) {
    const filtered = st.killFeed.filter(kf => st.time - kf.time < 6000)
    if (filtered.length !== st.killFeed.length) st.killFeed = filtered
  }
}

// ─── Bot AI ──────────────────────────────────────────────
function botAI(p: Player, st: GameState): PlayerInput {
  const input: PlayerInput = {
    mx: 0, my: 0,
    shoot: false, interact: false, ability: false, sprint: false,
    weaponNext: false, weaponPrev: false, useStimpak: false, useRadaway: false,
  }

  // Use stimpak when low HP
  if (p.hp < 30 && p.stimpaks > 0) {
    input.useStimpak = true
    return input
  }

  // Find nearest enemy
  let nearestEnemy: Enemy | null = null
  let ned = Infinity
  for (const e of st.enemies) {
    if (e.dead) continue
    const d = dist2(p, e)
    if (d < ned) { ned = d; nearestEnemy = e }
  }

  // Find nearest unopened loot
  let nearestLoot = null
  let nld = Infinity
  for (const lb of st.loot) {
    if (lb.open) continue
    const d = dist2(p, { x: lb.x, y: lb.y })
    if (d < nld) { nld = d; nearestLoot = lb }
  }

  if (nearestEnemy && ned < 15) {
    // Combat mode
    const dx = nearestEnemy.x - p.x
    const dy = nearestEnemy.y - p.y
    p.angle = Math.atan2(dy, dx)

    if (ned > 3) {
      // Approach
      const norm = normalize({ x: dx, y: dy })
      input.mx = norm.x
      input.my = norm.y
    } else if (ned < 1.5) {
      // Retreat
      const norm = normalize({ x: -dx, y: -dy })
      input.mx = norm.x
      input.my = norm.y
    }

    if (p.ammo > 0 && ned < 12) {
      input.shoot = true
    }

    // Use VATS when fighting tough enemies
    if (nearestEnemy.kind === 'deathclaw' && p.vatsCd <= 0) {
      input.ability = true
    }
  } else if (nearestLoot && nld < 20) {
    // Go to loot
    const dx = nearestLoot.x - p.x
    const dy = nearestLoot.y - p.y
    const norm = normalize({ x: dx, y: dy })
    input.mx = norm.x
    input.my = norm.y
    if (nld < INTERACT_RANGE) input.interact = true
    if (nld > 10) input.sprint = true
  } else {
    // Wander toward nearest uncleared area
    const unclearedArea = st.areas.find(a => !a.cleared)
    if (unclearedArea) {
      const cx = unclearedArea.x + unclearedArea.w / 2
      const cy = unclearedArea.y + unclearedArea.h / 2
      const dx = cx - p.x
      const dy = cy - p.y
      const norm = normalize({ x: dx, y: dy })
      input.mx = norm.x
      input.my = norm.y
      input.sprint = true
    }
  }

  return input
}
