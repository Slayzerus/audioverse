/**
 * Game constants for Underpaid Time Management
 */

// ─── Timers (milliseconds) ──────────────────────────────
export const ROUND_SECS     = 180        // 3-minute rounds
export const CHOP_TIME      = 1500       // ms to chop an ingredient
export const FAST_CHOP_TIME = 800        // ms on cutting board station
export const COOK_TIME      = 3000       // ms to cook on stove
export const BURN_TIME      = 3000       // ms after cooked before burn/fire
export const BAKE_TIME      = 5000       // ms to bake in oven (no burn)
export const CLEAN_TIME     = 2000       // ms to extinguish fire
export const WASH_TIME      = 1500       // ms to wash a dirty plate
export const ORDER_BASE     = 18000      // ms before order expires (normal)
export const COMBO_WINDOW   = 5000       // ms to chain another delivery

// ─── Movement ───────────────────────────────────────────
export const PLAYER_RADIUS  = 0.35       // world units
export const MOVE_SPEED     = 4.0        // world units/sec
export const CARRY_SPEED    = 3.2        // slower when carrying plate
export const INTERACT_DIST  = 1.2        // world units to interact with station

// ─── Grid ───────────────────────────────────────────────
export const CELL_SIZE      = 1.5        // world units per grid cell
export const DEFAULT_COLS   = 10
export const DEFAULT_ROWS   = 8

// ─── Camera ─────────────────────────────────────────────
export const CAMERA_ZOOM    = 8
export const CAMERA_FOLLOW  = 0.08

// ─── Scoring ────────────────────────────────────────────
export const TIP_THRESHOLD  = 0.5        // >50% time left = tip
export const COMBO_BONUS    = 0.25       // +25% per combo level
export const MAX_COMBO      = 5
export const FAIL_PENALTY   = -1         // score lost for expired order

// ─── Order speeds ───────────────────────────────────────
export const ORDER_SPEED_MULT: Record<string, number> = {
  slow: 1.4,
  normal: 1.0,
  fast: 0.7,
}

// ─── Difficulty ─────────────────────────────────────────
export const DIFFICULTY_SETTINGS: Record<string, { orderTimeMul: number; spawnMul: number; burnMul: number }> = {
  easy:   { orderTimeMul: 1.3, spawnMul: 1.3, burnMul: 1.5 },
  normal: { orderTimeMul: 1.0, spawnMul: 1.0, burnMul: 1.0 },
  hard:   { orderTimeMul: 0.7, spawnMul: 0.7, burnMul: 0.6 },
}

// ─── Kitchen layout presets ─────────────────────────────
export type LayoutPreset = 'simple' | 'medium' | 'complex'

// ─── Ingredient visual mapping ──────────────────────────
export const INGREDIENT_COLORS: Record<string, string> = {
  tomato:   '#e74c3c',
  meat:     '#8B4513',
  cheese:   '#f1c40f',
  lettuce:  '#2ecc71',
  bread:    '#d4a56a',
  egg:      '#fffdd0',
  flour:    '#f5f0e1',
  milk:     '#fafafa',
  apple:    '#e74c3c',
  mushroom: '#b8860b',
  onion:    '#d2b48c',
  fish:     '#87ceeb',
}

export const INGREDIENT_ICONS: Record<string, string> = {
  tomato: '🍅', meat: '🥩', cheese: '🧀', lettuce: '🥬',
  bread: '🍞', egg: '🥚', flour: '🌾', milk: '🥛',
  apple: '🍎', mushroom: '🍄', onion: '🧅', fish: '🐟',
}
