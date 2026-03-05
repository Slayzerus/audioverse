/**
 * BreakoutGame — Co-op brick breaker for 1-4 players.
 * Each player gets a paddle at the bottom region. Ball bounces, break all bricks.
 * Ball falls past all paddles → lose a life (shared 5 lives). Clear all bricks → next level.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PLAYER_COLORS, type GameConfig, PlayerSlot } from './types'
import { useGamepads } from './useGamepads'
import { KEY_LOOKUP, gamepadDir } from './inputMaps'
import { usePause } from './usePause'
import PauseMenu from './PauseMenu'
import css from './SharedGame.module.css'
import { useGameFocusLock } from '../../../hooks/useGameFocusLock'

const W = 640, H = 480
const PADDLE_W = 80, PADDLE_H = 10, PADDLE_SPEED = 5
const BALL_R = 5, BALL_SPEED = 4
const BRICK_ROWS = 5, BRICK_COLS = 10, BRICK_W = W / BRICK_COLS, BRICK_H = 18
const BRICK_GAP = 2
const BRICK_COLORS = ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db']

interface Paddle { x: number; y: number; color: string; playerIndex: number; name: string; input: PlayerSlot['input'] }
interface Ball { x: number; y: number; vx: number; vy: number }
interface Brick { x: number; y: number; w: number; h: number; color: string; alive: boolean }

function makeBricks(): Brick[] {
  const bricks: Brick[] = []
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      bricks.push({ x: c * BRICK_W + BRICK_GAP, y: r * BRICK_H + 40 + BRICK_GAP, w: BRICK_W - BRICK_GAP * 2, h: BRICK_H - BRICK_GAP * 2, color: BRICK_COLORS[r], alive: true })
    }
  }
  return bricks
}

function makePaddles(players: PlayerSlot[]): Paddle[] {
  const totalW = players.length * PADDLE_W + (players.length - 1) * 20
  const startX = (W - totalW) / 2
  return players.map((p, i) => ({
    x: startX + i * (PADDLE_W + 20), y: H - 40,
    color: p.color || PLAYER_COLORS[p.index] || '#fff', playerIndex: p.index, name: p.name, input: p.input
  }))
}

interface Props { players: PlayerSlot[]; config?: GameConfig; onBack: () => void }

export default function BreakoutGame({ players, config: _config, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paddlesRef = useRef<Paddle[]>(makePaddles(players))
  const ballRef = useRef<Ball>({ x: W / 2, y: H / 2, vx: BALL_SPEED * 0.7, vy: BALL_SPEED })
  const bricksRef = useRef<Brick[]>(makeBricks())
  const livesRef = useRef(5)
  const levelRef = useRef(1)
  const scoreRef = useRef(0)
  const [gameOver, setGameOver] = useState(false)
  const [, forceUpdate] = useState(0)
  const pads = useGamepads(); const padsRef = useRef(pads); padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // Input
  useEffect(() => {
    const pressed = new Set<string>()
    const kd = (e: KeyboardEvent) => pressed.add(e.key)
    const ku = (e: KeyboardEvent) => pressed.delete(e.key)
    let raf = 0
    const poll = () => {
      for (const p of paddlesRef.current) {
        if (p.input.type === 'keyboard') {
          const g = (p.input as {type:'keyboard';group:number}).group
          let dx = 0
          for (const [key, m] of KEY_LOOKUP) {
            if (m.group === g && pressed.has(key)) dx += m.dir.dx
          }
          p.x += dx * PADDLE_SPEED
        } else {
          const gp = padsRef.current.find(g => g.index === (p.input as {type:'gamepad';padIndex:number}).padIndex)
          if (gp) { const d = gamepadDir(gp); if (d) p.x += d.dx * PADDLE_SPEED }
        }
        p.x = Math.max(0, Math.min(W - PADDLE_W, p.x))
      }
      raf = requestAnimationFrame(poll)
    }
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku)
    raf = requestAnimationFrame(poll)
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); cancelAnimationFrame(raf) }
  }, [])

  // Game loop
  useEffect(() => {
    let raf = 0
    const loop = () => {
      if (pauseRef.current) { raf = requestAnimationFrame(loop); return }
      const ball = ballRef.current; const paddles = paddlesRef.current; const bricks = bricksRef.current

      // Move ball
      ball.x += ball.vx; ball.y += ball.vy

      // Wall bounces
      if (ball.x < BALL_R || ball.x > W - BALL_R) ball.vx *= -1
      if (ball.y < BALL_R) ball.vy *= -1

      // Bottom → lose life
      if (ball.y > H + BALL_R) {
        livesRef.current--
        if (livesRef.current <= 0) { setGameOver(true); forceUpdate(x => x + 1); return }
        ball.x = W / 2; ball.y = H / 2; ball.vx = BALL_SPEED * 0.7 * (Math.random() > 0.5 ? 1 : -1); ball.vy = BALL_SPEED
      }

      // Paddle collision
      for (const p of paddles) {
        if (ball.y + BALL_R >= p.y && ball.y - BALL_R <= p.y + PADDLE_H && ball.x >= p.x && ball.x <= p.x + PADDLE_W && ball.vy > 0) {
          ball.vy *= -1
          const hitPos = (ball.x - p.x) / PADDLE_W - 0.5 // -0.5 to 0.5
          ball.vx = hitPos * BALL_SPEED * 2
          ball.y = p.y - BALL_R
        }
      }

      // Brick collision
      for (const b of bricks) {
        if (!b.alive) continue
        if (ball.x + BALL_R > b.x && ball.x - BALL_R < b.x + b.w && ball.y + BALL_R > b.y && ball.y - BALL_R < b.y + b.h) {
          b.alive = false; scoreRef.current += 10
          // Determine bounce direction
          const overlapLeft = ball.x + BALL_R - b.x; const overlapRight = b.x + b.w - (ball.x - BALL_R)
          const overlapTop = ball.y + BALL_R - b.y; const overlapBottom = b.y + b.h - (ball.y - BALL_R)
          const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom)
          if (minOverlap === overlapTop || minOverlap === overlapBottom) ball.vy *= -1
          else ball.vx *= -1
          break
        }
      }

      // Level clear
      if (bricks.every(b => !b.alive)) {
        levelRef.current++
        bricksRef.current = makeBricks()
        const speed = BALL_SPEED + levelRef.current * 0.5
        ball.x = W / 2; ball.y = H / 2; ball.vx = speed * 0.7; ball.vy = speed
      }

      forceUpdate(x => x + 1)

      // Draw
      const c = canvasRef.current; if (!c) { raf = requestAnimationFrame(loop); return }
      const ctx = c.getContext('2d'); if (!ctx) { raf = requestAnimationFrame(loop); return }
      c.width = W; c.height = H
      ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H)

      // HUD
      ctx.fillStyle = '#aaa'; ctx.font = '14px monospace'; ctx.textAlign = 'left'
      ctx.fillText(`Score: ${scoreRef.current}  Level: ${levelRef.current}  Lives: ${'❤️'.repeat(livesRef.current)}`, 10, 20)

      // Bricks
      for (const b of bricksRef.current) {
        if (!b.alive) continue
        ctx.fillStyle = b.color; ctx.fillRect(b.x, b.y, b.w, b.h)
        ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.strokeRect(b.x, b.y, b.w, b.h)
      }

      // Paddles
      for (const p of paddles) {
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.roundRect(p.x, p.y, PADDLE_W, PADDLE_H, 4)
        ctx.fill()
        ctx.fillStyle = '#000'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(p.name, p.x + PADDLE_W / 2, p.y + 8)
      }

      // Ball
      ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'; ctx.fill()

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const restart = useCallback(() => {
    paddlesRef.current = makePaddles(players)
    ballRef.current = { x: W / 2, y: H / 2, vx: BALL_SPEED * 0.7, vy: BALL_SPEED }
    bricksRef.current = makeBricks(); livesRef.current = 5; levelRef.current = 1; scoreRef.current = 0
    setGameOver(false); forceUpdate(x => x + 1)
  }, [players])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (gameOver && (e.key===' '||e.key==='Enter')) restart() }
    window.addEventListener('keydown', fn); return () => window.removeEventListener('keydown', fn)
  }, [gameOver, restart])

  return (
    <div className={css.container}>
      <canvas ref={canvasRef} className={css.canvas}  role="img" aria-label="Breakout canvas"/>
      {isPaused && (
        <PauseMenu
          onResume={resume}
          onBack={onBack}
          players={players}
        />
      )}
      {gameOver && (
        <div className={css.overlay}>
          <h2>{t('miniGames.gameOver','Game Over!')}</h2>
          <p className={css.winnerText}>🧱 Score: {scoreRef.current} | Level: {levelRef.current}</p>
          <div className={css.overlayActions}>
            <button className={css.restartBtn} onClick={restart}>{t('miniGames.playAgain','Play Again')}</button>
            <button className={css.backBtnOverlay} onClick={onBack}>{t('miniGames.backToMenu','Back to Menu')}</button>
          </div>
          <p className={css.overlayHint}>{t('miniGames.pressRestart','Press Space or Enter to restart')}</p>
        </div>
      )}
    </div>
  )
}
