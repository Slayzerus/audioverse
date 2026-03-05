/**
 * IcyTowerGame — vertical platformer for 1-8 couch players.
 *
 * Controls:
 *   Keyboard group 0: A/D move, W jump
 *   Keyboard group 1: Left/Right move, Up jump
 *   Keyboard group 2: J/L move, I jump
 *   Keyboard group 3: Numpad 4/6 move, Numpad 8 jump
 *   Gamepad: left stick / D-pad move, A button jump
 *
 * Rules:
 *  - Jump between platforms that scroll upward.
 *  - Combo jumps (quick successive landings) give bigger jumps.
 *  - Wall-bouncing off canvas edges like original Icy Tower.
 *  - Power-ups: spring (super jump), magnet (pull toward platforms), shield (survive one fall).
 *  - Fall below screen bottom = game over.
 *  - Score = maximum height reached.
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
const GRAVITY = 0.45
const JUMP_VEL = -9
const MOVE_SPEED = 4.5
const PLAYER_SIZE = 16
const PLAT_H = 8
const BASE_PLAT_W = 100
const COMBO_WINDOW_MS = 600
const COMBO_BONUS = 1.35 // each combo multiplies jump
const WALL_BOUNCE = 0.7

// Power-up types
type PowerUpKind = 'spring' | 'magnet' | 'shield'
const POWERUP_COLORS: Record<PowerUpKind, string> = { spring: '#2ecc71', magnet: '#f1c40f', shield: '#3498db' }

// ─── Types ───────────────────────────────────────────────────
interface Platform {
  x: number; y: number; w: number
  powerUp?: PowerUpKind
}

interface Player {
  x: number; y: number; vx: number; vy: number
  onGround: boolean; alive: boolean
  combo: number; lastLandTime: number
  score: number; maxY: number
  color: string; name: string; index: number
  input: PlayerSlot['input']
  shield: boolean; magnetTimer: number
  coins: number; gems: number; stars: number
  bestFloor: number
}

interface GameState {
  players: Player[]
  platforms: Platform[]
  cameraY: number
  nextPlatY: number
  gameOver: boolean
  winner: string | null
  heightRecord: number
}

// keyboard maps
const KB_MOVE: Record<string, { group: number; dir: number }> = {
  a: { group: 0, dir: -1 }, d: { group: 0, dir: 1 },
  ArrowLeft: { group: 1, dir: -1 }, ArrowRight: { group: 1, dir: 1 },
  j: { group: 2, dir: -1 }, l: { group: 2, dir: 1 },
  '4': { group: 3, dir: -1 }, '6': { group: 3, dir: 1 },
}
const KB_JUMP: Record<string, number> = {
  w: 0, ' ': 0, ArrowUp: 1, i: 2, '8': 3,
}

// ─── Helpers ─────────────────────────────────────────────────
function generatePlatforms(fromY: number, toY: number, existing: Platform[], difficulty: string): Platform[] {
  const gap = difficulty === 'dense' ? 40 : difficulty === 'sparse' ? 80 : 55
  const plats = [...existing]
  let y = fromY
  while (y > toY) {
    const heightFactor = Math.max(0.5, 1 - Math.abs(y) / 15000)
    const w = BASE_PLAT_W * heightFactor + Math.random() * 30
    const x = Math.random() * (W - w)
    const powerUp: PowerUpKind | undefined = Math.random() < 0.08
      ? (['spring', 'magnet', 'shield'] as PowerUpKind[])[Math.floor(Math.random() * 3)]
      : undefined
    plats.push({ x, y, w, powerUp })
    y -= gap + Math.random() * 25
  }
  return plats
}

function initState(players: PlayerSlot[], density: string): GameState {
  const startPlats: Platform[] = [{ x: W / 2 - 60, y: H - 40, w: 120 }]
  const platforms = generatePlatforms(H - 80, -200, startPlats, density)
  const ps: Player[] = players.map((p, i) => ({
    x: W / 2 - PLAYER_SIZE / 2 + (i - players.length / 2) * 24,
    y: H - 40 - PLAYER_SIZE,
    vx: 0, vy: 0,
    onGround: true, alive: true,
    combo: 0, lastLandTime: 0,
    score: 0, maxY: 0,
    color: p.color || PLAYER_COLORS[p.index] || '#fff',
    name: p.name, index: p.index,
    input: p.input,
    shield: false, magnetTimer: 0,
    coins: 0, gems: 0, stars: 0, bestFloor: 0,
  }))
  return { players: ps, platforms, cameraY: 0, nextPlatY: -200, gameOver: false, winner: null, heightRecord: 0 }
}

// ─── Component ───────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function IcyTowerGame({ players, config, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const density = (config?.platformDensity as string) ?? 'normal'
  const gravMul = config?.gravity === 'low' ? 0.7 : config?.gravity === 'high' ? 1.3 : 1
  const stateRef = useRef<GameState>(initState(players, density))
  const keysRef = useRef<Set<string>>(new Set())
  const [scores, setScores] = useState<{ index: number; name: string; score: number; alive: boolean; color: string; coins: number; gems: number; stars: number }[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const pads = useGamepads()
  const padsRef = useRef(pads); padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => keysRef.current.add(e.key)
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  // Game loop
  useEffect(() => {
    let raf = 0
    let lastTime = performance.now()

    function loop(now: number) {
      raf = requestAnimationFrame(loop)
      if (pauseRef.current) { lastTime = now; return }
      const dt = Math.min((now - lastTime) / 16.67, 3) // normalize to ~60fps
      lastTime = now
      const st = stateRef.current
      if (st.gameOver) return

      const keys = keysRef.current
      const currentPads = padsRef.current

      for (const p of st.players) {
        if (!p.alive) continue

        // Input
        let moveDir = 0
        let jumpPressed = false
        if (p.input.type === 'keyboard') {
          for (const [key, val] of Object.entries(KB_MOVE)) {
            if (val.group === p.input.group && keys.has(key)) moveDir = val.dir
          }
          for (const [key, grp] of Object.entries(KB_JUMP)) {
            if (grp === p.input.group && keys.has(key)) jumpPressed = true
          }
        } else if (p.input.type === 'gamepad') {
          const gp = currentPads.find(g => g.index === (p.input as { type: 'gamepad'; padIndex: number }).padIndex)
          if (gp) {
            if (gp.left) moveDir = -1
            if (gp.right) moveDir = 1
            if (gp.a) jumpPressed = true
          }
        }

        // Movement
        p.vx = moveDir * MOVE_SPEED * dt
        p.vy += GRAVITY * gravMul * dt

        // Magnet: pull toward nearest platform above
        if (p.magnetTimer > 0) {
          p.magnetTimer -= dt
          let nearest: Platform | null = null; let bestDist = Infinity
          for (const pl of st.platforms) {
            const py = pl.y + st.cameraY
            if (py < p.y && py > p.y - 120) {
              const cx = pl.x + pl.w / 2
              const dist = Math.abs(cx - (p.x + PLAYER_SIZE / 2))
              if (dist < bestDist) { bestDist = dist; nearest = pl }
            }
          }
          if (nearest) {
            const cx = nearest.x + nearest.w / 2
            p.vx += (cx - (p.x + PLAYER_SIZE / 2)) * 0.03 * dt
          }
        }

        p.x += p.vx
        p.y += p.vy * dt

        // Wall bounce
        if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx) * WALL_BOUNCE }
        if (p.x + PLAYER_SIZE > W) { p.x = W - PLAYER_SIZE; p.vx = -Math.abs(p.vx) * WALL_BOUNCE }

        // Platform collision (only when falling)
        p.onGround = false
        if (p.vy >= 0) {
          for (const pl of st.platforms) {
            const platScreenY = pl.y + st.cameraY
            if (
              p.x + PLAYER_SIZE > pl.x && p.x < pl.x + pl.w &&
              p.y + PLAYER_SIZE >= platScreenY && p.y + PLAYER_SIZE <= platScreenY + PLAT_H + p.vy * dt + 2
            ) {
              p.y = platScreenY - PLAYER_SIZE
              p.vy = 0
              p.onGround = true

              // Combo
              const timeSinceLand = now - p.lastLandTime
              if (timeSinceLand < COMBO_WINDOW_MS) {
                p.combo++
              } else {
                p.combo = 0
              }
              p.lastLandTime = now

              // Award gems for combo achievements
              if (p.combo === 3) p.gems++
              if (p.combo === 5) p.gems += 2
              if (p.combo === 10) p.gems += 5

              // Collect power-up
              if (pl.powerUp) {
                if (pl.powerUp === 'spring') p.vy = JUMP_VEL * 2
                if (pl.powerUp === 'magnet') p.magnetTimer = 300
                if (pl.powerUp === 'shield') p.shield = true
                pl.powerUp = undefined
              }
              break
            }
          }
        }

        // Jump
        if (jumpPressed && p.onGround) {
          const comboMul = Math.pow(COMBO_BONUS, Math.min(p.combo, 8))
          p.vy = JUMP_VEL * comboMul
          p.onGround = false
        }

        // Height score
        const height = Math.floor(-p.y + H)
        if (height > p.score) {
          // Coin milestones
          const oldHundreds = Math.floor(p.score / 100)
          const newHundreds = Math.floor(height / 100)
          if (newHundreds > oldHundreds) p.coins += (newHundreds - oldHundreds)
          // Floor records (stars)
          const floor = Math.floor(height / 500)
          if (floor > p.bestFloor) { p.stars += (floor - p.bestFloor); p.bestFloor = floor }
          p.score = height
          p.maxY = Math.min(p.maxY, p.y)
        }

        // Fell below screen
        if (p.y > -st.cameraY + H + 50) {
          if (p.shield) {
            p.shield = false
            p.vy = JUMP_VEL * 1.5
          } else {
            p.alive = false
          }
        }
      }

      // Camera follows highest alive player
      const alivePs = st.players.filter(p => p.alive)
      if (alivePs.length > 0) {
        const highestY = Math.min(...alivePs.map(p => p.y))
        const targetCam = -(highestY - H * 0.4)
        st.cameraY += (targetCam - st.cameraY) * 0.08 * dt
      }

      // Generate more platforms above
      const topEdge = -st.cameraY - 200
      if (topEdge < st.nextPlatY) {
        st.platforms = generatePlatforms(st.nextPlatY, st.nextPlatY - 600, st.platforms, density)
        st.nextPlatY -= 600
      }

      // Remove platforms far below
      const bottomEdge = -st.cameraY + H + 200
      st.platforms = st.platforms.filter(pl => pl.y + st.cameraY < bottomEdge + 100)

      // Game over check
      const alive = st.players.filter(p => p.alive)
      if (alive.length === 0) {
        st.gameOver = true
        const best = st.players.reduce((a, b) => a.score > b.score ? a : b)
        st.winner = best.name
        st.heightRecord = best.score
      } else if (st.players.length > 1 && alive.length <= 1) {
        st.gameOver = true
        st.winner = alive[0]?.name ?? null
        st.heightRecord = Math.max(...st.players.map(p => p.score))
      }

      setScores(st.players.map(p => ({
        index: p.index, name: p.name, score: p.score, alive: p.alive,
        color: p.color, coins: p.coins, gems: p.gems, stars: p.stars,
      })))

      if (st.gameOver) {
        setGameOver(true)
        setWinner(st.winner)
      }

      // ─── Draw ────────────────────────
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      canvas.width = W; canvas.height = H

      // Sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, H)
      grad.addColorStop(0, '#0a0a2e')
      grad.addColorStop(1, '#1a1a3e')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)

      // Height indicator
      const heightNow = Math.max(...st.players.map(p => p.score))
      ctx.fillStyle = '#556'
      ctx.font = '14px monospace'
      ctx.fillText(`Height: ${heightNow}`, 10, 20)

      // Platforms
      for (const pl of st.platforms) {
        const sy = pl.y + st.cameraY
        if (sy < -20 || sy > H + 20) continue
        ctx.fillStyle = '#667'
        ctx.fillRect(pl.x, sy, pl.w, PLAT_H)
        ctx.fillStyle = '#889'
        ctx.fillRect(pl.x, sy, pl.w, 2)
        if (pl.powerUp) {
          ctx.fillStyle = POWERUP_COLORS[pl.powerUp]
          ctx.fillRect(pl.x + pl.w / 2 - 5, sy - 10, 10, 10)
        }
      }

      // Players
      for (const p of st.players) {
        if (!p.alive) continue
        ctx.fillStyle = p.color
        ctx.fillRect(p.x, p.y, PLAYER_SIZE, PLAYER_SIZE)
        // Eyes
        ctx.fillStyle = '#000'
        ctx.fillRect(p.x + 3, p.y + 4, 3, 3)
        ctx.fillRect(p.x + PLAYER_SIZE - 6, p.y + 4, 3, 3)
        // Shield glow
        if (p.shield) {
          ctx.strokeStyle = '#3498db'
          ctx.lineWidth = 2
          ctx.strokeRect(p.x - 2, p.y - 2, PLAYER_SIZE + 4, PLAYER_SIZE + 4)
        }
        // Combo indicator
        if (p.combo > 0) {
          ctx.fillStyle = '#f1c40f'
          ctx.font = 'bold 11px sans-serif'
          ctx.fillText(`${p.combo}x`, p.x, p.y - 4)
        }
      }
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [density, gravMul, players])

  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, density)
    setGameOver(false); setWinner(null); setScores([])
  }, [players, density])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gameOver && (e.key === ' ' || e.key === 'Enter')) handleRestart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameOver, handleRestart])

  return (
    <div className={styles.container}>
      <div className={styles.scoreboard}>
        {scores.map(s => (
          <div key={s.index} className={`${styles.scoreItem} ${!s.alive ? styles.dead : ''}`}>
            <span className={styles.scoreColor} style={{ background: s.color }} />
            <span>{s.name}</span>
            <span className={styles.scoreValue}>{s.score}</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>🪙{s.coins} 💎{s.gems} ⭐{s.stars}</span>
          </div>
        ))}
      </div>
      <canvas ref={canvasRef} className={styles.canvas}  role="img" aria-label="Icy Tower canvas"/>
      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}
      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && <p className={styles.winnerText}>🏆 {winner} {t('miniGames.wins', 'wins')}!</p>}
          {!winner && scores.length === 1 && (
            <p className={styles.winnerText}>{t('miniGames.finalScore', 'Score')}: {scores[0]?.score ?? 0}</p>
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
