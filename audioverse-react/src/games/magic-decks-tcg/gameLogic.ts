import type { GameConfig } from '../../pages/games/mini/types'
/**
 * gameLogic.ts — Core game logic for MagicDecks TCG.
 * Handles state initialization, mana/draw ticks, combat resolution,
 * evolution, bot AI, and win conditions.
 */
import type {
  GameState, PlayerState, FieldCreature, CardInstance, CardDef,
  BattleEvent, Element, BossState, AutoPlayMode,
} from './types'
import { ELEMENT_ADVANTAGE, ELEMENT_COLORS, RARITY_ORDER } from './types'
import { ALL_CARDS, CARDS_BY_ID, buildRandomDeck, buildElementDeck, preloadSprites } from './cardDatabase'
import type { PlayerSlot } from '../../pages/games/mini/types'
import { PLAYER_COLORS } from '../../pages/games/mini/types'

// ── Config ────────────────────────────────────────────────
export const LANES = 5
export const MAX_HAND = 7
export const DECK_SIZE = 25
export const MANA_MAX = 10
export const MANA_TICK = 120     // ticks between mana regen (at 60fps → ~2s)
export const DRAW_TICK = 300     // ticks between card draws (~5s)
export const ATTACK_TICK = 180   // base ticks between attacks (~3s)
export const STARTING_LIFE = 25
export const EVOLVE_COST = 2     // extra mana cost to evolve on field
const POISON_DMG = 1
const PARTICLE_SPAWN_PER_EVENT = 12

let uidCounter = 1
function nextUid(): number { return uidCounter++ }

// ── Init ──────────────────────────────────────────────────
export function initState(players: PlayerSlot[], config: GameConfig): GameState {
  uidCounter = 1
  const life = Number(config.startingLife) || STARTING_LIFE
  const mode = (config.gameMode as string) || 'duel'
  const deckSize = Number(config.deckSize) || DECK_SIZE
  const ps: PlayerState[] = players.map((s, i) => {
    const preferEl = (['fire', 'water', 'earth', 'air', 'light', 'dark'] as Element[])[i % 6]
    const deckCards = buildElementDeck(preferEl, deckSize)
    const hand = deckCards.splice(0, 5).map(d => ({ uid: nextUid(), def: d } as CardInstance))
    const deck = deckCards.map(d => ({ uid: nextUid(), def: d } as CardInstance))
    return {
      index: s.index,
      name: s.name,
      color: s.color || PLAYER_COLORS[s.index] || '#fff',
      input: s.input,
      life, maxLife: life,
      mana: 3, maxMana: MANA_MAX,
      hand, deck, discard: [],
      field: Array(LANES).fill(null),
      selectedCard: 0, selectedLane: 2,
      coins: 0, gems: 0, stars: 0,
      lastManaTick: 0, lastDrawTick: 0,
      comboCount: 0, lastElement: null,
    }
  })

  const coopBoss = mode === 'coop-raid' ? initBoss() : null
  return {
    players: ps,
    events: [],
    particles: [],
    gameOver: false, winner: null,
    tick: 0,
    mode,
    coopBoss,
    startTime: performance.now(),
    imageCache: preloadSprites(),
    nextUid: uidCounter,
  }
}

function initBoss(): BossState {
  const deckCards = buildRandomDeck(40)
  const hand = deckCards.splice(0, 5).map(d => ({ uid: nextUid(), def: d } as CardInstance))
  const deck = deckCards.map(d => ({ uid: nextUid(), def: d } as CardInstance))
  return {
    life: 80, maxLife: 80,
    field: Array(LANES).fill(null),
    hand, deck,
    mana: 5, maxMana: 15,
    ticksSinceDraw: 0, ticksSinceMana: 0,
    element: 'dark',
  }
}

// ── Card play ─────────────────────────────────────────────
export function playCard(st: GameState, p: PlayerState, _now: number): boolean {
  if (p.hand.length === 0) return false
  const ci = p.hand[p.selectedCard]
  if (!ci) return false
  const card = ci.def
  if (p.mana < card.cost) return false
  p.mana -= card.cost

  if (card.type === 'creature' || card.type === 'hero') {
    const lane = p.selectedLane
    if (p.field[lane] !== null) return false // lane occupied
    const fc = createFieldCreature(ci, lane, p.index)
    p.field[lane] = fc
    addEvent(st, 'summon', lane, p.index, undefined, card.element, 0, fc)
  } else if (card.type === 'spell' && card.spellEffect) {
    applySpell(st, p, card)
  }

  // combo tracking (same element = combo)
  if (p.lastElement === card.element) {
    p.comboCount++
    if (p.comboCount >= 3) p.gems++
  } else {
    p.comboCount = 1
  }
  p.lastElement = card.element

  p.hand.splice(p.selectedCard, 1)
  p.discard.push(ci)
  if (p.selectedCard >= p.hand.length) p.selectedCard = Math.max(0, p.hand.length - 1)
  return true
}

function createFieldCreature(ci: CardInstance, lane: number, owner: number): FieldCreature {
  const d = ci.def
  return {
    uid: ci.uid, def: d,
    hp: d.def, maxHp: d.def, atk: d.atk, spd: d.spd,
    lane, owner,
    ticksSinceAttack: 0,
    poisonTicks: 0, frozenTicks: 0,
    buffAtk: 0, buffDef: 0, buffTimer: 0,
    shieldHp: d.passive?.kind === 'shield' ? d.passive.value : 0,
    enterAnim: 30, hurtAnim: 0,
  }
}

// ── Spell effects ─────────────────────────────────────────
function applySpell(st: GameState, caster: PlayerState, card: CardDef) {
  const eff = card.spellEffect!
  const lane = caster.selectedLane

  switch (eff.kind) {
    case 'damage': {
      const target = findTargetCreature(st, caster.index, lane, 'enemy')
      if (target) {
        dealDamage(st, target, eff.value, card.element, caster.index)
      } else {
        // hit player life directly
        const enemy = getEnemy(st, caster.index)
        if (enemy) {
          enemy.life -= eff.value
          caster.coins += eff.value
          addEvent(st, 'spell', lane, caster.index, enemy.index, card.element, eff.value)
        }
      }
      break
    }
    case 'heal': {
      if (eff.target === 'self') {
        caster.life = Math.min(caster.maxLife, caster.life + eff.value)
        addEvent(st, 'heal', lane, caster.index, caster.index, card.element, eff.value)
      } else {
        const ally = caster.field[lane]
        if (ally) {
          ally.hp = Math.min(ally.maxHp, ally.hp + eff.value)
          addEvent(st, 'heal', lane, caster.index, caster.index, card.element, eff.value)
        }
      }
      break
    }
    case 'buff': {
      for (const fc of caster.field) {
        if (fc) { fc.buffAtk += eff.value; fc.buffDef += eff.value; fc.buffTimer = 600 }
      }
      addEvent(st, 'spell', lane, caster.index, caster.index, card.element, eff.value)
      break
    }
    case 'debuff': {
      const target = findTargetCreature(st, caster.index, lane, 'enemy')
      if (target) {
        target.frozenTicks += eff.value * 60
        addEvent(st, 'spell', lane, caster.index, target.owner, card.element, eff.value)
      }
      break
    }
    case 'aoe': {
      // hits all enemy creatures
      for (const enemy of st.players) {
        if (enemy.index === caster.index) continue
        for (let i = 0; i < LANES; i++) {
          const fc = enemy.field[i]
          if (fc) dealDamage(st, fc, eff.value, card.element, caster.index)
        }
      }
      if (st.coopBoss) {
        for (let i = 0; i < LANES; i++) {
          const fc = st.coopBoss.field[i]
          if (fc) dealDamage(st, fc, eff.value, card.element, caster.index)
        }
      }
      addEvent(st, 'spell', lane, caster.index, undefined, card.element, eff.value)
      break
    }
    case 'draw': {
      for (let i = 0; i < eff.value && caster.hand.length < MAX_HAND && caster.deck.length > 0; i++) {
        caster.hand.push(caster.deck.pop()!)
      }
      break
    }
    case 'mana': {
      caster.mana = Math.min(caster.maxMana, caster.mana + eff.value)
      break
    }
    case 'evolve': {
      const ally = caster.field[lane]
      if (ally && ally.def.evolvesTo) {
        evolveCreature(st, caster, lane)
      }
      break
    }
  }
}

// ── Evolution ─────────────────────────────────────────────
export function evolveCreature(st: GameState, p: PlayerState, lane: number): boolean {
  const fc = p.field[lane]
  if (!fc || !fc.def.evolvesTo) return false
  const nextDef = CARDS_BY_ID.get(fc.def.evolvesTo)
  if (!nextDef) return false
  if (p.mana < EVOLVE_COST) return false
  p.mana -= EVOLVE_COST

  // upgrade in place
  const hpRatio = fc.hp / fc.maxHp
  fc.def = nextDef
  fc.maxHp = nextDef.def
  fc.hp = Math.ceil(nextDef.def * hpRatio)
  fc.atk = nextDef.atk
  fc.spd = nextDef.spd
  fc.enterAnim = 30  // re-trigger entrance animation
  if (nextDef.passive?.kind === 'shield') fc.shieldHp = nextDef.passive.value

  addEvent(st, 'evolve', lane, p.index, undefined, nextDef.element, 0, fc)
  p.gems++
  return true
}

// ── Combat helpers ────────────────────────────────────────
function dealDamage(st: GameState, target: FieldCreature, rawDmg: number, attackerElement: Element, attackerOwner: number) {
  // elemental advantage: 1.5x damage
  let dmg = rawDmg
  if (ELEMENT_ADVANTAGE[attackerElement]?.includes(target.def.element)) dmg = Math.ceil(dmg * 1.5)

  // pierce: ignore some DEF (reduce effective shield/buffDef)
  // shield absorbs first
  if (target.shieldHp > 0) {
    const absorbed = Math.min(target.shieldHp, dmg)
    target.shieldHp -= absorbed
    dmg -= absorbed
  }
  // buffDef reduces damage
  const totalDef = target.buffDef
  dmg = Math.max(1, dmg - Math.floor(totalDef / 2))

  target.hp -= dmg
  target.hurtAnim = 15
  addEvent(st, 'attack', target.lane, attackerOwner, target.owner, attackerElement, dmg, target)
}

function findTargetCreature(st: GameState, casterIndex: number, lane: number, who: 'enemy' | 'ally'): FieldCreature | null {
  if (who === 'ally') {
    const p = st.players.find(pp => pp.index === casterIndex)
    return p?.field[lane] ?? null
  }
  // enemy: look at opponents' same lane first, then any lane
  for (const p of st.players) {
    if (p.index === casterIndex) continue
    if (p.field[lane]) return p.field[lane]
  }
  if (st.coopBoss?.field[lane]) return st.coopBoss.field[lane]
  // fallback: any occupied lane
  for (const p of st.players) {
    if (p.index === casterIndex) continue
    for (let i = 0; i < LANES; i++) {
      if (p.field[i]) return p.field[i]
    }
  }
  return null
}

function getEnemy(st: GameState, index: number): PlayerState | null {
  return st.players.find(p => p.index !== index) ?? null
}

// ── Main tick ─────────────────────────────────────────────
export function gameTick(st: GameState) {
  if (st.gameOver) return
  st.tick++

  // update particles
  updateParticles(st)

  // clean old events (keep last 2 seconds = 120 ticks)
  const cutoff = st.tick - 120
  st.events = st.events.filter(e => (e.time || 0) > cutoff)

  for (const p of st.players) {
    // mana regen
    p.lastManaTick++
    if (p.lastManaTick >= MANA_TICK) {
      p.mana = Math.min(p.maxMana, p.mana + 1)
      p.lastManaTick = 0
    }
    // draw card
    p.lastDrawTick++
    if (p.lastDrawTick >= DRAW_TICK && p.hand.length < MAX_HAND && p.deck.length > 0) {
      p.hand.push(p.deck.pop()!)
      p.lastDrawTick = 0
    }
    // recycle discard if deck empty
    if (p.deck.length === 0 && p.discard.length > 0) {
      p.deck = shuffle(p.discard)
      p.discard = []
    }

    // creature ticks
    for (let lane = 0; lane < LANES; lane++) {
      const fc = p.field[lane]
      if (!fc) continue

      // animation counters
      if (fc.enterAnim > 0) fc.enterAnim--
      if (fc.hurtAnim > 0) fc.hurtAnim--

      // buff timer
      if (fc.buffTimer > 0) {
        fc.buffTimer--
        if (fc.buffTimer <= 0) { fc.buffAtk = 0; fc.buffDef = 0 }
      }

      // frozen: skip attack
      if (fc.frozenTicks > 0) { fc.frozenTicks--; continue }

      // poison
      if (fc.poisonTicks > 0) {
        fc.poisonTicks--
        fc.hp -= POISON_DMG
        if (fc.hp <= 0) { killCreature(st, p, lane); continue }
      }

      // passive: regen
      if (fc.def.passive?.kind === 'regen') {
        if (st.tick % 60 === 0) fc.hp = Math.min(fc.maxHp, fc.hp + fc.def.passive.value)
      }
      // passive: inspire — boost adjacents
      if (fc.def.passive?.kind === 'inspire') {
        // applied during attack calc, not here
      }

      // attack timing
      const attackInterval = ATTACK_TICK * fc.spd
      fc.ticksSinceAttack++
      if (fc.ticksSinceAttack < attackInterval) continue
      fc.ticksSinceAttack = 0

      // resolve attack
      const effectiveAtk = fc.atk + fc.buffAtk + getInspireBonus(p, lane)
      
      // active ability
      if (fc.def.active) {
        fc.def.active.currentCd--
        if (fc.def.active.currentCd <= 0) {
          useActiveAbility(st, p, fc)
          fc.def.active.currentCd = fc.def.active.cooldown
        }
      }

      if (st.coopBoss) {
        const opp = st.coopBoss.field[lane]
        if (opp) {
          dealDamage(st, opp, effectiveAtk, fc.def.element, p.index)
          // thorns
          if (opp.def.passive?.kind === 'thorns') {
            fc.hp -= opp.def.passive.value
            fc.hurtAnim = 10
          }
          if (opp.hp <= 0) killBossCreature(st, lane)
          // lifesteal
          if (fc.def.passive?.kind === 'lifesteal') {
            const heal = Math.ceil(effectiveAtk * fc.def.passive.value / 100)
            fc.hp = Math.min(fc.maxHp, fc.hp + heal)
          }
        } else {
          st.coopBoss.life -= effectiveAtk
          p.coins += effectiveAtk
          addEvent(st, 'directHit', lane, p.index, undefined, fc.def.element, effectiveAtk)
        }
      } else {
        const enemy = getEnemy(st, p.index)
        if (enemy) {
          // find target in lane (with taunt priority)
          const target = findLaneTarget(enemy, lane)
          if (target) {
            dealDamage(st, target, effectiveAtk, fc.def.element, p.index)
            // thorns
            if (target.def.passive?.kind === 'thorns') {
              fc.hp -= target.def.passive.value
              fc.hurtAnim = 10
            }
            // lifesteal
            if (fc.def.passive?.kind === 'lifesteal') {
              const heal = Math.ceil(effectiveAtk * fc.def.passive.value / 100)
              fc.hp = Math.min(fc.maxHp, fc.hp + heal)
            }
            // splash
            if (fc.def.passive?.kind === 'splash') {
              const splashDmg = Math.ceil(effectiveAtk * fc.def.passive.value / 100)
              if (lane > 0 && enemy.field[lane - 1]) {
                dealDamage(st, enemy.field[lane - 1]!, splashDmg, fc.def.element, p.index)
              }
              if (lane < LANES - 1 && enemy.field[lane + 1]) {
                dealDamage(st, enemy.field[lane + 1]!, splashDmg, fc.def.element, p.index)
              }
            }
            if (target.hp <= 0) killCreature(st, enemy, target.lane)
          } else {
            enemy.life -= effectiveAtk
            p.coins += effectiveAtk
            addEvent(st, 'directHit', lane, p.index, enemy.index, fc.def.element, effectiveAtk)
          }
        }
      }

      // check self death (from thorns etc.)
      if (fc.hp <= 0) killCreature(st, p, lane)
    }
  }

  // boss AI
  if (st.coopBoss) tickBoss(st)

  // bot AI
  for (const p of st.players) {
    if (p.input.type === 'keyboard' || p.input.type === 'gamepad') continue
    tickBotAI(st, p)
  }

  // win check
  checkWinCondition(st)
}

function findLaneTarget(enemy: PlayerState, lane: number): FieldCreature | null {
  // taunt priority: if any creature in this lane has taunt, must attack it
  const fc = enemy.field[lane]
  if (fc) return fc
  return null
}

function getInspireBonus(p: PlayerState, lane: number): number {
  let bonus = 0
  if (lane > 0) {
    const left = p.field[lane - 1]
    if (left?.def.passive?.kind === 'inspire') bonus += left.def.passive.value
  }
  if (lane < LANES - 1) {
    const right = p.field[lane + 1]
    if (right?.def.passive?.kind === 'inspire') bonus += right.def.passive.value
  }
  return bonus
}

function useActiveAbility(st: GameState, owner: PlayerState, fc: FieldCreature) {
  const a = fc.def.active!
  switch (a.kind) {
    case 'fireball': {
      const enemy = getEnemy(st, owner.index)
      if (enemy) {
        const target = findTargetCreature(st, owner.index, fc.lane, 'enemy')
        if (target) dealDamage(st, target, a.value, fc.def.element, owner.index)
        else if (enemy) { enemy.life -= a.value; owner.coins += a.value }
      }
      addEvent(st, 'ability', fc.lane, owner.index, undefined, fc.def.element, a.value, fc)
      break
    }
    case 'heal': {
      // heal weakest ally
      let weakest: FieldCreature | null = null
      for (const f of owner.field) {
        if (f && (!weakest || f.hp < weakest.hp)) weakest = f
      }
      if (weakest) {
        weakest.hp = Math.min(weakest.maxHp, weakest.hp + a.value)
        addEvent(st, 'heal', weakest.lane, owner.index, owner.index, fc.def.element, a.value)
      }
      break
    }
    case 'freeze': {
      const target = findTargetCreature(st, owner.index, fc.lane, 'enemy')
      if (target) target.frozenTicks += a.value * 60
      break
    }
    case 'poison': {
      const target = findTargetCreature(st, owner.index, fc.lane, 'enemy')
      if (target) target.poisonTicks += a.value * 60
      break
    }
    case 'buff': {
      for (const f of owner.field) {
        if (f) { f.buffAtk += a.value; f.buffTimer = 600 }
      }
      break
    }
    case 'lightning': {
      // random enemy creature
      const enemy = getEnemy(st, owner.index)
      if (enemy) {
        const targets = enemy.field.filter((f): f is FieldCreature => f !== null)
        if (targets.length > 0) {
          const t = targets[Math.floor(Math.random() * targets.length)]
          dealDamage(st, t, a.value, fc.def.element, owner.index)
          if (t.hp <= 0) killCreature(st, enemy, t.lane)
        }
      }
      break
    }
    case 'drain': {
      const target = findTargetCreature(st, owner.index, fc.lane, 'enemy')
      if (target) {
        dealDamage(st, target, a.value, fc.def.element, owner.index)
        fc.hp = Math.min(fc.maxHp, fc.hp + a.value)
      }
      break
    }
    case 'summon': {
      // summon a basic token creature in empty lane
      const emptyLane = owner.field.findIndex(f => f === null)
      if (emptyLane !== -1) {
        const tokenDef = ALL_CARDS.find(c => c.element === fc.def.element && c.stage === 1 && c.type === 'creature')
        if (tokenDef) {
          const ci: CardInstance = { uid: nextUid(), def: tokenDef }
          owner.field[emptyLane] = createFieldCreature(ci, emptyLane, owner.index)
        }
      }
      break
    }
  }
}

function killCreature(st: GameState, owner: PlayerState, lane: number) {
  const fc = owner.field[lane]
  if (!fc) return
  addEvent(st, 'death', lane, fc.owner, undefined, fc.def.element, 0, fc)
  owner.field[lane] = null
}

function killBossCreature(st: GameState, lane: number) {
  if (!st.coopBoss) return
  const fc = st.coopBoss.field[lane]
  if (!fc) return
  addEvent(st, 'death', lane, -1, undefined, fc.def.element, 0, fc)
  st.coopBoss.field[lane] = null
}

// ── Boss AI ───────────────────────────────────────────────
function tickBoss(st: GameState) {
  const boss = st.coopBoss!
  // mana regen
  boss.ticksSinceMana++
  if (boss.ticksSinceMana >= MANA_TICK) {
    boss.mana = Math.min(boss.maxMana, boss.mana + 2) // boss gets 2 mana
    boss.ticksSinceMana = 0
  }
  // draw
  boss.ticksSinceDraw++
  if (boss.ticksSinceDraw >= DRAW_TICK && boss.hand.length < MAX_HAND && boss.deck.length > 0) {
    boss.hand.push(boss.deck.pop()!)
    boss.ticksSinceDraw = 0
  }
  // play strongest affordable creature
  const sorted = [...boss.hand].filter(c => c.def.cost <= boss.mana && (c.def.type === 'creature' || c.def.type === 'hero')).sort((a, b) => b.def.cost - a.def.cost)
  for (const ci of sorted) {
    const emptyLane = boss.field.findIndex(f => f === null)
    if (emptyLane === -1) break
    boss.field[emptyLane] = createFieldCreature(ci, emptyLane, -1)
    boss.mana -= ci.def.cost
    boss.hand.splice(boss.hand.indexOf(ci), 1)
    break
  }
  // boss creatures attack
  for (let lane = 0; lane < LANES; lane++) {
    const fc = boss.field[lane]
    if (!fc) continue
    if (fc.frozenTicks > 0) { fc.frozenTicks--; continue }
    fc.ticksSinceAttack++
    const interval = ATTACK_TICK * fc.spd
    if (fc.ticksSinceAttack < interval) continue
    fc.ticksSinceAttack = 0

    const effectiveAtk = fc.atk + fc.buffAtk
    // attack first player with creature in that lane
    let hit = false
    for (const p of st.players) {
      if (p.field[lane]) {
        dealDamage(st, p.field[lane]!, effectiveAtk, fc.def.element, -1)
        if (p.field[lane]!.hp <= 0) killCreature(st, p, lane)
        hit = true
        break
      }
    }
    if (!hit) {
      for (const p of st.players) { p.life -= effectiveAtk }
      addEvent(st, 'directHit', lane, -1, undefined, fc.def.element, effectiveAtk)
    }
  }
  for (let lane = 0; lane < LANES; lane++) {
    const fc = boss.field[lane]
    if (fc && fc.hp <= 0) killBossCreature(st, lane)
  }
}

// ── Bot AI ────────────────────────────────────────────────
function tickBotAI(st: GameState, bot: PlayerState) {
  if (bot.hand.length === 0) return
  // only act every ~60 ticks (1s)
  if (st.tick % 60 !== 0) return

  // strategy: play best affordable card
  const playable = bot.hand
    .map((ci, i) => ({ ci, i }))
    .filter(({ ci }) => ci.def.cost <= bot.mana)
    .sort((a, b) => b.ci.def.cost - a.ci.def.cost)

  for (const { ci, i } of playable) {
    if (ci.def.type === 'creature' || ci.def.type === 'hero') {
      // find best lane (prefer empty, then weakest enemy)
      let bestLane = bot.field.findIndex(f => f === null)
      if (bestLane === -1) continue
      // prefer lane with enemy creature for blocking
      const enemy = getEnemy(st, bot.index)
      if (enemy) {
        for (let l = 0; l < LANES; l++) {
          if (bot.field[l] === null && enemy.field[l] !== null) { bestLane = l; break }
        }
      }
      bot.selectedCard = i
      bot.selectedLane = bestLane
      playCard(st, bot, 0)
      break
    } else if (ci.def.type === 'spell') {
      // pick best lane target
      const enemy = getEnemy(st, bot.index)
      if (enemy) {
        for (let l = 0; l < LANES; l++) {
          if (enemy.field[l]) { bot.selectedLane = l; break }
        }
      }
      bot.selectedCard = i
      playCard(st, bot, 0)
      break
    }
  }

  // try to evolve a creature
  if (bot.mana >= EVOLVE_COST) {
    for (let lane = 0; lane < LANES; lane++) {
      const fc = bot.field[lane]
      if (fc && fc.def.evolvesTo) {
        evolveCreature(st, bot, lane)
        break
      }
    }
  }
}

// ── Win condition ─────────────────────────────────────────

// ── Auto-play for human player ────────────────────────────
/** Runs auto-play logic for a human player using the given strategy. */
export function tickAutoPlay(st: GameState, player: PlayerState, mode: AutoPlayMode) {
  if (mode === 'off') return
  if (player.hand.length === 0) return
  // only act every ~60 ticks (1s), same cadence as bot
  if (st.tick % 60 !== 0) return

  // Get playable cards
  const playable = player.hand
    .map((ci, i) => ({ ci, i }))
    .filter(({ ci }) => ci.def.cost <= player.mana)

  if (playable.length === 0) return

  // Sort based on strategy
  let sorted: typeof playable
  switch (mode) {
    case 'expensive':
      sorted = playable.sort((a, b) => b.ci.def.cost - a.ci.def.cost)
      break
    case 'cheap':
      sorted = playable.sort((a, b) => a.ci.def.cost - b.ci.def.cost)
      break
    case 'rarest':
      // rarest first, then most expensive as tiebreaker
      sorted = playable.sort((a, b) => {
        const ra = RARITY_ORDER[a.ci.def.rarity] ?? 0
        const rb = RARITY_ORDER[b.ci.def.rarity] ?? 0
        if (rb !== ra) return rb - ra
        return b.ci.def.cost - a.ci.def.cost
      })
      break
    default:
      sorted = playable
  }

  for (const { ci, i } of sorted) {
    if (ci.def.type === 'creature' || ci.def.type === 'hero') {
      let bestLane = player.field.findIndex(f => f === null)
      if (bestLane === -1) continue
      // prefer lane with enemy creature for blocking
      const enemy = getEnemy(st, player.index)
      if (enemy) {
        for (let l = 0; l < LANES; l++) {
          if (player.field[l] === null && enemy.field[l] !== null) { bestLane = l; break }
        }
      }
      player.selectedCard = i
      player.selectedLane = bestLane
      playCard(st, player, 0)
      break
    } else if (ci.def.type === 'spell') {
      const enemy = getEnemy(st, player.index)
      if (enemy) {
        for (let l = 0; l < LANES; l++) {
          if (enemy.field[l]) { player.selectedLane = l; break }
        }
      }
      player.selectedCard = i
      playCard(st, player, 0)
      break
    }
  }

  // also try evolving
  if (player.mana >= EVOLVE_COST) {
    for (let lane = 0; lane < LANES; lane++) {
      const fc = player.field[lane]
      if (fc && fc.def.evolvesTo) {
        evolveCreature(st, player, lane)
        break
      }
    }
  }
}

function checkWinCondition(st: GameState) {
  if (st.coopBoss) {
    if (st.coopBoss.life <= 0) {
      st.gameOver = true; st.winner = -1
      for (const p of st.players) p.stars++
    } else if (st.players.every(p => p.life <= 0)) {
      st.gameOver = true; st.winner = null
    }
  } else {
    const alive = st.players.filter(p => p.life > 0)
    if (alive.length <= 1) {
      st.gameOver = true
      st.winner = alive.length === 1 ? alive[0].index : null
      if (alive[0]) alive[0].stars++
    }
  }
}

// ── Events & Particles ───────────────────────────────────
function addEvent(st: GameState, kind: BattleEvent['kind'], lane: number, src: number, tgt: number | undefined, el: Element, val: number, fc?: FieldCreature) {
  const x = laneToX(lane)
  const y = fc ? 250 : 250
  st.events.push({ kind, lane, sourceOwner: src, targetOwner: tgt, element: el, value: val, x, y, time: st.tick })
  // spawn particles
  const color = ELEMENT_COLORS[el]
  for (let i = 0; i < PARTICLE_SPAWN_PER_EVENT; i++) {
    st.particles.push({
      x: x + Math.random() * 50 - 25,
      y: y + Math.random() * 50 - 25,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4 - 2,
      life: 30 + Math.random() * 30,
      maxLife: 60,
      color,
      size: 2 + Math.random() * 4,
      element: el,
    })
  }
}

function updateParticles(st: GameState) {
  for (let i = st.particles.length - 1; i >= 0; i--) {
    const p = st.particles[i]
    p.x += p.vx
    p.y += p.vy
    p.vy += 0.05 // gravity
    p.life--
    if (p.life <= 0) st.particles.splice(i, 1)
  }
}

export function laneToX(lane: number): number {
  return 130 + lane * 120
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
