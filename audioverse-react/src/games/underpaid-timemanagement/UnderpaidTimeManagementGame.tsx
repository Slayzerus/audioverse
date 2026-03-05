import type { GameConfig } from '../../pages/games/mini/types'
/**
 * UnderpaidTimeManagementGame — Isometric 3D cooking game (Overcooked-style).
 *
 * Uses Tiny Treats Collection GLTF models for kitchen environment
 * and Mixamo FBX models for characters with animations.
 *
 * Controls:
 *   Group 0: WASD + Space (pickup/drop) + E (interact/chop) + Q (dash)
 *   Group 1: Arrow keys + Enter (pickup/drop) + Shift (interact/chop) + Ctrl (dash)
 *   Gamepad:  LStick move, A pickup/drop, X interact/chop, B dash
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as THREE from 'three'
import type { PlayerSlot } from '../../pages/games/mini/types'
import { logger } from '../../utils/logger'
const log = logger.scoped('UnderpaidTimeManagement')
import { useGamepads } from '../../pages/games/mini/useGamepads'
import { usePause } from '../../pages/games/mini/usePause'
import PauseMenu from '../../pages/games/mini/PauseMenu'
import styles from './SharedGame.module.css'

import type { GameState, Player } from './types'
import { keysDown } from './input'
import { createScene, type SceneContext } from './sceneSetup'
import { populateScene, type SceneMeshes } from './kitchenGenerator'
import { gameTick, initState } from './gameLoop'
import { drawHUD } from './hudRenderer'
import {
  loadCharacter, createFallbackCharacter, playAnim,
  type CharacterHandle,
} from './modelManager'
import { CHARACTER_MODEL, ANIM_PATHS } from './assets'
import { useGameFocusLock } from '../../hooks/useGameFocusLock'

interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function UnderpaidTimeManagementGame({
  players, config = {}, onBack,
}: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const threeRef = useRef<HTMLCanvasElement>(null)
  const hudRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState | null>(null)
  const sceneCtxRef = useRef<SceneContext | null>(null)
  const meshesRef = useRef<SceneMeshes | null>(null)
  const charHandlesRef = useRef<Map<number, CharacterHandle>>(new Map())
  const scoreboardTimerRef = useRef(0)

  const [gameOver, setGameOver] = useState(false)
  const [finalState, setFinalState] = useState<GameState | null>(null)
  const [scoreboard, setScoreboard] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)

  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // ─── Initialize ────────────────────────────────────────
  useEffect(() => {
    const canvas = threeRef.current
    if (!canvas) return

    const gs = initState(players, config)
    stateRef.current = gs

    const sceneCtx = createScene(canvas, gs.gridCols, gs.gridRows)
    sceneCtxRef.current = sceneCtx

    let cancelled = false

    ;(async () => {
      setLoadProgress(5)
      try {
        // 1. Populate kitchen scene
        const result = await populateScene(
          sceneCtx.scene, gs.kitchenLayout,
          (pct) => setLoadProgress(Math.round(pct * 0.6)),
        )
        if (cancelled) return
        meshesRef.current = result
        setLoadProgress(65)

        // 2. Load character models for each player
        const chMap = new Map<number, CharacterHandle>()
        for (let i = 0; i < gs.players.length; i++) {
          const p = gs.players[i]
          try {
            const ch = await loadCharacter(CHARACTER_MODEL, {
              idle: ANIM_PATHS.idle,
              walk: ANIM_PATHS.walk,
              take_item: ANIM_PATHS.take_item,
              put_down: ANIM_PATHS.put_down,
              work: ANIM_PATHS.work,
              opening: ANIM_PATHS.opening,
            })
            if (cancelled) return

            // Tint character by player color
            const playerColor = new THREE.Color(p.color)
            ch.group.traverse((child: THREE.Object3D) => {
              if (child instanceof THREE.Mesh && child.material) {
                const mat = child.material as THREE.MeshStandardMaterial
                if (mat.isMeshStandardMaterial) {
                  mat.color.lerp(playerColor, 0.3)
                }
              }
            })

            ch.group.position.set(p.x, 0, p.y)
            sceneCtx.scene.add(ch.group)
            chMap.set(p.idx, ch)
            result.playerMeshes.set(p.idx, ch.group)
          } catch (err) {
            log.warn(`Character load failed for player ${p.idx}, using fallback:`, err)
            const fb = createFallbackCharacter(
              parseInt(p.color.replace('#', ''), 16) || 0xff6600,
            )
            fb.position.set(p.x, 0, p.y)
            sceneCtx.scene.add(fb)
            result.playerMeshes.set(p.idx, fb)
          }
          setLoadProgress(65 + Math.round(((i + 1) / gs.players.length) * 30))
        }
        charHandlesRef.current = chMap

        setLoadProgress(100)
        setLoading(false)
      } catch (err) {
        log.error('Scene loading failed, using fallbacks:', err)
        if (cancelled) return

        meshesRef.current = {
          playerMeshes: new Map(),
          stationMeshes: new Map(),
          itemMeshes: new Map(),
          fireMeshes: new Map(),
          scene: sceneCtx.scene,
        }
        setLoading(false)
      }
    })()

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
      cancelled = true
      window.removeEventListener('resize', handleResize)
      sceneCtx.dispose()
      sceneCtxRef.current = null
    }
  }, [players, config])

  // ─── Keyboard ──────────────────────────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => keysDown.add(e.key)
    const onUp = (e: KeyboardEvent) => keysDown.delete(e.key)
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      keysDown.clear()
    }
  }, [])

  // ─── Game Loop + Render Loop ───────────────────────────
  useEffect(() => {
    if (loading) return

    let raf = 0
    let last = performance.now()

    function loop(now: number) {
      raf = requestAnimationFrame(loop)

      const st = stateRef.current
      const sceneCtx = sceneCtxRef.current
      if (!st || !sceneCtx) return

      if (pauseRef.current) { last = now; return }

      let dt = now - last
      last = now
      if (dt > 100) dt = 100

      if (!st.gameOver) {
        // Tick game logic
        gameTick(st, dt, padsRef.current, meshesRef.current, charHandlesRef.current)

        // Update character animation mixers
        for (const ch of charHandlesRef.current.values()) {
          ch.mixer.update(dt / 1000)
        }
      }

      // Camera follow — average player position
      if (st.players.length > 0) {
        const avgX = st.players.reduce((s, p) => s + p.x, 0) / st.players.length
        const avgZ = st.players.reduce((s, p) => s + p.y, 0) / st.players.length
        sceneCtx.updateCamera(avgX, avgZ)
      }

      // Render 3D
      sceneCtx.renderer.render(sceneCtx.scene, sceneCtx.camera)

      // Render 2D HUD
      const hudCanvas = hudRef.current
      if (hudCanvas) {
        const ctx = hudCanvas.getContext('2d')
        if (ctx) drawHUD(ctx, hudCanvas.width, hudCanvas.height, st)
      }

      // Update React state (throttled to ~4 fps)
      scoreboardTimerRef.current += dt
      if (scoreboardTimerRef.current > 250) {
        scoreboardTimerRef.current = 0
        setScoreboard(st.players.map(p => ({ ...p })))
      }

      if (st.gameOver && !gameOver) {
        setGameOver(true)
        setFinalState({ ...st })
      }
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [loading, pauseRef, gameOver])

  // ─── Restart ───────────────────────────────────────────
  const handleRestart = useCallback(() => {
    const gs = initState(players, config)
    stateRef.current = gs

    const sceneCtx = sceneCtxRef.current
    if (sceneCtx) {
      // Remove dynamic objects
      const toRemove: THREE.Object3D[] = []
      for (const child of sceneCtx.scene.children) {
        if (child instanceof THREE.Light) continue
        if (child === sceneCtx.ground) continue
        if (child === sceneCtx.camera) continue
        if (child instanceof THREE.Line) continue
        toRemove.push(child)
      }
      for (const obj of toRemove) sceneCtx.scene.remove(obj)

      // Repopulate
      setLoading(true)
      setLoadProgress(0)
      populateScene(sceneCtx.scene, gs.kitchenLayout, (pct) => setLoadProgress(pct * 0.8)).then(result => {
        meshesRef.current = result

        // Recreate player meshes
        for (const p of gs.players) {
          const existingCh = charHandlesRef.current.get(p.idx)
          if (existingCh) {
            existingCh.group.position.set(p.x, 0, p.y)
            sceneCtx.scene.add(existingCh.group)
            result.playerMeshes.set(p.idx, existingCh.group)
            playAnim(existingCh, 'idle')
          } else {
            const fb = createFallbackCharacter(
              parseInt(p.color.replace('#', ''), 16) || 0xff6600,
            )
            fb.position.set(p.x, 0, p.y)
            sceneCtx.scene.add(fb)
            result.playerMeshes.set(p.idx, fb)
          }
        }

        setLoadProgress(100)
        setLoading(false)
      }).catch(() => {
        meshesRef.current = {
          playerMeshes: new Map(),
          stationMeshes: new Map(),
          itemMeshes: new Map(),
          fireMeshes: new Map(),
          scene: sceneCtx.scene,
        }
        setLoading(false)
      })
    }

    setGameOver(false)
    setFinalState(null)
    setScoreboard([])
  }, [players, config])

  // Restart on key press
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gameOver && (e.key === ' ' || e.key === 'Enter')) handleRestart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameOver, handleRestart])

  // Star rating
  const starCount = finalState?.totalStars ?? 0
  const stars = '⭐'.repeat(starCount) + '☆'.repeat(Math.max(0, 3 - starCount))

  return (
    <div className={styles.container}>
      {/* Scoreboard */}
      <div className={styles.scoreboard}>
        {scoreboard.map(s => (
          <div key={s.idx} className={styles.scoreItem}>
            <span className={styles.scoreColor} style={{ background: s.color }} />
            <span>{s.name}</span>
            <span className={styles.scoreValue}>
              🪙{s.coins} 💎{s.gems}
            </span>
          </div>
        ))}
      </div>

      {/* Game viewport — 3D canvas + HUD overlay */}
      <div className={styles.gameViewport}>
        <canvas ref={threeRef} className={styles.threeCanvas}  role="img" aria-label="Underpaid Time Management canvas"/>
        <canvas ref={hudRef} className={styles.hudCanvas} width={1024} height={768}  role="img" aria-label="Underpaid Time Management canvas"/>

        {/* Loading overlay */}
        {loading && (
          <div className={styles.loadingOverlay}>
            <h3>🍳 Setting up the kitchen...</h3>
            <div className={styles.loadingBar}>
              <div className={styles.loadingBarFill} style={{ width: `${loadProgress}%` }} />
            </div>
            <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Loading 3D models...</p>
          </div>
        )}
      </div>

      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

      {gameOver && finalState && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Time\'s Up!')}</h2>
          <p className={styles.starRating}>{stars}</p>
          <p className={styles.winnerText}>
            Score: {finalState.score}
          </p>
          <div className={styles.statsGrid}>
            <span>🪙</span><span>{finalState.totalCoins}</span>
            <span>💎</span><span>{finalState.totalGems}</span>
            <span>⭐</span><span>{finalState.totalStars}</span>
            <span>📦</span><span>{finalState.perfectStreak} perfect</span>
          </div>
          {finalState.mode === 'vs-kitchen' && (
            <p style={{ fontSize: '1.2rem', color: '#f1c40f' }}>
              Team 1: {finalState.teamScores[0]} vs Team 2: {finalState.teamScores[1]}
            </p>
          )}
          <div className={styles.overlayActions}>
            <button className={styles.restartBtn} onClick={handleRestart}>
              {t('miniGames.playAgain', 'Play Again')}
            </button>
            <button className={styles.backBtnOverlay} onClick={onBack}>
              {t('miniGames.backToMenu', 'Back to Menu')}
            </button>
          </div>
          <p className={styles.overlayHint}>
            {t('miniGames.pressRestart', 'Press Space or Enter to restart')}
          </p>
        </div>
      )}
    </div>
  )
}
