import type { GameConfig } from '../../pages/games/mini/types'
/**
 * Game loop / tick for Underpaid Time Management.
 *
 * Handles player movement, cooking timers, order management,
 * interact/pickup actions, and combo system.
 */
import type { GameState, Player, StoveState, OvenState } from './types'
import {
  MOVE_SPEED, CARRY_SPEED, PLAYER_RADIUS, CELL_SIZE,
  CHOP_TIME, FAST_CHOP_TIME, COOK_TIME, BURN_TIME,
  BAKE_TIME, CLEAN_TIME, WASH_TIME, COMBO_WINDOW,
  ROUND_SECS, DIFFICULTY_SETTINGS, FAIL_PENALTY,
} from './constants'
import {
  slideMove, getBlockingStations, nearestStationInRange,
  stationCenter, pushPlayersApart,
} from './helpers'
import { getInput, type GamepadState } from './input'
import {
  spawnOrder, findMatchingOrder, scoreDelivery, resetOrderCounter,
} from './recipeSystem'
import type { SceneMeshes } from './kitchenGenerator'
import {
  createFireMesh,
  type CharacterHandle, playAnim,
} from './modelManager'

import type { PlayerSlot } from '../../pages/games/mini/types'
import { PLAYER_COLORS } from '../../pages/games/mini/types'
import { getKitchenLayout } from './kitchenGenerator'

// ═══════════════════════════════════════════════════════════
//  INIT STATE
// ═══════════════════════════════════════════════════════════

export function initState(
  players: PlayerSlot[],
  config: GameConfig,
): GameState {
  const layout = getKitchenLayout(config.kitchenLayout || 'simple')
  const mode = (config.gameMode as string) || 'coop-kitchen'
  const difficulty = (config.difficulty as string) || 'normal'
  const diffSettings = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.normal

  resetOrderCounter()

  const ps: Player[] = players.map((p, i) => ({
    idx: p.index,
    x: layout.playerSpawns[i % layout.playerSpawns.length].x,
    y: layout.playerSpawns[i % layout.playerSpawns.length].y,
    angle: 0,
    color: p.color || PLAYER_COLORS[p.index] || '#fff',
    name: p.name,
    input: p.input,
    holding: null,
    holdingPlate: null,
    chopTimer: 0,
    interactTimer: 0,
    speed: MOVE_SPEED,
    team: mode === 'vs-kitchen' ? (i < Math.ceil(players.length / 2) ? 0 : 1) : 0,
    coins: 0,
    gems: 0,
    stars: 0,
    animState: 'idle',
    combo: 0,
    comboTimer: 0,
  }))

  // Init stove/oven states
  const stoves: StoveState[] = layout.stations
    .filter(s => s.type === 'stove')
    .map(s => ({ stationId: s.id, item: null, cookProgress: 0, burnProgress: 0, onFire: false }))

  const ovens: OvenState[] = layout.stations
    .filter(s => s.type === 'oven')
    .map(s => ({ stationId: s.id, item: null, bakeProgress: 0, done: false }))

  const orderInterval = Math.floor(7000 * diffSettings.spawnMul)

  return {
    players: ps,
    stations: layout.stations,
    stoves,
    ovens,
    plate: { items: [], dirty: false },
    dirtyPlates: 0,
    counterItems: [],
    orders: [],
    score: 0,
    teamScores: [0, 0],
    timeLeft: ROUND_SECS * 1000,
    gameOver: false,
    mode,
    round: 1,
    orderInterval,
    nextOrderIn: 2000,
    nextOrderId: 1,
    perfectStreak: 0,
    totalCoins: 0,
    totalGems: 0,
    totalStars: 0,
    combo: 0,
    comboTimer: 0,
    kitchenLayout: layout,
    gridCols: layout.cols,
    gridRows: layout.rows,
    cellSize: CELL_SIZE,
  }
}

// ═══════════════════════════════════════════════════════════
//  PICKUP & DROP LOGIC
// ═══════════════════════════════════════════════════════════

function doPickupDrop(p: Player, st: GameState): void {
  if (p.chopTimer > 0 || p.interactTimer > 0) return

  if (p.holding || p.holdingPlate) {
    // ─── DROP ───────────────────────────────────────────
    const station = nearestStationInRange(p, st.stations, st.cellSize)
    if (!station) return

    if (p.holdingPlate) {
      // Try serve plate
      if (station.type === 'serve') {
        const orderIdx = findMatchingOrder(p.holdingPlate, st.orders)
        if (orderIdx >= 0) {
          const order = st.orders[orderIdx]
          const result = scoreDelivery(order, st.combo)
          st.score += result.score
          st.totalCoins += result.coins
          st.totalGems += result.gems
          p.coins += result.coins
          p.gems += result.gems
          st.combo = result.combo
          st.comboTimer = COMBO_WINDOW
          if (result.perfect) st.perfectStreak++
          else st.perfectStreak = 0
          st.orders.splice(orderIdx, 1)
          st.dirtyPlates++
          p.holdingPlate = null
          return
        }
      }
      // Drop plate on counter
      if (station.type === 'counter') {
        // Put plate contents into plate station
        // For simplicity: drop individual items
      }
      return
    }

    if (p.holding) {
      // Drop on stove (must be chopped, stove must be empty and not on fire)
      if (station.type === 'stove') {
        const sv = st.stoves.find(s => s.stationId === station.id)
        if (sv && !sv.item && !sv.onFire && p.holding.chopped) {
          sv.item = p.holding
          p.holding = null
          return
        }
      }

      // Drop in oven
      if (station.type === 'oven') {
        const ov = st.ovens.find(o => o.stationId === station.id)
        if (ov && !ov.item) {
          ov.item = p.holding
          p.holding = null
          return
        }
      }

      // Drop on plate station (assemble)
      if (station.type === 'plate') {
        if (st.plate.items.length < 4) {
          st.plate.items.push(p.holding)
          p.holding = null
          return
        }
      }

      // Drop on counter
      if (station.type === 'counter' || station.type === 'cutting_board') {
        if (!st.counterItems.find(c => c.stationId === station.id)) {
          st.counterItems.push({ stationId: station.id, item: p.holding })
          p.holding = null
          return
        }
      }

      // Trash
      if (station.type === 'trash') {
        p.holding = null
        return
      }
    }
  } else {
    // ─── PICKUP ─────────────────────────────────────────
    const station = nearestStationInRange(p, st.stations, st.cellSize)
    if (!station) return

    // Pick up from stove (cooked item)
    if (station.type === 'stove') {
      const sv = st.stoves.find(s => s.stationId === station.id)
      if (sv && sv.item && sv.cookProgress >= COOK_TIME && !sv.onFire) {
        sv.item.cooked = true
        p.holding = sv.item
        sv.item = null
        sv.cookProgress = 0
        sv.burnProgress = 0
        return
      }
    }

    // Pick up from oven (baked item)
    if (station.type === 'oven') {
      const ov = st.ovens.find(o => o.stationId === station.id)
      if (ov && ov.item && ov.done) {
        ov.item.cooked = true
        p.holding = ov.item
        ov.item = null
        ov.bakeProgress = 0
        ov.done = false
        return
      }
    }

    // Try to pick up assembled plate
    if (station.type === 'plate' && st.plate.items.length > 0) {
      p.holdingPlate = { items: [...st.plate.items], dirty: false }
      st.plate.items = []
      return
    }

    // Pick up from serve window (try to match & deliver)
    if (station.type === 'serve' && p.holdingPlate) {
      // Already handled in drop section
    }

    // Pick from counter
    for (let i = 0; i < st.counterItems.length; i++) {
      if (st.counterItems[i].stationId === station.id) {
        p.holding = st.counterItems[i].item
        st.counterItems.splice(i, 1)
        return
      }
    }

    // Pick from ingredient station (infinite supply)
    if (station.type === 'ingredient' && station.ingredient) {
      p.holding = {
        ingredient: station.ingredient,
        chopped: false,
        cooked: false,
        burned: false,
      }
      return
    }

    // Pick clean plate from sink (if dirty plates available and sink isn't busy)
    if (station.type === 'sink' && st.dirtyPlates > 0) {
      p.interactTimer = WASH_TIME
      return
    }
  }
}

// ─── Interact (chop / clean / wash) ─────────────────────
function doInteract(p: Player, st: GameState): void {
  if (p.chopTimer > 0 || p.interactTimer > 0) return

  const station = nearestStationInRange(p, st.stations, st.cellSize)
  if (!station) return

  // Chop at counter or cutting board
  if (p.holding && !p.holding.chopped && !p.holding.cooked) {
    if (station.type === 'counter') {
      p.chopTimer = CHOP_TIME
      return
    }
    if (station.type === 'cutting_board') {
      p.chopTimer = FAST_CHOP_TIME
      return
    }
  }

  // Clean fire on stove
  if (station.type === 'stove') {
    const sv = st.stoves.find(s => s.stationId === station.id)
    if (sv && sv.onFire) {
      p.interactTimer = CLEAN_TIME
      return
    }
  }

  // Wash dirty plate at sink
  if (station.type === 'sink' && st.dirtyPlates > 0) {
    p.interactTimer = WASH_TIME
    return
  }
}

// ═══════════════════════════════════════════════════════════
//  MAIN GAME TICK
// ═══════════════════════════════════════════════════════════

export function gameTick(
  st: GameState,
  dt: number,
  pads: GamepadState[],
  meshes: SceneMeshes | null,
  charHandles?: Map<number, CharacterHandle>,
): void {
  if (st.gameOver) return

  // ─── Timer ─────────────────────────────────────────────
  st.timeLeft -= dt
  if (st.timeLeft <= 0) {
    st.timeLeft = 0
    st.gameOver = true
    st.totalStars = st.score >= 50 ? 3 : st.score >= 30 ? 2 : st.score >= 15 ? 1 : 0
    for (const p of st.players) {
      p.stars = st.totalStars
    }
    return
  }

  // ─── Combo timer decay ─────────────────────────────────
  if (st.comboTimer > 0) {
    st.comboTimer -= dt
    if (st.comboTimer <= 0) {
      st.combo = 0
      st.comboTimer = 0
    }
  }

  // ─── Build obstacle list ──────────────────────────────
  const obstacles = getBlockingStations(st.stations)

  // ─── Move players ─────────────────────────────────────
  for (const p of st.players) {
    if (p.chopTimer > 0 || p.interactTimer > 0) {
      p.animState = p.chopTimer > 0 ? 'chopping' : 'interacting'
      continue
    }

    const inp = getInput(p.input, pads)

    // One-shot actions
    if (inp.pickup) doPickupDrop(p, st)
    if (inp.interact) doInteract(p, st)

    // Movement
    if (inp.mx !== 0 || inp.my !== 0) {
      const len = Math.hypot(inp.mx, inp.my)
      const speed = (p.holding || p.holdingPlate) ? CARRY_SPEED : MOVE_SPEED
      const dashMul = inp.dash ? 1.4 : 1
      const moveSpeed = speed * dashMul * (dt / 1000)
      const dx = (inp.mx / len) * moveSpeed
      const dy = (inp.my / len) * moveSpeed

      const mapW = st.gridCols * st.cellSize
      const mapH = st.gridRows * st.cellSize
      const newPos = slideMove(p.x, p.y, dx, dy, PLAYER_RADIUS, obstacles, mapW, mapH)
      p.x = newPos.x
      p.y = newPos.y
      p.angle = Math.atan2(inp.my, inp.mx)
      p.animState = (p.holding || p.holdingPlate) ? 'carrying' : 'walking'
    } else {
      p.animState = (p.holding || p.holdingPlate) ? 'carrying' : 'idle'
    }
  }

  // Push players apart
  pushPlayersApart(st.players)

  // ─── Chop timers ──────────────────────────────────────
  for (const p of st.players) {
    if (p.chopTimer > 0) {
      p.chopTimer -= dt
      if (p.chopTimer <= 0) {
        p.chopTimer = 0
        if (p.holding) p.holding.chopped = true
      }
    }
    if (p.interactTimer > 0) {
      p.interactTimer -= dt
      if (p.interactTimer <= 0) {
        p.interactTimer = 0

        // Complete interaction based on nearest station
        const station = nearestStationInRange(p, st.stations, st.cellSize)
        if (station) {
          if (station.type === 'stove') {
            const sv = st.stoves.find(s => s.stationId === station.id)
            if (sv && sv.onFire) {
              sv.onFire = false
              sv.item = null
              sv.cookProgress = 0
              sv.burnProgress = 0
            }
          }
          if (station.type === 'sink' && st.dirtyPlates > 0) {
            st.dirtyPlates--
            // Give player a clean plate
            p.holdingPlate = { items: [], dirty: false }
          }
        }
      }
    }
  }

  // ─── Stove cooking ────────────────────────────────────
  const difficulty = 'normal' // TODO: pass from config
  const burnMul = (DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.normal).burnMul
  for (const sv of st.stoves) {
    if (sv.onFire || !sv.item) continue
    if (sv.cookProgress < COOK_TIME) {
      sv.cookProgress += dt
    } else {
      sv.burnProgress += dt
      if (sv.burnProgress >= BURN_TIME * burnMul) {
        sv.onFire = true
        sv.item = null
        sv.cookProgress = 0
        sv.burnProgress = 0

        // Add fire mesh
        if (meshes) {
          const station = st.stations.find(s => s.id === sv.stationId)
          if (station) {
            const fireMesh = createFireMesh()
            const pos = stationCenter(station, st.cellSize)
            fireMesh.position.set(pos.x, 0, pos.y)
            meshes.scene.add(fireMesh)
            meshes.fireMeshes.set(sv.stationId, fireMesh)
          }
        }
      }
    }
  }

  // Remove fire meshes when fire is extinguished
  if (meshes) {
    for (const sv of st.stoves) {
      if (!sv.onFire && meshes.fireMeshes.has(sv.stationId)) {
        const fireMesh = meshes.fireMeshes.get(sv.stationId)!
        meshes.scene.remove(fireMesh)
        meshes.fireMeshes.delete(sv.stationId)
      }
    }
  }

  // ─── Oven baking ──────────────────────────────────────
  for (const ov of st.ovens) {
    if (!ov.item || ov.done) continue
    ov.bakeProgress += dt
    if (ov.bakeProgress >= BAKE_TIME) {
      ov.done = true
    }
  }

  // ─── Spawn orders ────────────────────────────────────
  st.nextOrderIn -= dt
  const timePct = st.timeLeft / (ROUND_SECS * 1000)
  if (st.nextOrderIn <= 0 && st.orders.length < 6) {
    const order = spawnOrder(timePct, difficulty, 'normal')
    st.orders.push(order)
    st.nextOrderIn = st.orderInterval
  }

  // ─── Order timers ────────────────────────────────────
  for (let i = st.orders.length - 1; i >= 0; i--) {
    st.orders[i].timeLeft -= dt
    if (st.orders[i].timeLeft <= 0) {
      st.orders.splice(i, 1)
      st.score = Math.max(0, st.score + FAIL_PENALTY)
      st.combo = 0
      st.comboTimer = 0
    }
  }

  // ─── Update 3D meshes ────────────────────────────────
  if (meshes) {
    // Update player meshes
    for (const p of st.players) {
      const mesh = meshes.playerMeshes.get(p.idx)
      if (mesh) {
        mesh.position.set(p.x, 0, p.y)
        mesh.rotation.y = -p.angle + Math.PI / 2
      }

      // Update character animation
      if (charHandles) {
        const ch = charHandles.get(p.idx)
        if (ch) {
          ch.group.position.set(p.x, 0, p.y)
          ch.group.rotation.y = -p.angle + Math.PI / 2

          switch (p.animState) {
            case 'walking': playAnim(ch, 'walk'); break
            case 'carrying': playAnim(ch, 'take_item'); break
            case 'chopping': playAnim(ch, 'work'); break
            case 'interacting': playAnim(ch, 'opening'); break
            default: playAnim(ch, 'idle'); break
          }
        }
      }
    }

    // Update stove item visuals (cook progress indicator)
    for (const sv of st.stoves) {
      const station = st.stations.find(s => s.id === sv.stationId)
      if (!station) continue
      // Fire flicker
      if (sv.onFire) {
        const fire = meshes.fireMeshes.get(sv.stationId)
        if (fire) {
          const t = performance.now() * 0.005
          fire.scale.setScalar(0.8 + Math.sin(t) * 0.2)
          fire.rotation.y += 0.03
        }
      }
    }
  }
}
