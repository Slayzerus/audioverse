/**
 * Empire RTS — Core game logic (init + tick)
 * Side-scrolling Kingdom-style RTS with full economy, combat, waves.
 */
import type {
  GameState, Hero, Unit, Enemy, Building, ResourceNode,
  TeamState,
  UnitClass, EnemyClass, Direction, BuildingType, GameMode,
} from './types'
import type { PlayerSlot } from '../../pages/games/mini/types'
import { isBot } from '../../pages/games/mini/botAI'
import {
  WORLD_W, GROUND_Y,
  HERO_SPEED, HERO_HP, HERO_DMG, HERO_ATTACK_RANGE, HERO_ATTACK_CD,
  HERO_START_GOLD, HERO_POUCH_CAP,
  UNIT_STATS, ENEMY_STATS, BUILDING_DEFS,
  UPGRADE_COST_MULT, UPGRADE_HP_MULT,
  GATHER_RATE, GATHER_CD, CARRY_MAX,
  GOLDMINE_RATE, FARM_RATE, LUMBER_RATE,
  TOWER_RANGE, TOWER_DAMAGE, TOWER_FIRE_CD, ARROW_SPEED,
  PROJ_GRAVITY, PROJ_LIFETIME,
  WAVE_START_DELAY, WAVE_INTERVAL, WAVE_GROWTH, WAVE_ENEMY_POOL,
  TEAM_COLORS, BUILD_MENU,
  DAY_LENGTH, NIGHT_LENGTH,
  HERO_POUCH_UPGRADE,
} from './constants'

// ─── Helpers ──────────────────────────────────────────────
let _nextId = 1
function nid(): number { return _nextId++ }
function dist(a: { x: number }, b: { x: number }): number { return Math.abs(a.x - b.x) }
function clamp(v: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, v)) }
function randInt(lo: number, hi: number): number { return lo + Math.floor(Math.random() * (hi - lo + 1)) }
function pick<T>(arr: T[]): T { return arr[randInt(0, arr.length - 1)] }

// ─── Create hero ──────────────────────────────────────────
function createHero(p: PlayerSlot, team: number, spawnX: number, canAttack: boolean): Hero {
  return {
    playerIndex: p.index,
    name: p.name,
    team,
    x: spawnX,
    y: GROUND_Y,
    dir: 1,
    speed: HERO_SPEED,
    gold: HERO_START_GOLD,
    maxGold: HERO_POUCH_CAP,
    canAttack,
    hp: HERO_HP,
    maxHp: HERO_HP,
    damage: HERO_DMG,
    attackRange: HERO_ATTACK_RANGE,
    attackTimer: 0,
    attackCooldown: HERO_ATTACK_CD,
    interactCooldown: 0,
    selectedBuilding: null,
    animFrame: 0,
    animTimer: 0,
    state: 'idle',
    isBot: isBot(p),
  }
}

// ─── Create unit ──────────────────────────────────────────
function createUnit(cls: UnitClass, team: number, x: number, dir: Direction): Unit {
  const s = UNIT_STATS[cls]
  return {
    id: nid(), class: cls,
    x, y: GROUND_Y, hp: s.hp, maxHp: s.hp,
    team, dir, speed: s.speed, damage: s.damage,
    attackRange: s.range, attackCooldown: s.cooldown,
    attackTimer: 0, target: null,
    state: 'idle',
    gatherTarget: null, carryType: null, carryAmount: 0,
    animFrame: 0, animTimer: 0, retreating: false,
  }
}

// ─── Create enemy ─────────────────────────────────────────
function createEnemy(cls: EnemyClass, x: number, dir: Direction): Enemy {
  const s = ENEMY_STATS[cls]
  return {
    id: nid(), class: cls,
    x, y: GROUND_Y, hp: s.hp, maxHp: s.hp,
    dir, speed: s.speed, damage: s.damage,
    attackRange: s.range, attackCooldown: s.cooldown,
    attackTimer: 0, target: null,
    state: 'walk',
    animFrame: 0, animTimer: 0, loot: s.loot,
  }
}

// ─── Create building ──────────────────────────────────────
function createBuilding(type: BuildingType, team: number, x: number, prebuilt = false): Building {
  const d = BUILDING_DEFS[type]
  return {
    id: nid(), type, x, y: GROUND_Y - d.h,
    w: d.w, h: d.h,
    hp: prebuilt ? d.hp : 1, maxHp: d.hp,
    team, built: prebuilt, buildProgress: prebuilt ? 1 : 0,
    level: 1, cooldown: 0,
    rallyX: x + d.w / 2,
  }
}

// ─── Init state ───────────────────────────────────────────
export function initGameState(
  players: PlayerSlot[],
  mode: GameMode,
  difficulty: number,
  heroCanAttack: boolean,
  teamCount: number,
): GameState {
  _nextId = 1

  // Assign players to teams
  const playersPerTeam = Math.max(1, Math.ceil(players.length / teamCount))
  const teams: TeamState[] = []
  const heroes: Hero[] = []

  for (let t = 0; t < teamCount; t++) {
    teams.push({
      gold: 30, wood: 20, meat: 10,
      maxGold: 100,
      popCurrent: 0, popMax: 5,
      alive: true,
    })
  }

  // Spawn positions: teams spread along the world
  const spacing = WORLD_W / (teamCount + 1)

  for (let i = 0; i < players.length; i++) {
    const team = Math.min(Math.floor(i / playersPerTeam), teamCount - 1)
    const spawnX = spacing * (team + 1)
    heroes.push(createHero(players[i], team, spawnX, heroCanAttack))
  }

  // Castles per team
  const buildings: Building[] = []
  for (let t = 0; t < teamCount; t++) {
    const cx = spacing * (t + 1)
    buildings.push(createBuilding('castle', t, cx - 48, true))
  }

  // Resource nodes scattered
  const resourceNodes: ResourceNode[] = []
  const nodeCount = 20 + teamCount * 5
  for (let i = 0; i < nodeCount; i++) {
    const types: ('gold' | 'wood' | 'meat')[] = ['gold', 'wood', 'meat']
    const rt = types[i % 3]
    const nx = randInt(100, WORLD_W - 100)
    resourceNodes.push({
      id: nid(), type: rt, x: nx, y: GROUND_Y,
      amount: rt === 'gold' ? 100 : rt === 'wood' ? 80 : 60,
      maxAmount: rt === 'gold' ? 100 : rt === 'wood' ? 80 : 60,
    })
  }

  // Tree positions (background decoration)
  const treePositions: number[] = []
  for (let tx = 60; tx < WORLD_W; tx += randInt(40, 120)) {
    treePositions.push(tx)
  }

  // Starting pawns per team
  const units: Unit[] = []
  for (let t = 0; t < teamCount; t++) {
    const cx = spacing * (t + 1)
    for (let p = 0; p < 3; p++) {
      units.push(createUnit('pawn', t, cx + (p - 1) * 30, 1))
      teams[t].popCurrent++
    }
  }

  return {
    mode, frame: 0, tick: 0,
    worldW: WORLD_W, groundY: GROUND_Y,
    treePositions,
    heroes, units, enemies: [], buildings, resourceNodes,
    projectiles: [],
    teams, teamCount,
    waveNumber: 0, waveTimer: WAVE_START_DELAY,
    waveCooldown: WAVE_INTERVAL, waveActive: false, nextWave: null,
    nextId: _nextId,
    gameOver: false, winner: -1,
    day: 1, dayTimer: DAY_LENGTH, isNight: false,
    heroCanAttack: heroCanAttack,
    difficulty,
    playerSlots: players,
    events: [],
  }
}

// ─── Input per hero ───────────────────────────────────────
export interface HeroInput {
  moveX: number       // -1, 0, +1
  interact: boolean   // E / A button — pick up gold, recruit, build
  attack: boolean     // Space / X button
  buildPrev: boolean  // Q / LB
  buildNext: boolean  // Tab / RB
  buildPlace: boolean // F / Y button — place selected building
}

// ─── Game tick ────────────────────────────────────────────
export function gameTick(st: GameState, inputs: HeroInput[]): void {
  if (st.gameOver) return
  st.tick++
  st.frame++
  _nextId = st.nextId

  // ── Day/Night cycle ─────────────────────────────────────
  st.dayTimer--
  if (st.dayTimer <= 0) {
    if (st.isNight) {
      st.isNight = false
      st.dayTimer = DAY_LENGTH
      st.day++
    } else {
      st.isNight = true
      st.dayTimer = NIGHT_LENGTH
    }
  }

  // ── Decay events ────────────────────────────────────────
  st.events = st.events.filter(e => { e.timer--; return e.timer > 0 })

  // ── Heroes ──────────────────────────────────────────────
  for (let i = 0; i < st.heroes.length; i++) {
    const h = st.heroes[i]
    const inp = inputs[i] || { moveX: 0, interact: false, attack: false, buildPrev: false, buildNext: false, buildPlace: false }

    // Movement
    if (inp.moveX !== 0) {
      h.x += inp.moveX * h.speed
      h.dir = inp.moveX as Direction
      h.state = 'walk'
    } else {
      h.state = 'idle'
    }
    h.x = clamp(h.x, 20, st.worldW - 20)

    // Attack
    if (h.attackTimer > 0) h.attackTimer--
    if (inp.attack && h.canAttack && h.attackTimer <= 0) {
      h.state = 'attack'
      h.attackTimer = h.attackCooldown
      // Hit nearest enemy in range
      for (const e of st.enemies) {
        if (e.state === 'dying') continue
        if (dist(h, e) <= h.attackRange) {
          e.hp -= h.damage
          if (e.hp <= 0) {
            e.state = 'dying'
            h.gold = Math.min(h.gold + e.loot, h.maxGold)
            addEvent(st, `${h.name} slew ${e.class}!`, '#ff0')
          }
          break
        }
      }
    }

    // Interact cooldown
    if (h.interactCooldown > 0) h.interactCooldown--

    if (inp.interact && h.interactCooldown <= 0) {
      h.interactCooldown = 10
      heroInteract(st, h)
    }

    // Build menu cycling
    if (inp.buildPrev) {
      const idx = BUILD_MENU.indexOf(h.selectedBuilding!)
      h.selectedBuilding = BUILD_MENU[(idx - 1 + BUILD_MENU.length) % BUILD_MENU.length]
    }
    if (inp.buildNext) {
      const idx = h.selectedBuilding ? BUILD_MENU.indexOf(h.selectedBuilding) : -1
      h.selectedBuilding = BUILD_MENU[(idx + 1) % BUILD_MENU.length]
    }

    // Place building
    if (inp.buildPlace && h.selectedBuilding) {
      tryBuild(st, h, h.selectedBuilding)
    }

    // Animation
    h.animTimer++
    if (h.animTimer > 8) { h.animTimer = 0; h.animFrame = (h.animFrame + 1) % 6 }

    // Treasury bonus to pouch
    const treasuries = st.buildings.filter(b => b.type === 'treasury' && b.team === h.team && b.built)
    h.maxGold = HERO_POUCH_CAP + treasuries.reduce((sum, b) => sum + b.level * HERO_POUCH_UPGRADE, 0)
  }

  // ── Units ───────────────────────────────────────────────
  tickUnits(st)

  // ── Enemies ─────────────────────────────────────────────
  tickEnemies(st)

  // ── Projectiles ─────────────────────────────────────────
  tickProjectiles(st)

  // ── Buildings (production, towers, passive income) ──────
  tickBuildings(st)

  // ── Waves ───────────────────────────────────────────────
  tickWaves(st)

  // ── Win condition ───────────────────────────────────────
  checkWin(st)

  st.nextId = _nextId
}

// ─── Hero interaction ─────────────────────────────────────
function heroInteract(st: GameState, h: Hero): void {
  const team = st.teams[h.team]

  // 1. Pick up gold from ground (resource nodes)
  for (const rn of st.resourceNodes) {
    if (rn.type === 'gold' && rn.amount > 0 && dist(h, rn) < 50) {
      const take = Math.min(3, rn.amount, h.maxGold - h.gold)
      if (take > 0) {
        h.gold += take
        rn.amount -= take
        return
      }
    }
  }

  // 2. Deposit gold into team treasury
  for (const b of st.buildings) {
    if (b.team === h.team && b.built && dist(h, { x: b.x + b.w / 2 }) < 70) {
      if (h.gold > 0 && team.gold < team.maxGold) {
        const deposit = Math.min(h.gold, team.maxGold - team.gold)
        team.gold += deposit
        h.gold -= deposit
        return
      }
    }
  }

  // 3. Recruit from building
  for (const b of st.buildings) {
    if (b.team !== h.team || !b.built) continue
    const def = BUILDING_DEFS[b.type]
    if (!def.produces) continue
    if (dist(h, { x: b.x + b.w / 2 }) > 70) continue

    const uCost = UNIT_STATS[def.produces].cost
    if (team.gold >= uCost && team.popCurrent < team.popMax && b.cooldown <= 0) {
      team.gold -= uCost
      b.cooldown = def.recruitTime ?? 90
      // Spawn unit when cooldown ends (handled in tickBuildings)
      addEvent(st, `Recruiting ${def.produces}`, TEAM_COLORS[h.team] === 'Blue' ? '#48f' : '#f44')
      return
    }
  }
}

// ─── Build logic ──────────────────────────────────────────
function tryBuild(st: GameState, h: Hero, type: BuildingType): void {
  const team = st.teams[h.team]
  const def = BUILDING_DEFS[type]

  // Check cost
  const gCost = def.costGold
  const wCost = def.costWood
  if (team.gold < gCost || team.wood < wCost) return

  // Check spacing (no overlap)
  const bx = h.x - def.w / 2
  for (const b of st.buildings) {
    if (Math.abs(b.x - bx) < Math.max(b.w, def.w) * 0.8) return
  }

  team.gold -= gCost
  team.wood -= wCost
  st.buildings.push(createBuilding(type, h.team, bx))
  addEvent(st, `Building ${type}`, '#8f8')
}

// ─── Unit AI tick ─────────────────────────────────────────
function tickUnits(st: GameState): void {
  for (const u of st.units) {
    if (u.hp <= 0) continue
    u.animTimer++
    if (u.animTimer > 8) { u.animTimer = 0; u.animFrame = (u.animFrame + 1) % 6 }

    if (u.attackTimer > 0) u.attackTimer--

    // Pawn: gather or build
    if (u.class === 'pawn') {
      tickPawn(st, u)
      continue
    }

    // Monk: heal friendly units
    if (u.class === 'monk') {
      tickMonk(st, u)
      continue
    }

    // Combat units — find and attack enemies
    tickCombatUnit(st, u)
  }

  // Remove dead units
  const deadUnits = st.units.filter(u => u.hp <= 0)
  for (const d of deadUnits) {
    const team = st.teams[d.team]
    if (team) team.popCurrent = Math.max(0, team.popCurrent - 1)
  }
  st.units = st.units.filter(u => u.hp > 0)
}

function tickPawn(st: GameState, u: Unit): void {
  // If carrying resources, return to nearest castle/storage
  if (u.carryAmount >= CARRY_MAX || (u.carryAmount > 0 && !u.gatherTarget)) {
    const depot = st.buildings.find(b => b.team === u.team && b.built &&
      (b.type === 'castle' || b.type === 'lumbermill' || b.type === 'goldmine' || b.type === 'farm'))
    if (depot) {
      const dx = (depot.x + depot.w / 2) - u.x
      if (Math.abs(dx) < 30) {
        // Deposit
        const team = st.teams[u.team]
        if (u.carryType === 'gold') team.gold = Math.min(team.gold + u.carryAmount, team.maxGold)
        else if (u.carryType === 'wood') team.wood += u.carryAmount
        else if (u.carryType === 'meat') team.meat += u.carryAmount
        u.carryAmount = 0
        u.carryType = null
        u.state = 'idle'
      } else {
        u.x += Math.sign(dx) * u.speed
        u.dir = Math.sign(dx) as Direction
        u.state = 'move'
      }
    }
    return
  }

  // Find nearest unbuilt building to help construct
  const construction = st.buildings.find(b => b.team === u.team && !b.built)
  if (construction && dist(u, { x: construction.x + construction.w / 2 }) < 300) {
    const dx = (construction.x + construction.w / 2) - u.x
    if (Math.abs(dx) < 40) {
      u.state = 'build'
      construction.buildProgress += 0.005
      if (construction.buildProgress >= 1) {
        construction.built = true
        construction.hp = construction.maxHp
        addEvent(st as GameState, `${construction.type} completed!`, '#8f8')
      }
    } else {
      u.x += Math.sign(dx) * u.speed
      u.dir = Math.sign(dx) as Direction
      u.state = 'move'
    }
    return
  }

  // Gather nearest resource
  if (!u.gatherTarget) {
    let best: ResourceNode | null = null
    let bestDist = 500
    for (const rn of st.resourceNodes) {
      if (rn.amount <= 0) continue
      const d = dist(u, rn)
      if (d < bestDist) { best = rn; bestDist = d }
    }
    if (best) u.gatherTarget = best.id
  }

  const gtNode = st.resourceNodes.find(r => r.id === u.gatherTarget)
  if (gtNode && gtNode.amount > 0) {
    const dx = gtNode.x - u.x
    if (Math.abs(dx) < 30) {
      u.state = 'gather'
      if (u.attackTimer <= 0) {
        u.attackTimer = GATHER_CD
        const take = Math.min(GATHER_RATE, gtNode.amount)
        gtNode.amount -= take
        u.carryType = gtNode.type
        u.carryAmount += take
      }
    } else {
      u.x += Math.sign(dx) * u.speed
      u.dir = Math.sign(dx) as Direction
      u.state = 'move'
    }
  } else {
    u.gatherTarget = null
    u.state = 'idle'
  }
}

function tickMonk(st: GameState, u: Unit): void {
  // Find injured friendly unit
  let target: Unit | null = null
  let bestD = u.attackRange + 1
  for (const f of st.units) {
    if (f.team !== u.team || f === u || f.hp >= f.maxHp) continue
    const d = dist(u, f)
    if (d < bestD) { target = f; bestD = d }
  }

  if (target) {
    const dx = target.x - u.x
    if (Math.abs(dx) <= u.attackRange) {
      u.state = 'heal'
      if (u.attackTimer <= 0) {
        u.attackTimer = u.attackCooldown
        target.hp = Math.min(target.hp + 15, target.maxHp)
      }
    } else {
      u.x += Math.sign(dx) * u.speed
      u.dir = Math.sign(dx) as Direction
      u.state = 'move'
    }
  } else {
    u.state = 'idle'
  }
}

function tickCombatUnit(st: GameState, u: Unit): void {
  // Find nearest enemy
  let target: Enemy | null = null
  let bestD = 400
  for (const e of st.enemies) {
    if (e.state === 'dying') continue
    const d = dist(u, e)
    if (d < bestD) { target = e; bestD = d }
  }

  // Also target enemy buildings in PVP
  let targetBuilding: Building | null = null
  if (!target && st.mode === 'pvp') {
    for (const b of st.buildings) {
      if (b.team === u.team) continue
      const d = dist(u, { x: b.x + b.w / 2 })
      if (d < bestD) { targetBuilding = b; bestD = d }
    }
  }

  if (target) {
    const dx = target.x - u.x
    if (Math.abs(dx) <= u.attackRange) {
      u.state = 'attack'
      u.dir = Math.sign(dx) as Direction || 1
      if (u.attackTimer <= 0) {
        u.attackTimer = u.attackCooldown
        if (u.class === 'archer') {
          // Shoot arrow
          st.projectiles.push({
            x: u.x, y: u.y - 20,
            vx: u.dir * ARROW_SPEED, vy: -2,
            damage: u.damage, team: u.team, life: PROJ_LIFETIME,
          })
        } else {
          target.hp -= u.damage
          if (target.hp <= 0) {
            target.state = 'dying'
            st.teams[u.team].gold = Math.min(st.teams[u.team].gold + target.loot, st.teams[u.team].maxGold)
          }
        }
      }
    } else {
      u.x += Math.sign(dx) * u.speed
      u.dir = Math.sign(dx) as Direction || 1
      u.state = 'move'
    }
  } else if (targetBuilding) {
    const bx = targetBuilding.x + targetBuilding.w / 2
    const dx = bx - u.x
    if (Math.abs(dx) <= u.attackRange) {
      u.state = 'attack'
      if (u.attackTimer <= 0) {
        u.attackTimer = u.attackCooldown
        targetBuilding.hp -= u.damage
      }
    } else {
      u.x += Math.sign(dx) * u.speed
      u.dir = Math.sign(dx) as Direction || 1
      u.state = 'move'
    }
  } else {
    // Patrol near castle
    const castle = st.buildings.find(b => b.team === u.team && b.type === 'castle')
    if (castle && dist(u, { x: castle.x + castle.w / 2 }) > 200) {
      const dx = (castle.x + castle.w / 2) - u.x
      u.x += Math.sign(dx) * u.speed * 0.5
      u.dir = Math.sign(dx) as Direction || 1
      u.state = 'move'
    } else {
      u.state = 'idle'
    }
  }
}

// ─── Enemy AI ─────────────────────────────────────────────
function tickEnemies(st: GameState): void {
  for (const e of st.enemies) {
    if (e.state === 'dying') continue
    e.animTimer++
    if (e.animTimer > 8) { e.animTimer = 0; e.animFrame = (e.animFrame + 1) % 6 }
    if (e.attackTimer > 0) e.attackTimer--

    // Find nearest target: unit, hero, or building
    let tgt: { x: number } | null = null
    const tgtHP = { ref: null as (Unit | Hero | Building | null) }
    let bestD = 500

    // check heroes
    for (const h of st.heroes) {
      const d = dist(e, h)
      if (d < bestD) { tgt = h; tgtHP.ref = h; bestD = d }
    }
    // check units
    for (const u of st.units) {
      if (u.hp <= 0) continue
      const d = dist(e, u)
      if (d < bestD) { tgt = u; tgtHP.ref = u; bestD = d }
    }
    // check buildings
    for (const b of st.buildings) {
      if (b.hp <= 0) continue
      const bx = b.x + b.w / 2
      const d = Math.abs(e.x - bx)
      if (d < bestD) { tgt = { x: bx }; tgtHP.ref = b; bestD = d }
    }

    if (tgt && bestD <= e.attackRange) {
      e.state = 'attack'
      if (e.attackTimer <= 0) {
        e.attackTimer = e.attackCooldown
        const ref = tgtHP.ref!
        if ('hp' in ref) {
          (ref as { hp: number }).hp -= e.damage
          if ((ref as { hp: number }).hp <= 0) {
            if ('state' in ref && 'class' in ref && 'loot' in ref) {
              // Enemy killed (shouldn't happen — enemy attacking enemy)
            } else if ('alive' in ref && 'team' in ref) {
              // Unit or hero killed
            }
          }
        }
      }
    } else if (tgt) {
      // Move toward target
      const dx = tgt.x - e.x
      e.x += Math.sign(dx) * e.speed
      e.dir = Math.sign(dx) as Direction || 1
      e.state = 'walk'
    } else {
      // March toward center
      e.x += e.dir * e.speed * 0.5
      e.state = 'walk'
    }

    // Clamp to world
    e.x = clamp(e.x, 10, st.worldW - 10)
  }

  // Remove dying enemies after animation
  st.enemies = st.enemies.filter(e => {
    if (e.state === 'dying') {
      e.animTimer++
      return e.animTimer < 30 // keep for 30 ticks for death animation
    }
    return true
  })
}

// ─── Projectiles ──────────────────────────────────────────
function tickProjectiles(st: GameState): void {
  for (const p of st.projectiles) {
    p.x += p.vx
    p.y += p.vy
    p.vy += PROJ_GRAVITY
    p.life--

    // Hit enemy
    if (p.team >= 0) {
      for (const e of st.enemies) {
        if (e.state === 'dying') continue
        if (Math.abs(p.x - e.x) < 15 && Math.abs(p.y - e.y) < 30) {
          e.hp -= p.damage
          if (e.hp <= 0) {
            e.state = 'dying'
            st.teams[p.team].gold = Math.min(st.teams[p.team].gold + e.loot, st.teams[p.team].maxGold)
          }
          p.life = 0
          break
        }
      }
      // PVP: hit enemy units
      if (st.mode === 'pvp') {
        for (const u of st.units) {
          if (u.team === p.team || u.hp <= 0) continue
          if (Math.abs(p.x - u.x) < 15 && Math.abs(p.y - u.y) < 30) {
            u.hp -= p.damage
            p.life = 0
            break
          }
        }
      }
    } else {
      // Enemy projectile — hit units/heroes
      for (const u of st.units) {
        if (u.hp <= 0) continue
        if (Math.abs(p.x - u.x) < 15 && Math.abs(p.y - u.y) < 30) {
          u.hp -= p.damage
          p.life = 0
          break
        }
      }
    }

    // Hit ground
    if (p.y >= st.groundY) p.life = 0
  }

  st.projectiles = st.projectiles.filter(p => p.life > 0)
}

// ─── Building tick ────────────────────────────────────────
function tickBuildings(st: GameState): void {
  for (const b of st.buildings) {
    if (!b.built || b.hp <= 0) continue
    const def = BUILDING_DEFS[b.type]
    const team = st.teams[b.team]

    // Recruitment
    if (def.produces && b.cooldown > 0) {
      b.cooldown--
      if (b.cooldown <= 0 && team.popCurrent < team.popMax) {
        const unit = createUnit(def.produces, b.team, b.rallyX, 1)
        st.units.push(unit)
        team.popCurrent++
      }
    }

    // Tower auto-fire
    if (b.type === 'tower') {
      if (b.cooldown > 0) { b.cooldown--; continue }
      // Find nearest enemy in range
      let closest: Enemy | null = null
      let cDist = TOWER_RANGE
      for (const e of st.enemies) {
        if (e.state === 'dying') continue
        const d = Math.abs(e.x - (b.x + b.w / 2))
        if (d < cDist) { closest = e; cDist = d }
      }
      if (closest) {
        b.cooldown = TOWER_FIRE_CD
        const dx = closest.x - (b.x + b.w / 2)
        st.projectiles.push({
          x: b.x + b.w / 2, y: b.y,
          vx: Math.sign(dx) * ARROW_SPEED, vy: -3,
          damage: TOWER_DAMAGE * b.level, team: b.team,
          life: PROJ_LIFETIME,
        })
      }
    }

    // Passive income
    if (b.type === 'goldmine' && st.tick % GOLDMINE_RATE === 0) {
      team.gold = Math.min(team.gold + b.level, team.maxGold)
    }
    if (b.type === 'farm' && st.tick % FARM_RATE === 0) {
      team.meat += b.level
    }
    if (b.type === 'lumbermill' && st.tick % LUMBER_RATE === 0) {
      team.wood += b.level
    }

    // Treasury increases max gold
    if (b.type === 'treasury') {
      team.maxGold = 100 + st.buildings
        .filter(x => x.type === 'treasury' && x.team === b.team && x.built)
        .reduce((s, x) => s + x.level * 50, 0)
    }

    // House increases pop cap
    if (b.type === 'house') {
      // Recalculate pop cap occasionally
      if (st.tick % 60 === 0) {
        team.popMax = 5 + st.buildings
          .filter(x => x.team === b.team && x.built)
          .reduce((s, x) => s + BUILDING_DEFS[x.type].popAdd * x.level, 0)
      }
    }
  }

  // Remove destroyed buildings
  const destroyed = st.buildings.filter(b => b.hp <= 0 && b.built)
  for (const d of destroyed) {
    addEvent(st, `${d.type} destroyed!`, '#f44')
  }
  st.buildings = st.buildings.filter(b => b.hp > 0 || !b.built)
}

// ─── Wave spawning ────────────────────────────────────────
function tickWaves(st: GameState): void {
  if (st.mode === 'pvp') return  // No AI waves in pure PVP

  st.waveTimer--
  if (st.waveTimer <= 0 && st.enemies.filter(e => e.state !== 'dying').length === 0) {
    st.waveNumber++
    const pool = WAVE_ENEMY_POOL[st.difficulty] || WAVE_ENEMY_POOL[1]
    const count = Math.floor(3 + st.waveNumber * WAVE_GROWTH * (1 + st.difficulty * 0.3))
    const side: Direction = st.waveNumber % 2 === 0 ? -1 : 1
    const spawnX = side === -1 ? 30 : st.worldW - 30

    for (let i = 0; i < count; i++) {
      const cls = pick(pool)
      const en = createEnemy(cls, spawnX + randInt(-50, 50), (side * -1) as Direction)
      // Night bonus
      if (st.isNight) {
        en.hp = Math.round(en.hp * 1.3)
        en.damage = Math.round(en.damage * 1.2)
      }
      st.enemies.push(en)
    }

    st.waveTimer = st.waveCooldown
    addEvent(st, `Wave ${st.waveNumber}! (${count} enemies from ${side === -1 ? 'west' : 'east'})`, '#f80')
  }
}

// ─── Win condition ────────────────────────────────────────
function checkWin(st: GameState): void {
  // Check if any team's castle is destroyed
  for (let t = 0; t < st.teamCount; t++) {
    const castle = st.buildings.find(b => b.team === t && b.type === 'castle')
    if (!castle || castle.hp <= 0) {
      st.teams[t].alive = false
    }
  }

  const alive = st.teams.filter(t => t.alive)
  if (st.mode === 'pvp' || st.mode === 'skirmish') {
    if (alive.length <= 1) {
      st.gameOver = true
      st.winner = st.teams.indexOf(alive[0] || st.teams[0])
      addEvent(st, `Team ${st.winner + 1} wins!`, '#ff0')
    }
  } else if (st.mode === 'coop' || st.mode === 'endless') {
    if (alive.length === 0) {
      st.gameOver = true
      st.winner = -1
      addEvent(st, 'All castles destroyed! Game Over.', '#f44')
    }
  }
}

// ─── Utility ──────────────────────────────────────────────
function addEvent(st: GameState, text: string, color: string): void {
  st.events.push({ text, color, timer: 150 })
  if (st.events.length > 8) st.events.shift()
}

// ─── Upgrade building ─────────────────────────────────────
export function upgradeBuilding(st: GameState, b: Building): boolean {
  if (b.level >= 3 || !b.built) return false
  const def = BUILDING_DEFS[b.type]
  const mult = UPGRADE_COST_MULT[b.level]
  const gCost = Math.ceil(def.costGold * mult)
  const wCost = Math.ceil(def.costWood * mult)
  const team = st.teams[b.team]
  if (team.gold < gCost || team.wood < wCost) return false

  team.gold -= gCost
  team.wood -= wCost
  b.level++
  b.maxHp = Math.ceil(def.hp * UPGRADE_HP_MULT[b.level - 1])
  b.hp = b.maxHp
  addEvent(st, `${b.type} upgraded to Lv${b.level}!`, '#8f8')
  return true
}
