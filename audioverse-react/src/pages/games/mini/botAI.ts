/**
 * Bot AI framework for mini-games.
 *
 * Provides a `BotInput` that mimics a human player input and a `BotBrain`
 * interface that game-specific AI implementations fulfil.
 *
 * Bots are created as additional PlayerSlots whose InputSource has
 * type `'bot'` and whose brain ticks every game frame.
 */
import type { GameConfig, PlayerSlot, InputSource } from './types'
import { PLAYER_COLORS } from './types'

// ── Types ──────────────────────────────────────────────────

export type BotDifficulty = 'easy' | 'normal' | 'hard'

/** Direction a bot wants to move */
export interface BotMove {
  dx: number   // -1 left, 0 none, 1 right
  dy: number   // -1 up, 0 none, 1 down
  action: boolean  // primary action (A / Space)
  action2?: boolean // secondary action (B / Shift)
}

/** Readonly snapshot of game state passed to the bot brain each frame */
export interface BotGameState {
  /** Canvas width */
  w: number
  /** Canvas height */
  h: number
  /** This bot's index */
  myIndex: number
  /** All entities: array of { x, y, index, alive } */
  entities: ReadonlyArray<{ x: number; y: number; index: number; alive: boolean; vx?: number; vy?: number }>
  /** Optional targets (coins, food, goal, etc.) */
  targets?: ReadonlyArray<{ x: number; y: number; type?: string }>
  /** Optional hazards (spikes, projectiles, etc.) */
  hazards?: ReadonlyArray<{ x: number; y: number; r?: number }>
  /** Frame counter */
  frame: number
  /** Extra game-specific data */
  extra?: GameConfig
}

/**
 * BotBrain — game-specific AI logic.
 * Implement `tick()` to return the bot's desired move each frame.
 */
export interface BotBrain {
  tick(state: BotGameState): BotMove
}

// ── Default brains per difficulty ──────────────────────────

/**
 * RandomBrain — occasionally changes direction at random.
 * Useful as a fallback for games that haven't implemented
 * a specific bot yet.
 */
export class RandomBrain implements BotBrain {
  private changeInterval: number
  private currentMove: BotMove = { dx: 0, dy: 0, action: false }
  private frameCounter = 0

  constructor(difficulty: BotDifficulty) {
    this.changeInterval = difficulty === 'easy' ? 30 : difficulty === 'normal' ? 18 : 10
  }

  tick(_state: BotGameState): BotMove {
    this.frameCounter++
    if (this.frameCounter % this.changeInterval === 0) {
      const dirs = [
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: 0 },
      ]
      const d = dirs[Math.floor(Math.random() * dirs.length)]
      this.currentMove = { ...d, action: Math.random() < 0.2 }
    }
    return this.currentMove
  }
}

/**
 * ChaserBrain — moves toward nearest target, avoids nearest hazard.
 * Good default for games with collectibles or opponents.
 */
export class ChaserBrain implements BotBrain {
  private reactionDelay: number
  private jitterChance: number
  private frameCounter = 0

  constructor(difficulty: BotDifficulty) {
    this.reactionDelay = difficulty === 'easy' ? 12 : difficulty === 'normal' ? 4 : 1
    this.jitterChance = difficulty === 'easy' ? 0.15 : difficulty === 'normal' ? 0.05 : 0.01
  }

  tick(state: BotGameState): BotMove {
    this.frameCounter++

    // Jitter — occasionally do random move to seem human
    if (Math.random() < this.jitterChance) {
      return { dx: Math.random() < 0.5 ? -1 : 1, dy: 0, action: false }
    }

    // Only react every N frames
    if (this.frameCounter % this.reactionDelay !== 0) {
      return { dx: 0, dy: 0, action: false }
    }

    const me = state.entities.find(e => e.index === state.myIndex)
    if (!me) return { dx: 0, dy: 0, action: false }

    // Avoid hazards first
    if (state.hazards && state.hazards.length > 0) {
      let closest = state.hazards[0], dist = Infinity
      for (const h of state.hazards) {
        const d = Math.hypot(h.x - me.x, h.y - me.y)
        if (d < dist) { dist = d; closest = h }
      }
      if (dist < 60) {
        return {
          dx: me.x < closest.x ? -1 : 1,
          dy: me.y < closest.y ? -1 : 1,
          action: false,
        }
      }
    }

    // Chase nearest target or nearest opponent
    const targets = state.targets && state.targets.length > 0
      ? state.targets
      : state.entities.filter(e => e.index !== state.myIndex && e.alive)

    if (targets.length === 0) return { dx: 0, dy: 0, action: false }

    let nearest = targets[0], bestDist = Infinity
    for (const t of targets) {
      const d = Math.hypot(t.x - me.x, t.y - me.y)
      if (d < bestDist) { bestDist = d; nearest = t }
    }

    const dx = nearest.x > me.x + 5 ? 1 : nearest.x < me.x - 5 ? -1 : 0
    const dy = nearest.y > me.y + 5 ? 1 : nearest.y < me.y - 5 ? -1 : 0
    const action = bestDist < 40

    return { dx, dy, action }
  }
}

// ── Factory ────────────────────────────────────────────────

// ── Specialized bot brains per game ────────────────────────

/**
 * KamikazeBrain — charges straight at nearest opponent, ignoring hazards.
 * Good for Asteroids enemy ships that ram into players.
 */
export class KamikazeBrain implements BotBrain {
  private speed: number
  constructor(difficulty: BotDifficulty) {
    this.speed = difficulty === 'easy' ? 0.6 : difficulty === 'normal' ? 0.85 : 1.0
  }
  tick(state: BotGameState): BotMove {
    const me = state.entities.find(e => e.index === state.myIndex)
    if (!me) return { dx: 0, dy: 0, action: false }
    const opponents = state.entities.filter(e => e.index !== state.myIndex && e.alive)
    if (opponents.length === 0) return { dx: 0, dy: 0, action: false }
    let nearest = opponents[0], bestDist = Infinity
    for (const o of opponents) {
      const d = Math.hypot(o.x - me.x, o.y - me.y)
      if (d < bestDist) { bestDist = d; nearest = o }
    }
    const dx = nearest.x > me.x ? this.speed : nearest.x < me.x ? -this.speed : 0
    const dy = nearest.y > me.y ? this.speed : nearest.y < me.y ? -this.speed : 0
    return { dx: dx > 0 ? 1 : dx < 0 ? -1 : 0, dy: dy > 0 ? 1 : dy < 0 ? -1 : 0, action: true }
  }
}

/**
 * ShooterBrain — aims at nearest target and fires, moves to keep distance.
 * Good for Asteroids, Tanks — bots that shoot projectiles.
 */
export class ShooterBrain implements BotBrain {
  private fireRate: number
  private preferredDistance: number
  private frameCounter = 0
  constructor(difficulty: BotDifficulty) {
    this.fireRate = difficulty === 'easy' ? 40 : difficulty === 'normal' ? 20 : 10
    this.preferredDistance = 120
  }
  tick(state: BotGameState): BotMove {
    this.frameCounter++
    const me = state.entities.find(e => e.index === state.myIndex)
    if (!me) return { dx: 0, dy: 0, action: false }
    const targets = state.targets && state.targets.length > 0
      ? state.targets
      : state.entities.filter(e => e.index !== state.myIndex && e.alive)
    if (targets.length === 0) return { dx: 0, dy: 0, action: false }
    let nearest = targets[0], bestDist = Infinity
    for (const t of targets) {
      const d = Math.hypot(t.x - me.x, t.y - me.y)
      if (d < bestDist) { bestDist = d; nearest = t }
    }
    // Keep preferred distance
    let dx = 0, dy = 0
    if (bestDist < this.preferredDistance * 0.6) {
      dx = me.x > nearest.x ? 1 : -1
      dy = me.y > nearest.y ? 1 : -1
    } else if (bestDist > this.preferredDistance * 1.4) {
      dx = nearest.x > me.x ? 1 : nearest.x < me.x ? -1 : 0
      dy = nearest.y > me.y ? 1 : nearest.y < me.y ? -1 : 0
    }
    const action = this.frameCounter % this.fireRate === 0
    return { dx, dy, action }
  }
}

/**
 * PatrolBrain — moves along walls/edges, occasionally dashes into arena.
 * Good for Tag, Sumo, Dodgeball. Avoids center, hard to catch.
 */
export class PatrolBrain implements BotBrain {
  private patrolDir: number = 1
  private dashChance: number
  private frameCounter = 0
  constructor(difficulty: BotDifficulty) {
    this.dashChance = difficulty === 'easy' ? 0.005 : difficulty === 'normal' ? 0.015 : 0.03
  }
  tick(state: BotGameState): BotMove {
    this.frameCounter++
    const me = state.entities.find(e => e.index === state.myIndex)
    if (!me) return { dx: 0, dy: 0, action: false }
    // Stay near edges, patrol clockwise/counterclockwise
    const nearLeft = me.x < state.w * 0.2
    const nearRight = me.x > state.w * 0.8
    const nearTop = me.y < state.h * 0.2
    const nearBottom = me.y > state.h * 0.8
    if (nearRight) this.patrolDir = -1
    if (nearLeft) this.patrolDir = 1
    let dx = this.patrolDir
    let dy = nearTop ? 1 : nearBottom ? -1 : 0
    // Random dash toward center
    if (Math.random() < this.dashChance) {
      dx = state.w / 2 > me.x ? 1 : -1
      dy = state.h / 2 > me.y ? 1 : -1
    }
    return { dx, dy, action: Math.random() < 0.1 }
  }
}

/**
 * CollectorBrain — prioritizes collecting items (coins, food) over attacking.
 * Good for Collect, Fishing, Snakes.
 */
export class CollectorBrain implements BotBrain {
  private reactionDelay: number
  private frameCounter = 0
  constructor(difficulty: BotDifficulty) {
    this.reactionDelay = difficulty === 'easy' ? 10 : difficulty === 'normal' ? 4 : 1
  }
  tick(state: BotGameState): BotMove {
    this.frameCounter++
    if (this.frameCounter % this.reactionDelay !== 0) return { dx: 0, dy: 0, action: false }
    const me = state.entities.find(e => e.index === state.myIndex)
    if (!me) return { dx: 0, dy: 0, action: false }
    // Prioritize targets (collectibles) over opponents
    const targets = state.targets && state.targets.length > 0 ? state.targets : []
    if (targets.length > 0) {
      let nearest = targets[0], bestDist = Infinity
      for (const t of targets) {
        const d = Math.hypot(t.x - me.x, t.y - me.y)
        if (d < bestDist) { bestDist = d; nearest = t }
      }
      return {
        dx: nearest.x > me.x + 3 ? 1 : nearest.x < me.x - 3 ? -1 : 0,
        dy: nearest.y > me.y + 3 ? 1 : nearest.y < me.y - 3 ? -1 : 0,
        action: bestDist < 30,
      }
    }
    // Fallback: wander
    return { dx: Math.random() < 0.5 ? -1 : 1, dy: 0, action: false }
  }
}

/**
 * GoalieBrain — stays in a zone (e.g. goal area) and reacts to incoming objects.
 * Good for Pong, Hockey, Volleyball.
 */
export class GoalieBrain implements BotBrain {
  private reactionSpeed: number
  constructor(difficulty: BotDifficulty) {
    this.reactionSpeed = difficulty === 'easy' ? 0.3 : difficulty === 'normal' ? 0.7 : 1.0
  }
  tick(state: BotGameState): BotMove {
    const me = state.entities.find(e => e.index === state.myIndex)
    if (!me) return { dx: 0, dy: 0, action: false }
    // Track nearest hazard/target (ball/puck)
    const ball = state.hazards?.[0] || state.targets?.[0]
    if (!ball) return { dx: 0, dy: 0, action: false }
    const dy = ball.y > me.y + 5 ? 1 : ball.y < me.y - 5 ? -1 : 0
    const dx = ball.x > me.x + 10 ? 1 : ball.x < me.x - 10 ? -1 : 0
    // Action when ball is very close
    const dist = Math.hypot(ball.x - me.x, ball.y - me.y)
    return { dx: Math.round(dx * this.reactionSpeed) as -1 | 0 | 1, dy, action: dist < 50 }
  }
}

// ── Factory ────────────────────────────────────────────────

/** Bot type variants per game */
export type BotType = 'default' | 'kamikaze' | 'shooter' | 'patrol' | 'collector' | 'goalie'

/**
 * Create a BotBrain for a given game type, bot variant & difficulty.
 */
export function createDefaultBrain(
  gameId: string,
  difficulty: BotDifficulty,
  botType?: BotType,
): BotBrain {
  // If explicit type requested, use that
  if (botType === 'kamikaze') return new KamikazeBrain(difficulty)
  if (botType === 'shooter') return new ShooterBrain(difficulty)
  if (botType === 'patrol') return new PatrolBrain(difficulty)
  if (botType === 'collector') return new CollectorBrain(difficulty)
  if (botType === 'goalie') return new GoalieBrain(difficulty)

  // Per-game defaults
  switch (gameId) {
    case 'asteroids': return new ShooterBrain(difficulty)
    case 'tanks': return new ShooterBrain(difficulty)
    case 'pong': return new GoalieBrain(difficulty)
    case 'hockey': return new GoalieBrain(difficulty)
    case 'volleyball': return new GoalieBrain(difficulty)
    case 'snakes': return new CollectorBrain(difficulty)
    case 'collect': return new CollectorBrain(difficulty)
    case 'fishing': return new CollectorBrain(difficulty)
    case 'tag': return new PatrolBrain(difficulty)
    case 'dodgeball': return new PatrolBrain(difficulty)
    case 'sumo': return new ChaserBrain(difficulty)
    default: return new ChaserBrain(difficulty)
  }
}

/** Available bot types per game (for settings UI) */
export const GAME_BOT_TYPES: Record<string, { type: BotType; label: string }[]> = {
  asteroids: [
    { type: 'shooter', label: 'Enemy Ship' },
    { type: 'kamikaze', label: 'Kamikaze' },
  ],
  tanks: [
    { type: 'shooter', label: 'Sniper Tank' },
    { type: 'patrol', label: 'Patrol Tank' },
    { type: 'kamikaze', label: 'Kamikaze Tank' },
  ],
  tag: [
    { type: 'patrol', label: 'Patrol Runner' },
    { type: 'default', label: 'Chaser' },
  ],
  dodgeball: [
    { type: 'patrol', label: 'Dodger' },
    { type: 'kamikaze', label: 'Thrower' },
  ],
  snakes: [
    { type: 'collector', label: 'Hungry Snake' },
    { type: 'default', label: 'Hunter Snake' },
  ],
  pong: [
    { type: 'goalie', label: 'Goalie' },
  ],
  hockey: [
    { type: 'goalie', label: 'Goalie' },
    { type: 'default', label: 'Forward' },
  ],
  sumo: [
    { type: 'default', label: 'Wrestler' },
    { type: 'patrol', label: 'Edge Runner' },
  ],
}

// ── Bot PlayerSlot creation ────────────────────────────────

const BOT_INPUT: InputSource = { type: 'keyboard', group: -1 }
// We use keyboard with group -1 as a sentinel; actual movement comes from brain ticks

/**
 * Create bot PlayerSlot(s) to append to the human players array.
 */
export function createBotSlots(
  startIndex: number,
  count: number,
): PlayerSlot[] {
  const bots: PlayerSlot[] = []
  for (let i = 0; i < count; i++) {
    const idx = startIndex + i
    bots.push({
      index: idx,
      name: `🤖 Bot ${i + 1}`,
      color: PLAYER_COLORS[idx % PLAYER_COLORS.length],
      input: BOT_INPUT,
      joined: true,
      ready: true,
    })
  }
  return bots
}

/** Check whether a player slot is a bot */
export function isBot(player: PlayerSlot): boolean {
  return player.input.type === 'keyboard' && (player.input as Extract<InputSource, { type: 'keyboard' }>).group === -1
}
