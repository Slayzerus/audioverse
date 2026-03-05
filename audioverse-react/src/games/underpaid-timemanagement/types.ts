import type { GameConfig } from '../../pages/games/mini/types'
/**
 * Type definitions for Underpaid Time Management (Overcooked-style 3D isometric cooking game).
 */
import type { PlayerSlot } from '../../pages/games/mini/types'

// ─── Grid & Vector ──────────────────────────────────────
export interface Vec2 { x: number; y: number }

/** Grid cell position (col, row) in the kitchen layout */
export interface GridPos { col: number; row: number }

// ─── Ingredients ────────────────────────────────────────
export type Ingredient =
  | 'tomato' | 'lettuce' | 'cheese' | 'meat'
  | 'bread' | 'egg' | 'flour' | 'milk'
  | 'apple' | 'mushroom' | 'onion' | 'fish'

/** An item in the game (ingredient that can be processed) */
export interface FoodItem {
  ingredient: Ingredient
  chopped: boolean
  cooked: boolean
  burned: boolean
}

// ─── Station Types ──────────────────────────────────────
export type StationType =
  | 'ingredient'   // infinite supply of one ingredient
  | 'counter'      // can hold items, chopping happens here
  | 'stove'        // cook items, can burn/catch fire
  | 'oven'         // bake items (slower, no burn risk)
  | 'plate'        // assembly station for plating
  | 'serve'        // serve window to deliver orders
  | 'cutting_board'// dedicated chopping station (faster)
  | 'sink'         // wash dirty plates
  | 'trash'        // discard items
  | 'wall'         // blocking wall

/** Kitchen station placed on the grid */
export interface Station {
  id: string
  col: number
  row: number
  type: StationType
  ingredient?: Ingredient     // for ingredient stations
  facing?: 'north' | 'south' | 'east' | 'west'
  modelId?: string            // which 3D model to use
}

// ─── Stove state ────────────────────────────────────────
export interface StoveState {
  stationId: string
  item: FoodItem | null
  cookProgress: number    // 0..COOK_TIME ms
  burnProgress: number    // 0..BURN_TIME ms (after cooked)
  onFire: boolean
}

// ─── Oven state ─────────────────────────────────────────
export interface OvenState {
  stationId: string
  item: FoodItem | null
  bakeProgress: number   // 0..BAKE_TIME ms
  done: boolean
}

// ─── Counter state ──────────────────────────────────────
export interface CounterItem {
  stationId: string
  item: FoodItem
}

// ─── Plate / assembly ───────────────────────────────────
export interface PlateState {
  items: FoodItem[]
  dirty: boolean          // needs washing after use
}

// ─── Recipe / Order ─────────────────────────────────────
export interface Recipe {
  id: string
  name: string
  icon: string
  ingredients: Ingredient[]
  requiresChopping: boolean
  requiresCooking: boolean
  requiresBaking: boolean
  score: number
  tipBonus: number        // extra coins for fast delivery
}

export interface Order {
  id: number
  recipe: Recipe
  timeLeft: number        // ms remaining
  maxTime: number
}

export type LootItem = 'coin' | 'gem' | 'star'

// ─── Player ─────────────────────────────────────────────
export interface Player {
  idx: number
  x: number               // world position
  y: number
  angle: number           // facing direction (radians)
  color: string
  name: string
  input: PlayerSlot['input']
  holding: FoodItem | null
  holdingPlate: PlateState | null  // can carry a plate
  chopTimer: number       // ms remaining on chop action
  interactTimer: number   // ms remaining on clean/wash
  speed: number
  team: number            // 0 or 1 for VS
  coins: number
  gems: number
  stars: number
  animState: AnimState
  combo: number           // consecutive deliveries
  comboTimer: number      // combo reset timer
}

export type AnimState = 'idle' | 'walking' | 'chopping' | 'carrying' | 'interacting'

// ─── Kitchen Layout ─────────────────────────────────────
export interface KitchenLayout {
  id: string
  name: string
  cols: number
  rows: number
  stations: Station[]
  playerSpawns: Vec2[]    // world positions (not grid)
  serveWindowPos: Vec2
}

// ─── Game State ─────────────────────────────────────────
export interface GameState {
  players: Player[]
  stations: Station[]
  stoves: StoveState[]
  ovens: OvenState[]
  plate: PlateState
  dirtyPlates: number     // plates waiting at sink
  counterItems: CounterItem[]
  orders: Order[]
  score: number
  teamScores: [number, number]
  timeLeft: number        // ms
  gameOver: boolean
  mode: string            // 'coop-kitchen' | 'vs-kitchen'
  round: number           // current round/level
  orderInterval: number   // ms between order spawns
  nextOrderIn: number     // timer until next order
  nextOrderId: number
  perfectStreak: number
  totalCoins: number
  totalGems: number
  totalStars: number
  combo: number           // global combo multiplier
  comboTimer: number
  kitchenLayout: KitchenLayout
  // Grid dimensions for the kitchen
  gridCols: number
  gridRows: number
  cellSize: number        // world units per cell
}

// ─── Props used for the component interface ─────────────
export interface GameProps {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}
