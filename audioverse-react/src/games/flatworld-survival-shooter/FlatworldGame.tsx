/**
 * FlatworldGame.tsx — Main React component for Flatworld Survival.
 *
 * Terraria-like 2.5D survival game with destructible terrain, crafting,
 * building, combat, day/night cycle, bosses.
 *
 * Modes: survival, deathmatch, team-deathmatch, coop-survival
 * Rendering: Three.js (orthographic side view)
 * Controls: WASD/Arrows/IJKL + Mouse + Gamepad
 *
 * Assets:
 *   World:      public/assets/models/Low-Poly/Post-Apocalyptic World/
 *   Characters: public/assets/models/POLYGON_Heist_SourceFiles_v4/
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlayerSlot, GameConfig } from '../../pages/games/mini/types'
import { useGamepads } from '../../pages/games/mini/useGamepads'
import { usePause } from '../../pages/games/mini/usePause'
import PauseMenu from '../../pages/games/mini/PauseMenu'
import { type FlatWorldState } from './types'
import type { GameConfig as FlatworldConfig } from './types'
import { createGameState } from './worldGen'
import { tick, type PlayerActions, EMPTY_ACTIONS } from './gameState'
import { updateEnemySpawning } from './combat'
import { FlatworldRenderer } from './renderer'
import GameHUD from './GameHUD'
import { InventoryPanel } from './GamePanels'
import css from './FlatworldGame.module.css'
import { useGameFocusLock } from '../../hooks/useGameFocusLock'

// ─── Keyboard → action mappings ───────────────────────────
type Action = 'left' | 'right' | 'jump' | 'attack' | 'place' | 'interact' | 'inventory' | 'drop'
  | 'crouch' | 'prone' | 'enterVehicle'
  | 'hotbar0' | 'hotbar1' | 'hotbar2' | 'hotbar3' | 'hotbar4' | 'hotbar5' | 'hotbar6' | 'hotbar7' | 'hotbar8' | 'hotbar9'

const KEY_MAPS: Record<number, Record<string, Action>> = {
  0: {
    a: 'left', d: 'right', w: 'jump', ' ': 'attack',
    s: 'place', e: 'interact', Tab: 'inventory', q: 'drop',
    c: 'crouch', z: 'prone', f: 'enterVehicle',
    '1': 'hotbar0', '2': 'hotbar1', '3': 'hotbar2', '4': 'hotbar3', '5': 'hotbar4',
    '6': 'hotbar5', '7': 'hotbar6', '8': 'hotbar7', '9': 'hotbar8', '0': 'hotbar9',
  },
  1: {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'jump', Enter: 'attack',
    ArrowDown: 'place', Backspace: 'interact', '\\': 'inventory',
    '.': 'crouch', ',': 'prone', '/': 'enterVehicle',
  },
  2: {
    j: 'left', l: 'right', i: 'jump', u: 'attack',
    k: 'place', o: 'interact', p: 'inventory',
    n: 'crouch', m: 'prone', h: 'enterVehicle',
  },
}

// ─── Component ────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function FlatworldGame({ players, config, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<FlatworldRenderer | null>(null)
  const stateRef = useRef<FlatWorldState | null>(null)
  const keysDown = useRef(new Set<string>())
  const mouseRef = useRef({ x: 0, y: 0, left: false, right: false })
  const scrollRef = useRef(0)

  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [showInv, setShowInv] = useState(false)
  const [, forceUpdate] = useState(0)

  const pads = useGamepads()
  const padsRef = useRef(pads); padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // Active player = first keyboard group 0 human (or 0)
  const activePlayer = 0

  // ── Initialize state & renderer ─────────────────────────
  useEffect(() => {
    const cfg = (config ?? {}) as FlatworldConfig
    stateRef.current = createGameState(players, cfg)
    const canvas = canvasRef.current
    if (!canvas) return

    const r = new FlatworldRenderer()
    r.init(canvas)
    r.resize(canvas.clientWidth, canvas.clientHeight)
    rendererRef.current = r

    return () => {
      r.dispose()
      rendererRef.current = null
    }
    // Mount-only: game state and renderer initialized once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Resize handler ──────────────────────────────────────
  useEffect(() => {
    const handle = () => {
      const canvas = canvasRef.current
      const r = rendererRef.current
      if (canvas && r) {
        canvas.width = canvas.clientWidth
        canvas.height = canvas.clientHeight
        r.resize(canvas.clientWidth, canvas.clientHeight)
      }
    }
    window.addEventListener('resize', handle)
    handle()
    return () => window.removeEventListener('resize', handle)
  }, [])

  // ── Keyboard tracking ───────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysDown.current.add(e.key)
      // Prevent default for game keys
      if (['Tab', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
      }
    }
    const up = (e: KeyboardEvent) => { keysDown.current.delete(e.key) }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  // ── Mouse tracking ──────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const move = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX - canvas.getBoundingClientRect().left
      mouseRef.current.y = e.clientY - canvas.getBoundingClientRect().top
    }
    const mdown = (e: MouseEvent) => {
      if (e.button === 0) mouseRef.current.left = true
      if (e.button === 2) mouseRef.current.right = true
    }
    const mup = (e: MouseEvent) => {
      if (e.button === 0) mouseRef.current.left = false
      if (e.button === 2) mouseRef.current.right = false
    }
    const ctx = (e: MouseEvent) => e.preventDefault()
    const whl = (e: WheelEvent) => {
      scrollRef.current += e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0
      e.preventDefault()
    }
    canvas.addEventListener('mousemove', move)
    canvas.addEventListener('mousedown', mdown)
    canvas.addEventListener('mouseup', mup)
    canvas.addEventListener('contextmenu', ctx)
    canvas.addEventListener('wheel', whl, { passive: false })
    return () => {
      canvas.removeEventListener('mousemove', move)
      canvas.removeEventListener('mousedown', mdown)
      canvas.removeEventListener('mouseup', mup)
      canvas.removeEventListener('contextmenu', ctx)
      canvas.removeEventListener('wheel', whl)
    }
  }, [])

  // ── Build player actions from input ─────────────────────
  const buildActions = useCallback((): PlayerActions[] => {
    const st = stateRef.current
    if (!st) return []
    const r = rendererRef.current
    const canvas = canvasRef.current

    return st.players.map((p, idx) => {
      const a: PlayerActions = { ...EMPTY_ACTIONS }

      if (p.input.type === 'keyboard') {
        const group = p.input.group
        const km = KEY_MAPS[group]
        if (km) {
          for (const [key, action] of Object.entries(km)) {
            if (!keysDown.current.has(key)) continue
            switch (action) {
              case 'left': a.left = true; break
              case 'right': a.right = true; break
              case 'jump': a.jump = true; break
              case 'attack': a.attack = true; break
              case 'place': a.place = true; break
              case 'interact': a.interact = true; break
              case 'inventory':
                a.openInventory = true
                keysDown.current.delete(key) // toggle
                break
              case 'drop': a.dropItem = true; break
              case 'crouch':
                a.crouch = true
                keysDown.current.delete(key) // toggle
                break
              case 'prone':
                a.prone = true
                keysDown.current.delete(key) // toggle
                break
              case 'enterVehicle':
                a.enterVehicle = true
                keysDown.current.delete(key) // toggle
                break
              default:
                if (action.startsWith('hotbar')) {
                  a.hotbar = Number(action.replace('hotbar', ''))
                }
            }
          }
        }

        // Mouse for group 0 (primary player)
        if (group === 0 && r && canvas) {
          const world = r.screenToWorld(mouseRef.current.x, mouseRef.current.y, canvas)
          a.cursorX = world.x
          a.cursorY = world.y
          if (mouseRef.current.left) a.attack = true
          if (mouseRef.current.right) a.place = true
        }

        // Scroll for group 0
        if (group === 0 && scrollRef.current !== 0) {
          a.scrollDir = scrollRef.current > 0 ? 1 : -1
          scrollRef.current = 0
        }
      } else if (p.input.type === 'gamepad') {
        const gp = padsRef.current.find(g => g.index === (p.input as { padIndex: number }).padIndex)
        if (gp) {
          a.left = gp.left
          a.right = gp.right
          a.jump = gp.a
          a.attack = gp.x
          a.place = gp.b
          a.interact = gp.y
          if (gp.lb) a.scrollDir = -1
          if (gp.rb) a.scrollDir = 1
          if (gp.down) a.crouch = true
          if (gp.select) a.enterVehicle = true
          // Gamepad cursor: default to player facing direction
          const p2 = st.players[idx]
          if (p2) {
            const reach = 3
            a.cursorX = p2.x + (a.right ? reach : a.left ? -reach : p2.facing * reach)
            a.cursorY = p2.y + (a.jump ? -reach : 0)
          }
        }
      }

      return a
    })
  }, [])

  // ── Main game loop ──────────────────────────────────────
  useEffect(() => {
    let raf = 0
    const FIXED_DT = 1000 / 60
    let lastTime = performance.now()
    let accumulator = 0
    let frameCount = 0

    function loop(now: number) {
      if (pauseRef.current || showInv) {
        lastTime = now
        raf = requestAnimationFrame(loop)
        return
      }

      const st = stateRef.current
      const r = rendererRef.current
      if (!st || !r) { raf = requestAnimationFrame(loop); return }

      if (st.gameOver) {
        setGameOver(true)
        if (st.winner != null) {
          const w = st.players.find(p => p.index === st.winner)
          setWinner(w?.name ?? null)
        }
        // Still render final frame
        const canvas = canvasRef.current
        if (canvas) {
          const curX = Math.floor(st.players[activePlayer]?.x ?? 0)
          const curY = Math.floor(st.players[activePlayer]?.y ?? 0)
          if (st.players.length > 1) {
            r.renderSplitScreen(st, st.players.map((_, i) => i), curX, curY, canvas.width, canvas.height)
          } else {
            r.render(st, activePlayer, curX, curY)
          }
        }
        return
      }

      const dt = now - lastTime
      lastTime = now
      accumulator += Math.min(dt, 100) // cap to prevent spiral of death

      const actions = buildActions()

      // Inventory toggle
      for (const a of actions) {
        if (a.openInventory) {
          setShowInv(prev => !prev)
          break
        }
      }

      while (accumulator >= FIXED_DT) {
        tick(st, actions)
        updateEnemySpawning(st)
        accumulator -= FIXED_DT
      }

      // Render
      const canvas = canvasRef.current
      if (canvas) {
        const mouse = mouseRef.current
        const world = r.screenToWorld(mouse.x, mouse.y, canvas)
        const curTileX = Math.floor(world.x)
        const curTileY = Math.floor(world.y)

        // Split-screen for multiple players
        if (st.players.length > 1) {
          const indices = st.players.map((_, i) => i)
          r.renderSplitScreen(st, indices, curTileX, curTileY, canvas.width, canvas.height)
        } else {
          r.render(st, activePlayer, curTileX, curTileY)
        }
      }

      // Update React state periodically (every 10 frames)
      frameCount++
      if (frameCount % 10 === 0) {
        forceUpdate(n => n + 1)
      }

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [buildActions, showInv, activePlayer])

  // ── Restart ─────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    const cfg = (config ?? {}) as FlatworldConfig
    stateRef.current = createGameState(players, cfg)
    setGameOver(false)
    setWinner(null)
    setShowInv(false)
  }, [players, config])

  // Restart keybinding
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gameOver && (e.key === ' ' || e.key === 'Enter')) handleRestart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameOver, handleRestart])

  // Hotbar selection
  const handleHotbarSelect = useCallback((idx: number) => {
    const st = stateRef.current
    if (st?.players[activePlayer]) {
      st.players[activePlayer].hotbar = idx
    }
  }, [activePlayer])

  const state = stateRef.current

  return (
    <div ref={containerRef} className={css.container}>
      <canvas ref={canvasRef} className={css.canvas}  role="img" aria-label="Flatworld canvas"/>

      {/* HUD */}
      {state && (
        <GameHUD
          state={state}
          activePlayer={activePlayer}
          onHotbarSelect={handleHotbarSelect}
          onOpenInventory={() => setShowInv(true)}
        />
      )}

      {/* Scoreboard */}
      {state && (
        <div className={css.scoreboard}>
          {state.players.map((s, i) => (
            <div key={i} className={`${css.scoreItem} ${!s.alive ? css.dead : ''}`}>
              <span className={css.scoreColor} style={{ background: s.color }} />
              <span>{s.name}</span>
              <span className={css.scoreValue}>
                {state.config.mode === 'survival' || state.config.mode === 'coop-survival'
                  ? `${s.kills}K`
                  : `${s.kills}/${state.config.killsToWin}`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Inventory Panel */}
      {showInv && state && (
        <InventoryPanel
          state={state}
          activePlayer={activePlayer}
          onClose={() => setShowInv(false)}
        />
      )}

      {/* Pause Menu */}
      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

      {/* Game Over */}
      {gameOver && state && (
        <div className={css.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && <p className={css.winnerText}>🏆 {winner} {t('miniGames.wins', 'wins')}!</p>}
          {!winner && state.config.mode === 'coop-survival' && (
            <p className={css.winnerText}>
              {t('miniGames.survived', 'Survived')} {state.waveNum} {t('miniGames.waves', 'waves')}
            </p>
          )}
          {!winner && state.config.mode === 'survival' && (
            <p className={css.winnerText}>
              🌙 {t('miniGames.survived', 'Survived')} {Math.floor(state.frame / 60)}s
            </p>
          )}
          <div className={css.scoreRow}>
            {state.players.map((s, i) => (
              <div key={i} className={css.scoreCard} style={{ color: s.color }}>
                <div>{s.name}</div>
                <div>⚔️{s.kills} ☠️{s.deaths}</div>
                <div>🪙{s.coins} 💎{s.gems} ⭐{s.stars}</div>
              </div>
            ))}
          </div>
          <div className={css.overlayActions}>
            <button className={css.restartBtn} onClick={handleRestart}>{t('miniGames.playAgain', 'Play Again')}</button>
            <button className={css.backBtnOverlay} onClick={onBack}>{t('miniGames.backToMenu', 'Back to Menu')}</button>
          </div>
          <p className={css.overlayHint}>{t('miniGames.pressRestart', 'Press Space or Enter to restart')}</p>
        </div>
      )}
    </div>
  )
}
