/**
 * Map presets for the Warzone FPP game.
 *
 * Each preset defines a tile-grid layout and which game modes it supports.
 * Maps are procedurally populated with buildings, props, vehicles, pickups,
 * and mode-specific objectives by mapGenerator.ts.
 */
import type { MapPreset, GameMode } from './types'

// ─── All map presets ─────────────────────────────────────
export const MAP_PRESETS: MapPreset[] = [
  {
    id: 'bank_district',
    name: 'Bank District',
    description: 'Dense downtown streets around the Central Bank. Tight corridors and alleys.',
    gridW: 80,
    gridH: 80,
    tileSize: 3,
    modes: ['bomb', 'heist', 'team-deathmatch', 'deathmatch', 'escort'],
  },
  {
    id: 'downtown',
    name: 'Downtown',
    description: 'Large open city center with wide avenues and plazas. Ideal for large-scale battles.',
    gridW: 120,
    gridH: 120,
    tileSize: 3,
    modes: ['conquest', 'ctf', 'team-deathmatch', 'deathmatch', 'coop-assault'],
  },
  {
    id: 'industrial_zone',
    name: 'Industrial Zone',
    description: 'Warehouses, loading docks, and freight yards. Long sight lines and open areas.',
    gridW: 100,
    gridH: 80,
    tileSize: 3,
    modes: ['convoy', 'survival', 'conquest', 'team-deathmatch'],
  },
  {
    id: 'police_hq',
    name: 'Police Headquarters',
    description: 'Fortified police compound with holding cells and motor pool. Asymmetric layout.',
    gridW: 70,
    gridH: 70,
    tileSize: 3,
    modes: ['escort', 'bomb', 'heist', 'coop-assault', 'team-deathmatch'],
  },
  {
    id: 'highway',
    name: 'Highway',
    description: 'Long stretch of highway with overpasses and rest stops. Perfect for vehicle action.',
    gridW: 200,
    gridH: 50,
    tileSize: 3,
    modes: ['race', 'convoy', 'team-deathmatch'],
  },
  {
    id: 'harbor',
    name: 'Harbor',
    description: 'Waterfront docks with shipping containers and cranes. Mixed indoor/outdoor combat.',
    gridW: 90,
    gridH: 90,
    tileSize: 3,
    modes: ['heist', 'ctf', 'team-deathmatch', 'deathmatch', 'survival'],
  },
  {
    id: 'suburbs',
    name: 'Suburbs',
    description: 'Quiet residential neighborhood. Houses, gardens, and a small shopping strip.',
    gridW: 100,
    gridH: 100,
    tileSize: 3,
    modes: ['deathmatch', 'team-deathmatch', 'bomb', 'escort', 'conquest'],
  },
  {
    id: 'rooftops',
    name: 'Rooftops',
    description: 'Connected rooftop arenas high above the city. Vertical combat with long drops.',
    gridW: 60,
    gridH: 60,
    tileSize: 3,
    modes: ['deathmatch', 'team-deathmatch', 'ctf'],
  },
  {
    id: 'warzone_island',
    name: 'Warzone Island',
    description: 'Massive open island with scattered buildings, forests, and hills. Battle Royale paradise.',
    gridW: 200,
    gridH: 200,
    tileSize: 3,
    modes: ['battle-royale', 'deathmatch', 'team-deathmatch', 'conquest'],
  },
  {
    id: 'fallen_city',
    name: 'Fallen City',
    description: 'Post-apocalyptic urban sprawl. Ruined skyscrapers and overgrown streets. Perfect for looting.',
    gridW: 160,
    gridH: 160,
    tileSize: 3,
    modes: ['battle-royale', 'survival', 'deathmatch'],
  },
]

/** Get the default map for a given game mode */
export function getDefaultMap(mode: GameMode): MapPreset {
  return MAP_PRESETS.find(m => m.modes[0] === mode)
    || MAP_PRESETS.find(m => m.modes.includes(mode))
    || MAP_PRESETS[0]
}

/** Get all maps that support a given mode */
export function getMapsForMode(mode: GameMode): MapPreset[] {
  return MAP_PRESETS.filter(m => m.modes.includes(mode))
}
