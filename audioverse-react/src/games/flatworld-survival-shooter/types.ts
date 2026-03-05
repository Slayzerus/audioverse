/**
 * types.ts — Core types, block/item/recipe/enemy definitions for Flatworld Survival.
 *
 * Terraria-like 2.5D survival game with destructible terrain, crafting,
 * building, combat, day/night cycle, bosses.
 */

import type { PlayerSlot } from '../../pages/games/mini/types'

// ─── Block IDs ────────────────────────────────────────────
export const B = {
  AIR: 0, DIRT: 1, GRASS: 2, STONE: 3, SAND: 4, SNOW: 5, CLAY: 6,
  COAL_ORE: 7, IRON_ORE: 8, GOLD_ORE: 9, DIAMOND_ORE: 10, URANIUM_ORE: 11,
  WOOD: 12, LEAVES: 13, DEAD_WOOD: 14,
  PLANKS: 15, COBBLE: 16, BRICK: 17, CONCRETE: 18, METAL: 19,
  WATER: 20, LAVA: 21, BEDROCK: 22,
  WORKBENCH: 23, FURNACE: 24, ANVIL: 25, CHEST: 26,
  TORCH: 27, LANTERN: 28, GLASS: 29,
  RUBBLE: 30, SCRAP: 31,
  PLATFORM: 32, DOOR: 33, LADDER: 34,
  CACTUS: 35, MUSHROOM_BLOCK: 36,
  WOOD_WALL: 37, STONE_WALL: 38, METAL_WALL: 39,
} as const
export type BlockId = (typeof B)[keyof typeof B]

// ─── Item IDs ──────────────────────────────────────────────
// Block items share the same ID as the block. Extra items start at 100.
export const I = {
  NONE: -1,
  // Tools (100+)
  WOOD_PICKAXE: 100, STONE_PICKAXE: 101, IRON_PICKAXE: 102, GOLD_PICKAXE: 103, DIAMOND_PICKAXE: 104,
  WOOD_AXE: 110, STONE_AXE: 111, IRON_AXE: 112, GOLD_AXE: 113, DIAMOND_AXE: 114,
  WOOD_SWORD: 120, STONE_SWORD: 121, IRON_SWORD: 122, GOLD_SWORD: 123, DIAMOND_SWORD: 124,
  WOOD_SHOVEL: 130, STONE_SHOVEL: 131, IRON_SHOVEL: 132, GOLD_SHOVEL: 133, DIAMOND_SHOVEL: 134,
  // Materials
  COAL: 200, IRON_INGOT: 201, GOLD_INGOT: 202, DIAMOND: 203, URANIUM: 204,
  STICK: 210, STRING: 211, LEATHER: 212, CLOTH: 213, NAIL: 214, GEAR: 215,
  // Ranged
  BOW: 250, CROSSBOW: 251, PISTOL: 252, RIFLE: 253, SHOTGUN: 254,
  ARROW: 260, BOLT: 261, BULLET: 262,
  // Consumables
  APPLE: 300, MUSHROOM_ITEM: 301, COOKED_MEAT: 302, BREAD: 303,
  HEALTH_POTION: 310, SPEED_POTION: 311, STRENGTH_POTION: 312,
  BANDAGE: 320, MEDKIT: 321,
  // Throwables
  GRENADE: 350, MOLOTOV: 351, DYNAMITE: 352,
  // Vehicles
  BUGGY: 500, MOTORCYCLE: 501, HELICOPTER: 502, PLANE: 503, BOAT: 504,
  // Armor
  LEATHER_HELMET: 400, LEATHER_CHEST: 401, LEATHER_LEGS: 402,
  IRON_HELMET: 410, IRON_CHEST: 411, IRON_LEGS: 412,
  DIAMOND_HELMET: 420, DIAMOND_CHEST: 421, DIAMOND_LEGS: 422,
} as const
export type ItemId = number

// ─── Block Definitions ────────────────────────────────────
export interface BlockDef {
  name: string
  color: string       // front face color
  topColor?: string   // top face color (grass etc.)
  hardness: number    // ticks to mine (-1 = unbreakable)
  drop: ItemId        // item dropped when mined
  dropCount: number
  toolType: 'pickaxe' | 'axe' | 'shovel' | 'any'
  toolLevel: number   // 0=hand, 1=wood, 2=stone, 3=iron, 4=gold, 5=diamond
  transparent: boolean
  solid: boolean
  light: number       // 0-15 (torch=12, lava=15)
  climbable?: boolean
  liquid?: boolean
}

export const BLOCKS: Record<number, BlockDef> = {
  [B.AIR]:        { name: 'Air', color: '#00000000', hardness: 0, drop: -1, dropCount: 0, toolType: 'any', toolLevel: 0, transparent: true, solid: false, light: 0 },
  [B.DIRT]:       { name: 'Dirt', color: '#8B6914', hardness: 15, drop: B.DIRT, dropCount: 1, toolType: 'shovel', toolLevel: 0, transparent: false, solid: true, light: 0 },
  [B.GRASS]:      { name: 'Grass', color: '#8B6914', topColor: '#4a8c2a', hardness: 18, drop: B.DIRT, dropCount: 1, toolType: 'shovel', toolLevel: 0, transparent: false, solid: true, light: 0 },
  [B.STONE]:      { name: 'Stone', color: '#808080', hardness: 45, drop: B.COBBLE, dropCount: 1, toolType: 'pickaxe', toolLevel: 0, transparent: false, solid: true, light: 0 },
  [B.SAND]:       { name: 'Sand', color: '#E8D68C', hardness: 12, drop: B.SAND, dropCount: 1, toolType: 'shovel', toolLevel: 0, transparent: false, solid: true, light: 0 },
  [B.SNOW]:       { name: 'Snow', color: '#F0F0F0', hardness: 10, drop: B.SNOW, dropCount: 1, toolType: 'shovel', toolLevel: 0, transparent: false, solid: true, light: 0 },
  [B.CLAY]:       { name: 'Clay', color: '#B87840', hardness: 20, drop: B.CLAY, dropCount: 1, toolType: 'shovel', toolLevel: 0, transparent: false, solid: true, light: 0 },
  [B.COAL_ORE]:   { name: 'Coal Ore', color: '#606060', hardness: 50, drop: I.COAL, dropCount: 1, toolType: 'pickaxe', toolLevel: 1, transparent: false, solid: true, light: 0 },
  [B.IRON_ORE]:   { name: 'Iron Ore', color: '#937256', hardness: 60, drop: B.IRON_ORE, dropCount: 1, toolType: 'pickaxe', toolLevel: 2, transparent: false, solid: true, light: 0 },
  [B.GOLD_ORE]:   { name: 'Gold Ore', color: '#B5951D', hardness: 65, drop: B.GOLD_ORE, dropCount: 1, toolType: 'pickaxe', toolLevel: 3, transparent: false, solid: true, light: 0 },
  [B.DIAMOND_ORE]:{ name: 'Diamond Ore', color: '#5DB5C9', hardness: 80, drop: I.DIAMOND, dropCount: 1, toolType: 'pickaxe', toolLevel: 3, transparent: false, solid: true, light: 0 },
  [B.URANIUM_ORE]:{ name: 'Uranium Ore', color: '#3DB846', hardness: 90, drop: I.URANIUM, dropCount: 1, toolType: 'pickaxe', toolLevel: 4, transparent: false, solid: true, light: 4 },
  [B.WOOD]:       { name: 'Wood', color: '#8B5A2B', hardness: 25, drop: B.WOOD, dropCount: 1, toolType: 'axe', toolLevel: 0, transparent: false, solid: true, light: 0 },
  [B.LEAVES]:     { name: 'Leaves', color: '#2E8B1A', hardness: 5, drop: -1, dropCount: 0, toolType: 'any', toolLevel: 0, transparent: true, solid: false, light: 0 },
  [B.DEAD_WOOD]:  { name: 'Dead Wood', color: '#6B4226', hardness: 20, drop: I.STICK, dropCount: 2, toolType: 'axe', toolLevel: 0, transparent: false, solid: true, light: 0 },
  [B.PLANKS]:     { name: 'Planks', color: '#D4A960', hardness: 25, drop: B.PLANKS, dropCount: 1, toolType: 'axe', toolLevel: 0, transparent: false, solid: true, light: 0 },
  [B.COBBLE]:     { name: 'Cobblestone', color: '#707070', hardness: 50, drop: B.COBBLE, dropCount: 1, toolType: 'pickaxe', toolLevel: 0, transparent: false, solid: true, light: 0 },
  [B.BRICK]:      { name: 'Brick', color: '#B03020', hardness: 55, drop: B.BRICK, dropCount: 1, toolType: 'pickaxe', toolLevel: 0, transparent: false, solid: true, light: 0 },
  [B.CONCRETE]:   { name: 'Concrete', color: '#A0A0A0', hardness: 60, drop: B.CONCRETE, dropCount: 1, toolType: 'pickaxe', toolLevel: 1, transparent: false, solid: true, light: 0 },
  [B.METAL]:      { name: 'Metal', color: '#B0B0B8', hardness: 70, drop: B.METAL, dropCount: 1, toolType: 'pickaxe', toolLevel: 2, transparent: false, solid: true, light: 0 },
  [B.WATER]:      { name: 'Water', color: '#3060D0', hardness: -1, drop: -1, dropCount: 0, toolType: 'any', toolLevel: 0, transparent: true, solid: false, light: 0, liquid: true },
  [B.LAVA]:       { name: 'Lava', color: '#E06010', hardness: -1, drop: -1, dropCount: 0, toolType: 'any', toolLevel: 0, transparent: true, solid: false, light: 15, liquid: true },
  [B.BEDROCK]:    { name: 'Bedrock', color: '#303030', hardness: -1, drop: -1, dropCount: 0, toolType: 'any', toolLevel: 0, transparent: false, solid: true, light: 0 },
  [B.WORKBENCH]:  { name: 'Workbench', color: '#C89050', hardness: 20, drop: B.WORKBENCH, dropCount: 1, toolType: 'axe', toolLevel: 0, transparent: false, solid: true, light: 0 },
  [B.FURNACE]:    { name: 'Furnace', color: '#606060', hardness: 45, drop: B.FURNACE, dropCount: 1, toolType: 'pickaxe', toolLevel: 0, transparent: false, solid: true, light: 8 },
  [B.ANVIL]:      { name: 'Anvil', color: '#505060', hardness: 55, drop: B.ANVIL, dropCount: 1, toolType: 'pickaxe', toolLevel: 1, transparent: false, solid: true, light: 0 },
  [B.CHEST]:      { name: 'Chest', color: '#B08030', hardness: 15, drop: B.CHEST, dropCount: 1, toolType: 'axe', toolLevel: 0, transparent: false, solid: true, light: 0 },
  [B.TORCH]:      { name: 'Torch', color: '#FFD700', hardness: 1, drop: B.TORCH, dropCount: 1, toolType: 'any', toolLevel: 0, transparent: true, solid: false, light: 12 },
  [B.LANTERN]:    { name: 'Lantern', color: '#FFC040', hardness: 5, drop: B.LANTERN, dropCount: 1, toolType: 'any', toolLevel: 0, transparent: true, solid: false, light: 14 },
  [B.GLASS]:      { name: 'Glass', color: '#C0E8FF', hardness: 5, drop: -1, dropCount: 0, toolType: 'any', toolLevel: 0, transparent: true, solid: true, light: 0 },
  [B.RUBBLE]:     { name: 'Rubble', color: '#909080', hardness: 20, drop: B.COBBLE, dropCount: 1, toolType: 'pickaxe', toolLevel: 0, transparent: false, solid: true, light: 0 },
  [B.SCRAP]:      { name: 'Scrap', color: '#8890A0', hardness: 25, drop: B.SCRAP, dropCount: 1, toolType: 'pickaxe', toolLevel: 0, transparent: false, solid: true, light: 0 },
  [B.PLATFORM]:   { name: 'Platform', color: '#C89060', hardness: 10, drop: B.PLATFORM, dropCount: 1, toolType: 'axe', toolLevel: 0, transparent: true, solid: false, light: 0 },
  [B.DOOR]:       { name: 'Door', color: '#A07040', hardness: 15, drop: B.DOOR, dropCount: 1, toolType: 'axe', toolLevel: 0, transparent: true, solid: true, light: 0 },
  [B.LADDER]:     { name: 'Ladder', color: '#B08040', hardness: 10, drop: B.LADDER, dropCount: 1, toolType: 'axe', toolLevel: 0, transparent: true, solid: false, light: 0, climbable: true },
  [B.CACTUS]:     { name: 'Cactus', color: '#2D8B2D', hardness: 15, drop: B.CACTUS, dropCount: 1, toolType: 'any', toolLevel: 0, transparent: true, solid: true, light: 0 },
  [B.MUSHROOM_BLOCK]: { name: 'Mushroom', color: '#D04040', hardness: 5, drop: I.MUSHROOM_ITEM, dropCount: 1, toolType: 'any', toolLevel: 0, transparent: true, solid: false, light: 2 },
  [B.WOOD_WALL]:  { name: 'Wood Wall', color: '#A07848', hardness: 20, drop: B.WOOD_WALL, dropCount: 1, toolType: 'axe', toolLevel: 0, transparent: false, solid: true, light: 0 },
  [B.STONE_WALL]: { name: 'Stone Wall', color: '#787878', hardness: 45, drop: B.STONE_WALL, dropCount: 1, toolType: 'pickaxe', toolLevel: 0, transparent: false, solid: true, light: 0 },
  [B.METAL_WALL]: { name: 'Metal Wall', color: '#A0A0B0', hardness: 65, drop: B.METAL_WALL, dropCount: 1, toolType: 'pickaxe', toolLevel: 2, transparent: false, solid: true, light: 0 },
}

// ─── Item Definitions ──────────────────────────────────────
export interface ItemDef {
  name: string
  color: string
  stackSize: number
  damage?: number       // melee damage
  mineSpeed?: number    // mining speed multiplier (1 = base)
  toolType?: 'pickaxe' | 'axe' | 'shovel' | 'sword'
  toolLevel?: number    // 1-5 (wood → diamond)
  ranged?: boolean
  projectileSpeed?: number
  ammoId?: number
  heal?: number
  hunger?: number
  speedBoost?: number
  armor?: number
  armorSlot?: 'head' | 'chest' | 'legs'
  placeable?: boolean   // true = this item places a block
  placeBlock?: number
  throwable?: boolean
  explosionRadius?: number
  proneUsable?: boolean   // false = can't use item while prone (swords)
  vehicle?: boolean       // true = this item spawns a vehicle
  vehicleType?: VehicleType
}

// Items that are also blocks automatically get placeable=true, placeBlock=id
function blockItem(blockId: number): Partial<ItemDef> {
  const b = BLOCKS[blockId]
  return { name: b?.name ?? '?', color: b?.color ?? '#fff', stackSize: 99, placeable: true, placeBlock: blockId }
}

export const ITEMS: Record<number, ItemDef> = {
  // Block items
  [B.DIRT]: { ...blockItem(B.DIRT) } as ItemDef,
  [B.GRASS]: { ...blockItem(B.GRASS) } as ItemDef,
  [B.STONE]: { ...blockItem(B.STONE) } as ItemDef,
  [B.SAND]: { ...blockItem(B.SAND) } as ItemDef,
  [B.SNOW]: { ...blockItem(B.SNOW) } as ItemDef,
  [B.CLAY]: { ...blockItem(B.CLAY) } as ItemDef,
  [B.WOOD]: { ...blockItem(B.WOOD) } as ItemDef,
  [B.LEAVES]: { ...blockItem(B.LEAVES) } as ItemDef,
  [B.PLANKS]: { ...blockItem(B.PLANKS) } as ItemDef,
  [B.COBBLE]: { ...blockItem(B.COBBLE) } as ItemDef,
  [B.BRICK]: { ...blockItem(B.BRICK) } as ItemDef,
  [B.CONCRETE]: { ...blockItem(B.CONCRETE) } as ItemDef,
  [B.METAL]: { ...blockItem(B.METAL) } as ItemDef,
  [B.WORKBENCH]: { ...blockItem(B.WORKBENCH) } as ItemDef,
  [B.FURNACE]: { ...blockItem(B.FURNACE) } as ItemDef,
  [B.ANVIL]: { ...blockItem(B.ANVIL) } as ItemDef,
  [B.CHEST]: { ...blockItem(B.CHEST) } as ItemDef,
  [B.TORCH]: { ...blockItem(B.TORCH) } as ItemDef,
  [B.LANTERN]: { ...blockItem(B.LANTERN) } as ItemDef,
  [B.GLASS]: { ...blockItem(B.GLASS) } as ItemDef,
  [B.SCRAP]: { ...blockItem(B.SCRAP) } as ItemDef,
  [B.PLATFORM]: { ...blockItem(B.PLATFORM) } as ItemDef,
  [B.DOOR]: { ...blockItem(B.DOOR) } as ItemDef,
  [B.LADDER]: { ...blockItem(B.LADDER) } as ItemDef,
  [B.WOOD_WALL]: { ...blockItem(B.WOOD_WALL) } as ItemDef,
  [B.STONE_WALL]: { ...blockItem(B.STONE_WALL) } as ItemDef,
  [B.METAL_WALL]: { ...blockItem(B.METAL_WALL) } as ItemDef,
  [B.IRON_ORE]: { ...blockItem(B.IRON_ORE) } as ItemDef,
  [B.GOLD_ORE]: { ...blockItem(B.GOLD_ORE) } as ItemDef,
  // Materials
  [I.COAL]:       { name: 'Coal', color: '#303030', stackSize: 99 },
  [I.IRON_INGOT]: { name: 'Iron Ingot', color: '#A0A0A0', stackSize: 99 },
  [I.GOLD_INGOT]: { name: 'Gold Ingot', color: '#FFD700', stackSize: 99 },
  [I.DIAMOND]:    { name: 'Diamond', color: '#60D0E0', stackSize: 99 },
  [I.URANIUM]:    { name: 'Uranium', color: '#40C040', stackSize: 99 },
  [I.STICK]:      { name: 'Stick', color: '#A08040', stackSize: 99 },
  [I.STRING]:     { name: 'String', color: '#E0E0E0', stackSize: 99 },
  [I.LEATHER]:    { name: 'Leather', color: '#8B6914', stackSize: 99 },
  [I.NAIL]:       { name: 'Nail', color: '#909090', stackSize: 99 },
  [I.GEAR]:       { name: 'Gear', color: '#808090', stackSize: 99 },
  // Pickaxes
  [I.WOOD_PICKAXE]:    { name: 'Wood Pickaxe', color: '#D4A960', stackSize: 1, damage: 3, mineSpeed: 1.5, toolType: 'pickaxe', toolLevel: 1 },
  [I.STONE_PICKAXE]:   { name: 'Stone Pickaxe', color: '#808080', stackSize: 1, damage: 4, mineSpeed: 2.5, toolType: 'pickaxe', toolLevel: 2 },
  [I.IRON_PICKAXE]:    { name: 'Iron Pickaxe', color: '#C0C0C0', stackSize: 1, damage: 5, mineSpeed: 4.0, toolType: 'pickaxe', toolLevel: 3 },
  [I.GOLD_PICKAXE]:    { name: 'Gold Pickaxe', color: '#FFD700', stackSize: 1, damage: 4, mineSpeed: 6.0, toolType: 'pickaxe', toolLevel: 4 },
  [I.DIAMOND_PICKAXE]: { name: 'Diamond Pickaxe', color: '#60D0E0', stackSize: 1, damage: 6, mineSpeed: 5.0, toolType: 'pickaxe', toolLevel: 5 },
  // Axes
  [I.WOOD_AXE]:    { name: 'Wood Axe', color: '#D4A960', stackSize: 1, damage: 4, mineSpeed: 1.5, toolType: 'axe', toolLevel: 1 },
  [I.STONE_AXE]:   { name: 'Stone Axe', color: '#808080', stackSize: 1, damage: 5, mineSpeed: 2.5, toolType: 'axe', toolLevel: 2 },
  [I.IRON_AXE]:    { name: 'Iron Axe', color: '#C0C0C0', stackSize: 1, damage: 6, mineSpeed: 4.0, toolType: 'axe', toolLevel: 3 },
  [I.GOLD_AXE]:    { name: 'Gold Axe', color: '#FFD700', stackSize: 1, damage: 5, mineSpeed: 6.0, toolType: 'axe', toolLevel: 4 },
  [I.DIAMOND_AXE]: { name: 'Diamond Axe', color: '#60D0E0', stackSize: 1, damage: 7, mineSpeed: 5.0, toolType: 'axe', toolLevel: 5 },
  // Swords
  [I.WOOD_SWORD]:    { name: 'Wood Sword', color: '#D4A960', stackSize: 1, damage: 6, toolType: 'sword', toolLevel: 1 },
  [I.STONE_SWORD]:   { name: 'Stone Sword', color: '#808080', stackSize: 1, damage: 8, toolType: 'sword', toolLevel: 2 },
  [I.IRON_SWORD]:    { name: 'Iron Sword', color: '#C0C0C0', stackSize: 1, damage: 11, toolType: 'sword', toolLevel: 3 },
  [I.GOLD_SWORD]:    { name: 'Gold Sword', color: '#FFD700', stackSize: 1, damage: 9, toolType: 'sword', toolLevel: 4 },
  [I.DIAMOND_SWORD]: { name: 'Diamond Sword', color: '#60D0E0', stackSize: 1, damage: 14, toolType: 'sword', toolLevel: 5 },
  // Shovels
  [I.WOOD_SHOVEL]:    { name: 'Wood Shovel', color: '#D4A960', stackSize: 1, damage: 2, mineSpeed: 1.5, toolType: 'shovel', toolLevel: 1 },
  [I.STONE_SHOVEL]:   { name: 'Stone Shovel', color: '#808080', stackSize: 1, damage: 3, mineSpeed: 2.5, toolType: 'shovel', toolLevel: 2 },
  [I.IRON_SHOVEL]:    { name: 'Iron Shovel', color: '#C0C0C0', stackSize: 1, damage: 3, mineSpeed: 4.0, toolType: 'shovel', toolLevel: 3 },
  [I.GOLD_SHOVEL]:    { name: 'Gold Shovel', color: '#FFD700', stackSize: 1, damage: 3, mineSpeed: 6.0, toolType: 'shovel', toolLevel: 4 },
  [I.DIAMOND_SHOVEL]: { name: 'Diamond Shovel', color: '#60D0E0', stackSize: 1, damage: 4, mineSpeed: 5.0, toolType: 'shovel', toolLevel: 5 },
  // Ranged weapons
  [I.BOW]:      { name: 'Bow', color: '#A07030', stackSize: 1, damage: 8, ranged: true, projectileSpeed: 12, ammoId: I.ARROW },
  [I.CROSSBOW]: { name: 'Crossbow', color: '#706050', stackSize: 1, damage: 14, ranged: true, projectileSpeed: 16, ammoId: I.BOLT },
  [I.PISTOL]:   { name: 'Pistol', color: '#505050', stackSize: 1, damage: 12, ranged: true, projectileSpeed: 20, ammoId: I.BULLET },
  [I.RIFLE]:    { name: 'Rifle', color: '#404040', stackSize: 1, damage: 18, ranged: true, projectileSpeed: 24, ammoId: I.BULLET },
  [I.SHOTGUN]:  { name: 'Shotgun', color: '#504040', stackSize: 1, damage: 22, ranged: true, projectileSpeed: 18, ammoId: I.BULLET },
  [I.ARROW]:    { name: 'Arrow', color: '#A08040', stackSize: 99 },
  [I.BOLT]:     { name: 'Bolt', color: '#808080', stackSize: 99 },
  [I.BULLET]:   { name: 'Bullet', color: '#C0C020', stackSize: 99 },
  // Consumables
  [I.APPLE]:         { name: 'Apple', color: '#E03030', stackSize: 30, hunger: 15 },
  [I.MUSHROOM_ITEM]: { name: 'Mushroom', color: '#D04040', stackSize: 30, hunger: 10 },
  [I.COOKED_MEAT]:   { name: 'Cooked Meat', color: '#A06020', stackSize: 30, hunger: 35 },
  [I.BREAD]:         { name: 'Bread', color: '#D4A060', stackSize: 30, hunger: 25 },
  [I.HEALTH_POTION]: { name: 'Health Potion', color: '#E03030', stackSize: 10, heal: 50 },
  [I.SPEED_POTION]:  { name: 'Speed Potion', color: '#30A0E0', stackSize: 10, speedBoost: 1.5 },
  [I.BANDAGE]:       { name: 'Bandage', color: '#F0F0E0', stackSize: 30, heal: 15 },
  [I.MEDKIT]:        { name: 'Medkit', color: '#F0F0F0', stackSize: 10, heal: 80 },
  // Throwables
  [I.GRENADE]:  { name: 'Grenade', color: '#405030', stackSize: 20, throwable: true, damage: 40, explosionRadius: 3 },
  [I.MOLOTOV]:  { name: 'Molotov', color: '#D06020', stackSize: 10, throwable: true, damage: 25, explosionRadius: 2 },
  [I.DYNAMITE]: { name: 'Dynamite', color: '#D03020', stackSize: 15, throwable: true, damage: 60, explosionRadius: 5 },
  // Armor
  [I.LEATHER_HELMET]: { name: 'Leather Helmet', color: '#8B6914', stackSize: 1, armor: 2, armorSlot: 'head' },
  [I.LEATHER_CHEST]:  { name: 'Leather Chestplate', color: '#8B6914', stackSize: 1, armor: 4, armorSlot: 'chest' },
  [I.LEATHER_LEGS]:   { name: 'Leather Leggings', color: '#8B6914', stackSize: 1, armor: 2, armorSlot: 'legs' },
  [I.IRON_HELMET]:    { name: 'Iron Helmet', color: '#C0C0C0', stackSize: 1, armor: 4, armorSlot: 'head' },
  [I.IRON_CHEST]:     { name: 'Iron Chestplate', color: '#C0C0C0', stackSize: 1, armor: 6, armorSlot: 'chest' },
  [I.IRON_LEGS]:      { name: 'Iron Leggings', color: '#C0C0C0', stackSize: 1, armor: 4, armorSlot: 'legs' },
  [I.DIAMOND_HELMET]: { name: 'Diamond Helmet', color: '#60D0E0', stackSize: 1, armor: 6, armorSlot: 'head' },
  [I.DIAMOND_CHEST]:  { name: 'Diamond Chestplate', color: '#60D0E0', stackSize: 1, armor: 8, armorSlot: 'chest' },
  [I.DIAMOND_LEGS]:   { name: 'Diamond Leggings', color: '#60D0E0', stackSize: 1, armor: 6, armorSlot: 'legs' },
  // Vehicles
  [I.BUGGY]:      { name: 'Buggy', color: '#B08030', stackSize: 1, vehicle: true, vehicleType: 'buggy' },
  [I.MOTORCYCLE]: { name: 'Motorcycle', color: '#606060', stackSize: 1, vehicle: true, vehicleType: 'motorcycle' },
  [I.HELICOPTER]: { name: 'Helicopter', color: '#4080A0', stackSize: 1, vehicle: true, vehicleType: 'helicopter' },
  [I.PLANE]:      { name: 'Plane', color: '#A0A0D0', stackSize: 1, vehicle: true, vehicleType: 'plane' },
  [I.BOAT]:       { name: 'Boat', color: '#8B6914', stackSize: 1, vehicle: true, vehicleType: 'boat' },
}

// ─── Recipes ───────────────────────────────────────────────
export interface Recipe {
  result: number
  count: number
  ingredients: [number, number][]    // [itemId, count]
  station: 'hand' | 'workbench' | 'furnace' | 'anvil'
}

export const RECIPES: Recipe[] = [
  // Hand crafting
  { result: B.PLANKS, count: 4, ingredients: [[B.WOOD, 1]], station: 'hand' },
  { result: I.STICK, count: 4, ingredients: [[B.PLANKS, 2]], station: 'hand' },
  { result: B.TORCH, count: 4, ingredients: [[I.STICK, 1], [I.COAL, 1]], station: 'hand' },
  { result: B.WORKBENCH, count: 1, ingredients: [[B.PLANKS, 4]], station: 'hand' },
  { result: B.CHEST, count: 1, ingredients: [[B.PLANKS, 8]], station: 'hand' },
  { result: B.WOOD_WALL, count: 4, ingredients: [[B.PLANKS, 2]], station: 'hand' },
  { result: B.PLATFORM, count: 3, ingredients: [[B.PLANKS, 2]], station: 'hand' },
  { result: B.LADDER, count: 3, ingredients: [[I.STICK, 5]], station: 'hand' },
  { result: B.DOOR, count: 1, ingredients: [[B.PLANKS, 6]], station: 'hand' },
  // Workbench
  { result: I.WOOD_PICKAXE, count: 1, ingredients: [[B.PLANKS, 3], [I.STICK, 2]], station: 'workbench' },
  { result: I.WOOD_AXE, count: 1, ingredients: [[B.PLANKS, 3], [I.STICK, 2]], station: 'workbench' },
  { result: I.WOOD_SWORD, count: 1, ingredients: [[B.PLANKS, 2], [I.STICK, 1]], station: 'workbench' },
  { result: I.WOOD_SHOVEL, count: 1, ingredients: [[B.PLANKS, 1], [I.STICK, 2]], station: 'workbench' },
  { result: I.STONE_PICKAXE, count: 1, ingredients: [[B.COBBLE, 3], [I.STICK, 2]], station: 'workbench' },
  { result: I.STONE_AXE, count: 1, ingredients: [[B.COBBLE, 3], [I.STICK, 2]], station: 'workbench' },
  { result: I.STONE_SWORD, count: 1, ingredients: [[B.COBBLE, 2], [I.STICK, 1]], station: 'workbench' },
  { result: I.STONE_SHOVEL, count: 1, ingredients: [[B.COBBLE, 1], [I.STICK, 2]], station: 'workbench' },
  { result: B.FURNACE, count: 1, ingredients: [[B.COBBLE, 8]], station: 'workbench' },
  { result: I.BOW, count: 1, ingredients: [[I.STICK, 3], [I.STRING, 3]], station: 'workbench' },
  { result: I.ARROW, count: 4, ingredients: [[I.STICK, 1], [B.COBBLE, 1]], station: 'workbench' },
  { result: B.STONE_WALL, count: 4, ingredients: [[B.COBBLE, 2]], station: 'workbench' },
  { result: B.BRICK, count: 4, ingredients: [[B.CLAY, 4], [I.COAL, 1]], station: 'workbench' },
  { result: B.GLASS, count: 4, ingredients: [[B.SAND, 4], [I.COAL, 1]], station: 'workbench' },
  { result: B.LANTERN, count: 1, ingredients: [[I.IRON_INGOT, 1], [B.TORCH, 1]], station: 'workbench' },
  { result: I.BANDAGE, count: 3, ingredients: [[I.CLOTH, 2]], station: 'workbench' },
  { result: I.LEATHER_HELMET, count: 1, ingredients: [[I.LEATHER, 5]], station: 'workbench' },
  { result: I.LEATHER_CHEST, count: 1, ingredients: [[I.LEATHER, 8]], station: 'workbench' },
  { result: I.LEATHER_LEGS, count: 1, ingredients: [[I.LEATHER, 6]], station: 'workbench' },
  // Furnace (smelting)
  { result: I.IRON_INGOT, count: 1, ingredients: [[B.IRON_ORE, 1], [I.COAL, 1]], station: 'furnace' },
  { result: I.GOLD_INGOT, count: 1, ingredients: [[B.GOLD_ORE, 1], [I.COAL, 1]], station: 'furnace' },
  { result: I.COOKED_MEAT, count: 1, ingredients: [[I.LEATHER, 1], [I.COAL, 1]], station: 'furnace' },
  { result: B.CONCRETE, count: 4, ingredients: [[B.SAND, 2], [B.COBBLE, 2]], station: 'furnace' },
  { result: B.METAL, count: 2, ingredients: [[I.IRON_INGOT, 2]], station: 'furnace' },
  { result: I.NAIL, count: 8, ingredients: [[I.IRON_INGOT, 1]], station: 'furnace' },
  // Anvil
  { result: B.ANVIL, count: 1, ingredients: [[I.IRON_INGOT, 5]], station: 'workbench' },
  { result: I.IRON_PICKAXE, count: 1, ingredients: [[I.IRON_INGOT, 3], [I.STICK, 2]], station: 'anvil' },
  { result: I.IRON_AXE, count: 1, ingredients: [[I.IRON_INGOT, 3], [I.STICK, 2]], station: 'anvil' },
  { result: I.IRON_SWORD, count: 1, ingredients: [[I.IRON_INGOT, 2], [I.STICK, 1]], station: 'anvil' },
  { result: I.IRON_SHOVEL, count: 1, ingredients: [[I.IRON_INGOT, 1], [I.STICK, 2]], station: 'anvil' },
  { result: I.GOLD_PICKAXE, count: 1, ingredients: [[I.GOLD_INGOT, 3], [I.STICK, 2]], station: 'anvil' },
  { result: I.GOLD_AXE, count: 1, ingredients: [[I.GOLD_INGOT, 3], [I.STICK, 2]], station: 'anvil' },
  { result: I.GOLD_SWORD, count: 1, ingredients: [[I.GOLD_INGOT, 2], [I.STICK, 1]], station: 'anvil' },
  { result: I.DIAMOND_PICKAXE, count: 1, ingredients: [[I.DIAMOND, 3], [I.STICK, 2]], station: 'anvil' },
  { result: I.DIAMOND_AXE, count: 1, ingredients: [[I.DIAMOND, 3], [I.STICK, 2]], station: 'anvil' },
  { result: I.DIAMOND_SWORD, count: 1, ingredients: [[I.DIAMOND, 2], [I.STICK, 1]], station: 'anvil' },
  { result: I.DIAMOND_SHOVEL, count: 1, ingredients: [[I.DIAMOND, 1], [I.STICK, 2]], station: 'anvil' },
  { result: I.IRON_HELMET, count: 1, ingredients: [[I.IRON_INGOT, 5]], station: 'anvil' },
  { result: I.IRON_CHEST, count: 1, ingredients: [[I.IRON_INGOT, 8]], station: 'anvil' },
  { result: I.IRON_LEGS, count: 1, ingredients: [[I.IRON_INGOT, 6]], station: 'anvil' },
  { result: I.DIAMOND_HELMET, count: 1, ingredients: [[I.DIAMOND, 5]], station: 'anvil' },
  { result: I.DIAMOND_CHEST, count: 1, ingredients: [[I.DIAMOND, 8]], station: 'anvil' },
  { result: I.DIAMOND_LEGS, count: 1, ingredients: [[I.DIAMOND, 6]], station: 'anvil' },
  { result: I.CROSSBOW, count: 1, ingredients: [[I.IRON_INGOT, 3], [I.STICK, 2], [I.STRING, 2]], station: 'anvil' },
  { result: I.BOLT, count: 8, ingredients: [[I.IRON_INGOT, 1], [I.STICK, 2]], station: 'anvil' },
  { result: I.PISTOL, count: 1, ingredients: [[I.IRON_INGOT, 5], [I.GEAR, 2]], station: 'anvil' },
  { result: I.RIFLE, count: 1, ingredients: [[I.IRON_INGOT, 8], [I.GEAR, 3], [I.STICK, 1]], station: 'anvil' },
  { result: I.SHOTGUN, count: 1, ingredients: [[I.IRON_INGOT, 6], [I.GEAR, 2], [I.STICK, 1]], station: 'anvil' },
  { result: I.BULLET, count: 10, ingredients: [[I.IRON_INGOT, 1], [I.COAL, 1]], station: 'anvil' },
  { result: I.GRENADE, count: 2, ingredients: [[I.IRON_INGOT, 2], [I.COAL, 3]], station: 'anvil' },
  { result: I.DYNAMITE, count: 3, ingredients: [[I.STICK, 2], [I.COAL, 4], [I.STRING, 1]], station: 'anvil' },
  { result: I.HEALTH_POTION, count: 1, ingredients: [[I.MUSHROOM_ITEM, 3], [B.GLASS, 1]], station: 'workbench' },
  { result: I.MEDKIT, count: 1, ingredients: [[I.BANDAGE, 3], [I.HEALTH_POTION, 1]], station: 'workbench' },
  { result: B.METAL_WALL, count: 4, ingredients: [[I.IRON_INGOT, 2]], station: 'anvil' },
  { result: I.GEAR, count: 2, ingredients: [[I.IRON_INGOT, 2]], station: 'anvil' },
]

// Mark swords as not usable while prone
for (const id of [I.WOOD_SWORD, I.STONE_SWORD, I.IRON_SWORD, I.GOLD_SWORD, I.DIAMOND_SWORD]) {
  if (ITEMS[id]) ITEMS[id].proneUsable = false
}

// ─── Vehicle Definitions ──────────────────────────────────
export type VehicleType = 'buggy' | 'motorcycle' | 'helicopter' | 'plane' | 'boat'
export type Stance = 'standing' | 'crouching' | 'prone'

export interface VehicleDef {
  type: VehicleType
  name: string
  color: string
  speed: number       // max speed
  hp: number
  width: number
  height: number
  flying: boolean
  watercraft: boolean
  passengers: number  // max riders
  fuelMax: number     // max fuel ticks
  tiltSpeed: number   // Elastomania-style tilt rate (ground vehicles)
}

export const VEHICLE_DEFS: Record<VehicleType, VehicleDef> = {
  buggy:      { type: 'buggy', name: 'Buggy', color: '#B08030', speed: 0.18, hp: 150, width: 2.5, height: 1.5, flying: false, watercraft: false, passengers: 2, fuelMax: 12000, tiltSpeed: 0.04 },
  motorcycle: { type: 'motorcycle', name: 'Motorcycle', color: '#606060', speed: 0.24, hp: 80, width: 2.0, height: 1.2, flying: false, watercraft: false, passengers: 1, fuelMax: 8000, tiltSpeed: 0.06 },
  helicopter: { type: 'helicopter', name: 'Helicopter', color: '#4080A0', speed: 0.14, hp: 200, width: 3.0, height: 2.0, flying: true, watercraft: false, passengers: 2, fuelMax: 6000, tiltSpeed: 0.02 },
  plane:      { type: 'plane', name: 'Plane', color: '#A0A0D0', speed: 0.28, hp: 180, width: 3.5, height: 1.5, flying: true, watercraft: false, passengers: 1, fuelMax: 10000, tiltSpeed: 0.03 },
  boat:       { type: 'boat', name: 'Boat', color: '#8B6914', speed: 0.12, hp: 120, width: 3.0, height: 1.0, flying: false, watercraft: true, passengers: 3, fuelMax: 15000, tiltSpeed: 0.03 },
}

export interface VehicleState {
  id: number           // unique vehicle instance id
  type: VehicleType
  x: number; y: number
  vx: number; vy: number
  hp: number; maxHp: number
  fuel: number
  tilt: number         // -1 to 1 (Elastomania lean angle)
  rider: number        // player index or -1
  onGround: boolean
  alive: boolean
}

// Vehicle recipes
RECIPES.push(
  { result: I.BOAT, count: 1, ingredients: [[B.PLANKS, 12], [I.NAIL, 6]], station: 'workbench' },
  { result: I.BUGGY, count: 1, ingredients: [[I.IRON_INGOT, 8], [I.GEAR, 4], [B.PLANKS, 4]], station: 'anvil' },
  { result: I.MOTORCYCLE, count: 1, ingredients: [[I.IRON_INGOT, 6], [I.GEAR, 3]], station: 'anvil' },
  { result: I.HELICOPTER, count: 1, ingredients: [[I.IRON_INGOT, 15], [I.GEAR, 8], [I.DIAMOND, 2]], station: 'anvil' },
  { result: I.PLANE, count: 1, ingredients: [[I.IRON_INGOT, 12], [I.GEAR, 6], [I.GOLD_INGOT, 3]], station: 'anvil' },
)

// ─── Enemy Types ───────────────────────────────────────────
export interface EnemyDef {
  name: string
  color: string
  hp: number
  damage: number
  speed: number
  width: number
  height: number
  jumpForce: number
  xp: number
  drops: [number, number, number][]  // [itemId, count, chance 0-1]
  nightOnly: boolean
  underground?: boolean
  boss?: boolean
  ranged?: boolean
  projectileColor?: string
}

export const ENEMY_TYPES: Record<string, EnemyDef> = {
  mutant: { name: 'Mutant', color: '#60A040', hp: 30, damage: 8, speed: 1.2, width: 0.8, height: 1.8, jumpForce: 7, xp: 5,
    drops: [[I.LEATHER, 1, 0.3], [I.CLOTH, 1, 0.2]], nightOnly: true },
  raider: { name: 'Raider', color: '#A04030', hp: 40, damage: 12, speed: 1.5, width: 0.8, height: 1.8, jumpForce: 7, xp: 8,
    drops: [[I.BULLET, 3, 0.4], [I.BANDAGE, 1, 0.2], [I.IRON_INGOT, 1, 0.1]], nightOnly: true, ranged: true, projectileColor: '#ff4' },
  spider: { name: 'Spider', color: '#602020', hp: 20, damage: 6, speed: 2.0, width: 1.0, height: 0.6, jumpForce: 9, xp: 4,
    drops: [[I.STRING, 2, 0.5]], nightOnly: false, underground: true },
  slime: { name: 'Slime', color: '#40C040', hp: 15, damage: 4, speed: 0.8, width: 0.8, height: 0.8, jumpForce: 8, xp: 2,
    drops: [[I.MUSHROOM_ITEM, 1, 0.3]], nightOnly: false },
  skeleton: { name: 'Skeleton', color: '#D0D0C0', hp: 35, damage: 10, speed: 1.0, width: 0.7, height: 1.8, jumpForce: 7, xp: 7,
    drops: [[I.ARROW, 5, 0.4], [I.COAL, 2, 0.3]], nightOnly: true, ranged: true, projectileColor: '#ccc' },
  zombie_king: { name: 'Zombie King', color: '#408020', hp: 500, damage: 20, speed: 1.8, width: 2.0, height: 3.0, jumpForce: 10, xp: 100,
    drops: [[I.DIAMOND, 3, 1.0], [I.GOLD_INGOT, 5, 1.0], [I.HEALTH_POTION, 3, 1.0]], nightOnly: true, boss: true },
  mech_boss: { name: 'Mech Overlord', color: '#8080A0', hp: 800, damage: 30, speed: 2.0, width: 2.5, height: 3.5, jumpForce: 12, xp: 200,
    drops: [[I.DIAMOND, 5, 1.0], [I.URANIUM, 3, 1.0], [I.GEAR, 10, 1.0]], nightOnly: true, boss: true, ranged: true, projectileColor: '#f00' },
}

// ─── Game State Types ──────────────────────────────────────
export type GameMode = 'survival' | 'deathmatch' | 'team-deathmatch' | 'coop-survival'

export interface InvSlot { id: number; count: number }

export interface PlayerState {
  x: number; y: number
  vx: number; vy: number
  width: number; height: number
  facing: number          // 1 or -1
  onGround: boolean
  hp: number; maxHp: number
  hunger: number; maxHunger: number
  alive: boolean
  respawnTimer: number
  inventory: InvSlot[]    // 40 slots (10 hotbar + 30 backpack)
  hotbar: number          // selected hotbar index (0-9)
  armor: [number, number, number]  // head, chest, legs item IDs (-1=none)
  mineTarget: { x: number; y: number } | null
  mineProgress: number
  attackCooldown: number
  invincibleTimer: number
  // Stance
  stance: Stance
  // Vehicle
  vehicleId: number       // vehicle instance id or -1
  // Multiplayer tracking
  kills: number; deaths: number; streak: number; bestStreak: number
  coins: number; gems: number; stars: number
  color: string; name: string; index: number
  input: PlayerSlot['input']; team: number
  // Effects
  speedMult: number; speedTimer: number
  strengthMult: number; strengthTimer: number
}

export interface EnemyState {
  type: string
  x: number; y: number
  vx: number; vy: number
  hp: number; maxHp: number
  width: number; height: number
  facing: number
  onGround: boolean
  attackCooldown: number
  targetPlayer: number   // index
  alive: boolean
  // Boss phase
  phase?: number
}

export interface Projectile {
  x: number; y: number
  vx: number; vy: number
  owner: number           // player index, -1 for enemy
  damage: number
  color: string
  gravity: boolean
  life: number            // ticks remaining
}

export interface ItemDrop {
  x: number; y: number
  vy: number
  itemId: number
  count: number
  life: number            // ticks until despawn
  magnet: number          // player index attracting, -1=none
}

export interface Particle {
  x: number; y: number
  vx: number; vy: number
  color: string
  life: number
  maxLife: number
  size: number
}

export interface GameConfig {
  mode: GameMode
  mapSize: 'small' | 'medium' | 'large'
  killsToWin: number
  difficulty: string
  worldWidth: number
  worldHeight: number
  surfaceY: number
}

export interface FlatWorldState {
  world: number[][]        // [y][x] block IDs
  bgWorld: number[][]      // [y][x] background wall IDs
  players: PlayerState[]
  enemies: EnemyState[]
  projectiles: Projectile[]
  drops: ItemDrop[]
  particles: Particle[]
  vehicles: VehicleState[]
  nextVehicleId: number
  time: number             // 0-24000 day cycle (0=dawn, 6000=noon, 12000=dusk, 18000=midnight)
  frame: number
  config: GameConfig
  gameOver: boolean
  winner: number | null
  waveNum: number
  waveTimer: number
  bossAlive: boolean
  spawnCooldown: number
}

// ─── World Size Presets ────────────────────────────────────
export const MAP_SIZES: Record<string, { w: number; h: number; surface: number }> = {
  small:  { w: 200, h: 120, surface: 60 },
  medium: { w: 400, h: 200, surface: 100 },
  large:  { w: 600, h: 300, surface: 150 },
}

// Arena maps are always small
export const ARENA_SIZE = { w: 80, h: 50, surface: 25 }

// ─── Constants ─────────────────────────────────────────────
export const TILE = 1                // tile size in Three.js units
export const GRAVITY = 0.025
export const MAX_FALL = 0.4
export const MOVE_SPEED = 0.08
export const JUMP_VEL = 0.28
export const PLAYER_W = 0.6
export const PLAYER_H = 1.7
export const INV_SIZE = 40
export const HOTBAR_SIZE = 10
export const DAY_LENGTH = 24000     // ticks per full day cycle
export const DAWN = 0
export const NOON = 6000
export const DUSK = 12000
export const MIDNIGHT = 18000
export const RESPAWN_TICKS = 180
export const HUNGER_INTERVAL = 600  // ticks between hunger decrease
export const STARVE_INTERVAL = 120  // ticks between starve damage
export const ITEM_DESPAWN = 6000    // ticks until dropped items vanish
export const ITEM_MAGNET_RANGE = 2  // tiles
export const MELEE_RANGE = 1.8      // tiles
export const MELEE_COOLDOWN = 20    // ticks
export const INVINCIBLE_TICKS = 30
export const MINE_RANGE = 4         // tiles
export const PLACE_RANGE = 5        // tiles
// Stance constants
export const CROUCH_HEIGHT = 1.1    // crouching player height
export const PRONE_HEIGHT = 0.5     // prone player height
export const CROUCH_SPEED_MULT = 0.55
export const PRONE_SPEED_MULT = 0.25
export const ENEMY_SPAWN_RANGE = 20 // tiles from player (min)
export const ENEMY_MAX_RANGE = 40   // tiles from player (max)
export const ENEMY_CAP = 15
export const WAVE_INTERVAL = 900    // ticks between coop waves (15s)
export const BOSS_WAVE_INTERVAL = 5 // every N waves a boss spawns
