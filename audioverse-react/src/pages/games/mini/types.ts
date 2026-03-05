/** Shared types for couch mini-games (up to 8 players). */

export interface PlayerSlot {
  /** 0-based index */
  index: number
  /** Display name (Player 1, Player 2 …) */
  name: string
  /** CSS colour used for the player's avatar / snake / token */
  color: string
  /** Input source — which keyboard group or gamepad index */
  input: InputSource
  /** Is this slot occupied? */
  joined: boolean
  /** Is the player ready (pressed start / clicked)? */
  ready: boolean
  /** Linked backend profile player id (if selected) */
  profilePlayerId?: number
}

export type InputSource =
  | { type: 'keyboard'; group: number }
  | { type: 'gamepad'; padIndex: number }
  | { type: 'remote'; windowId: string }

export const PLAYER_COLORS = [
  '#e74c3c', // red
  '#3498db', // blue
  '#2ecc71', // green
  '#f1c40f', // yellow
  '#9b59b6', // purple
  '#e67e22', // orange
  '#1abc9c', // teal
  '#e91e63', // pink
] as const

export const PLAYER_NAMES = [
  'Player 1', 'Player 2', 'Player 3', 'Player 4',
  'Player 5', 'Player 6', 'Player 7', 'Player 8',
] as const

/** Direction as dx,dy */
export type Dir = { dx: number; dy: number }

export const DIR_UP:    Dir = { dx: 0, dy: -1 }
export const DIR_DOWN:  Dir = { dx: 0, dy: 1 }
export const DIR_LEFT:  Dir = { dx: -1, dy: 0 }
export const DIR_RIGHT: Dir = { dx: 1, dy: 0 }

export interface MiniGameMeta {
  id: string
  title: string
  description: string
  minPlayers: number
  maxPlayers: number
  icon: string
}

/**
 * Dynamic game configuration — each mini-game defines its own keys/settings.
 * Centralised here so only one `any` annotation exists for all game configs.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GameConfig = Record<string, any>
