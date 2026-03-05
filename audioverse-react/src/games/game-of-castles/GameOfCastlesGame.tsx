/**
 * GameOfCastlesGame  HoMM3-inspired turn-based strategy mini-game.
 *
 * Three screens: Adventure Map, Tactical Combat, Town Management.
 *
 * Controls:
 *   WASD / Arrows  Move hero / scroll map
 *   Tab  Next hero
 *   Enter  End turn / confirm
 *   Click  Select / interact
 *   Escape  Close menu / pause
 *   B  Spell book
 *   T  Open town (when hero at town)
 *   I  Info / tooltip
 *   Gamepad: D-pad/stick move, A confirm, B back/cancel
 *
 * Modes:
 *   - Conquest: capture all enemy towns
 *   - Coop Campaign: shared faction vs AI
 *   - VS Skirmish: each player controls own hero & towns
 *
 * Combat: Turn-based (default) or real-time.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlayerSlot } from '../../pages/games/mini/types'
import { PLAYER_COLORS } from '../../pages/games/mini/types'
import { useGamepads } from '../../pages/games/mini/useGamepads'
import { usePause } from '../../pages/games/mini/usePause'
import PauseMenu from '../../pages/games/mini/PauseMenu'
import styles from './SharedGame.module.css'

// --- Module imports ---
import type {
  GameState, GameProps,
} from './types'
import {
  CANVAS_W, CANVAS_H,
} from './constants'
import {
  calcArmyPower,
} from './heroes'
import {
  createInputState, setupInputHandlers, clearFrameInput,
} from './input'
import type { InputState } from './input'
import { drawResourceBar, drawTurnBar, drawMinimap, drawHeroList, drawNotifications } from './hudRenderer'
import { Camera, centerCameraOnHero, drawAdventureMap } from './adventureRenderer'
import { drawCombatScreen } from './combatRenderer'
import { createTownScreenState, drawTownScreen } from './townRenderer'
import type { TownScreenState } from './townRenderer'
import useTinySwordsSprites from '../../common/sprites/useTinySwordsSprites2'
import GameSetup from './GameSetup'
import MapEditor from './MapEditor'
import type { GameSetupConfig } from './types'
import { initGameState } from './gameOfCastlesInit'
import {
  processAdventureInput, processCombatInput, processLevelUpInput,
  processTownInput, getAttackerHero, getDefenderHero,
} from './gameOfCastlesGameplay'
import type { GameRefs, CombatUIState, GameCallbacks } from './gameOfCastlesGameplay'

// =====================================================================
//  MAIN COMPONENT
// =====================================================================
export default function GameOfCastlesGame({ players, config = {}, onBack }: GameProps) {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState | null>(null)
  const inputRef = useRef<InputState>(createInputState())
  const cameraRef = useRef<Camera>({ x: 0, y: 0 })
  const townScreenRef = useRef<TownScreenState>(createTownScreenState())
  const animTimerRef = useRef(0)
  void animTimerRef // reserved for sprite animations
  const lastMoveRef = useRef(0)
  const lastAIRef = useRef(0)
  const selectedHeroRef = useRef<string | null>(null)
  const combatUIRef = useRef<CombatUIState>({ hoveredCell: null, selectedAction: null, selectedSpellId: null, autoCombat: false })
  const notificationsRef = useRef<{ text: string; time: number }[]>([])

  // Game phase: 'setup' | 'playing' | 'editor'
  const [gamePhase, setGamePhase] = useState<'setup' | 'playing' | 'editor'>('setup')

  // React state for scoreboard / game-over overlay
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<number | null>(null)
  const [scoreboard, setScoreboard] = useState<{
    name: string; color: string; towns: number; heroes: number; army: number
  }[]>([])

  const combatMode = config.combatMode || 'turn-based'
  void combatMode // reserved for future use
  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })
  const spr = useTinySwordsSprites()
  const tickRef = useRef(0)

  // --- Notifications helper ---
  const pushNotification = useCallback((text: string) => {
    notificationsRef.current.push({ text, time: performance.now() })
    if (notificationsRef.current.length > 6) notificationsRef.current.shift()
  }, [])

  // --- Scoreboard updater ---
  const updateScoreboard = useCallback((state: GameState) => {
    const board = []
    for (let p = 0; p < state.totalPlayers; p++) {
      const pHeroes = state.heroes.filter(h => h.owner === p)
      const pTowns = state.towns.filter(t => t.owner === p)
      const armyPower = pHeroes.reduce((sum, h) => sum + calcArmyPower(h.army), 0)
      board.push({
        name: p < players.length ? (players[p].name || `P${p + 1}`) : `AI ${p - players.length + 1}`,
        color: PLAYER_COLORS[p] || '#888',
        towns: pTowns.length,
        heroes: pHeroes.length,
        army: armyPower,
      })
    }
    setScoreboard(board)
  }, [players])

  // --- Initialize game ---
  useEffect(() => {
    if (gamePhase !== 'playing') return
    if (stateRef.current) return // already initialized

    const state = initGameState(players, config)
    stateRef.current = state

    // Center camera on first hero
    const hero = state.heroes.find(h => h.owner === 0)
    if (hero) {
      cameraRef.current = centerCameraOnHero(hero, state.map.cols, state.map.rows)
      selectedHeroRef.current = hero.id
    }

    // Update scoreboard
    updateScoreboard(state)
  }, [gamePhase, players, config, updateScoreboard])

  // --- Input setup ---
  useEffect(() => {
    if (gamePhase !== 'playing') return
    const canvas = canvasRef.current
    if (!canvas) return
    const cleanup = setupInputHandlers(canvas, inputRef.current)
    return cleanup
  }, [gamePhase])

  // --- Game logic refs and callbacks for extracted functions ---
  const gameRefs: GameRefs = {
    input: inputRef,
    camera: cameraRef,
    selectedHero: selectedHeroRef,
    combatUI: combatUIRef,
    townScreen: townScreenRef,
    lastMove: lastMoveRef,
    lastAI: lastAIRef,
    notifications: notificationsRef,
  }
  const gameCb: GameCallbacks = {
    pushNotification,
    updateScoreboard,
  }

  // =====================================================================
  //  RENDER FRAME
  // =====================================================================
  function renderFrame(ctx: CanvasRenderingContext2D, state: GameState) {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    const tk = tickRef.current

    if (state.combat) {
      // Combat screen
      const attackerHero = getAttackerHero(state)
      const defenderHero = getDefenderHero(state)
      drawCombatScreen(
        ctx,
        state.combat,
        attackerHero,
        defenderHero,
        combatUIRef.current.hoveredCell,
        combatUIRef.current.selectedAction,
        combatUIRef.current.selectedSpellId,
        spr,
        tk,
      )

      // Combat control buttons overlay
      const btnY = CANVAS_H - 28
      const btnH = 22
      const btnW = 75
      ctx.font = 'bold 10px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Auto-combat button
      const autoActive = combatUIRef.current.autoCombat
      ctx.fillStyle = autoActive ? '#2e7d32' : '#3a2a15'
      ctx.fillRect(CANVAS_W - 330, btnY, btnW, btnH)
      ctx.strokeStyle = autoActive ? '#4caf50' : '#8B7355'
      ctx.strokeRect(CANVAS_W - 330, btnY, btnW, btnH)
      ctx.fillStyle = '#fff'
      ctx.fillText(autoActive ? 'AUTO ON' : 'Q: Auto', CANVAS_W - 330 + btnW / 2, btnY + btnH / 2)

      // Speed button
      ctx.fillStyle = '#3a2a15'
      ctx.fillRect(CANVAS_W - 250, btnY, btnW, btnH)
      ctx.strokeStyle = '#8B7355'
      ctx.strokeRect(CANVAS_W - 250, btnY, btnW, btnH)
      ctx.fillStyle = state.combatSpeed > 1 ? '#FFD700' : '#fff'
      ctx.fillText(`S: ${state.combatSpeed}x`, CANVAS_W - 250 + btnW / 2, btnY + btnH / 2)

      // Skip (instant resolve) button
      ctx.fillStyle = '#3a2a15'
      ctx.fillRect(CANVAS_W - 170, btnY, btnW, btnH)
      ctx.strokeStyle = '#8B7355'
      ctx.strokeRect(CANVAS_W - 170, btnY, btnW, btnH)
      ctx.fillStyle = '#fff'
      ctx.fillText('A: Skip', CANVAS_W - 170 + btnW / 2, btnY + btnH / 2)

      // Flee button
      ctx.fillStyle = '#5c1a1a'
      ctx.fillRect(CANVAS_W - 90, btnY, btnW, btnH)
      ctx.strokeStyle = '#d32f2f'
      ctx.strokeRect(CANVAS_W - 90, btnY, btnW, btnH)
      ctx.fillStyle = '#fff'
      ctx.fillText('F: Flee', CANVAS_W - 90 + btnW / 2, btnY + btnH / 2)

      ctx.textAlign = 'start'
    } else if (state.activeTownId) {
      // Town management screen
      const town = state.towns.find(t => t.id === state.activeTownId)
      if (town) {
        const hero = state.heroes.find(h => h.x === town.x && h.y === town.y && h.owner === town.owner) || null
        drawTownScreen(
          ctx, town, hero,
          state.resources[state.turn.currentPlayer],
          townScreenRef.current,
          inputRef.current.mouseX,
          inputRef.current.mouseY,
          spr,
          tk,
        )
      }
    } else {
      // Adventure map
      drawAdventureMap(ctx, state, cameraRef.current, selectedHeroRef.current, null, spr, tk)

      // HUD overlays
      drawResourceBar(ctx, state.resources[state.turn.currentPlayer], spr, tk)
      drawTurnBar(ctx, state, spr)
      drawMinimap(ctx, state, cameraRef.current.x, cameraRef.current.y, spr)
      drawHeroList(
        ctx,
        state.heroes.filter(h => h.owner === state.turn.currentPlayer),
        selectedHeroRef.current,
        spr,
      )
    }

    // Notifications (all screens)
    drawNotifications(ctx, notificationsRef.current.map(n => n.text), performance.now(), spr)

    // Level-up choice overlay
    if (state.pendingLevelUp) {
      const hero = state.heroes.find(h => h.id === state.pendingLevelUp!.heroId)
      if (hero) {
        const choices = state.pendingLevelUp.choices
        ctx.fillStyle = 'rgba(0,0,0,0.7)'
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

        const cx = CANVAS_W / 2
        const cy = CANVAS_H / 2

        // Panel background
        ctx.fillStyle = 'rgba(40,30,15,0.95)'
        ctx.fillRect(cx - 220, cy - 100, 440, 220)
        ctx.strokeStyle = '#FFD700'
        ctx.lineWidth = 2
        ctx.strokeRect(cx - 220, cy - 100, 440, 220)

        // Title
        ctx.fillStyle = '#FFD700'
        ctx.font = 'bold 18px monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${hero.name} reached Level ${hero.level + 1}!`, cx, cy - 70)
        ctx.fillStyle = '#ccc'
        ctx.font = '12px monospace'
        ctx.fillText('Choose your reward (press 1 or 2, or click):', cx, cy - 40)

        // Choice buttons
        for (let i = 0; i < Math.min(choices.length, 2); i++) {
          const bx = i === 0 ? cx - 180 : cx + 20
          const by = cy + 10
          const bw = 160
          const bh = 80

          // Button bg
          const hovered = inputRef.current.mouseX >= bx && inputRef.current.mouseX <= bx + bw &&
                          inputRef.current.mouseY >= by && inputRef.current.mouseY <= by + bh
          ctx.fillStyle = hovered ? '#5a4a30' : '#3a2a15'
          ctx.fillRect(bx, by, bw, bh)
          ctx.strokeStyle = hovered ? '#FFD700' : '#8B7355'
          ctx.strokeRect(bx, by, bw, bh)

          // Button label
          ctx.fillStyle = '#fff'
          ctx.font = 'bold 11px monospace'
          const c = choices[i]
          const label = `[${i + 1}]`
          if (c.type === 'primary') {
            ctx.fillText(label, bx + bw / 2, by + 20)
            ctx.fillStyle = '#7ec8e3'
            ctx.fillText(`+${c.primaryAmount} ${c.primaryStat.toUpperCase()}`, bx + bw / 2, by + 42)
            ctx.fillStyle = '#aaa'
            ctx.font = '9px monospace'
            ctx.fillText('Primary Stat', bx + bw / 2, by + 62)
          } else {
            ctx.fillText(label, bx + bw / 2, by + 20)
            ctx.fillStyle = '#a3e635'
            ctx.fillText(c.secondarySkillId.replace(/_/g, ' '), bx + bw / 2, by + 42)
            ctx.fillStyle = '#aaa'
            ctx.font = '9px monospace'
            ctx.fillText(`Level ${c.secondaryLevel}`, bx + bw / 2, by + 62)
          }
        }
        ctx.textAlign = 'start'
        ctx.lineWidth = 1
      }
    }

    // Game over overlay
    if (state.winner !== null) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
      ctx.fillStyle = '#FFD700'
      ctx.font = 'bold 32px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const winnerName = state.winner < players.length
        ? (players[state.winner].name || `Player ${state.winner + 1}`)
        : `AI ${state.winner - players.length + 1}`
      ctx.fillText(`${winnerName} Wins!`, CANVAS_W / 2, CANVAS_H / 2 - 30)
      ctx.font = '18px monospace'
      ctx.fillStyle = '#ccc'
      ctx.fillText('Press R to restart or ESC to exit', CANVAS_W / 2, CANVAS_H / 2 + 20)
      ctx.textAlign = 'start'
    }
  }

  // =====================================================================
  //  GAME LOOP
  // =====================================================================
  useEffect(() => {
    if (gamePhase !== 'playing') return
    let raf = 0
    const loop = () => {
      if (pauseRef.current) { raf = requestAnimationFrame(loop); return }

      const state = stateRef.current
      const canvas = canvasRef.current
      if (!state || !canvas) { raf = requestAnimationFrame(loop); return }

      const ctx = canvas.getContext('2d')
      if (!ctx) { raf = requestAnimationFrame(loop); return }

      const now = performance.now()

      // -- Process input by screen mode --
      if (state.winner !== null) {
        // Game over -- check restart
        const input = inputRef.current
        if (input.keysJustPressed.has('r') || input.keysJustPressed.has('R')) {
          const newState = initGameState(players, config)
          stateRef.current = newState
          const hero = newState.heroes.find(h => h.owner === 0)
          if (hero) {
            selectedHeroRef.current = hero.id
            cameraRef.current = centerCameraOnHero(hero, newState.map.cols, newState.map.rows)
          }
          setGameOver(false)
          setWinner(null)
          updateScoreboard(newState)
        }
        if (input.keysJustPressed.has('Escape')) {
          onBack()
        }
      } else if (state.combat) {
        stateRef.current = processCombatInput(state, now, gameRefs, gameCb)
      } else if (state.pendingLevelUp) {
        stateRef.current = processLevelUpInput(state, now, gameRefs, gameCb)
      } else if (state.activeTownId) {
        stateRef.current = processTownInput(state, now, gameRefs, gameCb)
      } else if (state.turn.currentPlayer < state.humanCount) {
        stateRef.current = processAdventureInput(state, now, gameRefs, gameCb)
      }

      // -- Render --
      tickRef.current++
      renderFrame(ctx, stateRef.current!)

      // -- Clear per-frame input --
      clearFrameInput(inputRef.current)

      // -- Check game over --
      if (stateRef.current!.winner !== null && !gameOver) {
        setGameOver(true)
        setWinner(stateRef.current!.winner)
      }

      // -- Prune old notifications --
      notificationsRef.current = notificationsRef.current.filter(n => now - n.time < 4000)

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  // Game loop â€” restarts on phase change; all state read from refs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamePhase])

  // =====================================================================
  //  RESTART
  // =====================================================================
  const handleRestart = useCallback(() => {
    const newState = initGameState(players, config)
    stateRef.current = newState
    const hero = newState.heroes.find(h => h.owner === 0)
    if (hero) {
      selectedHeroRef.current = hero.id
      cameraRef.current = centerCameraOnHero(hero, newState.map.cols, newState.map.rows)
    }
    notificationsRef.current = []
    setGameOver(false)
    setWinner(null)
    updateScoreboard(newState)
  }, [players, config, updateScoreboard]) // handleRestart

  // =====================================================================
  //  SETUP / EDITOR CALLBACKS
  // =====================================================================
  const handleStartFromSetup = useCallback((setupConfig: GameSetupConfig) => {
    const gameConfig = {
      ...config,
      gameMode: setupConfig.gameMode === 'campaign' ? 'coop-campaign' : setupConfig.gameMode,
      difficulty: setupConfig.difficulty,
      mapSize: setupConfig.mapSize,
      seed: setupConfig.seed,
      setupConfig,
    }
    // Create PlayerSlot-compatible array from setup
    const setupPlayers: PlayerSlot[] = setupConfig.players
      .filter(p => p.type === 'human')
      .map((p, i) => ({
        index: i, name: p.name, color: p.color,
        input: { type: 'keyboard' as const, group: i },
        joined: true, ready: true,
      }))

    const state = initGameState(
      setupPlayers.length > 0 ? setupPlayers : players,
      gameConfig,
    )
    stateRef.current = state
    const hero = state.heroes.find(h => h.owner === 0)
    if (hero) {
      selectedHeroRef.current = hero.id
      cameraRef.current = centerCameraOnHero(hero, state.map.cols, state.map.rows)
    }
    notificationsRef.current = []
    setGameOver(false)
    setWinner(null)
    updateScoreboard(state)
    setGamePhase('playing')
  }, [players, config, updateScoreboard]) // handleStartFromSetup

  const handleOpenEditor = useCallback(() => {
    setGamePhase('editor')
  }, [])

  const handleBackFromEditor = useCallback(() => {
    setGamePhase('setup')
  }, [])

  const handleBackToSetup = useCallback(() => {
    stateRef.current = null
    setGameOver(false)
    setWinner(null)
    setGamePhase('setup')
  }, [])

  // =====================================================================
  //  JSX
  // =====================================================================

  // --- Setup phase ---
  if (gamePhase === 'setup') {
    return (
      <div className={styles.container} style={{ position: 'relative' }}>
        <GameSetup
          initialPlayers={players.map(p => ({ name: p.name }))}
          onStartGame={handleStartFromSetup}
          onOpenEditor={handleOpenEditor}
          onBack={onBack}
        />
      </div>
    )
  }

  // --- Editor phase ---
  if (gamePhase === 'editor') {
    return (
      <div className={styles.container} style={{ position: 'relative' }}>
        <MapEditor
          onBack={handleBackFromEditor}
        />
      </div>
    )
  }

  // --- Playing phase ---
  return (
    <div className={styles.container}>
      {/* Scoreboard */}
      <div className={styles.scoreboard}>
        {scoreboard.map((sc, i) => (
          <div key={i} className={styles.scoreItem}>
            <span className={styles.scoreColor} style={{ background: sc.color }} />
            <span className={styles.scoreValue}>{sc.name}</span>
            <span>{''}{sc.towns}</span>
            <span>{''}{sc.heroes}</span>
            <span>{''}{sc.army}</span>
          </div>
        ))}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className={styles.canvas}
        tabIndex={0}
        style={{ cursor: 'pointer' }}
        aria-label="Game of Castles game canvas"
      />

      {/* Controls bar */}
      <div className={styles.controls}>
        <button className={styles.btn} onClick={handleRestart}>
          {''} {t('miniGames.restart', 'Restart')}
        </button>
        <button className={styles.btn} onClick={handleBackToSetup}>
          âš™ï¸ Setup
        </button>
        <span className={styles.info}>
          WASD: Move | Tab: Next Hero | Enter: End Turn | T: Town | Esc: Pause
        </span>
        <button className={styles.btn} onClick={onBack}>
          {''} {t('miniGames.back', 'Back')}
        </button>
      </div>

      {/* Pause menu */}
      {isPaused && <PauseMenu
        onResume={resume}
        onBack={onBack}
        players={players}
        gameId="game-of-castles"
      />}

      {/* Game over overlay */}
      {gameOver && (
        <div className={styles.overlay}>
          <div className={styles.overlayPanel}>
            <h2 style={{ color: '#FFD700', margin: '0 0 16px' }}>
              {winner !== null && winner < players.length
                ? `${players[winner]?.name || `Player ${winner + 1}`} Wins!`
                : `AI Wins!`}
            </h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className={styles.btnPrimary} onClick={handleRestart}>
                {''} Play Again
              </button>
              <button className={styles.btnPrimary} onClick={handleBackToSetup}>
                âš™ï¸ New Game
              </button>
              <button className={styles.btnDanger} onClick={onBack}>
                {''} Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
