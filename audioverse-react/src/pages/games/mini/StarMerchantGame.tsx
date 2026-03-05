/**
 * StarMerchantGame — space trading game for 1-8 players.
 *
 * Controls (per keyboard group):
 *   Group 0: WASD move ship, Space interact/trade
 *   Group 1: Arrows move ship, Enter interact/trade
 *   Group 2: IJKL move ship
 *   Group 3: Numpad 8/4/5/6 move ship
 * Gamepads: D-pad/left stick move, A interact, B cancel.
 *
 * Rules:
 *  - Top-down galaxy map with 8-12 planets (colored circles).
 *  - Player ship (colored triangle 10px) moves freely.
 *  - Each planet buys/sells commodities at fluctuating prices.
 *  - Cargo hold: 20 units max. Fuel costs per distance traveled.
 *  - Pirates (red triangles) patrol and attack.
 *  - Timed: accumulate most wealth in 5 minutes.
 *  - VS: separate tracking, compete for wealth. Coop: combined wealth target.
 *  - Currencies: coins (profit), gems (rare trade bonuses), stars (routes completed).
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
const W = 800
const H = 600
const SHIP_SIZE = 10
const SHIP_SPEED = 2.5
const PIRATE_SPEED = 1.2
const PIRATE_ATK_RANGE = 30
const CARGO_MAX = 20
const FUEL_MAX = 100
const FUEL_COST_PER_FRAME = 0.012
const PRICE_FLUCT_INTERVAL = 900 // frames ~15s at 60fps
const GAME_DURATION = 5 * 60 * 60 // 5 minutes at 60fps
const PLANET_LAND_DIST = 28
const PLANET_NAMES = ['Terra', 'Nyx', 'Kryon', 'Vega', 'Solaris', 'Dune', 'Helios', 'Aqua', 'Ferros', 'Glacius', 'Lumen', 'Zephyr']
const COMMODITIES = ['Food', 'Ore', 'Tech', 'Luxury', 'Medicine'] as const
type Commodity = typeof COMMODITIES[number]

// ─── Keyboard mappings ──────────────────────────────────────
type Action = 'up' | 'down' | 'left' | 'right' | 'interact'
const KEY_MAP = new Map<string, { group: number; action: Action }>()
;([ ['w',0,'up'],['s',0,'down'],['a',0,'left'],['d',0,'right'],[' ',0,'interact'] ] as const)
  .forEach(([k,g,a]) => KEY_MAP.set(k, { group: g, action: a }))
;([ ['ArrowUp',1,'up'],['ArrowDown',1,'down'],['ArrowLeft',1,'left'],['ArrowRight',1,'right'],['Enter',1,'interact'] ] as const)
  .forEach(([k,g,a]) => KEY_MAP.set(k, { group: g, action: a }))
;([ ['i',2,'up'],['k',2,'down'],['j',2,'left'],['l',2,'right'] ] as const)
  .forEach(([k,g,a]) => KEY_MAP.set(k, { group: g, action: a }))
;([ ['8',3,'up'],['5',3,'down'],['4',3,'left'],['6',3,'right'] ] as const)
  .forEach(([k,g,a]) => KEY_MAP.set(k, { group: g, action: a }))

// ─── Types ───────────────────────────────────────────────────
interface Planet {
  x: number; y: number; r: number; name: string; color: string
  prices: Record<Commodity, number>
  supply: Record<Commodity, number>
}

interface Pirate { x: number; y: number; angle: number; hp: number; target: number }

interface Merchant {
  x: number; y: number; angle: number
  fuel: number; coins: number; gems: number; stars: number
  cargo: { commodity: Commodity; qty: number }[]
  alive: boolean; hp: number
  color: string; name: string; playerIndex: number; input: PlayerSlot['input']
  routesCompleted: number; lastPlanet: number
  trading: boolean; tradePlanet: number
}

interface GameState {
  merchants: Merchant[]
  planets: Planet[]
  pirates: Pirate[]
  frame: number
  timer: number
  gameOver: boolean
  winner: number | null
}

// ─── Helpers ─────────────────────────────────────────────────
function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)
}

function randomPrices(): Record<Commodity, number> {
  const p = {} as Record<Commodity, number>
  for (const c of COMMODITIES) p[c] = Math.floor(Math.random() * 40) + 10
  return p
}

function randomSupply(): Record<Commodity, number> {
  const s = {} as Record<Commodity, number>
  for (const c of COMMODITIES) s[c] = Math.floor(Math.random() * 15) + 5
  return s
}

function initState(players: PlayerSlot[], planetCount: number, pirateFreq: string): GameState {
  const planets: Planet[] = []
  for (let i = 0; i < planetCount; i++) {
    planets.push({
      x: 60 + Math.random() * (W - 120),
      y: 60 + Math.random() * (H - 120),
      r: 15 + Math.random() * 10,
      name: PLANET_NAMES[i % PLANET_NAMES.length],
      color: ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#ecf0f1','#d35400','#c0392b','#27ae60','#2980b9'][i % 12],
      prices: randomPrices(),
      supply: randomSupply(),
    })
  }
  const merchants: Merchant[] = players.map((p, i) => ({
    x: planets[i % planets.length].x + 40,
    y: planets[i % planets.length].y + 40,
    angle: 0, fuel: FUEL_MAX, coins: 50, gems: 0, stars: 0,
    cargo: [], alive: true, hp: 3,
    color: p.color || PLAYER_COLORS[p.index] || '#fff',
    name: p.name, playerIndex: p.index, input: p.input,
    routesCompleted: 0, lastPlanet: i % planets.length,
    trading: false, tradePlanet: -1,
  }))
  const pirateCount = pirateFreq === 'none' ? 0 : pirateFreq === 'few' ? 2 : 5
  const pirates: Pirate[] = []
  for (let i = 0; i < pirateCount; i++) {
    pirates.push({ x: Math.random() * W, y: Math.random() * H, angle: Math.random() * Math.PI * 2, hp: 2, target: 0 })
  }
  return { merchants, planets, pirates, frame: 0, timer: GAME_DURATION, gameOver: false, winner: null }
}

function cargoTotal(m: Merchant): number {
  return m.cargo.reduce((s, c) => s + c.qty, 0)
}

function wealth(m: Merchant, planets: Planet[]): number {
  let w = m.coins
  for (const c of m.cargo) {
    const avgPrice = planets.reduce((s, p) => s + p.prices[c.commodity], 0) / planets.length
    w += c.qty * avgPrice
  }
  return Math.floor(w)
}

// ─── Component ───────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function StarMerchantGame({ players, config, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const planetCount = config?.planetCount ?? 8
  const pirateFreq = config?.pirateFrequency ?? 'few'
  const stateRef = useRef<GameState>(initState(players, planetCount, pirateFreq))
  const keysDown = useRef(new Set<string>())
  const [scores, setScores] = useState<{ idx: number; name: string; wealth: number; coins: number; gems: number; stars: number; alive: boolean; color: string }[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [_timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // ─── Keyboard ───────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => keysDown.current.add(e.key)
    const up = (e: KeyboardEvent) => keysDown.current.delete(e.key)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  // ─── Trade interaction (edge-triggered) ─────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const m = KEY_MAP.get(e.key)
      if (!m || m.action !== 'interact') return
      const st = stateRef.current
      for (const mer of st.merchants) {
        if (!mer.alive || mer.input.type !== 'keyboard' || mer.input.group !== m.group) continue
        if (mer.trading) {
          // Buy one unit of cheapest commodity
          const pl = st.planets[mer.tradePlanet]
          if (!pl) continue
          const affordable = COMMODITIES.filter(c => pl.prices[c] <= mer.coins && pl.supply[c] > 0)
          if (affordable.length > 0 && cargoTotal(mer) < CARGO_MAX) {
            const best = affordable.sort((a, b) => pl.prices[a] - pl.prices[b])[0]
            mer.coins -= pl.prices[best]
            pl.supply[best]--
            const existing = mer.cargo.find(c => c.commodity === best)
            if (existing) existing.qty++
            else mer.cargo.push({ commodity: best, qty: 1 })
          }
        } else {
          // Try to land on a planet
          for (let i = 0; i < st.planets.length; i++) {
            const pl = st.planets[i]
            if (dist(mer.x, mer.y, pl.x, pl.y) < PLANET_LAND_DIST) {
              // Sell all cargo first
              for (const c of mer.cargo) {
                mer.coins += c.qty * pl.prices[c.commodity]
                if (c.qty * pl.prices[c.commodity] > 50) mer.gems++
              }
              if (mer.cargo.length > 0 && i !== mer.lastPlanet) {
                mer.routesCompleted++
                mer.stars++
              }
              mer.cargo = []
              mer.lastPlanet = i
              mer.fuel = Math.min(FUEL_MAX, mer.fuel + 30)
              mer.trading = true
              mer.tradePlanet = i
              break
            }
          }
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ─── Game loop ──────────────────────────────────────────
  useEffect(() => {
    let raf = 0

    function tick() {
      if (pauseRef.current) { raf = requestAnimationFrame(tick); return }
      const st = stateRef.current
      if (st.gameOver) return
      st.frame++
      st.timer--
      setTimeLeft(st.timer)

      // Price fluctuation
      if (st.frame % PRICE_FLUCT_INTERVAL === 0) {
        for (const pl of st.planets) {
          for (const c of COMMODITIES) {
            pl.prices[c] = Math.max(5, pl.prices[c] + Math.floor(Math.random() * 21) - 10)
            pl.supply[c] = Math.max(0, pl.supply[c] + Math.floor(Math.random() * 5) - 1)
          }
        }
      }

      // Move merchants
      for (const mer of st.merchants) {
        if (!mer.alive) continue
        let dx = 0, dy = 0
        if (mer.input.type === 'keyboard') {
          const grp = mer.input.group
          for (const [key, m] of KEY_MAP) {
            if (m.group !== grp || !keysDown.current.has(key)) continue
            if (m.action === 'up') dy -= 1
            if (m.action === 'down') dy += 1
            if (m.action === 'left') dx -= 1
            if (m.action === 'right') dx += 1
          }
        } else if (mer.input.type === 'gamepad') {
          const gp = padsRef.current.find(p => p.index === (mer.input as { type: 'gamepad'; padIndex: number }).padIndex)
          if (gp) {
            if (gp.up) dy -= 1
            if (gp.down) dy += 1
            if (gp.left) dx -= 1
            if (gp.right) dx += 1
            // Gamepad interact (edge triggered by checking trading toggle)
            if (gp.a && !mer.trading) {
              for (let i = 0; i < st.planets.length; i++) {
                const pl = st.planets[i]
                if (dist(mer.x, mer.y, pl.x, pl.y) < PLANET_LAND_DIST) {
                  for (const c of mer.cargo) {
                    mer.coins += c.qty * pl.prices[c.commodity]
                    if (c.qty * pl.prices[c.commodity] > 50) mer.gems++
                  }
                  if (mer.cargo.length > 0 && i !== mer.lastPlanet) { mer.routesCompleted++; mer.stars++ }
                  mer.cargo = []
                  mer.lastPlanet = i
                  mer.fuel = Math.min(FUEL_MAX, mer.fuel + 30)
                  mer.trading = true
                  mer.tradePlanet = i
                  break
                }
              }
            }
            if (gp.a && mer.trading && cargoTotal(mer) < CARGO_MAX) {
              const pl = st.planets[mer.tradePlanet]
              if (pl) {
                const affordable = COMMODITIES.filter(c => pl.prices[c] <= mer.coins && pl.supply[c] > 0)
                if (affordable.length > 0) {
                  const best = affordable.sort((a, b) => pl.prices[a] - pl.prices[b])[0]
                  mer.coins -= pl.prices[best]
                  pl.supply[best]--
                  const existing = mer.cargo.find(c => c.commodity === best)
                  if (existing) existing.qty++
                  else mer.cargo.push({ commodity: best, qty: 1 })
                }
              }
            }
          }
        }
        if (dx !== 0 || dy !== 0) {
          const len = Math.sqrt(dx * dx + dy * dy)
          mer.x += (dx / len) * SHIP_SPEED
          mer.y += (dy / len) * SHIP_SPEED
          mer.angle = Math.atan2(dy, dx)
          mer.fuel -= FUEL_COST_PER_FRAME
          mer.trading = false
          if (mer.fuel <= 0) { mer.fuel = 0; mer.alive = false }
        }
        mer.x = Math.max(0, Math.min(W, mer.x))
        mer.y = Math.max(0, Math.min(H, mer.y))
      }

      // Pirates
      for (const pir of st.pirates) {
        if (pir.hp <= 0) continue
        const target = st.merchants.filter(m => m.alive)[pir.target % Math.max(1, st.merchants.filter(m => m.alive).length)]
        if (target) {
          const a = Math.atan2(target.y - pir.y, target.x - pir.x)
          pir.x += Math.cos(a) * PIRATE_SPEED
          pir.y += Math.sin(a) * PIRATE_SPEED
          pir.angle = a
          if (dist(pir.x, pir.y, target.x, target.y) < PIRATE_ATK_RANGE) {
            target.hp--
            pir.x -= Math.cos(a) * 40
            pir.y -= Math.sin(a) * 40
            if (target.hp <= 0) target.alive = false
          }
        }
        // Wrap
        if (pir.x < -20) pir.x = W + 10
        if (pir.x > W + 20) pir.x = -10
        if (pir.y < -20) pir.y = H + 10
        if (pir.y > H + 20) pir.y = -10
      }

      // Auto-shoot: merchants shoot at nearby pirates
      for (const mer of st.merchants) {
        if (!mer.alive) continue
        for (const pir of st.pirates) {
          if (pir.hp <= 0) continue
          if (dist(mer.x, mer.y, pir.x, pir.y) < 60 && st.frame % 30 === 0) {
            pir.hp--
          }
        }
      }

      // Timer / game over
      if (st.timer <= 0 || st.merchants.every(m => !m.alive)) {
        st.gameOver = true
        const sorted = [...st.merchants].sort((a, b) => wealth(b, st.planets) - wealth(a, st.planets))
        st.winner = sorted[0]?.playerIndex ?? null
      }

      setScores(st.merchants.map(m => ({
        idx: m.playerIndex, name: m.name, wealth: wealth(m, st.planets),
        coins: m.coins, gems: m.gems, stars: m.stars, alive: m.alive, color: m.color,
      })))

      if (st.gameOver) {
        setGameOver(true)
        const w = st.merchants.find(m => m.playerIndex === st.winner)
        setWinner(w?.name ?? null)
        return
      }

      // ─── Draw ────────────────────────────────────────────
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(tick); return }
      const ctx = canvas.getContext('2d')!
      canvas.width = W; canvas.height = H

      // Starfield background
      ctx.fillStyle = '#050510'
      ctx.fillRect(0, 0, W, H)
      // Stars (deterministic from frame seed)
      ctx.fillStyle = '#fff'
      for (let i = 0; i < 120; i++) {
        const sx = ((i * 7919 + 31) % W)
        const sy = ((i * 6271 + 17) % H)
        const brightness = ((i * 3 + st.frame) % 100) / 100
        ctx.globalAlpha = 0.3 + brightness * 0.5
        ctx.fillRect(sx, sy, 1.5, 1.5)
      }
      ctx.globalAlpha = 1

      // Planets
      for (const pl of st.planets) {
        ctx.fillStyle = pl.color
        ctx.beginPath(); ctx.arc(pl.x, pl.y, pl.r, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(pl.name, pl.x, pl.y + pl.r + 12)
      }

      // Pirates
      for (const pir of st.pirates) {
        if (pir.hp <= 0) continue
        ctx.save()
        ctx.translate(pir.x, pir.y)
        ctx.rotate(pir.angle)
        ctx.fillStyle = '#e74c3c'
        ctx.beginPath()
        ctx.moveTo(8, 0)
        ctx.lineTo(-6, -5)
        ctx.lineTo(-6, 5)
        ctx.closePath(); ctx.fill()
        ctx.restore()
      }

      // Player ships
      for (const mer of st.merchants) {
        ctx.globalAlpha = mer.alive ? 1 : 0.2
        ctx.save()
        ctx.translate(mer.x, mer.y)
        ctx.rotate(mer.angle)
        ctx.fillStyle = mer.color
        ctx.beginPath()
        ctx.moveTo(SHIP_SIZE, 0)
        ctx.lineTo(-SHIP_SIZE * 0.6, -SHIP_SIZE * 0.5)
        ctx.lineTo(-SHIP_SIZE * 0.6, SHIP_SIZE * 0.5)
        ctx.closePath(); ctx.fill()
        ctx.restore()
        ctx.globalAlpha = 1
        // Fuel bar
        if (mer.alive) {
          ctx.fillStyle = '#333'
          ctx.fillRect(mer.x - 12, mer.y + 12, 24, 3)
          ctx.fillStyle = mer.fuel > 25 ? '#2ecc71' : '#e74c3c'
          ctx.fillRect(mer.x - 12, mer.y + 12, 24 * (mer.fuel / FUEL_MAX), 3)
        }
        // Trading indicator
        if (mer.trading) {
          ctx.fillStyle = '#f1c40f'
          ctx.font = 'bold 9px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('TRADE', mer.x, mer.y - 12)
        }
      }

      // Timer HUD
      const secs = Math.max(0, Math.ceil(st.timer / 60))
      const min = Math.floor(secs / 60)
      const sec = secs % 60
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 16px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`${min}:${sec.toString().padStart(2, '0')}`, W - 10, 20)

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ─── Restart ───────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, planetCount, pirateFreq)
    setGameOver(false)
    setWinner(null)
    setScores([])
    setTimeLeft(GAME_DURATION)
  }, [players, planetCount, pirateFreq])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (gameOver && (e.key === ' ' || e.key === 'Enter')) handleRestart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameOver, handleRestart])

  return (
    <div className={styles.container}>
      <div className={styles.scoreboard}>
        {scores.map(s => (
          <div key={s.idx} className={`${styles.scoreItem} ${!s.alive ? styles.dead : ''}`}>
            <span className={styles.scoreColor} style={{ background: s.color }} />
            <span>{s.name}</span>
            <span className={styles.scoreValue}>${s.wealth}</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>🪙{s.coins} 💎{s.gems} ⭐{s.stars}</span>
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className={styles.canvas}  role="img" aria-label="Star Merchant canvas"/>

      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && <p className={styles.winnerText}>🏆 {winner} {t('miniGames.wins', 'wins')}!</p>}
          {!winner && scores.length === 1 && (
            <p className={styles.winnerText}>
              {t('miniGames.finalScore', 'Score')}: ${scores[0]?.wealth ?? 0}
            </p>
          )}
          <div className={styles.overlayActions}>
            <button className={styles.restartBtn} onClick={handleRestart}>{t('miniGames.playAgain', 'Play Again')}</button>
            <button className={styles.backBtnOverlay} onClick={onBack}>{t('miniGames.backToMenu', 'Back to Menu')}</button>
          </div>
          <p className={styles.overlayHint}>{t('miniGames.pressRestart', 'Press Space or Enter to restart')}</p>
        </div>
      )}
    </div>
  )
}
