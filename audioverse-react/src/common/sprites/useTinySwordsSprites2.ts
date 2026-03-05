/**
 * useTinySwordsSprites — loads ALL Tiny Swords assets by explicit path.
 * Returns structured sprite data organized by category.
 * Supports sprite sheets with frame extraction and static images.
 *
 * Reusable across all games that need Tiny Swords assets.
 */
import { useEffect, useRef, useState } from 'react'
import { loadSpriteSheet, loadImage, type SpriteSheetData } from './SpriteSheet'
import {
  TERRAIN, RESOURCES, BUILDINGS_FREE, BUILDINGS_KNIGHTS, BUILDINGS_GOBLINS,
  UNITS_FREE, UNITS_KNIGHTS, UNITS_GOBLINS, ENEMIES, EFFECTS, UI,
  type GameFactionColor,
} from './TinySwordsAssets'

// ── Public types ─────────────────────────────────────────────
export interface TinySwordsSprites {
  loaded: boolean
  progress: number // 0-1

  // Terrain
  waterBg: HTMLImageElement | null
  waterFoam: HTMLImageElement | null
  waterAnim: SpriteSheetData | null
  foam: SpriteSheetData | null
  tilemaps: HTMLImageElement[]
  groundFlat: HTMLImageElement | null
  groundElevation: HTMLImageElement | null
  shadows: HTMLImageElement | null
  bridge: SpriteSheetData | null

  // Decorations
  bushes: HTMLImageElement[]
  clouds: HTMLImageElement[]
  rocks: HTMLImageElement[]
  waterRocks: HTMLImageElement[]
  rubberDuck: HTMLImageElement | null
  deco: HTMLImageElement[]

  // Resources
  goldResource: HTMLImageElement | null
  goldResourceHighlight: HTMLImageElement | null
  goldStones: HTMLImageElement[]
  goldMine: { active: HTMLImageElement | null; destroyed: HTMLImageElement | null; inactive: HTMLImageElement | null }
  goldIcon: SpriteSheetData | null
  goldSpawn: SpriteSheetData | null
  meatResource: HTMLImageElement | null
  sheepIdle: SpriteSheetData | null
  sheepMove: SpriteSheetData | null
  sheepGrass: SpriteSheetData | null
  sheepBouncing: SpriteSheetData | null
  meatIcon: SpriteSheetData | null
  woodResource: HTMLImageElement | null
  trees: HTMLImageElement[]
  stumps: HTMLImageElement[]
  woodIcon: SpriteSheetData | null
  tools: HTMLImageElement[]
  treeAnimated: SpriteSheetData | null

  // Buildings (indexed by faction color)
  buildings: Record<GameFactionColor, {
    castle: HTMLImageElement | null
    barracks: HTMLImageElement | null
    archery: HTMLImageElement | null
    house1: HTMLImageElement | null
    house2: HTMLImageElement | null
    house3: HTMLImageElement | null
    monastery: HTMLImageElement | null
    tower: HTMLImageElement | null
  }>
  knightBuildings: Record<GameFactionColor, {
    castle: HTMLImageElement | null
    house: HTMLImageElement | null
    tower: HTMLImageElement | null
  }>
  buildingConstruction: { castle: HTMLImageElement | null; house: HTMLImageElement | null; tower: HTMLImageElement | null }
  buildingDestroyed: { castle: HTMLImageElement | null; house: HTMLImageElement | null; tower: HTMLImageElement | null }
  goblinBuildings: { house: HTMLImageElement | null; houseDestroyed: HTMLImageElement | null }
  goblinTowers: Record<GameFactionColor, HTMLImageElement | null>
  goblinTowerConstruction: HTMLImageElement | null
  goblinTowerDestroyed: HTMLImageElement | null

  // Units (indexed by faction color)
  units: Record<GameFactionColor, {
    warrior: Record<string, SpriteSheetData | null>
    archer: Record<string, SpriteSheetData | null>
    pawn: Record<string, SpriteSheetData | null>
    lancer: Record<string, SpriteSheetData | null>
    monk: Record<string, SpriteSheetData | null>
  }>
  knightUnits: Record<GameFactionColor, {
    warrior: SpriteSheetData | null
    archer: SpriteSheetData | null
    pawn: SpriteSheetData | null
  }>
  knightDead: SpriteSheetData | null
  arrowSprite: HTMLImageElement | null

  // Goblin units
  goblinBarrel: Record<GameFactionColor, SpriteSheetData | null>
  goblinTNT: Record<GameFactionColor, SpriteSheetData | null>
  goblinTorch: Record<GameFactionColor, SpriteSheetData | null>
  dynamite: SpriteSheetData | null

  // Enemies
  enemies: Record<string, Record<string, SpriteSheetData | null>>
  enemyAvatars: HTMLImageElement[]

  // Effects
  dust: SpriteSheetData[]
  explosions: SpriteSheetData[]
  fires: SpriteSheetData[]
  waterSplash: SpriteSheetData | null
  explosionSheet: SpriteSheetData | null
  fireSheet: SpriteSheetData | null

  // UI
  bannerPanel: HTMLImageElement | null
  bannerSlots: HTMLImageElement | null
  carved9: HTMLImageElement | null
  carved3: HTMLImageElement | null
  carvedRegular: HTMLImageElement | null
  barBigBase: HTMLImageElement | null
  barBigFill: HTMLImageElement | null
  barSmallBase: HTMLImageElement | null
  barSmallFill: HTMLImageElement | null
  buttons: Record<string, HTMLImageElement | null>
  cursors: HTMLImageElement[]
  avatars: HTMLImageElement[]
  iconsFree: HTMLImageElement[]
  iconsRegular: HTMLImageElement[]
  iconsPressed: HTMLImageElement[]
  iconsDisabled: HTMLImageElement[]
  paperRegular: HTMLImageElement | null
  paperSpecial: HTMLImageElement | null
  ribbonsBig: HTMLImageElement | null
  ribbonsSmall: HTMLImageElement | null
  ribbonStore: Record<string, HTMLImageElement | null>
  swords: HTMLImageElement | null
  woodTable: HTMLImageElement | null
  woodTableSlots: HTMLImageElement | null
  pointers: HTMLImageElement[]
}

function emptySprites(): TinySwordsSprites {
  const emptyColor = () => ({
    castle: null, barracks: null, archery: null, house1: null,
    house2: null, house3: null, monastery: null, tower: null,
  })
  const emptyKnightBldg = () => ({ castle: null, house: null, tower: null })
  const emptyUnits = () => ({
    warrior: {} as Record<string, SpriteSheetData | null>,
    archer: {} as Record<string, SpriteSheetData | null>,
    pawn: {} as Record<string, SpriteSheetData | null>,
    lancer: {} as Record<string, SpriteSheetData | null>,
    monk: {} as Record<string, SpriteSheetData | null>,
  })
  const emptyKnightUnit = () => ({ warrior: null, archer: null, pawn: null })
  return {
    loaded: false, progress: 0,
    waterBg: null, waterFoam: null, waterAnim: null, foam: null,
    tilemaps: [], groundFlat: null, groundElevation: null, shadows: null, bridge: null,
    bushes: [], clouds: [], rocks: [], waterRocks: [], rubberDuck: null, deco: [],
    goldResource: null, goldResourceHighlight: null, goldStones: [],
    goldMine: { active: null, destroyed: null, inactive: null },
    goldIcon: null, goldSpawn: null,
    meatResource: null, sheepIdle: null, sheepMove: null, sheepGrass: null,
    sheepBouncing: null, meatIcon: null,
    woodResource: null, trees: [], stumps: [], woodIcon: null, tools: [], treeAnimated: null,
    buildings: { blue: emptyColor(), red: emptyColor(), purple: emptyColor(), yellow: emptyColor() },
    knightBuildings: { blue: emptyKnightBldg(), red: emptyKnightBldg(), purple: emptyKnightBldg(), yellow: emptyKnightBldg() },
    buildingConstruction: { castle: null, house: null, tower: null },
    buildingDestroyed: { castle: null, house: null, tower: null },
    goblinBuildings: { house: null, houseDestroyed: null },
    goblinTowers: { blue: null, red: null, purple: null, yellow: null },
    goblinTowerConstruction: null, goblinTowerDestroyed: null,
    units: { blue: emptyUnits(), red: emptyUnits(), purple: emptyUnits(), yellow: emptyUnits() },
    knightUnits: { blue: emptyKnightUnit(), red: emptyKnightUnit(), purple: emptyKnightUnit(), yellow: emptyKnightUnit() },
    knightDead: null, arrowSprite: null,
    goblinBarrel: { blue: null, red: null, purple: null, yellow: null },
    goblinTNT: { blue: null, red: null, purple: null, yellow: null },
    goblinTorch: { blue: null, red: null, purple: null, yellow: null },
    dynamite: null,
    enemies: {}, enemyAvatars: [],
    dust: [], explosions: [], fires: [], waterSplash: null, explosionSheet: null, fireSheet: null,
    bannerPanel: null, bannerSlots: null, carved9: null, carved3: null, carvedRegular: null,
    barBigBase: null, barBigFill: null, barSmallBase: null, barSmallFill: null,
    buttons: {}, cursors: [], avatars: [],
    iconsFree: [], iconsRegular: [], iconsPressed: [], iconsDisabled: [],
    paperRegular: null, paperSpecial: null,
    ribbonsBig: null, ribbonsSmall: null, ribbonStore: {},
    swords: null, woodTable: null, woodTableSlots: null, pointers: [],
  }
}

type LoadTask = { type: 'img'; path: string; setter: (img: HTMLImageElement) => void }
  | { type: 'sheet'; path: string; setter: (s: SpriteSheetData) => void }

export default function useTinySwordsSprites(): TinySwordsSprites {
  const [sprites, setSprites] = useState<TinySwordsSprites>(emptySprites)
  const loadingRef = useRef(false)

  useEffect(() => {
    if (loadingRef.current) return
    loadingRef.current = true

    const s = emptySprites()
    const tasks: LoadTask[] = []

    // Helper: queue image load
    const img = (path: string, setter: (i: HTMLImageElement) => void) =>
      tasks.push({ type: 'img', path, setter })
    const sheet = (path: string, setter: (s: SpriteSheetData) => void) =>
      tasks.push({ type: 'sheet', path, setter })

    // ── Terrain ──
    img(TERRAIN.tileset.waterBg, i => { s.waterBg = i })
    img(TERRAIN.tileset.waterFoam, i => { s.waterFoam = i })
    sheet(TERRAIN.water.water, ss => { s.waterAnim = ss })
    sheet(TERRAIN.water.foam, ss => { s.foam = ss })
    for (const tc of [TERRAIN.tileset.color1, TERRAIN.tileset.color2, TERRAIN.tileset.color3, TERRAIN.tileset.color4, TERRAIN.tileset.color5]) {
      img(tc, i => { s.tilemaps.push(i) })
    }
    img(TERRAIN.ground.flat, i => { s.groundFlat = i })
    img(TERRAIN.ground.elevation, i => { s.groundElevation = i })
    img(TERRAIN.ground.shadows, i => { s.shadows = i })
    sheet(TERRAIN.bridge, ss => { s.bridge = ss })

    // Decorations
    for (const bp of TERRAIN.decorations.bushes) img(bp, i => { s.bushes.push(i) })
    for (const cp of TERRAIN.decorations.clouds) img(cp, i => { s.clouds.push(i) })
    for (const rp of TERRAIN.decorations.rocks) img(rp, i => { s.rocks.push(i) })
    for (const wp of TERRAIN.decorations.waterRocks) img(wp, i => { s.waterRocks.push(i) })
    img(TERRAIN.decorations.rubberDuck, i => { s.rubberDuck = i })
    for (const dp of TERRAIN.deco) img(dp, i => { s.deco.push(i) })
    for (const rwp of TERRAIN.water.rocks) img(rwp, i => { s.waterRocks.push(i) })

    // ── Resources ──
    img(RESOURCES.gold.resource, i => { s.goldResource = i })
    img(RESOURCES.gold.resourceHighlight, i => { s.goldResourceHighlight = i })
    for (const gs of RESOURCES.gold.stones) {
      img(gs.normal, i => { s.goldStones.push(i) })
    }
    img(RESOURCES.gold.mine.active, i => { s.goldMine.active = i })
    img(RESOURCES.gold.mine.destroyed, i => { s.goldMine.destroyed = i })
    img(RESOURCES.gold.mine.inactive, i => { s.goldMine.inactive = i })
    sheet(RESOURCES.gold.icon.idle, ss => { s.goldIcon = ss })
    sheet(RESOURCES.gold.icon.spawn, ss => { s.goldSpawn = ss })
    img(RESOURCES.meat.resource, i => { s.meatResource = i })
    sheet(RESOURCES.meat.sheep.idle, ss => { s.sheepIdle = ss })
    sheet(RESOURCES.meat.sheep.move, ss => { s.sheepMove = ss })
    sheet(RESOURCES.meat.sheep.grass, ss => { s.sheepGrass = ss })
    sheet(RESOURCES.sheepAnimated.bouncing, ss => { s.sheepBouncing = ss })
    sheet(RESOURCES.meat.icon.idle, ss => { s.meatIcon = ss })
    img(RESOURCES.wood.resource, i => { s.woodResource = i })
    for (const tp of RESOURCES.wood.trees) img(tp, i => { s.trees.push(i) })
    for (const sp of RESOURCES.wood.stumps) img(sp, i => { s.stumps.push(i) })
    sheet(RESOURCES.wood.icon.idle, ss => { s.woodIcon = ss })
    for (const tp of RESOURCES.tools) img(tp, i => { s.tools.push(i) })
    sheet(RESOURCES.tree, ss => { s.treeAnimated = ss })

    // ── Buildings ──
    const factionColors: GameFactionColor[] = ['blue', 'red', 'purple', 'yellow']
    for (const fc of factionColors) {
      const bf = BUILDINGS_FREE[fc]
      img(bf.castle, i => { s.buildings[fc].castle = i })
      img(bf.barracks, i => { s.buildings[fc].barracks = i })
      img(bf.archery, i => { s.buildings[fc].archery = i })
      img(bf.house1, i => { s.buildings[fc].house1 = i })
      img(bf.house2, i => { s.buildings[fc].house2 = i })
      img(bf.house3, i => { s.buildings[fc].house3 = i })
      img(bf.monastery, i => { s.buildings[fc].monastery = i })
      img(bf.tower, i => { s.buildings[fc].tower = i })

      const bk = BUILDINGS_KNIGHTS
      img(bk.castle[fc], i => { s.knightBuildings[fc].castle = i })
      img(bk.house[fc], i => { s.knightBuildings[fc].house = i })
      img(bk.tower[fc], i => { s.knightBuildings[fc].tower = i })

      // Goblin towers
      img(BUILDINGS_GOBLINS.tower[fc], i => { s.goblinTowers[fc] = i })
    }
    img(BUILDINGS_KNIGHTS.castle.construction, i => { s.buildingConstruction.castle = i })
    img(BUILDINGS_KNIGHTS.castle.destroyed, i => { s.buildingDestroyed.castle = i })
    img(BUILDINGS_KNIGHTS.house.construction, i => { s.buildingConstruction.house = i })
    img(BUILDINGS_KNIGHTS.house.destroyed, i => { s.buildingDestroyed.house = i })
    img(BUILDINGS_KNIGHTS.tower.construction, i => { s.buildingConstruction.tower = i })
    img(BUILDINGS_KNIGHTS.tower.destroyed, i => { s.buildingDestroyed.tower = i })
    img(BUILDINGS_GOBLINS.house.normal, i => { s.goblinBuildings.house = i })
    img(BUILDINGS_GOBLINS.house.destroyed, i => { s.goblinBuildings.houseDestroyed = i })
    img(BUILDINGS_GOBLINS.tower.construction, i => { s.goblinTowerConstruction = i })
    img(BUILDINGS_GOBLINS.tower.destroyed, i => { s.goblinTowerDestroyed = i })

    // ── Units ──
    for (const fc of factionColors) {
      const uf = UNITS_FREE[fc]
      // Warrior
      for (const [k, p] of Object.entries(uf.warrior)) sheet(p, ss => { s.units[fc].warrior[k] = ss })
      // Archer
      for (const [k, p] of Object.entries(uf.archer)) {
        if (k === 'arrow') img(p, i => { s.arrowSprite = i })
        else sheet(p, ss => { s.units[fc].archer[k] = ss })
      }
      // Pawn
      for (const [k, p] of Object.entries(uf.pawn)) sheet(p, ss => { s.units[fc].pawn[k] = ss })
      // Lancer
      for (const [k, p] of Object.entries(uf.lancer)) sheet(p, ss => { s.units[fc].lancer[k] = ss })
      // Monk
      for (const [k, p] of Object.entries(uf.monk)) sheet(p, ss => { s.units[fc].monk[k] = ss })

      // Knight units (Update 010)
      sheet(UNITS_KNIGHTS.warrior[fc], ss => { s.knightUnits[fc].warrior = ss })
      sheet(UNITS_KNIGHTS.archer[fc], ss => { s.knightUnits[fc].archer = ss })
      sheet(UNITS_KNIGHTS.pawn[fc], ss => { s.knightUnits[fc].pawn = ss })

      // Goblin units
      sheet(UNITS_GOBLINS.barrel[fc], ss => { s.goblinBarrel[fc] = ss })
      sheet(UNITS_GOBLINS.tnt[fc], ss => { s.goblinTNT[fc] = ss })
      sheet(UNITS_GOBLINS.torch[fc], ss => { s.goblinTorch[fc] = ss })
    }
    sheet(UNITS_KNIGHTS.dead, ss => { s.knightDead = ss })
    img(UNITS_KNIGHTS.archer.arrow, i => { s.arrowSprite = i })
    sheet(UNITS_GOBLINS.tnt.dynamite, ss => { s.dynamite = ss })

    // ── Enemies ──
    for (const [eName, eData] of Object.entries(ENEMIES)) {
      if (eName === 'avatars') continue
      if (Array.isArray(eData)) continue
      s.enemies[eName] = {}
      for (const [aName, path] of Object.entries(eData as Record<string, string>)) {
        sheet(path, ss => { s.enemies[eName][aName] = ss })
      }
    }
    for (const ap of ENEMIES.avatars) img(ap, i => { s.enemyAvatars.push(i) })

    // ── Effects ──
    for (const dp of EFFECTS.dust) sheet(dp, ss => { s.dust.push(ss) })
    for (const ep of EFFECTS.explosion) sheet(ep, ss => { s.explosions.push(ss) })
    for (const fp of EFFECTS.fire) sheet(fp, ss => { s.fires.push(ss) })
    sheet(EFFECTS.waterSplash, ss => { s.waterSplash = ss })
    sheet(EFFECTS.explosionSheet, ss => { s.explosionSheet = ss })
    sheet(EFFECTS.fireSheet, ss => { s.fireSheet = ss })

    // ── UI ──
    img(UI.banners.banner, i => { s.bannerPanel = i })
    img(UI.banners.bannerSlots, i => { s.bannerSlots = i })
    img(UI.banners.carved9, i => { s.carved9 = i })
    img(UI.banners.carved3, i => { s.carved3 = i })
    img(UI.banners.carvedRegular, i => { s.carvedRegular = i })
    img(UI.bars.bigBase, i => { s.barBigBase = i })
    img(UI.bars.bigFill, i => { s.barBigFill = i })
    img(UI.bars.smallBase, i => { s.barSmallBase = i })
    img(UI.bars.smallFill, i => { s.barSmallFill = i })
    for (const [k, p] of Object.entries(UI.buttons)) {
      img(p, i => { s.buttons[k] = i })
    }
    for (const cp of UI.cursors) img(cp, i => { s.cursors.push(i) })
    for (const ap of UI.avatars) img(ap, i => { s.avatars.push(i) })
    for (const ip of UI.icons.free) img(ip, i => { s.iconsFree.push(i) })
    for (const ip of UI.icons.regular) img(ip, i => { s.iconsRegular.push(i) })
    for (const ip of UI.icons.pressed) img(ip, i => { s.iconsPressed.push(i) })
    for (const ip of UI.icons.disabled) img(ip, i => { s.iconsDisabled.push(i) })
    img(UI.papers.regular, i => { s.paperRegular = i })
    img(UI.papers.special, i => { s.paperSpecial = i })
    img(UI.ribbons.big, i => { s.ribbonsBig = i })
    img(UI.ribbons.small, i => { s.ribbonsSmall = i })
    for (const [k, p] of Object.entries(UI.ribbons)) {
      if (k.startsWith('store')) img(p, i => { s.ribbonStore[k] = i })
    }
    img(UI.swords, i => { s.swords = i })
    img(UI.woodTable, i => { s.woodTable = i })
    img(UI.woodTableSlots, i => { s.woodTableSlots = i })
    for (const pp of UI.pointers) img(pp, i => { s.pointers.push(i) })

    // ── Execute all tasks ──
    let done = 0
    const total = tasks.length
    if (total === 0) { s.loaded = true; s.progress = 1; setSprites({ ...s }); return }

    function onComplete() {
      done++
      s.progress = done / total
      if (done >= total) {
        s.loaded = true
        setSprites({ ...s })
      } else if (done % 50 === 0) {
        // Update progress periodically
        setSprites({ ...s })
      }
    }

    for (const task of tasks) {
      if (task.type === 'img') {
        loadImage(task.path).then(i => { task.setter(i); onComplete() }).catch(() => onComplete())
      } else {
        loadSpriteSheet(task.path).then(ss => { task.setter(ss); onComplete() }).catch(() => onComplete())
      }
    }
  }, [])

  return sprites
}
