/**
 * combat.ts — Full tactical turn-based combat engine.
 *
 * 11×9 hex-like grid, initiative-based turns, melee + ranged attacks,
 * spellcasting, morale/luck, siege mechanics, damage formulas.
 */
import type {
  CombatState, CreatureStack, Hero, SiegeState, StatusEffect,
  SpellDef, SpellId,
} from './types'
import { COMBAT_COLS, COMBAT_ROWS, MAX_COMBAT_ROUNDS, MORALE_POSITIVE_CHANCE, LUCK_BONUS_CHANCE, SIEGE_WALL_HP, SIEGE_TOWER_HP, SIEGE_GATE_HP } from './constants'
import { ALL_CREATURES } from './factions'
import { ALL_SPELLS } from './spells'
import { getEffectiveStats, getSkillLevel } from './heroes'

// ═════════════════════════════════════════════════════════════
//  TYPES
// ═════════════════════════════════════════════════════════════
export interface CombatStack {
  id: string
  creatureId: string
  count: number
  currentHp: number        // HP of topmost creature
  maxHp: number
  side: 'attacker' | 'defender'
  originalSlot: number     // position in hero's army
  x: number
  y: number
  hasActed: boolean
  hasRetaliated: boolean
  shotsLeft: number
  statusEffects: StatusEffect[]
  morale: number
  luck: number
  initiative: number
  waited: boolean          // used Wait action this round
}

export interface CombatAction {
  type: 'move' | 'attack' | 'shoot' | 'spell' | 'wait' | 'defend' | 'surrender' | 'flee'
  targetX?: number
  targetY?: number
  targetStackId?: string
  spellId?: SpellId
}

export interface CombatResult {
  winner: 'attacker' | 'defender' | 'draw'
  attackerLosses: { creatureId: string; lost: number }[]
  defenderLosses: { creatureId: string; lost: number }[]
  xpGained: number
  loot: { gold: number }
}

// ═════════════════════════════════════════════════════════════
//  COMBAT INITIALIZATION
// ═════════════════════════════════════════════════════════════
let _stackIdCounter = 0

function armyToStacks(army: (CreatureStack | null)[], side: 'attacker' | 'defender', heroStats: { attack: number; defense: number; morale: number; luck: number }): CombatStack[] {
  const stacks: CombatStack[] = []
  const slotInUse = army.filter(s => s !== null)
  const usedCount = slotInUse.length

  for (let i = 0; i < army.length; i++) {
    const s = army[i]
    if (!s) continue
    const def = ALL_CREATURES[s.creatureId]
    if (!def) continue

    // Position: attackers on left, defenders on right
    const x = side === 'attacker' ? 0 : COMBAT_COLS - 1
    const y = Math.min(Math.max(1 + Math.floor(i * ((COMBAT_ROWS - 2) / Math.max(usedCount - 1, 1))), 0), COMBAT_ROWS - 1)

    stacks.push({
      id: `stack_${_stackIdCounter++}`,
      creatureId: s.creatureId,
      count: s.count,
      currentHp: def.hp,
      maxHp: def.hp,
      side,
      originalSlot: i,
      x, y,
      hasActed: false,
      hasRetaliated: false,
      shotsLeft: def.shots,
      statusEffects: [...s.statusEffects],
      morale: s.morale + heroStats.morale,
      luck: s.luck + heroStats.luck,
      initiative: def.initiative,
      waited: false,
    })
  }
  return stacks
}

export function initCombat(
  attackerArmy: (CreatureStack | null)[],
  defenderArmy: (CreatureStack | null)[],
  attackerHero: Hero | null,
  defenderHero: Hero | null,
  isSiege: boolean = false,
): CombatState {
  const aStats = attackerHero ? getEffectiveStats(attackerHero) : { attack: 0, defense: 0, morale: 0, luck: 0, spellPower: 0, knowledge: 0, maxMana: 0, movementBonus: 0 }
  const dStats = defenderHero ? getEffectiveStats(defenderHero) : { attack: 0, defense: 0, morale: 0, luck: 0, spellPower: 0, knowledge: 0, maxMana: 0, movementBonus: 0 }

  const attackerStacks = armyToStacks(attackerArmy, 'attacker', aStats)
  const defenderStacks = armyToStacks(defenderArmy, 'defender', dStats)
  const allStacks = [...attackerStacks, ...defenderStacks]

  // Sort by initiative (descending) for first turn
  allStacks.sort((a, b) => b.initiative - a.initiative)

  const siege: SiegeState | null = isSiege ? {
    wallHP: [SIEGE_WALL_HP, SIEGE_WALL_HP, SIEGE_WALL_HP],
    towerHP: [SIEGE_TOWER_HP, SIEGE_TOWER_HP],
    gateHP: SIEGE_GATE_HP,
    gateOpen: false,
    moatActive: true,
  } : null

  return {
    stacks: allStacks,
    activeStackIndex: 0,
    round: 1,
    phase: 'action',   // 'action' | 'spell_targeting' | 'animation' | 'result'
    attackerHeroId: attackerHero?.id ?? null,
    defenderHeroId: defenderHero?.id ?? null,
    siege,
    spellTargeting: null,
    log: ['⚔ Combat begins!'],
    obstacles: [],
    finished: false,
    winner: null,
  }
}

// ═════════════════════════════════════════════════════════════
//  INITIATIVE & TURN ORDER
// ═════════════════════════════════════════════════════════════
export function getActiveStack(state: CombatState): CombatStack | null {
  if (state.finished) return null
  return state.stacks[state.activeStackIndex] ?? null
}

export function advanceActiveStack(state: CombatState): CombatState {
  const s = { ...state }

  // Find next alive, un-acted stack
  const alive = s.stacks.filter(st => st.count > 0)
  if (alive.length === 0) return s

  const attackerAlive = alive.filter(st => st.side === 'attacker')
  const defenderAlive = alive.filter(st => st.side === 'defender')

  if (attackerAlive.length === 0 || defenderAlive.length === 0) {
    s.finished = true
    s.winner = attackerAlive.length > 0 ? 'attacker' : 'defender'
    s.log = [...s.log, `${s.winner} wins!`]
    return s
  }

  // Find next un-acted stack by initiative
  const unacted = alive.filter(st => !st.hasActed)
  if (unacted.length === 0) {
    // End of round — start new round
    return startNewRound(s)
  }

  unacted.sort((a, b) => b.initiative - a.initiative)
  // Include waited stacks last
  const notWaited = unacted.filter(st => !st.waited)
  const waited = unacted.filter(st => st.waited)
  const ordered = [...notWaited, ...waited]

  const next = ordered[0]
  s.activeStackIndex = s.stacks.indexOf(next)
  s.phase = 'action'
  return s
}

function startNewRound(state: CombatState): CombatState {
  const s = { ...state }
  s.round += 1

  if (s.round > MAX_COMBAT_ROUNDS) {
    s.finished = true
    s.winner = 'defender' // defender wins by timeout
    s.log = [...s.log, 'Combat ended — time limit reached. Defender wins.']
    return s
  }

  // Reset all stacks
  s.stacks = s.stacks.map(st => ({
    ...st,
    hasActed: false,
    hasRetaliated: false,
    waited: false,
  }))

  // --- Regeneration: heal creatures with regeneration ability at start of round ---
  for (const st of s.stacks) {
    if (st.count <= 0) continue
    const cDef = ALL_CREATURES[st.creatureId]
    if (cDef && cDef.abilities.includes('regeneration')) {
      const healAmt = Math.floor(cDef.hp * 0.2)
      st.currentHp = Math.min(st.currentHp + healAmt, cDef.hp)
      s.log = [...s.log, `♻ ${cDef.name} regenerates ${healAmt} HP`]
    }
  }

  // Tick status effects
  s.stacks = s.stacks.map(st => tickStatusEffects(st))

  s.log = [...s.log, `── Round ${s.round} ──`]

  // Sort by initiative
  const alive = s.stacks.filter(st => st.count > 0)
  alive.sort((a, b) => b.initiative - a.initiative)
  if (alive.length > 0) {
    s.activeStackIndex = s.stacks.indexOf(alive[0])
  }
  s.phase = 'action'
  return s
}

// ═════════════════════════════════════════════════════════════
//  DAMAGE CALCULATION
// ═════════════════════════════════════════════════════════════

/** HoMM3-style damage formula */
export function calcDamage(
  attacker: CombatStack,
  defender: CombatStack,
  attackerHero: Hero | null,
  defenderHero: Hero | null,
  isRanged: boolean,
): { min: number; max: number; avg: number } {
  const aDef = ALL_CREATURES[attacker.creatureId]!
  const dDef = ALL_CREATURES[defender.creatureId]!

  const heroAtk = attackerHero ? getEffectiveStats(attackerHero).attack : 0
  const heroDef = defenderHero ? getEffectiveStats(defenderHero).defense : 0

  const totalAttack = aDef.attack + heroAtk
  const totalDefense = dDef.defense + heroDef

  // Attack/defense difference multiplier
  let modifier: number
  if (totalAttack > totalDefense) {
    modifier = 1 + 0.05 * Math.min(totalAttack - totalDefense, 20)
  } else {
    modifier = 1 / (1 + 0.025 * Math.min(totalDefense - totalAttack, 40))
  }

  // Ranged penalty at melee range or with obstacle
  const rangePenalty = isRanged ? 1.0 : 1.0 // full damage either way (simplified)

  // Archery/offense/armorer skill modifiers
  let skillMod = 1.0
  if (attackerHero) {
    if (isRanged) {
      const archery = getSkillLevel(attackerHero, 'archery')
      skillMod *= 1 + [0, 0.10, 0.25, 0.50][archery]
    } else {
      const offense = getSkillLevel(attackerHero, 'offense')
      skillMod *= 1 + [0, 0.10, 0.20, 0.30][offense]
    }
  }
  if (defenderHero) {
    const armorer = getSkillLevel(defenderHero, 'armorer')
    skillMod *= 1 - [0, 0.05, 0.10, 0.15][armorer]
  }

  // Status effect modifiers
  let statusMod = 1.0
  for (const eff of attacker.statusEffects) {
    if (eff.type === 'attack_boost') statusMod *= (1 + eff.modifier)
  }
  for (const eff of defender.statusEffects) {
    if (eff.type === 'defense_boost') statusMod *= (1 - eff.modifier * 0.5)
  }

  const min = Math.max(1, Math.floor(aDef.minDmg * attacker.count * modifier * rangePenalty * skillMod * statusMod))
  const max = Math.max(1, Math.floor(aDef.maxDmg * attacker.count * modifier * rangePenalty * skillMod * statusMod))

  return { min, max, avg: Math.floor((min + max) / 2) }
}

/** Apply damage to a stack, return updated stack + kills */
export function applyDamage(
  stack: CombatStack,
  damage: number,
): { stack: CombatStack; killed: number } {
  const def = ALL_CREATURES[stack.creatureId]!
  let remaining = damage
  let killed = 0
  let hp = stack.currentHp
  let count = stack.count

  // Damage first removes current HP of top creature
  if (remaining >= hp) {
    remaining -= hp
    killed++
    count--
    hp = def.hp
  }

  // Then kill full creatures
  const fullKills = Math.min(Math.floor(remaining / def.hp), count)
  killed += fullKills
  count -= fullKills
  remaining -= fullKills * def.hp

  // Remaining damage to top creature
  if (count > 0 && remaining > 0) {
    hp -= remaining
    if (hp <= 0) {
      killed++
      count--
      hp = def.hp
    }
  }

  return {
    stack: { ...stack, count: Math.max(0, count), currentHp: count > 0 ? hp : 0 },
    killed,
  }
}

// ═════════════════════════════════════════════════════════════
//  MOVEMENT
// ═════════════════════════════════════════════════════════════
export function getReachableCells(stack: CombatStack, stacks: CombatStack[], _siege: SiegeState | null): Set<string> {
  const def = ALL_CREATURES[stack.creatureId]!
  const speed = def.speed + getSpeedModifier(stack)
  const reachable = new Set<string>()
  const occupied = new Set<string>()

  for (const s of stacks) {
    if (s.count > 0 && s.id !== stack.id) {
      occupied.add(`${s.x},${s.y}`)
    }
  }

  // Flying creatures can reach any non-occupied cell within range
  if (def.abilities.includes('flying')) {
    for (let y = 0; y < COMBAT_ROWS; y++) {
      for (let x = 0; x < COMBAT_COLS; x++) {
        const key = `${x},${y}`
        if (occupied.has(key)) continue
        if (x === stack.x && y === stack.y) continue
        const dist = Math.abs(x - stack.x) + Math.abs(y - stack.y)
        if (dist <= speed + 2) { // flying gets bonus range
          reachable.add(key)
        }
      }
    }
    return reachable
  }

  // Teleport creatures can reach ANY empty cell
  if (def.abilities.includes('teleport')) {
    for (let y = 0; y < COMBAT_ROWS; y++) {
      for (let x = 0; x < COMBAT_COLS; x++) {
        const key = `${x},${y}`
        if (!occupied.has(key) && !(x === stack.x && y === stack.y)) {
          reachable.add(key)
        }
      }
    }
    return reachable
  }

  // BFS for ground units
  const queue: { x: number; y: number; cost: number }[] = [{ x: stack.x, y: stack.y, cost: 0 }]
  const visited = new Map<string, number>()
  visited.set(`${stack.x},${stack.y}`, 0)

  while (queue.length > 0) {
    const { x, y, cost } = queue.shift()!
    if (cost >= speed) continue

    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]]) {
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || nx >= COMBAT_COLS || ny < 0 || ny >= COMBAT_ROWS) continue 
      const key = `${nx},${ny}`
      const newCost = cost + 1
      if (occupied.has(key)) continue
      if (!visited.has(key) || visited.get(key)! > newCost) {
        visited.set(key, newCost)
        reachable.add(key)
        queue.push({ x: nx, y: ny, cost: newCost })
      }
    }
  }

  return reachable
}

function getSpeedModifier(stack: CombatStack): number {
  let mod = 0
  for (const eff of stack.statusEffects) {
    if (eff.type === 'speed_boost') mod += eff.modifier
    if (eff.type === 'speed_reduce') mod -= eff.modifier
  }
  return mod
}

// ═════════════════════════════════════════════════════════════
//  ADJACENCY / TARGETING
// ═════════════════════════════════════════════════════════════
export function getAdjacentStacks(x: number, y: number, stacks: CombatStack[], side?: 'attacker' | 'defender'): CombatStack[] {
  const adj: CombatStack[] = []
  for (const s of stacks) {
    if (s.count <= 0) continue
    if (side && s.side !== side) continue
    const dx = Math.abs(s.x - x)
    const dy = Math.abs(s.y - y)
    if (dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0)) {
      adj.push(s)
    }
  }
  return adj
}

export function canShoot(stack: CombatStack, stacks: CombatStack[]): boolean {
  const def = ALL_CREATURES[stack.creatureId]!
  if (def.shots <= 0 || stack.shotsLeft <= 0) return false
  // Check if engaged in melee (adjacent enemy)
  const enemySide = stack.side === 'attacker' ? 'defender' : 'attacker'
  const adjacent = getAdjacentStacks(stack.x, stack.y, stacks, enemySide)
  return adjacent.length === 0 // can't shoot if in melee
}

// ═════════════════════════════════════════════════════════════
//  EXECUTE ACTION
// ═════════════════════════════════════════════════════════════
export function executeAction(state: CombatState, action: CombatAction, attackerHero: Hero | null, defenderHero: Hero | null): CombatState {
  let s = { ...state, stacks: state.stacks.map(st => ({ ...st })), log: [...state.log] }
  const active = s.stacks[s.activeStackIndex]
  if (!active || active.count <= 0) return advanceActiveStack(s)

  const aDef = ALL_CREATURES[active.creatureId]!

  switch (action.type) {
    case 'move': {
      if (action.targetX !== undefined && action.targetY !== undefined) {
        const reachable = getReachableCells(active, s.stacks, s.siege)
        const key = `${action.targetX},${action.targetY}`
        if (reachable.has(key)) {
          active.x = action.targetX
          active.y = action.targetY
          s.log.push(`${aDef.name} moves to (${action.targetX},${action.targetY})`)
        }
      }
      active.hasActed = true
      break
    }

    case 'attack': {
      const target = s.stacks.find(st => st.id === action.targetStackId)
      if (!target || target.count <= 0) break

      // Move adjacent if needed
      const dx = Math.abs(active.x - target.x)
      const dy = Math.abs(active.y - target.y)
      if (dx > 1 || dy > 1) {
        // Try to move next to target
        const reachable = getReachableCells(active, s.stacks, s.siege)
        let bestCell: { x: number; y: number } | null = null
        let bestDist = Infinity

        for (const [ddx, ddy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]]) {
          const nx = target.x + ddx
          const ny = target.y + ddy
          const key = `${nx},${ny}`
          if (reachable.has(key)) {
            const dist = Math.abs(nx - active.x) + Math.abs(ny - active.y)
            if (dist < bestDist) {
              bestDist = dist
              bestCell = { x: nx, y: ny }
            }
          }
        }

        if (bestCell) {
          active.x = bestCell.x
          active.y = bestCell.y
        } else {
          // Can't reach — move is wasted
          active.hasActed = true
          s.log.push(`${aDef.name} can't reach target`)
          break
        }
      }

      // Attack calculation
      const hero = active.side === 'attacker' ? attackerHero : defenderHero
      const enemyHero = active.side === 'attacker' ? defenderHero : attackerHero
      const { min, max } = calcDamage(active, target, hero, enemyHero, false)
      let damage = min + Math.floor(Math.random() * (max - min + 1))

      // Luck check
      if (Math.random() < LUCK_BONUS_CHANCE * Math.max(0, active.luck)) {
        damage = Math.floor(damage * 2)
        s.log.push(`🍀 Lucky strike!`)
      }

      const tDef = ALL_CREATURES[target.creatureId]!
      const result = applyDamage(target, damage)
      Object.assign(target, result.stack)
      s.log.push(`${aDef.name}(${active.count}) attacks ${tDef.name} for ${damage} dmg (${result.killed} killed)`)

      // --- Life Drain: heal attacker for damage dealt ---
      if (aDef.abilities.includes('life_drain') && active.count > 0) {
        const healAmount = damage
        const originalCount = active.count
        const restoredHp = Math.min(active.currentHp + healAmount, active.maxHp)
        const extraUnits = Math.floor(healAmount / active.maxHp)
        if (extraUnits > 0 || restoredHp > active.currentHp) {
          active.count += extraUnits
          active.currentHp = restoredHp
          s.log.push(`🧛 ${aDef.name} drains life! (healed ${extraUnits > 0 ? `+${extraUnits} units` : `+${restoredHp - active.currentHp} HP`})`)
        }
        void originalCount
      }

      // --- Fire Breath: damage stacks behind the target ---
      if (aDef.abilities.includes('fire_breath') && active.count > 0) {
        const behindX = target.x + (target.x - active.x)
        const behindY = target.y + (target.y - active.y)
        const behind = s.stacks.find(st => st.x === behindX && st.y === behindY && st.count > 0 && st.id !== active.id)
        if (behind) {
          const breathDmg = Math.floor(damage * 0.5)
          const bResult = applyDamage(behind, breathDmg)
          Object.assign(behind, bResult.stack)
          const bDef = ALL_CREATURES[behind.creatureId]!
          s.log.push(`🔥 Fire breath hits ${bDef.name} for ${breathDmg} dmg (${bResult.killed} killed)`)
        }
      }

      // --- Curse Attack: apply debuff to target ---
      if (aDef.abilities.includes('curse_attack') && target.count > 0) {
        target.statusEffects = [...target.statusEffects, {
          type: 'attack_reduce',
          modifier: 0.15,
          duration: 3,
          sourceSpellId: null,
        }]
        s.log.push(`☠ ${tDef.name} is cursed! (-15% attack for 3 rounds)`)
      }

      // Retaliation (skip if attacker has no_retaliation)
      if (target.count > 0 && !target.hasRetaliated && !aDef.abilities.includes('no_retaliation')) {
        const { min: rMin, max: rMax } = calcDamage(target, active, enemyHero, hero, false)
        const rDamage = rMin + Math.floor(Math.random() * (rMax - rMin + 1))
        const rResult = applyDamage(active, rDamage)
        Object.assign(active, rResult.stack)
        target.hasRetaliated = true
        s.log.push(`${tDef.name} retaliates for ${rDamage} dmg (${rResult.killed} killed)`)
      }

      // --- Double Strike: attack a second time ---
      if (aDef.abilities.includes('double_strike') && active.count > 0 && target.count > 0) {
        const { min: d2Min, max: d2Max } = calcDamage(active, target, hero, enemyHero, false)
        const damage2 = d2Min + Math.floor(Math.random() * (d2Max - d2Min + 1))
        const result2 = applyDamage(target, damage2)
        Object.assign(target, result2.stack)
        s.log.push(`⚔ ${aDef.name} strikes again for ${damage2} dmg (${result2.killed} killed)`)
      }

      active.hasActed = true

      // --- Fear: chance to make nearby enemies skip next turn ---
      if (aDef.abilities.includes('fear') && active.count > 0) {
        const nearby = getAdjacentStacks(active.x, active.y, s.stacks, active.side === 'attacker' ? 'defender' : 'attacker')
        for (const nearStack of nearby) {
          if (Math.random() < 0.2) {
            nearStack.hasActed = true
            const nDef = ALL_CREATURES[nearStack.creatureId]!
            s.log.push(`😱 ${nDef.name} is frozen with fear!`)
          }
        }
      }

      // Morale check — positive morale may grant extra turn
      if (active.count > 0 && Math.random() < MORALE_POSITIVE_CHANCE * Math.max(0, active.morale)) {
        active.hasActed = false
        s.log.push(`✨ High morale! ${aDef.name} gets another turn!`)
      }
      break
    }

    case 'shoot': {
      const target = s.stacks.find(st => st.id === action.targetStackId)
      if (!target || target.count <= 0) break
      if (!canShoot(active, s.stacks)) break

      const hero = active.side === 'attacker' ? attackerHero : defenderHero
      const enemyHero = active.side === 'attacker' ? defenderHero : attackerHero
      const { min, max } = calcDamage(active, target, hero, enemyHero, true)
      let damage = min + Math.floor(Math.random() * (max - min + 1))

      // Half damage if shooting over wall in siege
      if (s.siege && active.side === 'attacker') {
        const wallsBetween = s.siege.wallHP.some(w => w > 0)
        if (wallsBetween) damage = Math.floor(damage * 0.5)
      }

      if (Math.random() < LUCK_BONUS_CHANCE * Math.max(0, active.luck)) {
        damage = Math.floor(damage * 2)
        s.log.push(`🍀 Lucky shot!`)
      }

      const tDef = ALL_CREATURES[target.creatureId]!
      const result = applyDamage(target, damage)
      Object.assign(target, result.stack)
      active.shotsLeft--
      s.log.push(`${aDef.name}(${active.count}) shoots ${tDef.name} for ${damage} dmg (${result.killed} killed) [${active.shotsLeft} shots left]`)

      active.hasActed = true
      break
    }

    case 'spell': {
      if (!action.spellId) break
      const spell = ALL_SPELLS[action.spellId]
      if (!spell) break

      const casterHero = active.side === 'attacker' ? attackerHero : defenderHero
      if (!casterHero) break
      if (casterHero.mana < spell.manaCost) {
        s.log.push('Not enough mana!')
        break
      }

      s = applyCombatSpell(s, spell, action, casterHero, active.side)
      // Note: mana deduction should be handled by caller (updating hero state)
      active.hasActed = true
      break
    }

    case 'wait': {
      active.waited = true
      active.hasActed = true
      s.log.push(`${aDef.name} waits`)
      // Reinsert: waited stacks act after all others
      break
    }

    case 'defend': {
      // Defense mode: +30% defense for this round
      active.statusEffects = [...active.statusEffects, {
        type: 'defense_boost',
        modifier: 0.3,
        duration: 1,
        sourceSpellId: null,
      }]
      active.hasActed = true
      s.log.push(`${aDef.name} defends (🛡 +30% defense)`)
      break
    }

    case 'surrender':
    case 'flee': {
      s.finished = true
      s.winner = active.side === 'attacker' ? 'defender' : 'attacker'
      s.log.push(`${active.side} ${action.type === 'flee' ? 'flees' : 'surrenders'}!`)
      return s
    }
  }

  return advanceActiveStack(s)
}

// ═════════════════════════════════════════════════════════════
//  SPELL COMBAT APPLICATION
// ═════════════════════════════════════════════════════════════
function applyCombatSpell(
  state: CombatState,
  spell: SpellDef,
  action: CombatAction,
  casterHero: Hero,
  casterSide: 'attacker' | 'defender',
): CombatState {
  const s = { ...state }
  const spellPower = getEffectiveStats(casterHero).spellPower

  switch (spell.target) {
    case 'enemy_stack': {
      const target = s.stacks.find(st => st.id === action.targetStackId)
      if (!target || target.count <= 0) break
      const tDef = ALL_CREATURES[target.creatureId]!

      // Magic resist check — anti_magic blocks completely, magic_resist reduces by 50%
      if (tDef.abilities.includes('anti_magic')) {
        s.log.push(`🛡 ${tDef.name} is immune to magic!`)
        break
      }
      const magicResistMod = tDef.abilities.includes('magic_resist') ? 0.5 : 1.0

      if (spell.basePower > 0) {
        // Damage spell
        const damage = Math.floor((spell.basePower + spellPower * 10) * magicResistMod)
        const result = applyDamage(target, damage)
        Object.assign(target, result.stack)
        s.log.push(`🔮 ${spell.name} deals ${damage} to ${tDef.name} (${result.killed} killed)${magicResistMod < 1 ? ' [magic resist]' : ''}`)
      }

      if (spell.duration > 0) {
        // Debuff
        target.statusEffects.push({
          type: resolveSpellEffectType(spell.id),
          modifier: spell.basePower * 0.1,
          duration: spell.duration,
          sourceSpellId: spell.id,
        })
        s.log.push(`🔮 ${spell.name} debuffs ${tDef.name}`)
      }
      break
    }

    case 'friendly_stack': {
      const target = s.stacks.find(st => st.id === action.targetStackId)
      if (!target || target.count <= 0) break
      const tDef = ALL_CREATURES[target.creatureId]!

      if (spell.id === 'cure' || spell.id === 'resurrect' || spell.id === 'animate_dead') {
        // Healing
        const healAmount = spell.basePower + spellPower * 5
        const def = ALL_CREATURES[target.creatureId]!
        if (spell.id === 'resurrect' || spell.id === 'animate_dead') {
          // Resurrect dead creatures
          const resurrectCount = Math.floor(healAmount / def.hp)
          target.count += resurrectCount
          s.log.push(`🔮 ${spell.name} resurrects ${resurrectCount} ${tDef.name}`)
        } else {
          target.currentHp = Math.min(target.currentHp + healAmount, def.hp)
          s.log.push(`🔮 ${spell.name} heals ${tDef.name} for ${healAmount}`)
        }
      } else {
        // Buff
        target.statusEffects.push({
          type: resolveSpellEffectType(spell.id),
          modifier: spell.basePower * 0.1 + spellPower * 0.05,
          duration: spell.duration,
          sourceSpellId: spell.id,
        })
        s.log.push(`🔮 ${spell.name} buffs ${tDef.name}`)
      }
      break
    }

    case 'all_enemy': {
      const enemies = s.stacks.filter(st => st.side !== casterSide && st.count > 0)
      let totalKills = 0
      for (const enemy of enemies) {
        const damage = spell.basePower + Math.floor(spellPower * 8)
        const result = applyDamage(enemy, damage)
        Object.assign(enemy, result.stack)
        totalKills += result.killed
      }
      s.log.push(`🔮 ${spell.name} hits all enemies! (${totalKills} total kills)`)
      break
    }

    case 'all_friendly': {
      const allies = s.stacks.filter(st => st.side === casterSide && st.count > 0)
      for (const ally of allies) {
        ally.statusEffects.push({
          type: resolveSpellEffectType(spell.id),
          modifier: spell.basePower * 0.1 + spellPower * 0.05,
          duration: spell.duration,
          sourceSpellId: spell.id,
        })
      }
      s.log.push(`🔮 ${spell.name} buffs all allies!`)
      break
    }

    case 'area': {
      // AoE centered on target position
      const cx = action.targetX ?? 0
      const cy = action.targetY ?? 0
      const radius = spell.id.includes('chain') ? 3 : 2
      for (const st of s.stacks) {
        if (st.count <= 0) continue
        const dist = Math.abs(st.x - cx) + Math.abs(st.y - cy)
        if (dist <= radius) {
          const damage = Math.floor((spell.basePower + spellPower * 8) * (1 - dist * 0.15))
          const result = applyDamage(st, damage)
          Object.assign(st, result.stack)
        }
      }
      s.log.push(`🔮 ${spell.name} blasts area at (${cx},${cy})!`)
      break
    }
  }

  return s
}

function resolveSpellEffectType(spellId: string): string {
  const map: Record<string, string> = {
    bloodlust: 'attack_boost', stoneskin: 'defense_boost', haste: 'speed_boost',
    slow: 'speed_reduce', bless: 'attack_boost', weakness: 'attack_reduce',
    prayer: 'attack_boost', curse: 'attack_reduce', blind: 'blinded',
    shield_all: 'defense_boost', fire_shield: 'defense_boost',
  }
  return map[spellId] || 'misc_buff'
}

// ═════════════════════════════════════════════════════════════
//  STATUS EFFECT TICK
// ═════════════════════════════════════════════════════════════
function tickStatusEffects(stack: CombatStack): CombatStack {
  const effects = stack.statusEffects
    .map(e => ({ ...e, duration: e.duration - 1 }))
    .filter(e => e.duration > 0)
  return { ...stack, statusEffects: effects }
}

// ═════════════════════════════════════════════════════════════
//  SIEGE MECHANICS
// ═════════════════════════════════════════════════════════════
export function attackWall(state: CombatState, wallIndex: number, damage: number): CombatState {
  if (!state.siege) return state
  const siege = { ...state.siege, wallHP: [...state.siege.wallHP] }
  siege.wallHP[wallIndex] = Math.max(0, siege.wallHP[wallIndex] - damage)
  return { ...state, siege, log: [...state.log, `Wall section ${wallIndex + 1} takes ${damage} damage (${siege.wallHP[wallIndex]} HP left)`] }
}

export function attackGate(state: CombatState, damage: number): CombatState {
  if (!state.siege) return state
  const siege = { ...state.siege }
  siege.gateHP = Math.max(0, siege.gateHP - damage)
  siege.gateOpen = siege.gateHP <= 0
  const msg = siege.gateOpen ? 'Gate destroyed! 🚪' : `Gate takes ${damage} damage (${siege.gateHP} HP left)`
  return { ...state, siege, log: [...state.log, msg] }
}

// ═════════════════════════════════════════════════════════════
//  RESOLVE COMBAT
// ═════════════════════════════════════════════════════════════
export function resolveCombat(state: CombatState): CombatResult {
  const attackerLosses: { creatureId: string; lost: number }[] = []
  const defenderLosses: { creatureId: string; lost: number }[] = []

  let totalDefenderValue = 0

  for (const stack of state.stacks) {
    const def = ALL_CREATURES[stack.creatureId]!
    // Losses must be computed by caller comparing initial vs final counts
    // For now compute remaining
    if (stack.side === 'defender') {
      const unitValue = def.cost.gold + def.tier * 50
      totalDefenderValue += unitValue * Math.max(0, stack.count)
    }
  }

  return {
    winner: (state.winner ?? 'draw') as 'attacker' | 'defender' | 'draw',
    attackerLosses,
    defenderLosses,
    xpGained: Math.max(50, totalDefenderValue),
    loot: { gold: Math.floor(totalDefenderValue * 0.1) },
  }
}

/** Convert combat stacks back to army format */
export function stacksToArmy(stacks: CombatStack[], side: 'attacker' | 'defender'): (CreatureStack | null)[] {
  const army: (CreatureStack | null)[] = Array(7).fill(null)
  const sideStacks = stacks.filter(s => s.side === side && s.count > 0)

  for (const s of sideStacks) {
    if (s.originalSlot >= 0 && s.originalSlot < 7) {
      army[s.originalSlot] = {
        creatureId: s.creatureId,
        count: s.count,
        statusEffects: [],
        morale: 0,
        luck: 0,
        hasActed: false,
        hasRetaliated: false,
        shotsLeft: ALL_CREATURES[s.creatureId]?.shots ?? 0,
      }
    }
  }

  return army
}

/** Get all valid actions for the active stack */
export function getValidActions(state: CombatState, attackerHero: Hero | null, defenderHero: Hero | null): CombatAction[] {
  const active = getActiveStack(state)
  if (!active) return []

  const actions: CombatAction[] = []

  // Wait & Defend always available
  if (!active.waited) actions.push({ type: 'wait' })
  actions.push({ type: 'defend' })
  actions.push({ type: 'flee' })
  actions.push({ type: 'surrender' })

  // Move
  const reachable = getReachableCells(active, state.stacks, state.siege)
  for (const key of reachable) {
    const [x, y] = key.split(',').map(Number)
    actions.push({ type: 'move', targetX: x, targetY: y })
  }

  // Melee attack — any adjacent enemy
  const enemySide = active.side === 'attacker' ? 'defender' : 'attacker'
  const adjacentEnemies = getAdjacentStacks(active.x, active.y, state.stacks, enemySide)
  for (const e of adjacentEnemies) {
    actions.push({ type: 'attack', targetStackId: e.id })
  }

  // Also attack enemies reachable by moving adjacent
  for (const key of reachable) {
    const [x, y] = key.split(',').map(Number)
    const adjFromCell = getAdjacentStacks(x, y, state.stacks, enemySide)
    for (const e of adjFromCell) {
      if (!actions.some(a => a.type === 'attack' && a.targetStackId === e.id)) {
        actions.push({ type: 'attack', targetStackId: e.id, targetX: x, targetY: y })
      }
    }
  }

  // Shoot
  if (canShoot(active, state.stacks)) {
    const enemies = state.stacks.filter(s => s.side === enemySide && s.count > 0)
    for (const e of enemies) {
      actions.push({ type: 'shoot', targetStackId: e.id })
    }
  }

  // Spell
  const hero = active.side === 'attacker' ? attackerHero : defenderHero
  if (hero && hero.spells.length > 0) {
    for (const spellId of hero.spells) {
      const spell = ALL_SPELLS[spellId]
      if (spell && hero.mana >= spell.manaCost) {
        if (spell.target === 'enemy_stack' || spell.target === 'friendly_stack') {
          const targets = state.stacks.filter(s => s.count > 0 &&
            (spell.target === 'enemy_stack' ? s.side !== active.side : s.side === active.side))
          for (const t of targets) {
            actions.push({ type: 'spell', spellId, targetStackId: t.id })
          }
        } else if (spell.target === 'area') {
          // AoE — any cell
          actions.push({ type: 'spell', spellId, targetX: active.x, targetY: active.y })
        } else {
          actions.push({ type: 'spell', spellId })
        }
      }
    }
  }

  return actions
}
