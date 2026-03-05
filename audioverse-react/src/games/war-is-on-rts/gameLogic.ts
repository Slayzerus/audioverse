/**
 * gameLogic.ts — Game tick logic for War Is On RTS.
 * Handles unit AI, building production, resource gathering,
 * combat, projectiles, enemy waves, camera following, and win conditions.
 */
import type {
  GameState, UnitKind, EnemyKind, Building,
} from './types'
import {
  dist, clamp, moveToward, CMD_R, CMD_SPEED,
  BUILDING_DEFS, UNIT_DEFS, ENEMY_DEFS, BUILDABLE_BUILDINGS, BUILDABLE_UNITS,
  BUILDING_SIZE, BUILD_TIME_TICKS, KB_MAP, getPopCap, getPopUsed,
} from './types'
import type { PlayerSlot } from '../../pages/games/mini/types'

// ─── Input state ─────────────────────────────────────────────
export interface InputState {
  keys: Set<string>
  pads: Array<{
    index: number; up: boolean; down: boolean; left: boolean; right: boolean
    a: boolean; b: boolean; x: boolean; y: boolean
  }>
}

// ─── Cooldown tracking ──────────────────────────────────────
const cooldowns: Record<string, number> = {}
function cd(key: string, ms: number): boolean {
  const now = performance.now()
  if (cooldowns[key] && now - cooldowns[key] < ms) return false
  cooldowns[key] = now
  return true
}

/** Spawn a floating text number/message */
function addFloat(st: GameState, x: number, y: number, text: string, color: string) {
  st.floatingTexts.push({ x, y, text, color, tick: 0, maxTick: 40 })
}

// ─── Build a building ────────────────────────────────────────
function handleBuild(st: GameState, ownerIdx: number) {
  const ps = st.players[ownerIdx]
  if (!ps || !ps.alive) return
  const cmd = st.commanders[ownerIdx]
  if (!cmd) return

  const bIdx = ps.selectedBuild % BUILDABLE_BUILDINGS.length
  const bKind = BUILDABLE_BUILDINGS[bIdx]
  const def = BUILDING_DEFS[bKind]

  // Check cost
  if (ps[def.costType] < def.cost) {
    addFloat(st, cmd.x, cmd.y - 30, `Need ${def.cost} ${def.costType}`, '#e74c3c')
    return
  }

  // Don't build too close to existing buildings
  const MIN_DIST = BUILDING_SIZE * 2.2
  if (st.buildings.some(b => dist(b, cmd) < MIN_DIST)) {
    addFloat(st, cmd.x, cmd.y - 30, 'Too close!', '#f39c12')
    return
  }

  // Don't build in water
  if (isInWater(st, cmd.x, cmd.y)) {
    addFloat(st, cmd.x, cmd.y - 30, 'Can\'t build in water!', '#3498db')
    return
  }

  ps[def.costType] -= def.cost

  st.buildings.push({
    id: st.nextId++,
    x: cmd.x, y: cmd.y,
    hp: 1, maxHp: def.hp,
    kind: bKind, owner: ownerIdx,
    buildProgress: 0,
    trainQueue: [], trainProgress: 0,
  })

  addFloat(st, cmd.x, cmd.y - 30, `Building ${def.label}`, '#2ecc71')
}

// ─── Train a unit ────────────────────────────────────────────
function handleTrain(st: GameState, ownerIdx: number) {
  const ps = st.players[ownerIdx]
  if (!ps || !ps.alive) return
  const cmd = st.commanders[ownerIdx]
  if (!cmd) return

  // Population cap check
  const cap = getPopCap(st, ownerIdx)
  const used = getPopUsed(st, ownerIdx)
  // Also count units currently queued for training
  const queued = st.buildings
    .filter(b => b.owner === ownerIdx && b.hp > 0)
    .reduce((sum, b) => sum + b.trainQueue.length, 0)
  if (used + queued >= cap) {
    addFloat(st, cmd.x, cmd.y - 30, 'Pop full!', '#e74c3c')
    return
  }

  const uIdx = ps.selectedUnit % BUILDABLE_UNITS.length
  const uKind = BUILDABLE_UNITS[uIdx]
  const uDef = UNIT_DEFS[uKind]

  // Find nearest building that can train this unit
  const trained = st.buildings.find(b =>
    b.owner === ownerIdx && b.kind === uDef.trainedAt &&
    b.buildProgress >= 1 && b.trainQueue.length < 5 &&
    dist(b, cmd) < 200
  )
  if (!trained) {
    addFloat(st, cmd.x, cmd.y - 30, `Need ${uDef.trainedAt}`, '#f39c12')
    return
  }

  // Check cost
  if (ps[uDef.costType] < uDef.cost) {
    addFloat(st, cmd.x, cmd.y - 30, `Need ${uDef.cost} ${uDef.costType}`, '#e74c3c')
    return
  }
  ps[uDef.costType] -= uDef.cost

  trained.trainQueue.push(uKind)
  addFloat(st, trained.x, trained.y - 30, `+${uDef.label}`, '#3498db')
}

// ─── Rally units to commander ────────────────────────────────
function handleRally(st: GameState, ownerIdx: number) {
  const cmd = st.commanders[ownerIdx]
  if (!cmd) return
  for (const u of st.units) {
    if (u.owner === ownerIdx && u.animState !== 'dead') {
      u.target = { x: cmd.x, y: cmd.y }
      u.gatherTarget = null
      u.carrying = null
      u.carryAmount = 0
    }
  }
}

// ─── Send units to base ─────────────────────────────────────
function handleBurrow(st: GameState, ownerIdx: number) {
  const castle = st.buildings.find(b => b.owner === ownerIdx && b.kind === 'castle' && b.hp > 0)
  if (!castle) return
  for (const u of st.units) {
    if (u.owner === ownerIdx && u.animState !== 'dead') {
      u.target = { x: castle.x, y: castle.y }
      u.gatherTarget = null
    }
  }
}

// ─── Spawn a unit from building ──────────────────────────────
function spawnUnit(st: GameState, building: Building, kind: UnitKind) {
  const def = UNIT_DEFS[kind]
  const angle = Math.random() * Math.PI * 2
  st.units.push({
    id: st.nextId++,
    x: building.x + Math.cos(angle) * 40,
    y: building.y + Math.sin(angle) * 40,
    hp: def.hp, maxHp: def.hp,
    dmg: def.dmg, speed: def.speed, range: def.range, r: def.r,
    kind, owner: building.owner,
    target: null, attackTarget: null,
    facingLeft: false, animState: 'idle', animTick: 0,
    gatherTarget: null, carrying: null, carryAmount: 0,
  })
}

// ─── Spawn enemy (coop mode) ────────────────────────────────
function spawnEnemy(st: GameState, kind: EnemyKind, x: number, y: number) {
  const def = ENEMY_DEFS[kind]
  st.enemyUnits.push({
    id: st.nextId++,
    x, y,
    hp: def.hp, maxHp: def.hp,
    dmg: def.dmg, speed: def.speed, range: def.range, r: def.r,
    kind, target: null, facingLeft: false,
    animState: 'idle', animTick: 0,
  })
}

// ─── Main game tick ──────────────────────────────────────────
export function gameTick(
  st: GameState,
  players: PlayerSlot[],
  input: InputState,
) {
  if (st.gameOver) return
  st.tick++

  const humanCount = players.length

  // ── Process player input ──
  players.forEach((p, i) => {
    const cmd = st.commanders[i]
    if (!cmd || !st.players[i]?.alive) return

    let dx = 0, dy = 0
    let buildPressed = false, rallyPressed = false
    let burrowPressed = false, cyclePressed = false, trainPressed = false

    if (p.input.type === 'keyboard') {
      for (const [key, mapping] of Object.entries(KB_MAP)) {
        if (mapping.group !== (p.input as { type: 'keyboard'; group: number }).group) continue
        if (!input.keys.has(key)) continue
        switch (mapping.action) {
          case 'up': dy -= 1; break
          case 'down': dy += 1; break
          case 'left': dx -= 1; break
          case 'right': dx += 1; break
          case 'build': buildPressed = true; break
          case 'rally': rallyPressed = true; break
          case 'burrow': burrowPressed = true; break
          case 'cycle': cyclePressed = true; break
          case 'train': trainPressed = true; break
        }
      }
    } else if (p.input.type === 'gamepad') {
      const gp = input.pads.find(g => g.index === (p.input as { type: 'gamepad'; padIndex: number }).padIndex)
      if (gp) {
        if (gp.up) dy -= 1
        if (gp.down) dy += 1
        if (gp.left) dx -= 1
        if (gp.right) dx += 1
        if (gp.a) buildPressed = true
        if (gp.x) rallyPressed = true
        if (gp.y) burrowPressed = true
        if (gp.b) cyclePressed = true
      }
    }

    // Move commander
    const mag = Math.hypot(dx, dy)
    if (mag > 0) {
      cmd.x = clamp(cmd.x + (dx / mag) * CMD_SPEED, CMD_R, st.mapW - CMD_R)
      cmd.y = clamp(cmd.y + (dy / mag) * CMD_SPEED, CMD_R, st.mapH - CMD_R)
      pushOutOfWater(st, cmd)
      cmd.facingLeft = dx < 0
    }
    cmd.animTick++

    // Actions with cooldowns
    if (buildPressed && cd(`build_${i}`, 400)) handleBuild(st, i)
    if (trainPressed && cd(`train_${i}`, 400)) handleTrain(st, i)
    if (rallyPressed && cd(`rally_${i}`, 300)) handleRally(st, i)
    if (burrowPressed && cd(`burrow_${i}`, 300)) handleBurrow(st, i)
    if (cyclePressed && cd(`cycle_${i}`, 300)) {
      st.players[i].selectedBuild = (st.players[i].selectedBuild + 1) % BUILDABLE_BUILDINGS.length
      st.players[i].selectedUnit = (st.players[i].selectedUnit + 1) % BUILDABLE_UNITS.length
    }
  })

  // ── AI commanders (improved) ──
  for (let ai = humanCount; ai < st.players.length; ai++) {
    if (!st.players[ai]?.alive) continue
    const cmd = st.commanders[ai]
    if (!cmd) continue
    const aiPs = st.players[ai]

    // Priority 1: Build houses early for pop cap
    const myBuildings = st.buildings.filter(b => b.owner === ai && b.hp > 0)
    const hasCastle = myBuildings.some(b => b.kind === 'castle')
    const hasBarracks = myBuildings.some(b => b.kind === 'barracks' && b.buildProgress >= 1)
    const hasArchery = myBuildings.some(b => b.kind === 'archery' && b.buildProgress >= 1)
    const hasHouse = myBuildings.some(b => b.kind === 'house' && b.buildProgress >= 1)
    const hasTower = myBuildings.some(b => b.kind === 'tower' && b.buildProgress >= 1)
    const houseCount = myBuildings.filter(b => b.kind === 'house').length
    const popCap = getPopCap(st, ai)
    const popUsed = getPopUsed(st, ai)

    // Strategic movement: patrol near base, occasionally scout
    if (st.tick % 45 === 0) {
      const castle = myBuildings.find(b => b.kind === 'castle')
      if (castle) {
        // Stay near base but patrol around it
        const patrolDist = 100 + Math.random() * 200
        const angle = (st.tick / 200 + ai * 1.5) * Math.PI * 2
        const tx = castle.x + Math.cos(angle) * patrolDist
        const ty = castle.y + Math.sin(angle) * patrolDist
        cmd.x = clamp(cmd.x + (tx - cmd.x) * 0.15, CMD_R, st.mapW - CMD_R)
        cmd.y = clamp(cmd.y + (ty - cmd.y) * 0.15, CMD_R, st.mapH - CMD_R)
      }
    }

    // Build priorities
    if (st.tick % 60 === 0 && hasCastle) {
      if (!hasHouse && aiPs.wood >= 8) {
        aiPs.selectedBuild = BUILDABLE_BUILDINGS.indexOf('house')
        handleBuild(st, ai)
      } else if (!hasBarracks && aiPs.gold >= 15) {
        aiPs.selectedBuild = BUILDABLE_BUILDINGS.indexOf('barracks')
        handleBuild(st, ai)
      } else if (!hasArchery && aiPs.wood >= 12 && hasBarracks) {
        aiPs.selectedBuild = BUILDABLE_BUILDINGS.indexOf('archery')
        handleBuild(st, ai)
      } else if (houseCount < 3 && popUsed >= popCap - 2 && aiPs.wood >= 8) {
        aiPs.selectedBuild = BUILDABLE_BUILDINGS.indexOf('house')
        handleBuild(st, ai)
      } else if (!hasTower && aiPs.gold >= 20 && hasBarracks) {
        aiPs.selectedBuild = BUILDABLE_BUILDINGS.indexOf('tower')
        handleBuild(st, ai)
      }
    }

    // Training priorities — mix units based on needs
    if (st.tick % 40 === 0 && popUsed < popCap) {
      const myUnits = st.units.filter(u => u.owner === ai && u.hp > 0)
      const pawns = myUnits.filter(u => u.kind === 'pawn').length
      const warriors = myUnits.filter(u => u.kind === 'warrior').length
      const archers = myUnits.filter(u => u.kind === 'archer').length

      if (pawns < 3 && aiPs.meat >= 2 && hasHouse) {
        aiPs.selectedUnit = BUILDABLE_UNITS.indexOf('pawn')
        handleTrain(st, ai)
      } else if (warriors < 4 && aiPs.gold >= 5 && hasBarracks) {
        aiPs.selectedUnit = BUILDABLE_UNITS.indexOf('warrior')
        handleTrain(st, ai)
      } else if (archers < 3 && aiPs.wood >= 4 && hasArchery) {
        aiPs.selectedUnit = BUILDABLE_UNITS.indexOf('archer')
        handleTrain(st, ai)
      } else if (warriors >= 3 && aiPs.gold >= 7 && hasBarracks) {
        aiPs.selectedUnit = BUILDABLE_UNITS.indexOf('lancer')
        handleTrain(st, ai)
      }
    }

    // Rally attack if we have enough units
    if (st.tick % 300 === 0) {
      const myUnitCount = st.units.filter(u => u.owner === ai && u.hp > 0).length
      if (myUnitCount >= 6) handleRally(st, ai)
    }
  }

  // ── Building construction & training ──
  for (const b of st.buildings) {
    if (b.hp <= 0) continue

    // Construction progress (pawns nearby speed it up)
    if (b.buildProgress < 1) {
      const nearPawns = st.units.filter(u => u.owner === b.owner && u.kind === 'pawn' && dist(u, b) < 60)
      const rate = 1 / BUILD_TIME_TICKS * (1 + nearPawns.length * 0.5)
      b.buildProgress = Math.min(1, b.buildProgress + rate)
      if (b.buildProgress >= 1) {
        b.hp = b.maxHp
        // add build dust effect
        st.effects.push({ x: b.x, y: b.y, kind: 'dust', variant: 0, tick: 0, maxTick: 20 })
      }
      continue
    }

    // Training
    if (b.trainQueue.length > 0) {
      const unitKind = b.trainQueue[0]
      const def = UNIT_DEFS[unitKind]
      b.trainProgress++
      if (b.trainProgress >= def.trainTime) {
        b.trainProgress = 0
        b.trainQueue.shift()
        spawnUnit(st, b, unitKind)
        addFloat(st, b.x, b.y - 30, `${def.label} ready!`, '#2ecc71')
      }
    }

    // Tower auto-attack
    const bDef = BUILDING_DEFS[b.kind]
    if (bDef.attackRange && bDef.attackDmg && bDef.fireRate) {
      if (st.tick % bDef.fireRate === 0) {
        // Find nearest hostile
        let nearestDist = bDef.attackRange
        let target: { x: number; y: number } | null = null

        // Enemy mobs first
        for (const eu of st.enemyUnits) {
          if (eu.hp <= 0) continue
          const d = dist(b, eu)
          if (d < nearestDist) { nearestDist = d; target = eu }
        }
        // Enemy player units
        for (const u of st.units) {
          if (u.owner === b.owner || u.hp <= 0) continue
          if (st.coop && u.owner < humanCount && b.owner < humanCount) continue
          const d = dist(b, u)
          if (d < nearestDist) { nearestDist = d; target = u }
        }

        if (target) {
          const d = dist(b, target)
          if (d > 0) {
            st.projectiles.push({
              x: b.x, y: b.y - BUILDING_SIZE / 2,
              dx: (target.x - b.x) / d,
              dy: (target.y - b.y) / d,
              speed: 6, dmg: bDef.attackDmg, owner: b.owner, life: 50,
            })
          }
        }
      }
    }
  }

  // ── Unit logic ──
  for (const u of st.units) {
    if (u.hp <= 0) { u.animState = 'dead'; continue }
    u.animTick++

    // Pawn resource gathering
    if (u.kind === 'pawn' && u.gatherTarget != null) {
      const node = st.resourceNodes.find(r => r.id === u.gatherTarget)
      if (node && node.amount > 0) {
        const d = dist(u, node)
        if (d < 30) {
          u.animState = 'gather'
          // Gather resources
          const gatherRate = 0.25
          node.amount -= gatherRate
          u.carrying = node.kind
          u.carryAmount += gatherRate
          if (u.carryAmount >= 6 || node.amount <= 0) {
            // Return to nearest castle
            const castle = st.buildings.find(b => b.owner === u.owner && b.kind === 'castle' && b.hp > 0)
            if (castle) {
              u.target = { x: castle.x, y: castle.y }
              u.gatherTarget = null
            }
          }
        } else {
          u.animState = 'run'
          const arrived = moveToward(u, node.x, node.y, u.speed)
          u.facingLeft = node.x < u.x
          if (arrived) u.animState = 'gather'
        }
        continue
      } else {
        u.gatherTarget = null
      }
    }

    // Deliver carried resources
    if (u.carrying && u.carryAmount > 0) {
      const castle = st.buildings.find(b => b.owner === u.owner && b.kind === 'castle' && b.hp > 0)
      if (castle && dist(u, castle) < 50) {
        const ps = st.players[u.owner]
        if (ps) ps[u.carrying] += Math.floor(u.carryAmount)
        u.carryAmount = 0
        u.carrying = null
        // Go back to same type of resource
        const nearRes = st.resourceNodes
          .filter(r => r.amount > 0)
          .sort((a, b) => dist(a, u) - dist(b, u))[0]
        if (nearRes) u.gatherTarget = nearRes.id
      } else if (castle) {
        u.animState = 'run'
        moveToward(u, castle.x, castle.y, u.speed)
        u.facingLeft = castle.x < u.x
        continue
      }
    }

    // Auto-assign idle pawns to gather
    if (u.kind === 'pawn' && !u.target && !u.gatherTarget && !u.attackTarget && u.animState === 'idle') {
      const nearRes = st.resourceNodes
        .filter(r => r.amount > 0)
        .sort((a, b) => dist(a, u) - dist(b, u))[0]
      if (nearRes && dist(u, nearRes) < 400) {
        u.gatherTarget = nearRes.id
      }
    }

    // Find nearest enemy (player units vs enemy units vs enemy buildings)
    let nearestEnemyDist = u.range * 3
    let nearestEnemy: { x: number; y: number; hp: number; id?: number; isEnemy?: boolean } | null = null

    // Check enemy player units
    for (const eu of st.units) {
      if (eu.owner === u.owner || eu.hp <= 0) continue
      if (st.coop && eu.owner < humanCount && u.owner < humanCount) continue
      const d = dist(u, eu)
      if (d < nearestEnemyDist) { nearestEnemyDist = d; nearestEnemy = eu }
    }
    // Check enemy mobs
    for (const eu of st.enemyUnits) {
      if (eu.hp <= 0) continue
      const d = dist(u, eu)
      if (d < nearestEnemyDist) { nearestEnemyDist = d; nearestEnemy = { ...eu, isEnemy: true } }
    }
    // Check enemy buildings
    for (const eb of st.buildings) {
      if (eb.owner === u.owner || eb.hp <= 0) continue
      if (st.coop && eb.owner < humanCount && u.owner < humanCount) continue
      const d = dist(u, eb)
      if (d < nearestEnemyDist) { nearestEnemyDist = d; nearestEnemy = eb }
    }

    // Monk heals nearby allies instead of attacking
    if (u.kind === 'monk') {
      const hurtAlly = st.units.find(a =>
        a.owner === u.owner && a.hp > 0 && a.hp < a.maxHp && a.id !== u.id && dist(a, u) < u.range
      )
      if (hurtAlly) {
        u.animState = 'attack' // heal animation
        hurtAlly.hp = Math.min(hurtAlly.maxHp, hurtAlly.hp + 0.1)
        if (st.tick % 20 === 0) addFloat(st, hurtAlly.x, hurtAlly.y - 20, '+heal', '#2ecc71')
        continue
      }
    }

    if (nearestEnemy && nearestEnemyDist < u.range) {
      u.animState = 'attack'
      u.facingLeft = nearestEnemy.x < u.x

      // Archer shoots projectile
      if (u.kind === 'archer' && st.tick % 20 === 0) {
        const d = dist(u, nearestEnemy)
        if (d > 0) {
          st.projectiles.push({
            x: u.x, y: u.y,
            dx: (nearestEnemy.x - u.x) / d,
            dy: (nearestEnemy.y - u.y) / d,
            speed: 5, dmg: u.dmg, owner: u.owner, life: 60,
          })
        }
      } else if (u.kind !== 'archer') {
        // Melee attack
        const dmgDealt = u.dmg * 0.033
        nearestEnemy.hp -= dmgDealt
        // Occasional damage float
        if (st.tick % 15 === 0) {
          addFloat(st, nearestEnemy.x, nearestEnemy.y - 20, `-${u.dmg}`, '#e74c3c')
        }
      }
    } else if (u.target) {
      u.animState = 'run'
      u.facingLeft = u.target.x < u.x
      const arrived = moveToward(u, u.target.x, u.target.y, u.speed)
      if (arrived) { u.target = null; u.animState = 'idle' }
    } else {
      // Follow commander
      const cmd = st.commanders[u.owner]
      if (cmd) {
        const d = dist(u, cmd)
        if (d > 60) {
          u.animState = 'run'
          u.facingLeft = cmd.x < u.x
          moveToward(u, cmd.x + (Math.random() - 0.5) * 30, cmd.y + (Math.random() - 0.5) * 30, u.speed * 0.8)
        } else {
          u.animState = 'idle'
        }
      } else {
        u.animState = 'idle'
      }
    }
  }

  // ── Enemy unit AI ──
  for (const eu of st.enemyUnits) {
    if (eu.hp <= 0) { eu.animState = 'dead'; continue }
    eu.animTick++

    // Find nearest player unit/building to attack
    let nearestDist = 200
    let nearestTarget: { x: number; y: number; hp: number } | null = null

    for (const u of st.units) {
      if (u.hp <= 0) continue
      const d = dist(eu, u)
      if (d < nearestDist) { nearestDist = d; nearestTarget = u }
    }
    for (const b of st.buildings) {
      if (b.hp <= 0) continue
      const d = dist(eu, b)
      if (d < nearestDist) { nearestDist = d; nearestTarget = b }
    }

    if (nearestTarget && nearestDist < eu.range) {
      eu.animState = 'attack'
      eu.facingLeft = nearestTarget.x < eu.x
      nearestTarget.hp -= eu.dmg * 0.033
    } else if (nearestTarget) {
      eu.animState = 'run'
      eu.facingLeft = nearestTarget.x < eu.x
      moveToward(eu, nearestTarget.x, nearestTarget.y, eu.speed)
    } else {
      // Wander toward center
      eu.animState = 'run'
      moveToward(eu, st.mapW / 2, st.mapH / 2, eu.speed * 0.3)
    }
  }

  // ── Projectiles ──
  st.projectiles = st.projectiles.filter(p => {
    p.x += p.dx * p.speed
    p.y += p.dy * p.speed
    p.life--
    if (p.life <= 0) return false

    // Hit detection against enemy units / enemy mob units / buildings
    for (const u of st.units) {
      if (u.owner === p.owner || u.hp <= 0) continue
      if (dist(p, u) < u.r + 5) {
        u.hp -= p.dmg
        if (u.hp <= 0) st.effects.push({ x: u.x, y: u.y, kind: 'dust', variant: 1, tick: 0, maxTick: 15 })
        return false
      }
    }
    for (const eu of st.enemyUnits) {
      if (eu.hp <= 0) continue
      if (dist(p, eu) < eu.r + 5) {
        eu.hp -= p.dmg
        if (eu.hp <= 0) st.effects.push({ x: eu.x, y: eu.y, kind: 'explosion', variant: 0, tick: 0, maxTick: 20 })
        return false
      }
    }
    return true
  })

  // ── Effects ──
  st.effects = st.effects.filter(e => {
    e.tick++
    return e.tick < e.maxTick
  })

  // ── Remove dead ──
  st.units = st.units.filter(u => {
    if (u.hp <= 0) {
      addFloat(st, u.x, u.y - 10, '☠', '#888')
      return false
    }
    return true
  })
  st.enemyUnits = st.enemyUnits.filter(e => {
    if (e.hp <= 0) {
      addFloat(st, e.x, e.y - 10, '☠', '#e74c3c')
      // Reward: killing enemies gives resources to nearest player
      let nearestPlayer = 0
      let nearDist = Infinity
      for (let i = 0; i < st.commanders.length; i++) {
        const d = dist(st.commanders[i], e)
        if (d < nearDist) { nearDist = d; nearestPlayer = i }
      }
      if (st.players[nearestPlayer]) {
        st.players[nearestPlayer].gold += 2
        addFloat(st, e.x, e.y - 25, '+2g', '#f1c40f')
      }
      return false
    }
    return true
  })
  st.buildings = st.buildings.filter(b => {
    if (b.hp <= 0) {
      st.effects.push({ x: b.x, y: b.y, kind: 'explosion', variant: 0, tick: 0, maxTick: 25 })
      addFloat(st, b.x, b.y - 20, 'Destroyed!', '#e74c3c')
      return false
    }
    return true
  })
  st.resourceNodes = st.resourceNodes.filter(r => r.amount > 0)

  // ── Unit separation (anti-blob) ──
  const SEP_DIST = 14
  for (let i = 0; i < st.units.length; i++) {
    const a = st.units[i]
    for (let j = i + 1; j < st.units.length; j++) {
      const b = st.units[j]
      const d = dist(a, b)
      if (d < SEP_DIST && d > 0.1) {
        const push = (SEP_DIST - d) * 0.3
        const dx = (a.x - b.x) / d
        const dy = (a.y - b.y) / d
        a.x += dx * push
        a.y += dy * push
        b.x -= dx * push
        b.y -= dy * push
      }
    }
  }

  // ── Floating text tick ──
  st.floatingTexts = st.floatingTexts.filter(ft => {
    ft.tick++
    ft.y -= 0.6 // float upward
    return ft.tick < ft.maxTick
  })

  // ── Coop wave spawner ──
  if (st.coop) {
    st.waveTimer++
    if (st.waveTimer >= 300 + st.waveNumber * 60) { // every ~10-12s
      st.waveTimer = 0
      st.waveNumber++
      const enemyTypes: EnemyKind[] = ['gnoll', 'gnome', 'spider', 'snake', 'lizard', 'skull',
        'bear', 'panda', 'thief', 'minotaur', 'troll', 'turtle', 'shaman',
        'harpoonFish', 'paddleFish']
      const count = 2 + st.waveNumber
      const edge = Math.floor(Math.random() * 4)
      for (let i = 0; i < count; i++) {
        const kind = enemyTypes[Math.floor(Math.random() * Math.min(enemyTypes.length, 3 + st.waveNumber))]
        let ex = 0, ey = 0
        if (edge === 0) { ex = Math.random() * st.mapW; ey = 10 }
        else if (edge === 1) { ex = Math.random() * st.mapW; ey = st.mapH - 10 }
        else if (edge === 2) { ex = 10; ey = Math.random() * st.mapH }
        else { ex = st.mapW - 10; ey = Math.random() * st.mapH }
        spawnEnemy(st, kind, ex, ey)
      }
    }
  }

  // ── Win condition ──
  // Check castle destruction
  for (let i = 0; i < st.players.length; i++) {
    const castle = st.buildings.find(b => b.owner === i && b.kind === 'castle')
    if (!castle && st.players[i].alive) {
      st.players[i].alive = false
    }
  }

  if (st.coop) {
    const humansAlive = st.players.filter(ps => ps.alive)
    if (humansAlive.length === 0) {
      st.gameOver = true
    }
    // Coop never truly "wins" — it's survival. But if all waves cleared + no enemies...
    if (st.waveNumber >= 15 && st.enemyUnits.length === 0) {
      st.gameOver = true
      st.winnerIdx = 0
      st.players.forEach(p => { if (p.alive) p.stars++ })
    }
  } else {
    const alive = st.players.filter(p => p.alive)
    if (alive.length <= 1 && st.players.length > 1) {
      st.gameOver = true
      const winner = alive[0]
      if (winner) {
        winner.stars++
        st.winnerIdx = st.players.indexOf(winner)
      }
    }
  }

  // ── Camera: smoothly follow each player's commander ──
  for (let i = 0; i < st.cameras.length; i++) {
    const cam = st.cameras[i]
    const cmd = st.commanders[i]
    if (!cam || !cmd) continue

    // Target: center camera on commander
    const targetX = cmd.x - cam.vw / 2
    const targetY = cmd.y - cam.vh / 2

    // Smooth lerp
    cam.x += (targetX - cam.x) * 0.12
    cam.y += (targetY - cam.y) * 0.12

    // Clamp to world bounds
    cam.x = clamp(cam.x, 0, Math.max(0, st.mapW - cam.vw))
    cam.y = clamp(cam.y, 0, Math.max(0, st.mapH - cam.vh))
  }
}

// ─── Helper: check if point is in water ──────────────────────
function isInWater(st: GameState, x: number, y: number): boolean {
  return st.waterAreas.some(wa =>
    x > wa.x && x < wa.x + wa.w && y > wa.y && y < wa.y + wa.h
  )
}

// ─── Helper: push entity out of water areas ──────────────────
function pushOutOfWater(st: GameState, obj: { x: number; y: number }) {
  for (const wa of st.waterAreas) {
    if (obj.x > wa.x && obj.x < wa.x + wa.w && obj.y > wa.y && obj.y < wa.y + wa.h) {
      // Push to nearest edge
      const dLeft = obj.x - wa.x
      const dRight = wa.x + wa.w - obj.x
      const dTop = obj.y - wa.y
      const dBottom = wa.y + wa.h - obj.y
      const minD = Math.min(dLeft, dRight, dTop, dBottom)
      if (minD === dLeft) obj.x = wa.x - 2
      else if (minD === dRight) obj.x = wa.x + wa.w + 2
      else if (minD === dTop) obj.y = wa.y - 2
      else obj.y = wa.y + wa.h + 2
    }
  }
}
