/**
 * Recipe & order system for Underpaid Time Management.
 *
 * Defines all recipes, generates orders, and scores deliveries.
 */
import type { Recipe, Order, PlateState, Ingredient } from './types'
import { ORDER_BASE, TIP_THRESHOLD, COMBO_BONUS, MAX_COMBO, ORDER_SPEED_MULT, DIFFICULTY_SETTINGS } from './constants'
import { rngChoice } from './helpers'

// ═══════════════════════════════════════════════════════════
//  RECIPES
// ═══════════════════════════════════════════════════════════

export const RECIPES: Recipe[] = [
  // ─── Simple (1-2 ingredients) ─────────────────────────
  {
    id: 'salad',
    name: 'Salad',
    icon: '🥗',
    ingredients: ['lettuce', 'tomato'],
    requiresChopping: true,
    requiresCooking: false,
    requiresBaking: false,
    score: 15,
    tipBonus: 5,
  },
  {
    id: 'toast',
    name: 'Toast',
    icon: '🍞',
    ingredients: ['bread'],
    requiresChopping: false,
    requiresCooking: true,
    requiresBaking: false,
    score: 10,
    tipBonus: 4,
  },
  {
    id: 'grilled_cheese',
    name: 'Grilled Cheese',
    icon: '🧀',
    ingredients: ['bread', 'cheese'],
    requiresChopping: false,
    requiresCooking: true,
    requiresBaking: false,
    score: 18,
    tipBonus: 6,
  },
  // ─── Medium (2-3 ingredients) ──────────────────────────
  {
    id: 'burger',
    name: 'Burger',
    icon: '🍔',
    ingredients: ['meat', 'bread', 'lettuce'],
    requiresChopping: true,
    requiresCooking: true,
    requiresBaking: false,
    score: 30,
    tipBonus: 10,
  },
  {
    id: 'soup',
    name: 'Soup',
    icon: '🍲',
    ingredients: ['tomato', 'onion', 'mushroom'],
    requiresChopping: true,
    requiresCooking: true,
    requiresBaking: false,
    score: 28,
    tipBonus: 8,
  },
  {
    id: 'omelette',
    name: 'Omelette',
    icon: '🍳',
    ingredients: ['egg', 'cheese', 'mushroom'],
    requiresChopping: true,
    requiresCooking: true,
    requiresBaking: false,
    score: 25,
    tipBonus: 7,
  },
  {
    id: 'fish_n_chips',
    name: 'Fish & Chips',
    icon: '🐟',
    ingredients: ['fish', 'bread'],
    requiresChopping: false,
    requiresCooking: true,
    requiresBaking: false,
    score: 22,
    tipBonus: 7,
  },
  {
    id: 'sandwich',
    name: 'Sandwich',
    icon: '🥪',
    ingredients: ['bread', 'meat', 'cheese'],
    requiresChopping: true,
    requiresCooking: false,
    requiresBaking: false,
    score: 22,
    tipBonus: 6,
  },
  // ─── Complex (3+ ingredients, may need baking) ────────
  {
    id: 'pasta',
    name: 'Pasta',
    icon: '🍝',
    ingredients: ['flour', 'tomato', 'cheese', 'mushroom'],
    requiresChopping: true,
    requiresCooking: true,
    requiresBaking: false,
    score: 40,
    tipBonus: 12,
  },
  {
    id: 'pizza',
    name: 'Pizza',
    icon: '🍕',
    ingredients: ['flour', 'tomato', 'cheese'],
    requiresChopping: true,
    requiresCooking: false,
    requiresBaking: true,
    score: 35,
    tipBonus: 10,
  },
  {
    id: 'apple_pie',
    name: 'Apple Pie',
    icon: '🥧',
    ingredients: ['flour', 'apple', 'egg'],
    requiresChopping: true,
    requiresCooking: false,
    requiresBaking: true,
    score: 35,
    tipBonus: 10,
  },
  {
    id: 'cake',
    name: 'Cake',
    icon: '🎂',
    ingredients: ['flour', 'egg', 'milk'],
    requiresChopping: false,
    requiresCooking: false,
    requiresBaking: true,
    score: 38,
    tipBonus: 12,
  },
  {
    id: 'steak_dinner',
    name: 'Steak Dinner',
    icon: '🥩',
    ingredients: ['meat', 'onion', 'mushroom', 'lettuce'],
    requiresChopping: true,
    requiresCooking: true,
    requiresBaking: false,
    score: 45,
    tipBonus: 15,
  },
]

// ─── Recipes by difficulty tier ─────────────────────────
const EASY_IDS  = ['salad', 'toast', 'grilled_cheese']
const MED_IDS   = ['burger', 'soup', 'omelette', 'fish_n_chips', 'sandwich']
const HARD_IDS  = ['pasta', 'pizza', 'apple_pie', 'cake', 'steak_dinner']

function byId(id: string): Recipe {
  return RECIPES.find(r => r.id === id)!
}

/**
 * Pick a recipe based on difficulty curve.
 * As time progresses (timePercent → 0), harder recipes appear more often.
 */
export function pickRecipe(timePercent: number, difficulty: string): Recipe {
  let pool: Recipe[]
  if (timePercent > 0.7) {
    // Early game — easy
    pool = EASY_IDS.map(byId)
  } else if (timePercent > 0.35) {
    // Midgame — mix of easy + medium
    pool = [...EASY_IDS, ...MED_IDS].map(byId)
  } else {
    // Late game — medium + hard
    pool = [...MED_IDS, ...HARD_IDS].map(byId)
  }

  // On hard difficulty, bias toward harder recipes
  if (difficulty === 'hard' && timePercent < 0.5 && Math.random() < 0.4) {
    pool = HARD_IDS.map(byId)
  }
  // On easy, mostly easy
  if (difficulty === 'easy' && Math.random() < 0.5) {
    pool = EASY_IDS.map(byId)
  }

  return rngChoice(pool)
}

// ─── Order management ───────────────────────────────────

let nextOrderId = 1

export function resetOrderCounter(): void {
  nextOrderId = 1
}

export function spawnOrder(
  timePercent: number,
  difficulty: string,
  orderSpeed: string,
): Order {
  const recipe = pickRecipe(timePercent, difficulty)
  const diffSettings = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.normal
  const speedMult = ORDER_SPEED_MULT[orderSpeed] || 1.0
  const maxTime = ORDER_BASE * diffSettings.orderTimeMul * speedMult
  return {
    id: nextOrderId++,
    recipe,
    timeLeft: maxTime,
    maxTime,
  }
}

// ─── Item matching ──────────────────────────────────────

/**
 * Check if plate contents match a recipe.
 * Each ingredient must be present and properly prepared.
 */
export function plateMatchesRecipe(plate: PlateState, recipe: Recipe): boolean {
  if (plate.items.length !== recipe.ingredients.length) return false

  const needed = [...recipe.ingredients]
  for (const item of plate.items) {
    const idx = needed.indexOf(item.ingredient)
    if (idx === -1) return false

    // Check proper preparation
    if (recipe.requiresChopping && !item.chopped) return false
    if (recipe.requiresCooking && !item.cooked) return false
    if (item.burned) return false

    needed.splice(idx, 1)
  }
  return needed.length === 0
}

/**
 * Find the first matching order for the plate contents.
 * Returns the matching order index, or -1.
 */
export function findMatchingOrder(plate: PlateState, orders: Order[]): number {
  for (let i = 0; i < orders.length; i++) {
    if (plateMatchesRecipe(plate, orders[i].recipe)) return i
  }
  return -1
}

// ─── Scoring ────────────────────────────────────────────

export interface DeliveryResult {
  score: number
  coins: number
  gems: number
  tip: number
  combo: number
  perfect: boolean
}

/**
 * Calculate reward for delivering an order.
 */
export function scoreDelivery(
  order: Order,
  combo: number,
): DeliveryResult {
  const pct = order.timeLeft / order.maxTime
  const perfect = pct > TIP_THRESHOLD
  const tip = perfect ? order.recipe.tipBonus : 0
  const comboMul = 1 + Math.min(combo, MAX_COMBO) * COMBO_BONUS
  const score = Math.round((order.recipe.score + tip) * comboMul)
  const coins = 1
  const gems = perfect ? 1 : 0

  return { score, coins, gems, tip, combo: Math.min(combo + 1, MAX_COMBO), perfect }
}

/**
 * Get the set of unique ingredients the game needs to provide ingredient stations for.
 */
export function getRequiredIngredients(availableRecipes: Recipe[]): Ingredient[] {
  const set = new Set<Ingredient>()
  for (const r of availableRecipes) {
    for (const ing of r.ingredients) set.add(ing)
  }
  return Array.from(set)
}
