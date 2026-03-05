import type { GameConfig } from '../../pages/games/mini/types'
import type { PlayerSlot } from '../../pages/games/mini/types'
import type {
  GameState, FactionId, Hero, AIDifficulty, AIPlayerState, ResourceBundle,
  GameSetupConfig, PlayerSetupSlot,
} from './types'
import { createHero, calcVisionRange } from './heroes'
import { getStartingResources } from './economy'
import { generateWorldMap, revealFog } from './mapGenerator'
import { FACTION_BONUSES } from './factionBonuses'

export function initGameState(players: PlayerSlot[], config: GameConfig): GameState {
  const setup = config.setupConfig as GameSetupConfig | undefined
  const humanCount = setup
    ? setup.players.filter((p: PlayerSetupSlot) => p.type === 'human').length
    : players.length
  const mode = (setup?.gameMode === 'campaign' ? 'coop-campaign' : (setup?.gameMode || config.gameMode as string)) || 'conquest'
  const difficulty = (setup?.difficulty || config.difficulty as AIDifficulty) || 'normal'
  const mapSize = (setup?.mapSize || config.mapSize as 'small' | 'medium' | 'large') || 'medium'

  // Player count depends on mode / setup
  let totalPlayers: number
  if (setup) {
    totalPlayers = setup.players.length
  } else if (mode === 'coop-campaign') {
    totalPlayers = 2
  } else if (mode === 'survival') {
    totalPlayers = Math.max(2, humanCount + 3) // more AI enemies in survival
  } else {
    totalPlayers = Math.max(2, humanCount + 1)
  }

  // Assign factions — from setup config or default pool
  const factionPool: FactionId[] = ['castle', 'wilds', 'rampart', 'tower', 'inferno', 'necropolis', 'dungeon']
  const factions: FactionId[] = []
  for (let i = 0; i < totalPlayers; i++) {
    if (setup && setup.players[i]) {
      factions.push(setup.players[i].faction)
    } else {
      factions.push(factionPool[i % factionPool.length])
    }
  }

  // Generate world map
  const { map, towns, mines, treasures, mapObjects, heroStartPositions } = generateWorldMap({
    mapSizeKey: mapSize,
    playerCount: totalPlayers,
    factions,
    seed: config.seed ?? Math.floor(Math.random() * 999999),
  })

  // Create heroes for each player
  const heroes: Hero[] = []
  for (let i = 0; i < totalPlayers; i++) {
    const startPos = heroStartPositions[i] || { x: 2, y: 2 }
    const hero = createHero(factions[i], i, startPos.x, startPos.y)
    heroes.push(hero)
    revealFog(map, startPos.x, startPos.y, calcVisionRange(hero), i)
  }

  // Set up resources (apply faction bonuses)
  const resources: ResourceBundle[] = []
  for (let i = 0; i < totalPlayers; i++) {
    const base = getStartingResources()
    const bonus = FACTION_BONUSES[factions[i]]
    if (bonus) {
      base.gold = Math.round(base.gold * bonus.startingResourceMult)
      base.wood = Math.round(base.wood * bonus.startingResourceMult)
      base.ore = Math.round(base.ore * bonus.startingResourceMult)
    }
    resources.push(base)
  }

  // AI states for non-human players
  const actualHumanCount = setup
    ? setup.players.filter((p: PlayerSetupSlot) => p.type === 'human').length
    : humanCount
  const aiStates: AIPlayerState[] = []
  for (let i = actualHumanCount; i < totalPlayers; i++) {
    const aiDifficulty = (setup?.players[i]?.difficulty as AIDifficulty) || difficulty
    aiStates.push({
      playerIndex: i,
      difficulty: aiDifficulty,
      targetTownId: null,
      targetHeroId: null,
      exploredTiles: new Set(),
    })
  }

  // Coins / gems / stars for meta progression
  const coins = new Array(totalPlayers).fill(0)
  const metaGems = new Array(totalPlayers).fill(0)
  const stars = new Array(totalPlayers).fill(0)

  return {
    map,
    heroes,
    towns,
    mines,
    treasures,
    mapObjects,
    resources,
    coins,
    metaGems,
    stars,
    turn: {
      currentPlayer: 0,
      day: 1,
      week: 1,
      month: 1,
      phase: 'hero_move',
    },
    combat: null,
    activeTownId: null,
    activeHeroId: null,
    winner: null,
    aiStates,
    mode: mode as GameState['mode'],
    difficulty,
    humanCount: actualHumanCount,
    totalPlayers,
    mapSize,
    trades: [],
    eventLog: ['Game started! Move your hero to explore the map.'],
    pendingLevelUp: null,
    combatSpeed: 1,
  }
}
