import type { GameConfig } from '../../pages/games/mini/types'
/**
 * AtomicPostApoGame — Isometric action RPG using Three.js + 2D HUD.
 *
 * Uses Post-Apocalyptic World GLB models for environment
 * and POLYGON Heist FBX models for characters.
 *
 * Controls:
 *   WASD: move | Space: shoot | E: interact | Q: VATS
 *   Shift: sprint | 1/2: weapon switch | R: stimpak | T: radaway
 *   Gamepad: LStick move, X shoot, A interact, Y VATS, B sprint
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as THREE from 'three'
import type { PlayerSlot } from '../../pages/games/mini/types'
import { logger } from '../../utils/logger'
const log = logger.scoped('AtomicPostApoGame')
import { useGamepads } from '../../pages/games/mini/useGamepads'
import { usePause } from '../../pages/games/mini/usePause'
import PauseMenu from '../../pages/games/mini/PauseMenu'
import styles from './SharedGame.module.css'

import type { GameState, Player } from './types'
import { VIEWPORT_W, VIEWPORT_H } from './constants'
import { keysDown } from './input'
import { createScene, type SceneContext } from './sceneSetup'
import { initState, populateScene } from './mapGenerator'
import { gameTick, type SceneMeshes } from './gameLoop'
import { drawHUD } from './hudRenderer'
import { createBulletMesh } from './modelManager'
import { useGameFocusLock } from '../../hooks/useGameFocusLock'

interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function AtomicPostApoGame({ players, config = {}, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const threeRef = useRef<HTMLCanvasElement>(null)
  const hudRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState | null>(null)
  const sceneCtxRef = useRef<SceneContext | null>(null)
  const meshesRef = useRef<SceneMeshes | null>(null)
  const bulletMeshesRef = useRef<Map<number, THREE.Mesh>>(new Map())
  const scoreboardTimerRef = useRef(0)

  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
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

    const sceneCtx = createScene(canvas, gs.mapW, gs.mapH)
    sceneCtxRef.current = sceneCtx

    // Bullet group container
    const bulletGroup = new THREE.Group()
    sceneCtx.scene.add(bulletGroup)

    // Load map models asynchronously
    let cancelled = false
    ;(async () => {
      setLoadProgress(10)
      try {
        const result = await populateScene(sceneCtx.scene, gs)
        if (cancelled) return
        setLoadProgress(90)

        meshesRef.current = {
          playerMeshes: result.playerMeshes,
          enemyMeshes: result.enemyMeshes,
          lootMeshes: result.lootMeshes,
          bulletGroup,
          scene: sceneCtx.scene,
        }

        setLoadProgress(100)
        setLoading(false)
      } catch (err) {
        log.error('Model loading failed, using fallbacks:', err)
        if (cancelled) return

        // Still playable with fallback meshes
        meshesRef.current = {
          playerMeshes: new Map(),
          enemyMeshes: new Map(),
          lootMeshes: new Map(),
          bulletGroup,
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
      // Also resize HUD canvas
      const hudCanvas = hudRef.current
      if (hudCanvas) {
        hudCanvas.width = w
        hudCanvas.height = h
      }
    }
    window.addEventListener('resize', handleResize)
    // Initial size
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
      if (st.gameOver) {
        // Still render but don't tick
        sceneCtx.renderer.render(sceneCtx.scene, sceneCtx.camera)
        return
      }

      let dt = now - last
      last = now
      if (dt > 100) dt = 100

      // ─── Tick game logic ─────────────────────────────
      gameTick(st, dt, padsRef.current, meshesRef.current)

      // ─── Manage bullet 3D meshes ─────────────────────
      const meshes = meshesRef.current
      if (meshes) {
        const bulletMeshes = bulletMeshesRef.current
        const activeBulletIds = new Set<number>()

        for (const b of st.bullets) {
          activeBulletIds.add(b.id)

          let bm = bulletMeshes.get(b.id)
          if (!bm) {
            bm = createBulletMesh(0xffd700)
            meshes.bulletGroup.add(bm)
            bulletMeshes.set(b.id, bm)
          }
          bm.position.set(b.x, b.z, b.y)
        }

        // Remove gone bullets
        for (const [id, mesh] of bulletMeshes) {
          if (!activeBulletIds.has(id)) {
            meshes.bulletGroup.remove(mesh)
            mesh.geometry.dispose()
            ;(mesh.material as THREE.Material).dispose()
            bulletMeshes.delete(id)
          }
        }
      }

      // ─── Camera follow ─────────────────────────────
      const alive = st.players.filter(p => p.alive)
      if (alive.length > 0) {
        const avgX = alive.reduce((s, p) => s + p.x, 0) / alive.length
        const avgZ = alive.reduce((s, p) => s + p.y, 0) / alive.length
        sceneCtx.updateCamera(avgX, avgZ)
      }

      // ─── Animate loot (bobbing + rotation) ─────────
      if (meshes) {
        for (const lb of st.loot) {
          if (lb.open) continue
          const lm = meshes.lootMeshes.get(lb.id)
          if (lm) {
            lm.position.y = 0.3 + Math.sin(now * 0.003 + lb.id) * 0.15
            lm.rotation.y += 0.02
          }
        }
      }

      // ─── Render 3D scene ──────────────────────────
      sceneCtx.renderer.render(sceneCtx.scene, sceneCtx.camera)

      // ─── Render 2D HUD ────────────────────────────
      const hudCanvas = hudRef.current
      if (hudCanvas) {
        const ctx = hudCanvas.getContext('2d')
        if (ctx) {
          drawHUD(ctx, hudCanvas.width, hudCanvas.height, st)
        }
      }

      // ─── Update React state (throttled) ───────────
      scoreboardTimerRef.current += dt
      if (scoreboardTimerRef.current > 250) {
        scoreboardTimerRef.current = 0
        setScoreboard(st.players.map(p => ({ ...p })))
      }
      if (st.gameOver) {
        setGameOver(true)
        if (st.winner === -1) setWinner(t('miniGames.teamWins', 'Team wins!'))
        else if (st.winner != null) {
          const w = st.players.find(p => p.idx === st.winner)
          setWinner(w?.name ?? `Player ${(st.winner) + 1}`)
        }
      }
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [loading, pauseRef, t])

  // ─── Restart ───────────────────────────────────────────
  const handleRestart = useCallback(() => {
    const gs = initState(players, config)
    stateRef.current = gs

    // Clear old scene objects and rebuild
    const sceneCtx = sceneCtxRef.current
    if (sceneCtx) {
      // Remove all scene children except camera, lights, ground, and ground patches
      const toRemove: THREE.Object3D[] = []
      for (const child of sceneCtx.scene.children) {
        if (child instanceof THREE.Light) continue
        if (child === sceneCtx.ground) continue
        if (child === sceneCtx.camera) continue
        // Preserve ground detail patches (positioned at y ≤ 0.005)
        if (child instanceof THREE.Mesh && child.position.y <= 0.005 && child.rotation.x === -Math.PI / 2) continue
        toRemove.push(child)
      }
      for (const obj of toRemove) sceneCtx.scene.remove(obj)

      // Re-add ground
      sceneCtx.ground.position.set(gs.mapW / 2, -0.01, gs.mapH / 2)
      if (!sceneCtx.scene.children.includes(sceneCtx.ground)) {
        sceneCtx.scene.add(sceneCtx.ground)
      }

      // Bullet group
      const bulletGroup = new THREE.Group()
      sceneCtx.scene.add(bulletGroup)
      bulletMeshesRef.current.clear()

      // Repopulate
      setLoading(true)
      populateScene(sceneCtx.scene, gs).then(result => {
        meshesRef.current = {
          playerMeshes: result.playerMeshes,
          enemyMeshes: result.enemyMeshes,
          lootMeshes: result.lootMeshes,
          bulletGroup,
          scene: sceneCtx.scene,
        }
        setLoading(false)
      }).catch(() => {
        meshesRef.current = {
          playerMeshes: new Map(),
          enemyMeshes: new Map(),
          lootMeshes: new Map(),
          bulletGroup,
          scene: sceneCtx.scene,
        }
        setLoading(false)
      })
    }

    setGameOver(false)
    setWinner(null)
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

  return (
    <div className={styles.container}>
      {/* Scoreboard */}
      <div className={styles.scoreboard}>
        {scoreboard.map(s => (
          <div key={s.idx} className={`${styles.scoreItem} ${!s.alive ? styles.dead : ''}`}>
            <span className={styles.scoreColor} style={{ background: s.color }} />
            <span>{s.name}</span>
            <span className={styles.scoreValue}>K:{s.kills} 🪙{s.coins} 💎{s.gems} ⭐{s.stars}</span>
          </div>
        ))}
      </div>

      {/* Game viewport — 3D canvas + HUD overlay */}
      <div className={styles.gameViewport}>
        <canvas ref={threeRef} className={styles.threeCanvas}  role="img" aria-label="Atomic Post Apo canvas"/>
        <canvas ref={hudRef} className={styles.hudCanvas} width={VIEWPORT_W} height={VIEWPORT_H}  role="img" aria-label="Atomic Post Apo canvas"/>

        {/* Loading overlay */}
        {loading && (
          <div className={styles.loadingOverlay}>
            <h3>☢ Loading Wasteland...</h3>
            <div className={styles.loadingBar}>
              <div className={styles.loadingBarFill} style={{ width: `${loadProgress}%` }} />
            </div>
            <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Loading 3D models...</p>
          </div>
        )}
      </div>

      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && <p className={styles.winnerText}>🏆 {winner} {t('miniGames.wins', 'wins')}!</p>}
          {!winner && <p className={styles.winnerText}>{t('miniGames.defeated', 'The wasteland claimed you...')}</p>}
          {stateRef.current?.mode === 'coop-survival' && (
            <p className={styles.waveInfo}>Survived {stateRef.current?.wave || 0} waves</p>
          )}
          <div className={styles.overlayActions}>
            <button className={styles.restartBtn} onClick={handleRestart}>
              {t('miniGames.playAgain', 'Play Again')}
            </button>
            <button className={styles.backBtnOverlay} onClick={onBack}>
              {t('miniGames.backToMenu', 'Back to Menu')}
            </button>
          </div>
          <p className={styles.overlayHint}>{t('miniGames.pressRestart', 'Press Space or Enter to restart')}</p>
        </div>
      )}
    </div>
  )
}
