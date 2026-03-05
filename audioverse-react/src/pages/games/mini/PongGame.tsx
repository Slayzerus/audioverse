/**
 * PongGame — classic Pong supporting 2-4 players.
 * 2 players: left vs right paddles.
 * 3-4 players: 4-sided arena (top, bottom, left, right).
 * Each player defends their wall. Miss the ball → lose a life.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useMiniGameFocusTrap } from '../../../hooks/useMiniGameFocusTrap'
import { useTranslation } from 'react-i18next'
import { PLAYER_COLORS, type GameConfig, PlayerSlot } from './types'
import { useGamepads } from './useGamepads'
import { KEY_LOOKUP } from './inputMaps'
import { usePause } from './usePause'
import PauseMenu from './PauseMenu'
import css from './SharedGame.module.css'

const W = 640, H = 480
const PADDLE_W = 10, PADDLE_L = 70, PADDLE_SPEED = 6
const BALL_R = 6, BALL_SPEED = 4, BALL_ACCEL = 0.2
const LIVES = 5

interface Paddle {
  // Position along the wall (0..max)
  pos: number; wall: 'left'|'right'|'top'|'bottom'
  moveDir: number // -1, 0, 1
  color: string; name: string; playerIndex: number; lives: number
  input: PlayerSlot['input']
}
interface Ball { x: number; y: number; vx: number; vy: number; speed: number }

function initPaddles(players: PlayerSlot[]): Paddle[] {
  const walls: ('left'|'right'|'top'|'bottom')[] = players.length <= 2 ? ['left','right'] : ['left','right','top','bottom']
  return players.map((p, i) => ({
    pos: (walls[i % walls.length] === 'left' || walls[i % walls.length] === 'right') ? H / 2 : W / 2,
    wall: walls[i % walls.length],
    moveDir: 0, color: p.color || PLAYER_COLORS[p.index] || '#fff', name: p.name, playerIndex: p.index, lives: LIVES,
    input: p.input,
  }))
}

function initBall(): Ball {
  const angle = (Math.random() * Math.PI * 2)
  return { x: W / 2, y: H / 2, vx: Math.cos(angle) * BALL_SPEED, vy: Math.sin(angle) * BALL_SPEED, speed: BALL_SPEED }
}

interface Props { players: PlayerSlot[]; config?: GameConfig; onBack: () => void }

export default function PongGame({ players, config: _config, onBack }: Props) {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paddlesRef = useRef<Paddle[]>(initPaddles(players))
  const ballRef = useRef<Ball>(initBall())
  const [scores, setScores] = useState<{idx:number;name:string;lives:number;color:string}[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string|null>(null)
  const pads = useGamepads(); const padsRef = useRef(pads); padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // Trap focus within the mini-game while active
  useMiniGameFocusTrap(true, 'pong-')

  // Input: keyboard sets moveDir
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const m = KEY_LOOKUP.get(e.key); if (!m) return
      for (const p of paddlesRef.current) {
        if (p.lives <= 0 || p.input.type !== 'keyboard') continue
        if ((p.input as {type:'keyboard';group:number}).group !== m.group) continue
        const isVert = p.wall === 'left' || p.wall === 'right'
        if (isVert) { if (m.dir.dy !== 0) p.moveDir = m.dir.dy }
        else { if (m.dir.dx !== 0) p.moveDir = m.dir.dx }
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      const m = KEY_LOOKUP.get(e.key); if (!m) return
      for (const p of paddlesRef.current) {
        if (p.input.type !== 'keyboard') continue
        if ((p.input as {type:'keyboard';group:number}).group !== m.group) continue
        const isVert = p.wall === 'left' || p.wall === 'right'
        if (isVert && m.dir.dy !== 0) p.moveDir = 0
        if (!isVert && m.dir.dx !== 0) p.moveDir = 0
      }
    }
    window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKeyUp)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp) }
  }, [])

  // Game loop
  useEffect(() => {
    let raf = 0
    const loop = () => {
      if (pauseRef.current) { raf = requestAnimationFrame(loop); return }
      const paddles = paddlesRef.current; const ball = ballRef.current
      // Gamepad input
      for (const p of paddles) {
        if (p.lives <= 0 || p.input.type !== 'gamepad') continue
        const gp = padsRef.current.find(g => g.index === (p.input as {type:'gamepad';padIndex:number}).padIndex)
        if (!gp) continue
        const isVert = p.wall === 'left' || p.wall === 'right'
        if (isVert) p.moveDir = gp.up ? -1 : gp.down ? 1 : 0
        else p.moveDir = gp.left ? -1 : gp.right ? 1 : 0
      }

      // Move paddles
      for (const p of paddles) {
        if (p.lives <= 0) continue
        const maxPos = (p.wall === 'left' || p.wall === 'right') ? H : W
        p.pos = Math.max(PADDLE_L / 2, Math.min(maxPos - PADDLE_L / 2, p.pos + p.moveDir * PADDLE_SPEED))
      }

      // Move ball
      ball.x += ball.vx; ball.y += ball.vy

      // Check paddle collisions
      for (const p of paddles) {
        if (p.lives <= 0) continue
        let hit = false
        if (p.wall === 'left' && ball.x - BALL_R <= PADDLE_W && ball.vx < 0) {
          if (Math.abs(ball.y - p.pos) < PADDLE_L / 2) { ball.vx = Math.abs(ball.vx); hit = true }
        } else if (p.wall === 'right' && ball.x + BALL_R >= W - PADDLE_W && ball.vx > 0) {
          if (Math.abs(ball.y - p.pos) < PADDLE_L / 2) { ball.vx = -Math.abs(ball.vx); hit = true }
        } else if (p.wall === 'top' && ball.y - BALL_R <= PADDLE_W && ball.vy < 0) {
          if (Math.abs(ball.x - p.pos) < PADDLE_L / 2) { ball.vy = Math.abs(ball.vy); hit = true }
        } else if (p.wall === 'bottom' && ball.y + BALL_R >= H - PADDLE_W && ball.vy > 0) {
          if (Math.abs(ball.x - p.pos) < PADDLE_L / 2) { ball.vy = -Math.abs(ball.vy); hit = true }
        }
        if (hit) { ball.speed += BALL_ACCEL; const mag = Math.sqrt(ball.vx**2+ball.vy**2); ball.vx = ball.vx/mag*ball.speed; ball.vy = ball.vy/mag*ball.speed }
      }

      // Check wall scoring (only walls with alive paddles count)
      const aliveWalls = new Set(paddles.filter(p => p.lives > 0).map(p => p.wall))
      let scored = false
      if (ball.x < 0 && aliveWalls.has('left')) { const p = paddles.find(p => p.wall === 'left' && p.lives > 0); if (p) p.lives--; scored = true }
      if (ball.x > W && aliveWalls.has('right')) { const p = paddles.find(p => p.wall === 'right' && p.lives > 0); if (p) p.lives--; scored = true }
      if (ball.y < 0 && aliveWalls.has('top')) { const p = paddles.find(p => p.wall === 'top' && p.lives > 0); if (p) p.lives--; scored = true }
      if (ball.y > H && aliveWalls.has('bottom')) { const p = paddles.find(p => p.wall === 'bottom' && p.lives > 0); if (p) p.lives--; scored = true }
      // bounce off dead walls / edges
      if (!scored) {
        if (ball.x < 0 || ball.x > W) ball.vx = -ball.vx
        if (ball.y < 0 || ball.y > H) ball.vy = -ball.vy
      }
      if (scored) { Object.assign(ball, initBall()) }
      ball.x = Math.max(0, Math.min(W, ball.x)); ball.y = Math.max(0, Math.min(H, ball.y))

      setScores(paddles.map(p => ({ idx: p.playerIndex, name: p.name, lives: p.lives, color: p.color })))
      const alive = paddles.filter(p => p.lives > 0)
      if (alive.length <= 1) { setGameOver(true); if (alive.length === 1) setWinner(alive[0].name); return }

      // Draw
      const c = canvasRef.current; if (!c) { raf = requestAnimationFrame(loop); return }
      const ctx = c.getContext('2d'); if (!ctx) { raf = requestAnimationFrame(loop); return }
      c.width = W; c.height = H
      ctx.fillStyle = '#111'; ctx.fillRect(0,0,W,H)
      // Center line
      ctx.setLineDash([6,6]); ctx.strokeStyle = '#333'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke()
      ctx.setLineDash([])
      // Paddles
      for (const p of paddles) {
        ctx.fillStyle = p.lives > 0 ? p.color : `${p.color}33`
        if (p.wall === 'left') ctx.fillRect(0, p.pos - PADDLE_L/2, PADDLE_W, PADDLE_L)
        else if (p.wall === 'right') ctx.fillRect(W - PADDLE_W, p.pos - PADDLE_L/2, PADDLE_W, PADDLE_L)
        else if (p.wall === 'top') ctx.fillRect(p.pos - PADDLE_L/2, 0, PADDLE_L, PADDLE_W)
        else ctx.fillRect(p.pos - PADDLE_L/2, H - PADDLE_W, PADDLE_L, PADDLE_W)
      }
      // Ball
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI*2); ctx.fill()
      ctx.shadowColor = '#fff'; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.strokeRect(0,0,W,H)

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const restart = useCallback(() => {
    paddlesRef.current = initPaddles(players); ballRef.current = initBall()
    setGameOver(false); setWinner(null); setScores([])
  }, [players])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (gameOver && (e.key===' '||e.key==='Enter')) restart() }
    window.addEventListener('keydown', fn); return () => window.removeEventListener('keydown', fn)
  }, [gameOver, restart])

  return (
    <div className={css.container}>
      <div className={css.scoreboard}>
        {scores.map(s => (
          <div key={s.idx} className={`${css.scoreItem} ${s.lives<=0?css.dead:''}`}>
            <span className={css.scoreColor} style={{background:s.color}} />
            <span>{s.name}</span>
            <span className={css.scoreValue}>{'♥'.repeat(Math.max(0,s.lives))}</span>
          </div>
        ))}
      </div>
      <canvas ref={canvasRef} className={css.canvas}  role="img" aria-label="Pong canvas"/>
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
          {winner && <p className={css.winnerText}>🏆 {winner} {t('miniGames.wins','wins')}!</p>}
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
