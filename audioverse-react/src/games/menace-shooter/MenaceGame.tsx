import type { GameConfig } from '../../pages/games/mini/types'
/**
 * MenaceGame — 3D Top-down Post-Apocalyptic GTA2-style open-world action game.
 *
 * SPLIT-SCREEN: up to 8 players on one screen.
 *   Grid layout adapts: 1→1×1, 2→2×1, 3→2×2+minimap, 4→2×2,
 *   5→3×2+minimap, 6→3×2, 7-8→3×3+minimap.
 *   When no spare slot → press M to toggle per-viewport minimap.
 *
 * Controls (per keyboard group):
 *   Group 0: WASD move/steer, Space shoot, E enter/exit vehicle, Q pickup, Shift sprint
 *   Group 1: Arrows move/steer, Enter shoot, / enter/exit, . pickup, , sprint
 *   Group 2: IJKL move, U shoot, O enter, P pickup, H sprint
 *   Group 3: Numpad 8456 move, 0 shoot, 9 enter, 7 pickup, 1 sprint
 * Gamepads: stick move/steer, X shoot, A enter/exit vehicle, Y pickup, LB sprint
 *
 * Architecture:
 *   One Three.js renderer + per-player cameras (scissor viewports)
 *   + HUD canvas overlay (2D) with per-viewport clipping
 */

import { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { PerspectiveCamera } from 'three'
import type { PlayerSlot } from '../../pages/games/mini/types'
import { useGamepads } from '../../pages/games/mini/useGamepads'
import { usePause } from '../../pages/games/mini/usePause'
import PauseMenu from '../../pages/games/mini/PauseMenu'
import css from './SharedGame.module.css'

import type { GameState } from './types'
import {
  createScene, createPlayerCamera, updatePlayerCamera, setupSplitScreenLight,
  type SceneContext,
} from './sceneSetup'
import { initGameState, gameTick, type InputSnapshot } from './gameLogic'
import {
  createSyncState, initStaticScene, syncScene, disposeSyncState, preloadModels,
  type SyncState,
} from './sceneSync'
import { drawHud, drawMinimapPanel, drawPanelBorders, drawGameOver } from './hudRenderer'
import { useGameFocusLock } from '../../hooks/useGameFocusLock'

// ── Grid layout ───────────────────────────────────────────
function computeGrid(n: number): { cols: number; rows: number } {
  if (n <= 1) return { cols: 1, rows: 1 }
  if (n <= 2) return { cols: 2, rows: 1 }
  if (n <= 4) return { cols: 2, rows: 2 }
  if (n <= 6) return { cols: 3, rows: 2 }
  return { cols: 3, rows: 3 }
}

function getViewport(
  slot: number, cols: number, rows: number, w: number, h: number,
) {
  const col = slot % cols
  const row = Math.floor(slot / cols)
  const pw = Math.floor(w / cols)
  const ph = Math.floor(h / rows)
  return { x: col * pw, y: row * ph, w: pw, h: ph }
}

// ── Component ─────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function MenaceGame({ players, config: _config, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const cfg = _config || {}

  const threeRef = useRef<HTMLCanvasElement>(null)
  const hudRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState | null>(null)
  const sceneCtxRef = useRef<SceneContext | null>(null)
  const syncRef = useRef<SyncState | null>(null)
  const camerasRef = useRef<PerspectiveCamera[]>([])

  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [minimapToggle, setMinimapToggle] = useState(false)

  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // ── Grid computation ────────────────────────────────────
  const playerCount = useMemo(() => players.filter(p => p.joined).length || 1, [players])
  const grid = useMemo(() => computeGrid(playerCount), [playerCount])
  const totalSlots = grid.cols * grid.rows
  const hasMinimapSlot = totalSlots > playerCount

  // ── Keyboard state ──────────────────────────────────────
  const keysRef = useRef(new Set<string>())
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key)
      // M toggles minimap when no dedicated slot
      if ((e.key === 'm' || e.key === 'M') && !hasMinimapSlot) {
        setMinimapToggle(prev => !prev)
      }
    }
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      keysRef.current.clear()
    }
  }, [hasMinimapSlot])

  // ── Initialize Three.js scene + per-player cameras ──────
  useEffect(() => {
    const canvas = threeRef.current
    if (!canvas) return

    const sceneCtx = createScene(canvas)
    sceneCtxRef.current = sceneCtx

    // Create per-player cameras
    const cams: PerspectiveCamera[] = []
    for (let i = 0; i < playerCount; i++) {
      const cam = createPlayerCamera()
      sceneCtx.scene.add(cam)
      cams.push(cam)
    }
    camerasRef.current = cams

    // Init game state
    const gs = initGameState(players, cfg)
    stateRef.current = gs

    // Position dirLight for full-map coverage (split-screen)
    setupSplitScreenLight(sceneCtx.dirLight, gs.level.worldW, gs.level.worldH)

    // Create sync state and build static scene
    const sync = createSyncState()
    syncRef.current = sync

    preloadModels().then(() => {
      if (stateRef.current && sceneCtxRef.current && syncRef.current) {
        initStaticScene(sceneCtxRef.current, stateRef.current, syncRef.current)
      }
    })

    initStaticScene(sceneCtx, gs, sync)

    // Resize handler
    const handleResize = () => {
      const container = canvas.parentElement
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      sceneCtx.resize(w, h)
      const hudCanvas = hudRef.current
      if (hudCanvas) {
        hudCanvas.width = w
        hudCanvas.height = h
      }
    }
    window.addEventListener('resize', handleResize)
    requestAnimationFrame(handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cams.forEach(c => sceneCtx.scene.remove(c))
      camerasRef.current = []
      if (syncRef.current && sceneCtxRef.current) {
        disposeSyncState(sceneCtxRef.current.scene, syncRef.current)
      }
      sceneCtx.dispose()
      sceneCtxRef.current = null
      stateRef.current = null
      syncRef.current = null
    }
  // Scene setup depends on players/config; other captured values are refs or imports
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players, cfg, playerCount])

  // ── Game loop ───────────────────────────────────────────
  useEffect(() => {
    let raf = 0
    // Capture these values at effect creation time
    const gridCols = grid.cols
    const gridRows = grid.rows
    const mmSlot = hasMinimapSlot
    let mmToggle = minimapToggle

    // Keep minimap toggle in sync without re-registering effect
    const updateToggle = () => { mmToggle = minimapToggle }
    updateToggle()

    function loop() {
      raf = requestAnimationFrame(loop)

      const st = stateRef.current
      const sceneCtx = sceneCtxRef.current
      const sync = syncRef.current
      const cams = camerasRef.current
      if (!st || !sceneCtx || !sync || !sync.initialized || cams.length === 0) return
      if (pauseRef.current) return

      const now = performance.now()

      // Build input snapshot
      const input: InputSnapshot = {
        keys: keysRef.current,
        pads: padsRef.current.map(gp => ({
          index: gp.index,
          up: gp.up, down: gp.down, left: gp.left, right: gp.right,
          a: gp.a, b: gp.b, x: gp.x, y: gp.y, lb: gp.lb,
        })),
      }

      // Tick game logic
      if (!st.gameOver) {
        gameTick(st, input, now)
      }

      // Sync game state → 3D meshes (once for the shared scene)
      syncScene(sceneCtx, st, sync)

      const { renderer, scene } = sceneCtx
      const canvas = threeRef.current!
      const cssW = canvas.clientWidth
      const cssH = canvas.clientHeight

      // ── Split-screen 3D rendering ───────────────────────
      renderer.autoClear = false
      renderer.setScissorTest(false)
      renderer.clear(true, true, true)
      renderer.setScissorTest(true)

      for (let i = 0; i < st.players.length; i++) {
        const p = st.players[i]
        const cam = cams[i]
        if (!cam) continue

        const vp = getViewport(i, gridCols, gridRows, cssW, cssH)

        // Update camera for this player
        updatePlayerCamera(cam, p.x, p.y)
        cam.aspect = vp.w / vp.h
        cam.updateProjectionMatrix()

        // WebGL viewport (Three.js accepts CSS coords, auto-scales by pixelRatio)
        const glY = cssH - vp.y - vp.h
        renderer.setViewport(vp.x, glY, vp.w, vp.h)
        renderer.setScissor(vp.x, glY, vp.w, vp.h)

        renderer.render(scene, cam)
      }

      renderer.setScissorTest(false)
      renderer.autoClear = true

      // ── 2D HUD overlay ─────────────────────────────────
      const hudCanvas = hudRef.current
      if (hudCanvas) {
        const ctx2d = hudCanvas.getContext('2d')
        if (ctx2d) {
          ctx2d.clearRect(0, 0, hudCanvas.width, hudCanvas.height)

          if (st.gameOver) {
            drawGameOver(ctx2d, hudCanvas.width, hudCanvas.height, st)
          } else {
            // Per-viewport minimap: shown only when toggled and no panel slot
            const showCornerMM = !mmSlot && mmToggle

            // Draw each player's HUD within their viewport
            for (let i = 0; i < st.players.length; i++) {
              const vp = getViewport(i, gridCols, gridRows, hudCanvas.width, hudCanvas.height)
              ctx2d.save()
              ctx2d.beginPath()
              ctx2d.rect(vp.x, vp.y, vp.w, vp.h)
              ctx2d.clip()
              drawHud(ctx2d, vp.x, vp.y, vp.w, vp.h, st, i, showCornerMM)
              ctx2d.restore()
            }

            // Dedicated minimap panel (when grid has a spare slot)
            if (mmSlot) {
              const mmVp = getViewport(st.players.length, gridCols, gridRows, hudCanvas.width, hudCanvas.height)
              drawMinimapPanel(ctx2d, mmVp.x, mmVp.y, mmVp.w, mmVp.h, st)
            }

            // Panel border lines
            if (st.players.length > 1) {
              drawPanelBorders(ctx2d, gridCols, gridRows, hudCanvas.width, hudCanvas.height)
            }
          }
        }
      }

      // Check game over
      if (st.gameOver && !gameOver) {
        setGameOver(true)
        setWinner(st.winner)
      }
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [pauseRef, gameOver, grid, hasMinimapSlot, minimapToggle])

  // ── Restart ─────────────────────────────────────────────
  const restart = useCallback(() => {
    const sceneCtx = sceneCtxRef.current
    if (!sceneCtx) return

    // Dispose old sync state
    if (syncRef.current) {
      disposeSyncState(sceneCtx.scene, syncRef.current)
    }

    // Remove old dynamic children (keep cameras & lights)
    const toRemove: import('three').Object3D[] = []
    sceneCtx.scene.traverse(child => {
      if (child === sceneCtx.scene) return
      if (child === sceneCtx.camera) return
      if ((child as import('three').Light).isLight) return
      // Keep per-player cameras
      if (camerasRef.current.includes(child as PerspectiveCamera)) return
      if (child.parent === sceneCtx.scene) toRemove.push(child)
    })
    for (const obj of toRemove) sceneCtx.scene.remove(obj)

    // Rebuild game
    const gs = initGameState(players, cfg)
    stateRef.current = gs

    setupSplitScreenLight(sceneCtx.dirLight, gs.level.worldW, gs.level.worldH)

    const sync = createSyncState()
    syncRef.current = sync
    initStaticScene(sceneCtx, gs, sync)

    setGameOver(false)
    setWinner(null)
  }, [players, cfg])

  // Restart on keypress
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gameOver && (e.key === ' ' || e.key === 'Enter')) restart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameOver, restart])

  // ── Scoreboard data (for overlay) ───────────────────────
  const scores = stateRef.current?.players.map(p => ({
    name: p.name,
    color: p.color,
    score: p.score,
    level: p.level,
    alive: p.alive,
    coins: p.coins,
    gems: p.gems,
  })) ?? []

  return (
    <div className={css.container}>
      {/* Compact scoreboard strip */}
      <div className={css.scoreboard}>
        {scores.map((s, i) => (
          <div key={i} className={`${css.scoreItem} ${!s.alive ? css.dead : ''}`}>
            <span className={css.scoreColor} style={{ background: s.color }} />
            <span className={css.scoreValue}>{s.score}</span>
          </div>
        ))}
        {!hasMinimapSlot && (
          <div className={css.scoreItem} style={{ opacity: 0.4, fontSize: '0.75rem' }}>
            [M] map
          </div>
        )}
      </div>

      {/* Game viewport: 3D canvas + HUD overlay */}
      <div className={css.gameViewport}>
        <canvas ref={threeRef} className={css.threeCanvas}  role="img" aria-label="Menace canvas"/>
        <canvas ref={hudRef} className={css.hudCanvas}  role="img" aria-label="Menace canvas"/>
      </div>

      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

      {gameOver && (
        <div className={css.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && (
            <div className={css.winnerText}>
              🏆 {winner} {t('miniGames.wins', 'wins')}!
            </div>
          )}
          <div className={css.finalScoreboard}>
            {[...scores].sort((a, b) => b.score - a.score).map((s, i) => (
              <div key={i} className={css.finalScoreRow}>
                <span className={css.finalScoreRank}>#{i + 1}</span>
                <span className={css.scoreColor} style={{ background: s.color }} />
                <span className={css.finalScoreVal}>{s.score}pts</span>
              </div>
            ))}
          </div>
          <div className={css.overlayActions}>
            <button className={css.restartBtn} onClick={restart}>
              {t('miniGames.playAgain', 'Play Again')}
            </button>
            <button className={css.backBtnOverlay} onClick={onBack}>
              {t('miniGames.backToMenu', 'Back to Menu')}
            </button>
          </div>
          <div className={css.overlayHint}>
            {t('miniGames.pressRestart', 'Press Space or Enter to restart')}
          </div>
        </div>
      )}
    </div>
  )
}
