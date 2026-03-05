/**
 * OilImperiumGame — oil tycoon economic game for 1-4 players.
 *
 * Controls (per keyboard group):
 *   Group 0: W/A/S/D move, Space buy plot, E build/well, Q upgrade
 *   Group 1: Arrows move, Enter buy plot, Shift build/well, Ctrl upgrade
 * Gamepads: Left stick / D-pad move, A buy, X build, Y upgrade
 *
 * Rules:
 *  - Top-down 8x6 grid of land plots.
 *  - Buy plots, build oil wells and refineries, sell oil at market price.
 *  - Oil prices fluctuate in real-time (sine wave + random noise).
 *  - Revenue ticks every 2 seconds based on wells + refineries.
 *  - VS mode: sabotage opponent wells for $200.
 *  - Coop mode: shared empire, combined wealth target.
 *  - Win: reach $10,000 first (or most wealth when 5-min timer expires).
 *
 * Currencies:
 *  - Coins (oil revenue), Gems (contracts), Stars (market domination).
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PLAYER_COLORS, type GameConfig, PlayerSlot } from './types'
import { useGamepads } from './useGamepads'
import { usePause } from './usePause'
import PauseMenu from './PauseMenu'
import styles from './SharedGame.module.css'
import { useGameFocusLock } from '../../../hooks/useGameFocusLock'

// ─── Constants ───────────────────────────────────────────────
const CANVAS_W = 800
const CANVAS_H = 600
const GRID_COLS = 8
const GRID_ROWS = 6
const CELL_W = 80
const CELL_H = 70
const GRID_X = 40
const GRID_Y = 40
const CHART_H = 60
const CHART_Y = CANVAS_H - CHART_H - 10
const CHART_X = GRID_X
const CHART_W = GRID_COLS * CELL_W
const TICK_INTERVAL = 2000
const MARKET_INTERVAL = 1500
const WIN_AMOUNT = 10000
const GAME_DURATION = 300_000 // 5 min
const MAX_PRICE_HISTORY = 20
const PLOT_BASE_COST = 200
const WELL_COST = 300
const REFINERY_COST = 400
const UPGRADE_COST = 500
const MAX_WELL_LEVEL = 3
const SABOTAGE_COST = 200
const SABOTAGE_DURATION = 10_000

// ─── Keyboard mappings ───────────────────────────────────────
interface KBAction { group: number; action: string }
const KB_MAP = new Map<string, KBAction>([
  // Group 0 — WASD + Space/E/Q
  ['w', { group: 0, action: 'up' }],
  ['s', { group: 0, action: 'down' }],
  ['a', { group: 0, action: 'left' }],
  ['d', { group: 0, action: 'right' }],
  [' ', { group: 0, action: 'buy' }],
  ['e', { group: 0, action: 'build' }],
  ['q', { group: 0, action: 'upgrade' }],
  // Group 1 — Arrows + Enter/Shift/Ctrl
  ['ArrowUp', { group: 1, action: 'up' }],
  ['ArrowDown', { group: 1, action: 'down' }],
  ['ArrowLeft', { group: 1, action: 'left' }],
  ['ArrowRight', { group: 1, action: 'right' }],
  ['Enter', { group: 1, action: 'buy' }],
  ['Shift', { group: 1, action: 'build' }],
  ['Control', { group: 1, action: 'upgrade' }],
])

// ─── Types ───────────────────────────────────────────────────
interface Plot {
  col: number
  row: number
  owner: number | null       // playerIndex or null
  oilRichness: number        // 1-5
  hasWell: boolean
  wellLevel: number          // 0-3
  hasRefinery: boolean
  sabotaged: boolean
  sabotageEnd: number
}

interface OilPlayer {
  index: number
  name: string
  color: string
  input: PlayerSlot['input']
  money: number
  oilStored: number
  coins: number
  gems: number
  stars: number
  cursorCol: number
  cursorRow: number
  wellsCount: number
  refineriesCount: number
  eliminated: boolean
}

interface GameState {
  players: OilPlayer[]
  grid: Plot[][]
  marketPrice: number
  priceHistory: number[]
  elapsed: number
  gameOver: boolean
  winner: number | null
  coop: boolean
  lastTick: number
  lastMarketTick: number
  marketPhase: number
}

// ─── Helpers ─────────────────────────────────────────────────
function createGrid(): Plot[][] {
  const grid: Plot[][] = []
  for (let r = 0; r < GRID_ROWS; r++) {
    const row: Plot[] = []
    for (let c = 0; c < GRID_COLS; c++) {
      row.push({
        col: c, row: r, owner: null,
        oilRichness: Math.floor(Math.random() * 5) + 1,
        hasWell: false, wellLevel: 0, hasRefinery: false,
        sabotaged: false, sabotageEnd: 0,
      })
    }
    grid.push(row)
  }
  return grid
}

function plotCost(plot: Plot): number {
  return PLOT_BASE_COST + plot.oilRichness * 60
}

function initState(players: PlayerSlot[], config?: GameConfig): GameState {
  const grid = createGrid()
  const coop = config?.gameMode === 'coop-empire'
  const startingCash = config?.startingCash ?? 1000

  // Starting positions
  const starts = [
    { c: 1, r: 1 }, { c: GRID_COLS - 2, r: GRID_ROWS - 2 },
    { c: GRID_COLS - 2, r: 1 }, { c: 1, r: GRID_ROWS - 2 },
  ]

  const oilPlayers: OilPlayer[] = players.map((p, i) => {
    const start = starts[i % starts.length]
    const plot = grid[start.r][start.c]
    plot.owner = p.index
    plot.hasWell = true
    plot.wellLevel = 1
    return {
      index: p.index, name: p.name,
      color: p.color || PLAYER_COLORS[p.index] || '#fff',
      input: p.input, money: startingCash, oilStored: 0,
      coins: 0, gems: 0, stars: 0,
      cursorCol: start.c, cursorRow: start.r,
      wellsCount: 1, refineriesCount: 0, eliminated: false,
    }
  })

  return {
    players: oilPlayers, grid, marketPrice: 50,
    priceHistory: [50], elapsed: 0, gameOver: false,
    winner: null, coop, lastTick: Date.now(),
    lastMarketTick: Date.now(), marketPhase: 0,
  }
}

// ─── Component ───────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function OilImperiumGame({ players, config, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState>(initState(players, config))
  const startTimeRef = useRef(Date.now())
  const [hud, setHud] = useState<OilPlayer[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads

  const gameDuration = ((config?.gameDuration ?? 5) * 60_000)
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // ── Process action for a player ──
  const processAction = useCallback((playerIdx: number, action: string) => {
    const st = stateRef.current
    if (st.gameOver) return
    const player = st.players.find(p => p.index === playerIdx)
    if (!player || player.eliminated) return

    if (action === 'up') player.cursorRow = Math.max(0, player.cursorRow - 1)
    else if (action === 'down') player.cursorRow = Math.min(GRID_ROWS - 1, player.cursorRow + 1)
    else if (action === 'left') player.cursorCol = Math.max(0, player.cursorCol - 1)
    else if (action === 'right') player.cursorCol = Math.min(GRID_COLS - 1, player.cursorCol + 1)
    else {
      const plot = st.grid[player.cursorRow][player.cursorCol]
      if (action === 'buy') {
        // Buy unowned plot or sabotage enemy plot (VS)
        if (plot.owner === null) {
          const cost = plotCost(plot)
          if (player.money >= cost) {
            player.money -= cost
            plot.owner = player.index
            player.gems += 1
          }
        } else if (plot.owner !== player.index && !st.coop && config?.gameMode === 'vs-market') {
          // Sabotage
          if (player.money >= SABOTAGE_COST && !plot.sabotaged) {
            player.money -= SABOTAGE_COST
            plot.sabotaged = true
            plot.sabotageEnd = Date.now() + SABOTAGE_DURATION
          }
        }
      } else if (action === 'build') {
        if (plot.owner === player.index || (st.coop && plot.owner !== null)) {
          if (!plot.hasWell) {
            if (player.money >= WELL_COST) {
              player.money -= WELL_COST
              plot.hasWell = true
              plot.wellLevel = 1
              player.wellsCount++
            }
          } else if (!plot.hasRefinery) {
            if (player.money >= REFINERY_COST) {
              player.money -= REFINERY_COST
              plot.hasRefinery = true
              player.refineriesCount++
              player.gems += 2
            }
          }
        }
      } else if (action === 'upgrade') {
        if ((plot.owner === player.index || (st.coop && plot.owner !== null))
            && plot.hasWell && plot.wellLevel < MAX_WELL_LEVEL) {
          if (player.money >= UPGRADE_COST) {
            player.money -= UPGRADE_COST
            plot.wellLevel++
          }
        }
      }
    }
  }, [config?.gameMode])

  // ── Keyboard input ──
  useEffect(() => {
    const held = new Set<string>()
    function onKeyDown(e: KeyboardEvent) {
      if (held.has(e.key)) return
      held.add(e.key)
      const mapping = KB_MAP.get(e.key)
      if (!mapping) return
      const st = stateRef.current
      for (const p of st.players) {
        if (p.input.type === 'keyboard' && p.input.group === mapping.group) {
          processAction(p.index, mapping.action)
        }
      }
    }
    function onKeyUp(e: KeyboardEvent) { held.delete(e.key) }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp) }
  }, [processAction])

  // ── Gamepad polling ──
  useEffect(() => {
    let raf = 0
    const prevBtns: Record<number, { a: boolean; x: boolean; y: boolean }> = {}
    function poll() {
      const st = stateRef.current
      const currentPads = padsRef.current
      for (const p of st.players) {
        if (p.input.type !== 'gamepad') continue
        const gp = currentPads.find(g => g.index === (p.input as { padIndex: number }).padIndex)
        if (!gp) continue
        // Movement (rate-limited via frame)
        if (gp.up) processAction(p.index, 'up')
        else if (gp.down) processAction(p.index, 'down')
        else if (gp.left) processAction(p.index, 'left')
        else if (gp.right) processAction(p.index, 'right')
        // Edge-detect buttons
        const prev = prevBtns[p.index] ?? { a: false, x: false, y: false }
        if (gp.a && !prev.a) processAction(p.index, 'buy')
        if (gp.x && !prev.x) processAction(p.index, 'build')
        if (gp.y && !prev.y) processAction(p.index, 'upgrade')
        prevBtns[p.index] = { a: gp.a, x: gp.x, y: gp.y }
      }
      raf = requestAnimationFrame(poll)
    }
    raf = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(raf)
  }, [processAction])

  // ── Game loop (revenue ticks + market updates) ──
  useEffect(() => {
    function tick() {
      if (pauseRef.current) return
      const st = stateRef.current
      if (st.gameOver) return
      const now = Date.now()

      // Timer
      st.elapsed = now - startTimeRef.current
      const remaining = gameDuration - st.elapsed
      setTimeLeft(Math.max(0, remaining))

      // Market price update
      if (now - st.lastMarketTick >= MARKET_INTERVAL) {
        st.marketPhase += 0.15
        st.marketPrice = Math.max(10,
          50 + Math.sin(st.marketPhase) * 25 + (Math.random() - 0.5) * 15
        )
        st.priceHistory.push(Math.round(st.marketPrice))
        if (st.priceHistory.length > MAX_PRICE_HISTORY) st.priceHistory.shift()
        st.lastMarketTick = now
      }

      // Revenue tick
      if (now - st.lastTick >= TICK_INTERVAL) {
        for (const p of st.players) {
          if (p.eliminated) continue
          let oilProduced = 0
          let refinedValue = 0
          for (const row of st.grid) {
            for (const plot of row) {
              const isOwner = st.coop ? plot.owner !== null : plot.owner === p.index
              if (!isOwner || !plot.hasWell) continue
              // Check sabotage expiry
              if (plot.sabotaged && now >= plot.sabotageEnd) {
                plot.sabotaged = false
              }
              const output = plot.sabotaged
                ? plot.wellLevel * plot.oilRichness * 0.3
                : plot.wellLevel * plot.oilRichness
              if (plot.hasRefinery) {
                refinedValue += output * st.marketPrice * 0.15
              } else {
                oilProduced += output
              }
            }
          }
          p.oilStored += oilProduced
          // Auto-sell refined oil
          const revenue = refinedValue + p.oilStored * st.marketPrice * 0.05
          p.money += Math.round(revenue)
          p.coins += Math.round(revenue / 10)
          p.oilStored = Math.max(0, p.oilStored * 0.7) // decay stored

          // Stars for market domination
          if (p.money >= 5000) p.stars = Math.max(p.stars, 1)
          if (p.money >= 8000) p.stars = Math.max(p.stars, 2)
          if (p.money >= WIN_AMOUNT) p.stars = Math.max(p.stars, 3)
        }
        st.lastTick = now
      }

      // Win check
      if (st.coop) {
        const totalMoney = st.players.reduce((s, p) => s + p.money, 0)
        if (totalMoney >= WIN_AMOUNT || remaining <= 0) {
          st.gameOver = true
          st.winner = -1 // coop win
          setGameOver(true)
          setWinner(t('miniGames.coopVictory', 'Co-op Victory!'))
        }
      } else {
        for (const p of st.players) {
          if (p.money >= WIN_AMOUNT) {
            st.gameOver = true
            st.winner = p.index
            setGameOver(true)
            setWinner(p.name)
            break
          }
        }
        if (!st.gameOver && remaining <= 0) {
          st.gameOver = true
          const richest = [...st.players].sort((a, b) => b.money - a.money)[0]
          st.winner = richest.index
          setGameOver(true)
          setWinner(richest.name)
        }
      }

      setHud([...st.players])
    }

    const timerId = setInterval(tick, 100)
    return () => clearInterval(timerId)
  }, [gameDuration, t])

  // ── Canvas render ──
  useEffect(() => {
    let raf = 0
    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { raf = requestAnimationFrame(draw); return }
      const st = stateRef.current

      canvas.width = CANVAS_W
      canvas.height = CANVAS_H

      // Background
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      // Draw grid plots
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const plot = st.grid[r][c]
          const x = GRID_X + c * CELL_W
          const y = GRID_Y + r * CELL_H

          // Plot background (richness → shade)
          const richAlpha = 0.3 + plot.oilRichness * 0.1
          ctx.fillStyle = `rgba(210, 180, 120, ${richAlpha})`
          ctx.fillRect(x + 2, y + 2, CELL_W - 4, CELL_H - 4)

          // Owner border
          if (plot.owner !== null) {
            const ownerP = st.players.find(p => p.index === plot.owner)
            ctx.strokeStyle = ownerP?.color ?? '#fff'
            ctx.lineWidth = 3
            ctx.strokeRect(x + 1, y + 1, CELL_W - 2, CELL_H - 2)
          }

          // Sabotage indicator
          if (plot.sabotaged) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.25)'
            ctx.fillRect(x + 2, y + 2, CELL_W - 4, CELL_H - 4)
          }

          // Oil well (dark circle)
          if (plot.hasWell) {
            ctx.fillStyle = '#2c2c2c'
            ctx.beginPath()
            ctx.arc(x + CELL_W / 2, y + CELL_H / 2, 12, 0, Math.PI * 2)
            ctx.fill()
            // Level indicator
            ctx.fillStyle = '#ffd700'
            ctx.font = 'bold 10px monospace'
            ctx.textAlign = 'center'
            ctx.fillText(`L${plot.wellLevel}`, x + CELL_W / 2, y + CELL_H / 2 + 4)
          }

          // Refinery (gray rectangle)
          if (plot.hasRefinery) {
            ctx.fillStyle = '#555'
            ctx.fillRect(x + CELL_W / 2 + 8, y + 8, 20, 14)
            ctx.fillStyle = '#888'
            ctx.fillRect(x + CELL_W / 2 + 10, y + 4, 4, 6) // chimney
          }

          // Oil richness small text
          ctx.fillStyle = '#888'
          ctx.font = '9px monospace'
          ctx.textAlign = 'left'
          ctx.fillText(`⛽${plot.oilRichness}`, x + 4, y + CELL_H - 6)
        }
      }

      // Draw player cursors
      for (const p of st.players) {
        if (p.eliminated) continue
        const cx = GRID_X + p.cursorCol * CELL_W
        const cy = GRID_Y + p.cursorRow * CELL_H
        ctx.strokeStyle = p.color
        ctx.lineWidth = 2
        ctx.setLineDash([4, 3])
        ctx.strokeRect(cx - 1, cy - 1, CELL_W + 2, CELL_H + 2)
        ctx.setLineDash([])
        // Player icon
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(cx + 10, cy + 10, 5, 0, Math.PI * 2)
        ctx.fill()
      }

      // ── Market price chart ──
      ctx.fillStyle = '#0e0e1a'
      ctx.fillRect(CHART_X, CHART_Y, CHART_W, CHART_H)
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 1
      ctx.strokeRect(CHART_X, CHART_Y, CHART_W, CHART_H)

      const prices = st.priceHistory
      if (prices.length > 1) {
        const maxP = Math.max(...prices, 80)
        const minP = Math.min(...prices, 20)
        const range = maxP - minP || 1
        ctx.strokeStyle = '#f39c12'
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i < prices.length; i++) {
          const px = CHART_X + (i / (MAX_PRICE_HISTORY - 1)) * CHART_W
          const py = CHART_Y + CHART_H - ((prices[i] - minP) / range) * (CHART_H - 4) - 2
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.stroke()
      }

      // Chart label
      ctx.fillStyle = '#f39c12'
      ctx.font = 'bold 11px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`Oil: $${Math.round(st.marketPrice)}/bbl`, CHART_X + 4, CHART_Y + 12)

      // Timer
      const remain = Math.max(0, gameDuration - st.elapsed)
      const mins = Math.floor(remain / 60000)
      const secs = Math.floor((remain % 60000) / 1000)
      ctx.fillStyle = remain < 30000 ? '#e74c3c' : '#aaa'
      ctx.font = 'bold 14px monospace'
      ctx.textAlign = 'right'
      ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, CANVAS_W - 20, 25)

      // Title
      ctx.fillStyle = '#eee'
      ctx.font = 'bold 14px monospace'
      ctx.textAlign = 'left'
      ctx.fillText('OIL IMPERIUM', 20, 25)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [gameDuration])

  // ── Restart ──
  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, config)
    startTimeRef.current = Date.now()
    setGameOver(false)
    setWinner(null)
    setHud([])
    setTimeLeft(gameDuration)
  }, [players, config, gameDuration])

  // Keyboard restart
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (gameOver && (e.key === ' ' || e.key === 'Enter')) handleRestart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameOver, handleRestart])

  const formatTime = (ms: number) => {
    const m = Math.floor(ms / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className={styles.container}>
      {/* HUD Scoreboard */}
      <div className={styles.scoreboard}>
        {hud.map(p => (
          <div key={p.index} className={`${styles.scoreItem} ${p.eliminated ? styles.dead : ''}`}>
            <span className={styles.scoreColor} style={{ background: p.color }} />
            <span>{p.name}</span>
            <span className={styles.scoreValue}>
              ${p.money.toLocaleString()} | ⛽{Math.round(p.oilStored)} | 🪙{p.coins} 💎{p.gems} ⭐{p.stars}
            </span>
          </div>
        ))}
        <div style={{ color: '#aaa', fontSize: '0.85rem', marginLeft: '1rem' }}>
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      {/* Canvas */}
      <canvas ref={canvasRef} className={styles.canvas}  role="img" aria-label="Oil Imperium canvas"/>

      {/* Controls hint */}
      <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.5rem', textAlign: 'center' }}>
        Move: WASD/Arrows | Buy: Space/Enter | Build: E/Shift | Upgrade: Q/Ctrl
      </div>

      {isPaused && (
        <PauseMenu
          onResume={resume}
          onBack={onBack}
          players={players}
        />
      )}

      {/* Game Over overlay */}
      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && (
            <p className={styles.winnerText}>🏆 {winner} {t('miniGames.wins', 'wins')}!</p>
          )}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', margin: '0.5rem 0' }}>
            {hud.sort((a, b) => b.money - a.money).map(p => (
              <div key={p.index} style={{ color: p.color, fontWeight: 600 }}>
                {p.name}: ${p.money.toLocaleString()} — 🪙{p.coins} 💎{p.gems} ⭐{p.stars}
              </div>
            ))}
          </div>
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
