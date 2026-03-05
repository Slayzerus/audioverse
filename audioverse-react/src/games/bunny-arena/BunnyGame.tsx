import type { GameConfig } from '../../pages/games/mini/types'
/**
 * BunnyGame -- 3D ragdoll platformer (2.5D: Z frozen) using Three.js.
 *
 * Core mechanics remain identical to the original:
 * - Ragdoll bunny (head, torso, pelvis, arms, legs)
 * - A button: stand/jump (doggy→plank), LB: grab, movement: roll
 * - Death: spikes, head impact, falling off screen
 * - Motorcycle mode, grab mechanic, pose animation
 * - Attack: stand up and spin to kick with extended legs
 *
 * Architecture:
 *   Three.js canvas (3D scene)  +  HUD canvas overlay (2D)
 *   sceneSetup -> levelGenerator -> gameLogic -> sceneSync -> hudRenderer
 *
 * Game modes: Arena (fight), Puzzle (collect coins), Free (sandbox),
 *             Sumo (push off), Race (checkpoints), King (hill)
 */
import { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import * as THREE from 'three'
import type { PlayerSlot } from '../../pages/games/mini/types'
import { useGamepads } from '../../pages/games/mini/useGamepads'
import { KEY_LOOKUP } from '../../pages/games/mini/inputMaps'
import { usePause } from '../../pages/games/mini/usePause'
import PauseMenu from '../../pages/games/mini/PauseMenu'
import css from './SharedGame.module.css'

import { WORLD_W, WORLD_H, GRAVITY_BASE } from './constants'
import type { GameState } from './types'
import { createScene, type SceneContext } from './sceneSetup'
import { generateLevel, createLevelMeshes, type LevelMeshes } from './levelGenerator'
import { initGameState, gameTick, clamp, type InputSnapshot } from './gameLogic'
import { createBunnyMeshes, syncScene, type BunnyMeshMap } from './sceneSync'
import { drawHUD, type HUDLabels } from './hudRenderer'
import BunnyTutorial, { isTutorialCompleted } from './BunnyTutorial'
import { useGameFocusLock } from '../../hooks/useGameFocusLock'

interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function BunnyGame({ players, config = {}, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const threeRef = useRef<HTMLCanvasElement>(null)
  const hudRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState | null>(null)
  const sceneCtxRef = useRef<SceneContext | null>(null)
  const levelMeshesRef = useRef<LevelMeshes | null>(null)
  const bunnyMeshesRef = useRef<BunnyMeshMap | null>(null)

  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState('')
  const [showTutorial, setShowTutorial] = useState(!isTutorialCompleted())

  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver || showTutorial })

  const mode = (config.mode as string) || 'arena'
  const livesConfig = Number(config.lives) || 3
  const gravMult = [0.6, 0.8, 1.0, 1.2, 1.5][clamp(Number(config.gravity) || 3, 1, 5) - 1]
  const gravity = GRAVITY_BASE * gravMult
  const aiDifficulty = clamp(Number(config.aiDifficulty) || 1, 0, 3)
  const isMotorcycleMode = mode === 'free'

  // ── HUD labels (i18n) ──────────────────────────────────
  const hudLabels: HUDLabels = useMemo(() => ({
    modeBanner: mode === 'arena' ? t('bunny.hudArena')
      : mode === 'puzzle' ? t('bunny.hudPuzzle')
        : mode === 'sumo' ? t('bunny.hudSumo')
          : mode === 'race' ? t('bunny.hudRace')
            : mode === 'king' ? t('bunny.hudKing')
              : t('bunny.hudFree'),
    controlsRoll: t('bunny.controlsRoll'),
    controlsStand: t('bunny.controlsStand'),
    controlsGrab: t('bunny.controlsGrab'),
    controlsPause: t('bunny.controlsPause'),
    controlsAttack: t('bunny.controlsAttack'),
    kingTimer: (seconds: number) => t('bunny.kingTimer', { seconds }),
    sumoRing: t('bunny.sumoRing'),
    raceCheckpoint: (n: number) => t('bunny.raceCheckpoint', { n }),
    raceFinish: t('bunny.raceFinish'),
  }), [t, mode])

  // --- Keyboard state ----------------------------------------
  const keysRef = useRef(new Set<string>())

  useEffect(() => {
    const down = (e: KeyboardEvent) => keysRef.current.add(e.key)
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      keysRef.current.clear()
    }
  }, [])

  // --- Initialize Three.js scene -----------------------------
  useEffect(() => {
    const canvas = threeRef.current
    if (!canvas) return

    // Create the 3D scene
    const sceneCtx = createScene(canvas)
    sceneCtxRef.current = sceneCtx

    // Generate level data + meshes
    const levelData = generateLevel(mode, players.length)
    const levelMeshes = createLevelMeshes(sceneCtx.scene, levelData)
    levelMeshesRef.current = levelMeshes

    // Initialize game state
    const gs = initGameState(players, mode, gravity, livesConfig, levelData, aiDifficulty)
    stateRef.current = gs

    // Create bunny 3D meshes
    const bMeshes = createBunnyMeshes(sceneCtx.scene, gs.bunnies)
    bunnyMeshesRef.current = bMeshes

    // Initial resize
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
      sceneCtx.dispose()
      sceneCtxRef.current = null
      stateRef.current = null
    }
  }, [players, mode, gravity, livesConfig, aiDifficulty])

  // --- Game loop ---------------------------------------------
  useEffect(() => {
    let raf = 0

    function loop() {
      raf = requestAnimationFrame(loop)

      const st = stateRef.current
      const sceneCtx = sceneCtxRef.current
      const levelMeshes = levelMeshesRef.current
      const bunnyMeshes = bunnyMeshesRef.current
      if (!st || !sceneCtx || !levelMeshes || !bunnyMeshes) return

      if (pauseRef.current) return
      if (st.gameOver) {
        // Keep rendering but don't tick
        syncScene(st, bunnyMeshes, levelMeshes, sceneCtx.scene)
        sceneCtx.renderer.render(sceneCtx.scene, sceneCtx.camera)
        return
      }

      // Build input snapshot (GamepadSnapshot already has boolean fields)
      const input: InputSnapshot = {
        keys: keysRef.current,
        pads: padsRef.current.map(gp => ({
          index: gp.index,
          up: gp.up,
          down: gp.down,
          left: gp.left,
          right: gp.right,
          a: gp.a,
          b: gp.b,
          x: gp.x,
          y: gp.y,
          lb: gp.lb,
        })),
        keyLookup: KEY_LOOKUP,
      }

      // Tick game logic
      gameTick(st, input, isMotorcycleMode)

      // Sync game state -> 3D meshes
      syncScene(st, bunnyMeshes, levelMeshes, sceneCtx.scene)

      // Render 3D scene
      sceneCtx.renderer.render(sceneCtx.scene, sceneCtx.camera)

      // Render 2D HUD overlay
      const hudCanvas = hudRef.current
      if (hudCanvas) {
        const ctx = hudCanvas.getContext('2d')
        if (ctx) drawHUD(ctx, hudCanvas.width, hudCanvas.height, st, hudLabels)
      }

      // Check game over
      if (st.gameOver && !gameOver) {
        setGameOver(true)
        const w = st.bunnies.find(b => b.index === st.winner)
        setWinner(w?.name || '')
      }
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [pauseRef, mode, gameOver, hudLabels, isMotorcycleMode])

  // --- Restart -----------------------------------------------
  const restart = useCallback(() => {
    const sceneCtx = sceneCtxRef.current
    if (!sceneCtx) return

    // Remove non-essential objects from scene (keep lights, camera)
    const toRemove: THREE.Object3D[] = []
    sceneCtx.scene.traverse(child => {
      if (child === sceneCtx.scene) return
      if (child instanceof THREE.Light) return
      if (child === sceneCtx.camera) return
      if (child.parent === sceneCtx.scene) toRemove.push(child)
    })
    for (const obj of toRemove) sceneCtx.scene.remove(obj)

    // Rebuild level and bunnies
    const levelData = generateLevel(mode, players.length)
    const levelMeshes = createLevelMeshes(sceneCtx.scene, levelData)
    levelMeshesRef.current = levelMeshes

    const gs = initGameState(players, mode, gravity, livesConfig, levelData, aiDifficulty)
    stateRef.current = gs

    const bMeshes = createBunnyMeshes(sceneCtx.scene, gs.bunnies)
    bunnyMeshesRef.current = bMeshes

    setGameOver(false)
    setWinner('')
  }, [players, mode, gravity, livesConfig, aiDifficulty])

  // Restart on keypress
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gameOver && (e.key === ' ' || e.key === 'Enter')) restart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameOver, restart])

  // --- Scoreboard data ---------------------------------------
  const scores = stateRef.current?.bunnies.map(b => ({
    name: b.name,
    color: b.color,
    score: b.score,
    lives: b.lives,
    alive: b.alive,
  })) ?? []

  return (
    <div className={css.container}>
      {/* Tutorial overlay (first launch only) */}
      {showTutorial && <BunnyTutorial onComplete={() => setShowTutorial(false)} />}

      {/* Scoreboard with tooltips */}
      <div className={css.scoreboard}>
        {scores.map((s, i) => (
          <div
            key={i}
            className={`${css.scoreItem} ${!s.alive && s.lives <= 0 ? css.dead : ''}`}
            title={t('bunny.tooltipRoll')}
          >
            <span className={css.scoreColor} style={{ background: s.color }} />
            <span>{s.name}</span>
            <span className={css.scoreValue}>{'♥'.repeat(Math.max(0, s.lives))}</span>
            {mode === 'puzzle' && <span className={css.scoreValue}>🪙{s.score}</span>}
            {mode === 'king' && <span className={css.scoreValue}>👑{s.score}s</span>}
            {mode === 'race' && <span className={css.scoreValue}>🏁{s.score}/{stateRef.current?.checkpoints.length ?? 0}</span>}
          </div>
        ))}
      </div>

      {/* Game viewport: 3D canvas + HUD overlay */}
      <div className={css.gameViewport} title={t('bunny.tooltipPose')}>
        <canvas ref={threeRef} className={css.threeCanvas}  role="img" aria-label="Bunny canvas"/>
        <canvas ref={hudRef} className={css.hudCanvas} width={WORLD_W} height={WORLD_H}  role="img" aria-label="Bunny canvas"/>
      </div>

      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

      {gameOver && (
        <div className={css.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          <div
            className={css.winnerText}
            style={{ color: stateRef.current?.bunnies.find(b => b.index === stateRef.current?.winner)?.color }}
          >
            {winner} {t('miniGames.wins', 'wins')}! 🐰
          </div>
          <div className={css.overlayActions}>
            <button className={css.restartBtn} onClick={restart} title={t('bunny.tooltipKick')}>
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