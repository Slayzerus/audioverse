import type { MutableRefObject } from 'react'
import type {
  GameState, Town, Hero, CreatureStack, MapObject, LevelUpChoice, BuildingDef,
} from './types'
import type { InputState } from './input'
import type { Camera } from './adventureRenderer'
import type { TownScreenState } from './townRenderer'
import type { CombatAction, CombatResult, CombatStack } from './combat'
import {
  CANVAS_W, CANVAS_H, HERO_MOVE_COOLDOWN_MS, TILE_PX, COMBAT_TILE,
  AI_THINK_DELAY_MS, COINS_PER_BATTLE_WON, GEMS_PER_TOWN_CAPTURED,
  STARS_PER_GAME_WON,
} from './constants'
import { ALL_CREATURES } from './factions'
import {
  createHero, calcVisionRange, canLevelUp,
  generateLevelUpChoices, applyLevelUp, resetHeroDaily,
} from './heroes'
import { revealFog, isPassable, getMovementCost } from './mapGenerator'
import {
  initCombat, executeAction, getActiveStack, advanceActiveStack,
  getReachableCells, resolveCombat, stacksToArmy,
} from './combat'
import {
  addResources, subtractResources, canAfford,
  calcDailyIncome, recruitCreatures, applyWeeklyGrowth,
  purchaseBuilding,
} from './economy'
import { planAITurn, aiCombatAction, autoResolveCombat } from './ai'
import { screenToTile, screenToCombatTile, pollGamepad } from './input'
import { ALL_BUILDINGS } from './buildings'
import { centerCameraOnHero, clampCamera } from './adventureRenderer'
import { getCombatGridOffset } from './combatRenderer'
import { createTownScreenState } from './townRenderer'

// =====================================================================
//  INTERFACES
// =====================================================================

export interface CombatUIState {
  hoveredCell: { col: number; row: number } | null
  selectedAction: 'move' | 'attack' | 'shoot' | 'spell' | null
  selectedSpellId: string | null
  autoCombat: boolean
}

export interface GameRefs {
  input: MutableRefObject<InputState>
  camera: MutableRefObject<Camera>
  selectedHero: MutableRefObject<string | null>
  combatUI: MutableRefObject<CombatUIState>
  townScreen: MutableRefObject<TownScreenState>
  lastMove: MutableRefObject<number>
  lastAI: MutableRefObject<number>
  notifications: MutableRefObject<{ text: string; time: number }[]>
}

export interface GameCallbacks {
  pushNotification: (text: string) => void
  updateScoreboard: (state: GameState) => void
}
// =====================================================================
//  PROCESS INPUT PER FRAME
// =====================================================================
export function processAdventureInput(state: GameState, now: number, refs: GameRefs, cb: GameCallbacks): GameState {
  const input = refs.input.current
  const hero = state.heroes.find(h => h.id === refs.selectedHero.current)
  if (!hero || hero.owner !== state.turn.currentPlayer) return state

  // Keyboard movement
  const moveReady = now - refs.lastMove.current > HERO_MOVE_COOLDOWN_MS
  let dx = 0, dy = 0

  if (moveReady) {
    if (input.keysDown.has('ArrowUp') || input.keysDown.has('w') || input.keysDown.has('W')) dy = -1
    if (input.keysDown.has('ArrowDown') || input.keysDown.has('s') || input.keysDown.has('S')) dy = 1
    if (input.keysDown.has('ArrowLeft') || input.keysDown.has('a') || input.keysDown.has('A')) dx = -1
    if (input.keysDown.has('ArrowRight') || input.keysDown.has('d') || input.keysDown.has('D')) dx = 1
  }

  // Gamepad
  const gp = pollGamepad(input)
  if (moveReady && gp.dx) dx = gp.dx
  if (moveReady && gp.dy) dy = gp.dy

  // Move hero
  if ((dx || dy) && moveReady) {
    const nx = hero.x + dx
    const ny = hero.y + dy
    if (isPassable(state.map, nx, ny)) {
      const terrain = state.map.cells[ny][nx].terrain
      const cost = getMovementCost(terrain, 0)
      if (hero.movementPoints >= cost) {
        hero.x = nx
        hero.y = ny
        hero.movementPoints -= cost
        refs.lastMove.current = now
        revealFog(state.map, nx, ny, calcVisionRange(hero), hero.owner)
        refs.camera.current = clampCamera(
          centerCameraOnHero(hero, state.map.cols, state.map.rows),
          state.map.cols, state.map.rows
        )

        // Check interactions at new position
        state = checkMapInteraction(state, hero, nx, ny, refs, cb)
      }
    }
  }

  // Mouse click on map
  if (input.mouseJustClicked && !state.combat && !state.activeTownId) {
    const tile = screenToTile(input.mouseX, input.mouseY, refs.camera.current.x, refs.camera.current.y, TILE_PX)
    if (tile) {
      // Check if clicked on a town
      const town = state.towns.find(t => t.x === tile.col && t.y === tile.row)
      if (town && town.owner === state.turn.currentPlayer && hero.x === town.x && hero.y === town.y) {
        state.activeTownId = town.id
        refs.townScreen.current = createTownScreenState()
      }
    }
  }

  // Tab -> next hero
  if (input.keysJustPressed.has('Tab')) {
    const playerHeroes = state.heroes.filter(h => h.owner === state.turn.currentPlayer)
    if (playerHeroes.length > 0) {
      const idx = playerHeroes.findIndex(h => h.id === refs.selectedHero.current)
      const next = playerHeroes[(idx + 1) % playerHeroes.length]
      refs.selectedHero.current = next.id
      refs.camera.current = clampCamera(
        centerCameraOnHero(next, state.map.cols, state.map.rows),
        state.map.cols, state.map.rows
      )
    }
  }

  // Enter -> end turn
  if (input.keysJustPressed.has('Enter') || input.keysJustPressed.has('e') || input.keysJustPressed.has('E')) {
    state = endPlayerTurn(state, refs, cb)
  }

  // T -> open town (if hero is at own town)
  if (input.keysJustPressed.has('t') || input.keysJustPressed.has('T')) {
    if (hero) {
      const town = state.towns.find(t => t.x === hero.x && t.y === hero.y && t.owner === hero.owner)
      if (town) {
        state.activeTownId = town.id
        refs.townScreen.current = createTownScreenState()
      }
    }
  }

  // Escape -> close screens
  if (input.keysJustPressed.has('Escape')) {
    if (state.activeTownId) {
      state.activeTownId = null
    }
  }

  return state
}

// =====================================================================
//  MAP INTERACTIONS (treasures, mines, enemies, objects)
// =====================================================================
export function checkMapInteraction(state: GameState, hero: Hero, x: number, y: number, refs: GameRefs, cb: GameCallbacks): GameState {
  // Pick up treasure
  const treasureIdx = state.treasures.findIndex(t => t.x === x && t.y === y)
  if (treasureIdx >= 0) {
    const treasure = state.treasures[treasureIdx]
    if (treasure.resources) {
      state.resources[hero.owner] = addResources(state.resources[hero.owner], treasure.resources)
      cb.pushNotification(`Found resources!`)
    }
    if (treasure.artifactId) {
      // Find empty equipment slot
      const slots = Object.keys(hero.equipment) as (keyof typeof hero.equipment)[]
      const emptySlot = slots.find(s => hero.equipment[s] === null)
      if (emptySlot) {
        hero.equipment[emptySlot] = treasure.artifactId!
        cb.pushNotification(`Found artifact: ${treasure.artifactId}`)
      }
    }
    if (treasure.resources && treasure.resources.gold) {
      cb.pushNotification(`Found ${treasure.resources.gold} gold!`)
    }
    state.treasures.splice(treasureIdx, 1)
  }

  // Capture mine
  const mine = state.mines.find(m => m.x === x && m.y === y)
  if (mine && mine.owner !== hero.owner) {
    // If mine has guards, fight them
    if (mine.guardArmy && mine.guardArmy.some(s => s !== null)) {
      state = startCombat(state, hero, mine.guardArmy.filter(Boolean) as CreatureStack[], `Mine Guard`, refs, cb)
      if (!state.combat) {
        // Combat resolved immediately (auto) -- capture
        mine.owner = hero.owner
        cb.pushNotification(`Captured ${mine.resourceType} mine!`)
      }
      return state
    }
    mine.owner = hero.owner
    cb.pushNotification(`Captured ${mine.resourceType} mine!`)
  }

  // Enter enemy town
  const town = state.towns.find(t => t.x === x && t.y === y)
  if (town && town.owner !== hero.owner) {
    // Fight garrison
    const garrison = town.garrison.filter(Boolean) as CreatureStack[]
    if (garrison.length > 0) {
      const isSiege = town.fortLevel > 0
      state = startCombat(state, hero, garrison, `Town ${town.name}`, refs, cb, isSiege ? town : undefined)
      if (!state.combat) {
        // Auto-resolved -- capture
        captureTown(state, town, hero, refs, cb)
      }
    } else {
      captureTown(state, town, hero, refs, cb)
    }
    return state
  }

  // Fight enemy hero
  const enemyHero = state.heroes.find(h => h.x === x && h.y === y && h.owner !== hero.owner)
  if (enemyHero) {
    state = startCombat(state, hero, enemyHero.army.filter(Boolean) as CreatureStack[], enemyHero.name, refs, cb)
    return state
  }

  // Map objects (shrines, wells, etc.)
  const objIdx = state.mapObjects.findIndex(o => o.x === x && o.y === y)
  if (objIdx >= 0) {
    const obj = state.mapObjects[objIdx]
    const vis = obj.visited
    if (typeof vis === 'object' ? !vis[hero.owner] : !vis) {
      state = interactWithMapObject(state, hero, obj, refs, cb)
      if (typeof obj.visited !== 'object') obj.visited = {} as Record<number, boolean>
      ;(obj.visited as Record<number, boolean>)[hero.owner] = true
    }
  }

  return state
}

export function interactWithMapObject(state: GameState, hero: Hero, obj: MapObject, refs: GameRefs, cb: GameCallbacks): GameState {
  switch (obj.type) {
    case 'well':
      hero.mana = Math.min(hero.mana + 10, hero.maxMana)
      cb.pushNotification('Mystic Well: +10 mana')
      break
    case 'shrine':
      // Learn a random spell
      if (obj.data?.spellId && !hero.spells.includes(obj.data.spellId)) {
        hero.spells.push(obj.data.spellId)
        cb.pushNotification(`Learned spell: ${obj.data.spellId}`)
      } else {
        cb.pushNotification('Shrine â€” spell already known')
      }
      break
    case 'wandering_army':
    case 'neutral_army':
      if (obj.army && obj.army.some(s => s !== null)) {
        state = startCombat(state, hero, obj.army.filter(Boolean) as CreatureStack[], obj.type === 'wandering_army' ? 'Wandering Army' : 'Neutral Guard', refs, cb)
        if (!state.combat) {
          const idx = state.mapObjects.indexOf(obj)
          if (idx >= 0) state.mapObjects.splice(idx, 1)
        }
      }
      break
    case 'obelisk':
      cb.pushNotification('Obelisk: Reveals part of the map')
      revealFog(state.map, hero.x, hero.y, 12, hero.owner)
      break
    case 'fountain':
      hero.movementPoints += 4
      cb.pushNotification('Fountain of Youth: +4 movement')
      break
    case 'arena':
      hero.attack += 1
      hero.defense += 1
      cb.pushNotification('Arena: +1 Attack, +1 Defense')
      break
    case 'learning_stone':
      hero.experience += 500
      cb.pushNotification('Learning Stone: +500 XP')
      break
    case 'windmill': {
      const gold = 300 + Math.floor(Math.random() * 400)
      state.resources[hero.owner].gold += gold
      cb.pushNotification(`Windmill: +${gold} gold`)
      break
    }
    case 'temple':
      cb.pushNotification('Temple: +2 Morale this week')
      // Morale effect (applied to creatures in army)
      for (const slot of hero.army) {
        if (slot) slot.morale = Math.min(slot.morale + 2, 3)
      }
      break
    case 'garden':
      hero.movementPoints += (obj.data?.movementBonus ?? 3)
      for (const slot of hero.army) {
        if (slot) slot.morale = Math.min(slot.morale + 1, 3)
      }
      cb.pushNotification('Garden: +3 movement, +1 Morale')
      break
    case 'witch_hut':
      if (obj.data?.skillId) {
        const existing = hero.skills.find(s => s.skillId === obj.data.skillId)
        if (!existing && hero.skills.length < 8) {
          hero.skills.push({ skillId: obj.data.skillId, name: obj.data.skillId, level: 1 })
          cb.pushNotification(`Witch Hut: Learned ${obj.data.skillId}!`)
        } else if (existing && existing.level < 3) {
          existing.level += 1
          cb.pushNotification(`Witch Hut: ${obj.data.skillId} upgraded to Lv${existing.level}!`)
        } else {
          cb.pushNotification('Witch Hut: Nothing new to learn')
        }
      }
      break
    case 'den':
      if (obj.army && obj.army.some(s => s !== null)) {
        state = startCombat(state, hero, obj.army.filter(Boolean) as CreatureStack[], 'Monster Den', refs, cb)
        // If combat won, gold reward is given in finishCombat via obj.data.goldReward
      } else {
        const reward = obj.data?.goldReward ?? 2000
        state.resources[hero.owner].gold += reward
        cb.pushNotification(`Monster Den: +${reward} gold!`)
      }
      break
    case 'dragon_utopia':
      if (obj.army && obj.army.some(s => s !== null)) {
        state = startCombat(state, hero, obj.army.filter(Boolean) as CreatureStack[], 'Dragon Utopia', refs, cb)
      } else {
        const reward = obj.data?.goldReward ?? 15000
        const xp = obj.data?.xpReward ?? 5000
        state.resources[hero.owner].gold += reward
        hero.experience += xp
        cb.pushNotification(`Dragon Utopia: +${reward} gold, +${xp} XP!`)
      }
      break
    case 'quest_hut':
      if (obj.data?.questComplete) {
        cb.pushNotification('Quest already completed!')
      } else if (obj.data?.questType) {
        const qt = obj.data.questType
        const target = obj.data.questTarget
        if (qt === 'collect_gold') {
          if (state.resources[hero.owner].gold >= target) {
            state.resources[hero.owner].gold -= target
            state.resources[hero.owner].gold += obj.data.questRewardGold || 0
            hero.experience += obj.data.questRewardXP || 0
            obj.data.questComplete = true
            cb.pushNotification(`Quest complete! +${obj.data.questRewardGold} gold, +${obj.data.questRewardXP} XP`)
          } else {
            cb.pushNotification(`Quest: Bring ${target} gold (you have ${state.resources[hero.owner].gold})`)
          }
        } else {
          // Display quest info
          cb.pushNotification(`Quest: ${qt.replace(/_/g, ' ')} â€” progress ${obj.data.questProgress ?? 0}/${target}`)
        }
      }
      break
    case 'prison':
      if (obj.data?.heroFaction) {
        // Rescue a hero â€” create a new hero for the player
        const newHero = createHero(obj.data.heroFaction, hero.owner, hero.x, hero.y)
        state.heroes.push(newHero)
        obj.data.heroFaction = null
        cb.pushNotification(`Rescued hero: ${newHero.name}!`)
      } else {
        cb.pushNotification('Prison is empty')
      }
      break
    case 'refugee_camp':
      if (obj.data?.creatureId && obj.data?.count > 0) {
        const emptySlot = hero.army.findIndex(s => s === null)
        const sameSlot = hero.army.findIndex(s => s && s.creatureId === obj.data.creatureId)
        if (sameSlot >= 0) {
          hero.army[sameSlot]!.count += obj.data.count
          cb.pushNotification(`Refugees joined: +${obj.data.count} ${obj.data.creatureId}`)
          obj.data.count = 0
        } else if (emptySlot >= 0) {
          const cDef = ALL_CREATURES[obj.data.creatureId]
          hero.army[emptySlot] = {
            creatureId: obj.data.creatureId,
            count: obj.data.count,
            statusEffects: [], morale: 0, luck: 0,
            hasActed: false, hasRetaliated: false,
            shotsLeft: cDef?.shots ?? 0,
          }
          cb.pushNotification(`Refugees joined: +${obj.data.count} ${obj.data.creatureId}`)
          obj.data.count = 0
        } else {
          cb.pushNotification('No empty army slots for refugees')
        }
      } else {
        cb.pushNotification('Refugee camp is empty')
      }
      break
    case 'tavern':
      cb.pushNotification('Tavern: +1 Morale')
      for (const slot of hero.army) {
        if (slot) slot.morale = Math.min(slot.morale + 1, 3)
      }
      break
    default:
      cb.pushNotification(`Visited ${obj.type}`)
  }
  return state
}

export function captureTown(state: GameState, town: Town, hero: Hero, _refs: GameRefs, cb: GameCallbacks) {
  const prevOwner = town.owner
  town.owner = hero.owner
  state.coins[hero.owner] += GEMS_PER_TOWN_CAPTURED
  cb.pushNotification(`Captured town: ${town.name}!`)
  state.eventLog.push(`${hero.name} captured ${town.name}`)

  // Mode-specific win conditions
  if (state.mode === 'king-of-hill') {
    // Win by holding all towns
    const allTowns = state.towns.every(t => t.owner === hero.owner)
    if (allTowns) {
      state.winner = hero.owner
      state.stars[state.winner] += STARS_PER_GAME_WON
    }
    return
  }

  if (state.mode === 'treasure-hunt') {
    // Win by accumulating 50000 gold
    if (state.resources[hero.owner].gold >= 50000) {
      state.winner = hero.owner
      state.stars[state.winner] += STARS_PER_GAME_WON
    }
    return
  }

  // Standard conquest/skirmish: eliminate opponents
  if (prevOwner >= 0) {
    const remainingTowns = state.towns.filter(t => t.owner === prevOwner)
    const remainingHeroes = state.heroes.filter(h => h.owner === prevOwner)
    if (remainingTowns.length === 0 && remainingHeroes.length === 0) {
      // Check if only one player remains with towns
      const playersWithTowns = new Set(state.towns.map(t => t.owner).filter(o => o >= 0))
      if (playersWithTowns.size === 1) {
        state.winner = [...playersWithTowns][0]
        state.stars[state.winner] += STARS_PER_GAME_WON
      }
    }
  }
}

// =====================================================================
//  COMBAT FLOW
// =====================================================================
export function startCombat(
  state: GameState,
  attackerHero: Hero,
  defenderArmy: CreatureStack[],
  defenderName: string,
  refs: GameRefs,
  cb: GameCallbacks,
  siegeTown?: Town,
): GameState {
  const defenderHero = state.heroes.find(
    h => h.owner !== attackerHero.owner &&
         h.x === attackerHero.x && h.y === attackerHero.y
  ) || null

  const combat = initCombat(
    attackerHero.army.filter(Boolean) as CreatureStack[],
    defenderArmy,
    attackerHero,
    defenderHero,
    !!siegeTown
  )

  state.combat = combat
  state.turn.phase = 'combat'
  refs.combatUI.current = { hoveredCell: null, selectedAction: null, selectedSpellId: null, autoCombat: false }
  cb.pushNotification(`Combat with ${defenderName}!`)
  return state
}

export function processCombatInput(state: GameState, _now: number, refs: GameRefs, cb: GameCallbacks): GameState {
  if (!state.combat) return state
  const input = refs.input.current
  const combat = state.combat
  const activeStack = getActiveStack(combat)

  if (!activeStack) {
    // Combat might be over
    return finishCombat(state, refs, cb)
  }

  // Check if active stack belongs to AI
  const isAI = activeStack.side === 'defender'
    ? state.heroes.find(h => h.x === state.heroes[0]?.x && h.y === state.heroes[0]?.y && h.owner !== state.turn.currentPlayer) != null
      || state.turn.currentPlayer >= state.humanCount
    : state.turn.currentPlayer >= state.humanCount

  if (isAI) {
    // AI combat action (speed-adjusted delay)
    const aiDelay = Math.max(50, AI_THINK_DELAY_MS / (state.combatSpeed || 1))
    if (_now - refs.lastAI.current > aiDelay) {
      const hero = activeStack.side === 'attacker'
        ? state.heroes.find(h => h.owner === state.turn.currentPlayer)
        : null
      const action = aiCombatAction(activeStack, combat.stacks, hero || null)
      state.combat = executeAction(combat, action, getAttackerHero(state), getDefenderHero(state))
      state.combat = advanceActiveStack(state.combat)
      refs.lastAI.current = _now

      // Check if combat is over
      const alive = state.combat.stacks.filter(s => s.count > 0)
      const attackerAlive = alive.some(s => s.side === 'attacker')
      const defenderAlive = alive.some(s => s.side === 'defender')
      if (!attackerAlive || !defenderAlive) {
        return finishCombat(state, refs, cb)
      }
    }
    return state
  }

  // Human player combat input
  // Mouse hover on combat grid
  if (input.mouseX > 0 && input.mouseY > 0) {
    const gridOff = getCombatGridOffset()
    const tile = screenToCombatTile(input.mouseX, input.mouseY, gridOff.x, gridOff.y, COMBAT_TILE)
    refs.combatUI.current.hoveredCell = tile
  }

  // Mouse click on combat control buttons
  if (input.mouseJustClicked) {
    const mx = input.mouseX
    const my = input.mouseY
    const btnY = CANVAS_H - 28
    const btnH = 22
    const btnW = 75
    if (my >= btnY && my <= btnY + btnH) {
      // Auto button
      if (mx >= CANVAS_W - 330 && mx <= CANVAS_W - 330 + btnW) {
        refs.combatUI.current.autoCombat = !refs.combatUI.current.autoCombat
        cb.pushNotification(refs.combatUI.current.autoCombat ? 'Auto-combat ON' : 'Auto-combat OFF')
        input.mouseJustClicked = false
        return state
      }
      // Speed button
      if (mx >= CANVAS_W - 250 && mx <= CANVAS_W - 250 + btnW) {
        const speeds = [1, 2, 4]
        const idx = speeds.indexOf(state.combatSpeed)
        state.combatSpeed = speeds[(idx + 1) % speeds.length]
        cb.pushNotification(`Combat speed: ${state.combatSpeed}x`)
        input.mouseJustClicked = false
        return state
      }
      // Skip button
      if (mx >= CANVAS_W - 170 && mx <= CANVAS_W - 170 + btnW) {
        input.mouseJustClicked = false
        const combatResult = autoResolveCombat(
          state.heroes.find(h => h.owner === state.turn.currentPlayer)!,
          null,
          state.heroes.find(h => h.owner === state.turn.currentPlayer)!.army.filter(Boolean) as CreatureStack[],
          combat.stacks.filter((s: CombatStack) => s.side === 'defender' && s.count > 0).map((s: CombatStack) => ({
            creatureId: s.creatureId, count: s.count
          })) as CreatureStack[]
        )
        const resolved = resolveCombat(combatResult)
        return applyAutoResolveResult(state, resolved, refs, cb)
      }
      // Flee button
      if (mx >= CANVAS_W - 90 && mx <= CANVAS_W - 90 + btnW) {
        input.mouseJustClicked = false
        const action: CombatAction = { type: 'flee' }
        state.combat = executeAction(combat, action, getAttackerHero(state), getDefenderHero(state))
        return finishCombat(state, refs, cb)
      }
    }
  }

  // Click to execute action
  if (input.mouseJustClicked && refs.combatUI.current.hoveredCell) {
    const hc = refs.combatUI.current.hoveredCell
    const reachable = getReachableCells(activeStack, combat.stacks, combat.siege)

    // Check if clicking an enemy -- attack/shoot
    const targetStack = combat.stacks.find(
      s => s.x === hc.col && s.y === hc.row && s.count > 0 && s.side !== activeStack.side
    )

    if (targetStack) {
      // Attack or shoot
      const isAdjacent = Math.abs(activeStack.x - hc.col) <= 1 && Math.abs(activeStack.y - hc.row) <= 1
      const creature = ALL_CREATURES[activeStack.creatureId]
      if (creature?.abilities?.includes('ranged') && activeStack.shotsLeft > 0) {
        const action: CombatAction = { type: 'shoot', targetStackId: targetStack.id, targetX: hc.col, targetY: hc.row }
        state.combat = executeAction(combat, action, getAttackerHero(state), getDefenderHero(state))
      } else if (isAdjacent) {
        const action: CombatAction = { type: 'attack', targetStackId: targetStack.id, targetX: hc.col, targetY: hc.row }
        state.combat = executeAction(combat, action, getAttackerHero(state), getDefenderHero(state))
      } else {
        // Move adjacent then attack -- find nearest reachable cell adjacent to target
        const adjacentCells = [
          { x: hc.col - 1, y: hc.row }, { x: hc.col + 1, y: hc.row },
          { x: hc.col, y: hc.row - 1 }, { x: hc.col, y: hc.row + 1 },
          { x: hc.col - 1, y: hc.row - 1 }, { x: hc.col + 1, y: hc.row - 1 },
          { x: hc.col - 1, y: hc.row + 1 }, { x: hc.col + 1, y: hc.row + 1 },
        ]
        const moveTo = adjacentCells.find(c => reachable.has(`${c.x},${c.y}`))
        if (moveTo) {
          const action: CombatAction = { type: 'attack', targetStackId: targetStack.id, targetX: moveTo.x, targetY: moveTo.y }
          state.combat = executeAction(combat, action, getAttackerHero(state), getDefenderHero(state))
        }
      }
    } else if (reachable.has(`${hc.col},${hc.row}`)) {
      // Move to empty cell
      const action: CombatAction = { type: 'move', targetX: hc.col, targetY: hc.row }
      state.combat = executeAction(combat, action, getAttackerHero(state), getDefenderHero(state))
    }

    // Advance to next stack
    if (state.combat) {
      state.combat = advanceActiveStack(state.combat)
      // Check combat over
      const alive = state.combat.stacks.filter(s => s.count > 0)
      if (!alive.some(s => s.side === 'attacker') || !alive.some(s => s.side === 'defender')) {
        return finishCombat(state, refs, cb)
      }
    }
  }

  // Keyboard shortcuts in combat
  if (input.keysJustPressed.has('w') || input.keysJustPressed.has('W')) {
    // Wait
    const action: CombatAction = { type: 'wait' }
    state.combat = executeAction(combat, action, getAttackerHero(state), getDefenderHero(state))
    state.combat = advanceActiveStack(state.combat)
  }
  if (input.keysJustPressed.has('d') || input.keysJustPressed.has('D')) {
    // Defend
    const action: CombatAction = { type: 'defend' }
    state.combat = executeAction(combat, action, getAttackerHero(state), getDefenderHero(state))
    state.combat = advanceActiveStack(state.combat)
  }
  if (input.keysJustPressed.has('f') || input.keysJustPressed.has('F')) {
    // Flee
    const action: CombatAction = { type: 'flee' }
    state.combat = executeAction(combat, action, getAttackerHero(state), getDefenderHero(state))
    return finishCombat(state, refs, cb)
  }
  if (input.keysJustPressed.has('a') || input.keysJustPressed.has('A')) {
    // Auto-resolve instantly
    const combatResult = autoResolveCombat(
      state.heroes.find(h => h.owner === state.turn.currentPlayer)!,
      null,
      state.heroes.find(h => h.owner === state.turn.currentPlayer)!.army.filter(Boolean) as CreatureStack[],
      combat.stacks.filter((s: CombatStack) => s.side === 'defender' && s.count > 0).map((s: CombatStack) => ({
        creatureId: s.creatureId, count: s.count
      })) as CreatureStack[]
    )
    const resolved = resolveCombat(combatResult)
    return applyAutoResolveResult(state, resolved, refs, cb)
  }
  // Toggle auto-combat (let AI fight for you turn by turn)
  if (input.keysJustPressed.has('q') || input.keysJustPressed.has('Q')) {
    refs.combatUI.current.autoCombat = !refs.combatUI.current.autoCombat
    cb.pushNotification(refs.combatUI.current.autoCombat ? 'Auto-combat ON (Q to toggle)' : 'Auto-combat OFF')
  }
  // Speed toggle: S key cycles 1x -> 2x -> 4x -> 1x
  if (input.keysJustPressed.has('s') || input.keysJustPressed.has('S')) {
    const speeds = [1, 2, 4]
    const idx = speeds.indexOf(state.combatSpeed)
    state.combatSpeed = speeds[(idx + 1) % speeds.length]
    cb.pushNotification(`Combat speed: ${state.combatSpeed}x`)
  }

  // Auto-combat: let AI decide for human player's stacks too
  if (refs.combatUI.current.autoCombat && activeStack.side === 'attacker' && state.turn.currentPlayer < state.humanCount) {
    const hero = state.heroes.find(h => h.owner === state.turn.currentPlayer) || null
    const action = aiCombatAction(activeStack, combat.stacks, hero)
    state.combat = executeAction(combat, action, getAttackerHero(state), getDefenderHero(state))
    state.combat = advanceActiveStack(state.combat)

    const alive = state.combat.stacks.filter(s => s.count > 0)
    if (!alive.some(s => s.side === 'attacker') || !alive.some(s => s.side === 'defender')) {
      return finishCombat(state, refs, cb)
    }
    return state
  }

  // Combat speed: skip mouse input handling if speed > 1 (AI handles faster)
  if (state.combatSpeed > 1 && refs.combatUI.current.autoCombat) {
    return state
  }

  return state
}

export function getAttackerHero(state: GameState): Hero | null {
  return state.heroes.find(h => h.owner === state.turn.currentPlayer) || null
}

export function getDefenderHero(state: GameState): Hero | null {
  // Find defending hero (enemy at same position)
  const attacker = getAttackerHero(state)
  if (!attacker) return null
  return state.heroes.find(
    h => h.owner !== state.turn.currentPlayer && h.x === attacker.x && h.y === attacker.y
  ) || null
}

export function finishCombat(state: GameState, refs: GameRefs, cb: GameCallbacks): GameState {
  if (!state.combat) return state
  const result = resolveCombat(state.combat)
  const attackerHero = getAttackerHero(state)

  if (attackerHero && result.winner === 'attacker') {
    // Update attacker army
    attackerHero.army = stacksToArmy(state.combat.stacks, 'attacker')
    // Award XP
    attackerHero.experience += result.xpGained
    state.resources[attackerHero.owner].gold += result.loot.gold
    state.coins[attackerHero.owner] += COINS_PER_BATTLE_WON
    cb.pushNotification(`Victory! +${result.xpGained} XP, +${result.loot.gold} gold`)

    // Level up check
    while (canLevelUp(attackerHero)) {
      const choices = generateLevelUpChoices(attackerHero)
      if (choices.length > 0) {
        if (attackerHero.owner < state.humanCount) {
          // Show level-up choice UI for human players
          state.pendingLevelUp = { heroId: attackerHero.id, choices }
          cb.pushNotification(`${attackerHero.name} leveled up! Choose a bonus.`)
          break // Wait for player to pick
        } else {
          // AI auto-picks first choice
          const updated = applyLevelUp(attackerHero, choices[0])
          Object.assign(attackerHero, updated)
        }
      } else {
        break
      }
    }

    // Handle captured mines/towns after combat
    const mine = state.mines.find(m => m.x === attackerHero.x && m.y === attackerHero.y)
    if (mine && mine.owner !== attackerHero.owner) {
      mine.owner = attackerHero.owner
      mine.guardArmy = null
      cb.pushNotification(`Captured ${mine.resourceType} mine!`)
    }

    const town = state.towns.find(t => t.x === attackerHero.x && t.y === attackerHero.y && t.owner !== attackerHero.owner)
    if (town) {
      captureTown(state, town, attackerHero, refs, cb)
      town.garrison = stacksToArmy(state.combat.stacks, 'defender')
    }

    // Remove defeated enemy hero
    const defenderHero = getDefenderHero(state)
    if (defenderHero) {
      state.heroes = state.heroes.filter(h => h.id !== defenderHero.id)
    }

    // Remove map object (wandering army)
    const objIdx = state.mapObjects.findIndex(o => o.x === attackerHero.x && o.y === attackerHero.y && o.type === 'wandering_army')
    if (objIdx >= 0) state.mapObjects.splice(objIdx, 1)

  } else if (attackerHero && result.winner === 'defender') {
    // Attacker lost
    cb.pushNotification(`Defeat! ${attackerHero.name} has fallen.`)
    state.heroes = state.heroes.filter(h => h.id !== attackerHero.id)

    // Check if player has any heroes/towns left
    const pHeroes = state.heroes.filter(h => h.owner === attackerHero.owner)
    const pTowns = state.towns.filter(t => t.owner === attackerHero.owner)
    if (pHeroes.length === 0 && pTowns.length === 0) {
      // Player eliminated
      state.eventLog.push(`Player ${attackerHero.owner + 1} eliminated!`)
      const playersWithTowns = new Set(state.towns.map(t => t.owner).filter(o => o >= 0))
      if (playersWithTowns.size === 1) {
        state.winner = [...playersWithTowns][0]
        state.stars[state.winner] += STARS_PER_GAME_WON
      }
    }
  }

  state.combat = null
  state.turn.phase = 'hero_move'
  cb.updateScoreboard(state)
  return state
}

export function applyAutoResolveResult(state: GameState, result: CombatResult, _refs: GameRefs, cb: GameCallbacks): GameState {
  const attackerHero = getAttackerHero(state)
  if (!attackerHero) { state.combat = null; return state }

  if (result.winner === 'attacker') {
    // Reduce army based on losses
    for (const loss of result.attackerLosses) {
      const slot = attackerHero.army.find(s => s && s.creatureId === loss.creatureId)
      if (slot) {
        slot.count = Math.max(0, slot.count - loss.lost)
        if (slot.count === 0) {
          const idx = attackerHero.army.indexOf(slot)
          attackerHero.army[idx] = null
        }
      }
    }
    attackerHero.experience += result.xpGained
    state.resources[attackerHero.owner].gold += result.loot.gold
    state.coins[attackerHero.owner] += COINS_PER_BATTLE_WON
    cb.pushNotification(`Auto-resolve victory! +${result.xpGained} XP`)
  } else {
    cb.pushNotification(`Auto-resolve defeat! ${attackerHero.name} fallen.`)
    state.heroes = state.heroes.filter(h => h.id !== attackerHero.id)
  }

  state.combat = null
  state.turn.phase = 'hero_move'
  cb.updateScoreboard(state)
  return state
}

// =====================================================================
//  LEVEL-UP CHOICE UI
// =====================================================================
export function processLevelUpInput(state: GameState, _now: number, refs: GameRefs, cb: GameCallbacks): GameState {
  if (!state.pendingLevelUp) return state
  const input = refs.input.current
  const hero = state.heroes.find(h => h.id === state.pendingLevelUp!.heroId)
  if (!hero) { state.pendingLevelUp = null; return state }

  const choices = state.pendingLevelUp.choices

  // Keyboard: 1 or 2 to pick
  if (input.keysJustPressed.has('1') && choices.length >= 1) {
    const updated = applyLevelUp(hero, choices[0])
    Object.assign(hero, updated)
    cb.pushNotification(`Level ${hero.level}! ${describeLevelUpChoice(choices[0])}`)
    state.pendingLevelUp = null
    // Check if another level-up is pending
    if (canLevelUp(hero)) {
      const newChoices = generateLevelUpChoices(hero)
      if (newChoices.length > 0) {
        state.pendingLevelUp = { heroId: hero.id, choices: newChoices }
      }
    }
    return state
  }
  if (input.keysJustPressed.has('2') && choices.length >= 2) {
    const updated = applyLevelUp(hero, choices[1])
    Object.assign(hero, updated)
    cb.pushNotification(`Level ${hero.level}! ${describeLevelUpChoice(choices[1])}`)
    state.pendingLevelUp = null
    if (canLevelUp(hero)) {
      const newChoices = generateLevelUpChoices(hero)
      if (newChoices.length > 0) {
        state.pendingLevelUp = { heroId: hero.id, choices: newChoices }
      }
    }
    return state
  }

  // Mouse click on choice buttons
  if (input.mouseJustClicked) {
    const mx = input.mouseX
    const my = input.mouseY
    // Choice buttons are rendered at cx-180 and cx+20, cy+40, w=160, h=80
    const cx = CANVAS_W / 2
    const cy = CANVAS_H / 2

    if (choices.length >= 1 && mx >= cx - 180 && mx <= cx - 20 && my >= cy + 10 && my <= cy + 90) {
      const updated = applyLevelUp(hero, choices[0])
      Object.assign(hero, updated)
      cb.pushNotification(`Level ${hero.level}! ${describeLevelUpChoice(choices[0])}`)
      state.pendingLevelUp = null
      if (canLevelUp(hero)) {
        const newChoices = generateLevelUpChoices(hero)
        if (newChoices.length > 0) {
          state.pendingLevelUp = { heroId: hero.id, choices: newChoices }
        }
      }
      return state
    }
    if (choices.length >= 2 && mx >= cx + 20 && mx <= cx + 180 && my >= cy + 10 && my <= cy + 90) {
      const updated = applyLevelUp(hero, choices[1])
      Object.assign(hero, updated)
      cb.pushNotification(`Level ${hero.level}! ${describeLevelUpChoice(choices[1])}`)
      state.pendingLevelUp = null
      if (canLevelUp(hero)) {
        const newChoices = generateLevelUpChoices(hero)
        if (newChoices.length > 0) {
          state.pendingLevelUp = { heroId: hero.id, choices: newChoices }
        }
      }
      return state
    }
  }

  return state
}

export function describeLevelUpChoice(choice: LevelUpChoice): string {
  if (choice.type === 'primary') {
    return `+${choice.primaryAmount} ${choice.primaryStat}`
  } else {
    return `${choice.secondarySkillId} Lv${choice.secondaryLevel}`
  }
}

// =====================================================================
//  TOWN SCREEN INPUT
// =====================================================================
export function processTownInput(state: GameState, _now: number, refs: GameRefs, cb: GameCallbacks): GameState {
  if (!state.activeTownId) return state
  const input = refs.input.current
  const town = state.towns.find(t => t.id === state.activeTownId)
  if (!town) { state.activeTownId = null; return state }

  const hero = state.heroes.find(h => h.x === town.x && h.y === town.y && h.owner === town.owner) || null
  const tss = refs.townScreen.current

  if (input.keysJustPressed.has('Escape')) {
    state.activeTownId = null
    return state
  }

  if (!input.mouseJustClicked) return state

  const mx = input.mouseX
  const my = input.mouseY

  // Tab buttons
  const tabs = ['buildings', 'recruit', 'army', 'market', 'info'] as const
  const tabPositions = [
    { x: 8, y: 42, w: 85 }, { x: 98, y: 42, w: 75 },
    { x: 178, y: 42, w: 65 }, { x: 248, y: 42, w: 70 },
    { x: 323, y: 42, w: 60 },
  ]
  for (let i = 0; i < tabs.length; i++) {
    const tp = tabPositions[i]
    if (mx >= tp.x && mx <= tp.x + tp.w && my >= 42 && my <= 64) {
      tss.tab = tabs[i]
      return state
    }
  }

  // Close button (top-right)
  if (mx >= CANVAS_W - 30 && my <= 30) {
    state.activeTownId = null
    return state
  }

  // Tab-specific actions
  if (tss.tab === 'buildings') {
    state = processTownBuildingsClick(state, town, mx, my, refs, cb)
  } else if (tss.tab === 'recruit') {
    state = processTownRecruitClick(state, town, hero, mx, my, refs, cb)
  }

  return state
}

export function processTownBuildingsClick(state: GameState, town: Town, mx: number, my: number, refs: GameRefs, cb: GameCallbacks): GameState {
  const tss = refs.townScreen.current
  // Buildings are displayed in a grid starting at y=72
  // Each building card is ~130x55, 4 per row
  const startY = 72
  const cardW = 130
  const cardH = 55
  const gap = 8
  const cols = 4

  const buildings = town.buildings || []
  const builtIds = new Set(buildings.map(b => b.buildingId))
  const allAvailable = Object.values(ALL_BUILDINGS).filter(
    (b: BuildingDef) => !builtIds.has(b.id) && (b.factions === 'all' || (Array.isArray(b.factions) && b.factions.includes(town.faction)))
  )

  // Check if clicked on an available building in the right panel (details + build button)
  if (tss.selectedBuildingId) {
    // Build button at approx x: 580, y: startY + 200, w: 120, h: 30
    if (mx >= 580 && mx <= 700 && my >= startY + 200 && my <= startY + 230) {
      const res = state.resources[state.turn.currentPlayer]
      const result = purchaseBuilding(town, tss.selectedBuildingId, res)
      if (result.success) {
        Object.assign(town, result.town)
        state.resources[state.turn.currentPlayer] = result.resources
        cb.pushNotification(`Built ${tss.selectedBuildingId}!`)
      } else {
        cb.pushNotification('Cannot build â€” check resources/prerequisites')
      }
      return state
    }
  }

  // Click on a building card to select it
  for (let i = 0; i < allAvailable.length; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const bx = 8 + col * (cardW + gap)
    const by = startY + row * (cardH + gap)
    if (mx >= bx && mx <= bx + cardW && my >= by && my <= by + cardH) {
      tss.selectedBuildingId = allAvailable[i].id
      return state
    }
  }

  return state
}

export function processTownRecruitClick(state: GameState, town: Town, hero: Hero | null, mx: number, my: number, refs: GameRefs, cb: GameCallbacks): GameState {
  const tss = refs.townScreen.current
  // Creature list is on the left; recruit button on the right
  if (tss.selectedCreatureId && hero) {
    // Recruit button area: x: 580, y: 200, w: 120, h: 30
    if (mx >= 580 && mx <= 700 && my >= 200 && my <= 230) {
      const result = recruitCreatures(town, tss.selectedCreatureId!, tss.recruitCount, hero.army)
      if (canAfford(state.resources[hero.owner], result.cost)) {
        hero.army = result.army
        Object.assign(town, result.town)
        state.resources[hero.owner] = subtractResources(state.resources[hero.owner], result.cost)
        cb.pushNotification(`Recruited ${tss.recruitCount}x ${tss.selectedCreatureId}`)
      } else {
        cb.pushNotification('Cannot afford recruitment')
      }
      return state
    }
  }

  // Click on creature in list
  const creatures = town.creaturePool || []
  for (let i = 0; i < creatures.length; i++) {
    const cy = 80 + i * 40
    if (mx >= 8 && mx <= 300 && my >= cy && my <= cy + 36) {
      tss.selectedCreatureId = creatures[i]?.creatureId || null
      tss.recruitCount = 1
      return state
    }
  }

  return state
}

// =====================================================================
//  TURN MANAGEMENT
// =====================================================================
export function endPlayerTurn(state: GameState, refs: GameRefs, cb: GameCallbacks): GameState {
  const currentPlayer = state.turn.currentPlayer
  const nextPlayer = currentPlayer + 1

  if (nextPlayer < state.totalPlayers) {
    // Next player's turn
    state.turn.currentPlayer = nextPlayer

    if (nextPlayer >= state.humanCount) {
      // AI turn
      state = runAITurn(state, nextPlayer, refs, cb)
    } else {
      // Next human player
      const hero = state.heroes.find(h => h.owner === nextPlayer)
      if (hero) {
        refs.selectedHero.current = hero.id
        refs.camera.current = clampCamera(
          centerCameraOnHero(hero, state.map.cols, state.map.rows),
          state.map.cols, state.map.rows
        )
      }
    }
    return state
  }

  // All players have acted -> new day
  return advanceDay(state, refs, cb)
}

export function runAITurn(state: GameState, playerId: number, refs: GameRefs, cb: GameCallbacks): GameState {
  const plan = planAITurn(state, playerId)

  // Execute building
  for (const buildAction of plan.buildActions) {
    const town = state.towns.find(t => t.id === buildAction.townId)
    if (town) {
      const res = state.resources[playerId]
      const result = purchaseBuilding(town, buildAction.buildingId, res)
      if (result.success) {
        Object.assign(town, result.town)
        state.resources[playerId] = result.resources
      }
    }
  }

  // Execute recruitment
  for (const recruit of plan.recruitActions) {
    const town = state.towns.find(t => t.id === recruit.townId)
    const hero = state.heroes.find(h => h.owner === playerId)
    if (town && hero) {
      const result = recruitCreatures(town, recruit.creatureId, recruit.count, hero.army)
      hero.army = result.army
      Object.assign(town, result.town)
      state.resources[playerId] = subtractResources(state.resources[playerId], result.cost)
    }
  }

  // Execute hero movement
  for (const heroAction of plan.heroActions) {
    const hero = state.heroes.find(h => h.id === heroAction.heroId)
    if (hero && heroAction.actions.length > 0) {
      for (const action of heroAction.actions) {
        if (hero.movementPoints <= 0) break
        const tx = action.targetX
        const ty = action.targetY
        const terrain = state.map.cells[ty][tx].terrain
        const cost = getMovementCost(terrain, 0)
        if (hero.movementPoints >= cost && isPassable(state.map, tx, ty)) {
          hero.x = tx
          hero.y = ty
          hero.movementPoints -= cost
          revealFog(state.map, tx, ty, calcVisionRange(hero), hero.owner)

          // Check interactions
          state = checkMapInteraction(state, hero, tx, ty, refs, cb)
          if (state.combat) {
            // Auto-resolve AI combats
            const aiCombatState = autoResolveCombat(
              hero,
              null,
              hero.army.filter(Boolean) as CreatureStack[],
              state.combat.stacks.filter((s: CombatStack) => s.side === 'defender' && s.count > 0).map((s: CombatStack) => ({
                creatureId: s.creatureId, count: s.count
              })) as CreatureStack[]
            )
            const aiResult = resolveCombat(aiCombatState)
            state = applyAutoResolveResult(state, aiResult, refs, cb)
            if (!state.heroes.includes(hero)) break // Hero died
          }
        }
      }
    }
  }

  // Move to next player or new day
  const nextPlayer = playerId + 1
  if (nextPlayer < state.totalPlayers) {
    state.turn.currentPlayer = nextPlayer
    if (nextPlayer >= state.humanCount) {
      return runAITurn(state, nextPlayer, refs, cb)
    }
  } else {
    state = advanceDay(state, refs, cb)
  }

  return state
}

export function advanceDay(state: GameState, refs: GameRefs, cb: GameCallbacks): GameState {
  state.turn.currentPlayer = 0
  state.turn.day += 1

  // Daily income
  for (let p = 0; p < state.totalPlayers; p++) {
    const income = calcDailyIncome(
      state.towns.filter(t => t.owner === p),
      state.mines.filter(m => m.owner === p),
      state.heroes.filter(h => h.owner === p)
    )
    state.resources[p] = addResources(state.resources[p], income)
  }

  // Reset hero movement
  for (const hero of state.heroes) {
    const reset = resetHeroDaily(hero)
    Object.assign(hero, reset)
  }

  // Check for new week
  if (state.turn.day > 7) {
    state.turn.day = 1
    state.turn.week += 1
    cb.pushNotification(`Week ${state.turn.week} begins!`)

    // Weekly creature growth
    for (const town of state.towns) {
      const updated = applyWeeklyGrowth(town)
      Object.assign(town, updated)
    }

    // Check for new month
    if (state.turn.week > 4) {
      state.turn.week = 1
      state.turn.month += 1
      cb.pushNotification(`Month ${state.turn.month} begins!`)
    }
  }

  // Select first human hero
  const hero = state.heroes.find(h => h.owner === 0)
  if (hero) {
    refs.selectedHero.current = hero.id
    refs.camera.current = clampCamera(
      centerCameraOnHero(hero, state.map.cols, state.map.rows),
      state.map.cols, state.map.rows
    )
  }

  state.eventLog.push(`Day ${state.turn.day}, Week ${state.turn.week}, Month ${state.turn.month}`)

  // Survival mode: spawn hostile creatures every week
  if (state.mode === 'survival' && state.turn.day === 1) {
    const waveStr = state.turn.week * 3
    const tier = Math.min(7, 1 + Math.floor(state.turn.week / 2))
    const creatures = Object.values(ALL_CREATURES).filter(c => c.tier <= tier)
    if (creatures.length > 0) {
      const creature = creatures[Math.floor(Math.random() * creatures.length)]
      // Spawn near a random map edge
      const edge = Math.floor(Math.random() * 4)
      let sx: number, sy: number
      switch (edge) {
        case 0: sx = 0; sy = Math.floor(Math.random() * state.map.rows); break
        case 1: sx = state.map.cols - 1; sy = Math.floor(Math.random() * state.map.rows); break
        case 2: sx = Math.floor(Math.random() * state.map.cols); sy = 0; break
        default: sx = Math.floor(Math.random() * state.map.cols); sy = state.map.rows - 1; break
      }
      if (state.map.cells[sy]?.[sx]?.terrain !== 'water' && state.map.cells[sy]?.[sx]?.terrain !== 'mountain') {
        const waveArmy: (CreatureStack | null)[] = Array(7).fill(null)
        waveArmy[0] = {
          creatureId: creature.id, count: waveStr,
          statusEffects: [], morale: 0, luck: 0, hasActed: false, hasRetaliated: false, shotsLeft: creature.shots,
        }
        state.mapObjects.push({
          id: `wave_${state.turn.week}_${Math.floor(Math.random() * 999)}`,
          type: 'neutral_army',
          x: sx, y: sy,
          army: waveArmy,
          visited: false,
          data: { isWave: true },
        })
        if (state.map.cells[sy]?.[sx]) {
          state.map.cells[sy][sx].objectId = state.mapObjects[state.mapObjects.length - 1].id
        }
        cb.pushNotification(`Hostile army spotted near ${['West', 'East', 'North', 'South'][edge]} edge!`)
      }
    }
  }

  cb.updateScoreboard(state)
  return state
}
