/**
 * AsteroidsGame — 1-4 players co-op/competitive asteroid shooters.
 * Each player controls a ship with left/right rotation + thrust (up) + shoot (action key).
 * Destroy asteroids for points. Ships can collide with asteroids and lose a life (3 lives).
 * Game ends when all players are eliminated or all asteroids destroyed (respawns waves).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useMiniGameFocusTrap } from '../../../hooks/useMiniGameFocusTrap'
import { useTranslation } from 'react-i18next'
import { PLAYER_COLORS, type GameConfig, PlayerSlot } from './types'
import { useGamepads } from './useGamepads'
import { KEY_LOOKUP, ACTION_KEYS } from './inputMaps'
import { usePause } from './usePause'
import PauseMenu from './PauseMenu'
import css from './SharedGame.module.css'

const W = 800, H = 600
const ROT_SPEED = 0.08, THRUST = 0.15, FRICTION = 0.99, BULLET_SPEED = 6, BULLET_LIFE = 60
type Vec = { x: number; y: number }
interface Ship { x: number; y: number; vx: number; vy: number; angle: number; color: string; name: string; playerIndex: number; lives: number; input: PlayerSlot['input']; invincible: number; lastShot: number }
interface Bullet { x: number; y: number; vx: number; vy: number; life: number; owner: number; color: string }
interface Asteroid { x: number; y: number; vx: number; vy: number; r: number; angle: number }

function wrap(v: Vec): Vec {
  let { x, y } = v
  if (x < 0) x += W; if (x > W) x -= W; if (y < 0) y += H; if (y > H) y -= H
  return { x, y }
}

function spawnAsteroids(n: number): Asteroid[] {
  return Array.from({ length: n }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
    r: 25 + Math.random() * 20, angle: Math.random() * Math.PI * 2
  }))
}

interface Props { players: PlayerSlot[]; config?: GameConfig; onBack: () => void }

export default function AsteroidsGame({ players, config: _config, onBack }: Props) {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shipsRef = useRef<Ship[]>(players.map((p, i) => {
    const a = (i / players.length) * Math.PI * 2
    return { x: W/2+Math.cos(a)*100, y: H/2+Math.sin(a)*100, vx: 0, vy: 0, angle: a, color: p.color || PLAYER_COLORS[p.index] || '#fff', name: p.name, playerIndex: p.index, lives: 3, input: p.input, invincible: 120, lastShot: 0 }
  }))
  const bulletsRef = useRef<Bullet[]>([])
  const asteroidsRef = useRef<Asteroid[]>(spawnAsteroids(6))
  const waveRef = useRef(1)
  const frameRef = useRef(0)
  const [gameOver, setGameOver] = useState(false)
  const [scores, setScores] = useState<{idx:number;name:string;lives:number;color:string;pts:number}[]>([])
  const pointsRef = useRef<Map<number,number>>(new Map())
  const pads = useGamepads(); const padsRef = useRef(pads); padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // Trap focus within the mini-game while active
  useMiniGameFocusTrap(true, 'asteroids-')

  // Input state
  const inputRef = useRef<Map<number,{left:boolean;right:boolean;up:boolean;action:boolean}>>(new Map())

  useEffect(() => {
    const pressed = new Set<string>()
    const kd = (e: KeyboardEvent) => pressed.add(e.key)
    const ku = (e: KeyboardEvent) => pressed.delete(e.key)
    let raf = 0
    const poll = () => {
      for (const s of shipsRef.current) {
        const inp = { left: false, right: false, up: false, action: false }
        if (s.input.type === 'keyboard') {
          const g = (s.input as {type:'keyboard';group:number}).group
          for (const [key, m] of KEY_LOOKUP) {
            if (m.group === g && pressed.has(key)) {
              if (m.dir.dx < 0) inp.left = true
              if (m.dir.dx > 0) inp.right = true
              if (m.dir.dy < 0) inp.up = true
            }
          }
          for (const [key, ag] of ACTION_KEYS) { if (ag === g && pressed.has(key)) inp.action = true }
        } else {
          const gp = padsRef.current.find(p => p.index === (s.input as {type:'gamepad';padIndex:number}).padIndex)
          if (gp) {
            if (gp.left) inp.left = true; if (gp.right) inp.right = true
            if (gp.up) inp.up = true; if (gp.a) inp.action = true
          }
        }
        inputRef.current.set(s.playerIndex, inp)
      }
      raf = requestAnimationFrame(poll)
    }
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku)
    raf = requestAnimationFrame(poll)
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); cancelAnimationFrame(raf) }
  }, [])

  useEffect(() => {
    let raf = 0
    const loop = () => {
      if (pauseRef.current) { raf = requestAnimationFrame(loop); return }
      const ships = shipsRef.current; const bullets = bulletsRef.current; const asteroids = asteroidsRef.current
      const frame = ++frameRef.current; const pts = pointsRef.current

      const alive = ships.filter(s => s.lives > 0)
      if (alive.length === 0) { setGameOver(true); updateScores(); return }

      // Ship updates
      for (const s of alive) {
        const inp = inputRef.current.get(s.playerIndex) ?? { left: false, right: false, up: false, action: false }
        if (inp.left) s.angle -= ROT_SPEED
        if (inp.right) s.angle += ROT_SPEED
        if (inp.up) { s.vx += Math.cos(s.angle) * THRUST; s.vy += Math.sin(s.angle) * THRUST }
        s.vx *= FRICTION; s.vy *= FRICTION
        const w = wrap({ x: s.x + s.vx, y: s.y + s.vy }); s.x = w.x; s.y = w.y
        if (s.invincible > 0) s.invincible--

        // Shoot
        if (inp.action && frame - s.lastShot > 10) {
          s.lastShot = frame
          bullets.push({ x: s.x + Math.cos(s.angle)*14, y: s.y + Math.sin(s.angle)*14, vx: Math.cos(s.angle)*BULLET_SPEED + s.vx, vy: Math.sin(s.angle)*BULLET_SPEED + s.vy, life: BULLET_LIFE, owner: s.playerIndex, color: s.color })
        }
      }

      // Bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i]; const w = wrap({ x: b.x + b.vx, y: b.y + b.vy }); b.x = w.x; b.y = w.y
        b.life--; if (b.life <= 0) bullets.splice(i, 1)
      }

      // Asteroid updates
      for (const a of asteroids) { const w = wrap({ x: a.x + a.vx, y: a.y + a.vy }); a.x = w.x; a.y = w.y; a.angle += 0.01 }

      // Bullet-asteroid collisions
      for (let bi = bullets.length - 1; bi >= 0; bi--) {
        const b = bullets[bi]
        for (let ai = asteroids.length - 1; ai >= 0; ai--) {
          const a = asteroids[ai]; const dx = b.x - a.x, dy = b.y - a.y
          if (Math.sqrt(dx*dx+dy*dy) < a.r) {
            bullets.splice(bi, 1); pts.set(b.owner, (pts.get(b.owner) ?? 0) + Math.round(50/a.r*10))
            if (a.r > 15) {
              asteroids.push({ x: a.x, y: a.y, vx: a.vy + (Math.random()-0.5), vy: -a.vx + (Math.random()-0.5), r: a.r*0.6, angle: 0 })
              asteroids.push({ x: a.x, y: a.y, vx: -a.vy + (Math.random()-0.5), vy: a.vx + (Math.random()-0.5), r: a.r*0.6, angle: 0 })
            }
            asteroids.splice(ai, 1); break
          }
        }
      }

      // Ship-asteroid collisions
      for (const s of alive) {
        if (s.invincible > 0) continue
        for (const a of asteroids) {
          const dx = s.x - a.x, dy = s.y - a.y
          if (Math.sqrt(dx*dx+dy*dy) < a.r + 10) { s.lives--; s.invincible = 120; s.x = W/2; s.y = H/2; s.vx = 0; s.vy = 0; break }
        }
      }

      // New wave
      if (asteroids.length === 0) { waveRef.current++; asteroidsRef.current.push(...spawnAsteroids(4 + waveRef.current * 2)) }

      updateScores()

      // Draw
      const c = canvasRef.current; if (!c) { raf = requestAnimationFrame(loop); return }
      const ctx = c.getContext('2d'); if (!ctx) { raf = requestAnimationFrame(loop); return }
      c.width = W; c.height = H
      ctx.fillStyle = '#050510'; ctx.fillRect(0, 0, W, H)
      // Stars
      ctx.fillStyle = '#333'
      for (let i = 0; i < 60; i++) { const sx = (i*137.5+23)%W, sy = (i*97.3+11)%H; ctx.fillRect(sx,sy,1,1) }
      // Asteroids
      for (const a of asteroids) {
        ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.angle)
        ctx.beginPath(); for (let i = 0; i < 8; i++) { const ang = (i/8)*Math.PI*2; const r = a.r*(0.8+0.2*Math.sin(i*3)); ctx[i===0?'moveTo':'lineTo'](Math.cos(ang)*r, Math.sin(ang)*r) }
        ctx.closePath(); ctx.strokeStyle = '#888'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore()
      }
      // Ships
      for (const s of ships) {
        if (s.lives <= 0) continue
        if (s.invincible > 0 && frame % 6 < 3) continue
        ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.angle)
        ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -8); ctx.lineTo(-4, 0); ctx.lineTo(-8, 8); ctx.closePath()
        ctx.fillStyle = s.color; ctx.fill(); ctx.restore()
      }
      // Bullets
      for (const b of bullets) { ctx.fillStyle = b.color; ctx.fillRect(b.x-2, b.y-2, 4, 4) }
      raf = requestAnimationFrame(loop)
    }

    function updateScores() {
      setScores(shipsRef.current.map(s => ({ idx: s.playerIndex, name: s.name, lives: s.lives, color: s.color, pts: pointsRef.current.get(s.playerIndex) ?? 0 })))
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const restart = useCallback(() => {
    shipsRef.current = players.map((p, i) => {
      const a = (i / players.length) * Math.PI * 2
      return { x: W/2+Math.cos(a)*100, y: H/2+Math.sin(a)*100, vx: 0, vy: 0, angle: a, color: p.color || PLAYER_COLORS[p.index] || '#fff', name: p.name, playerIndex: p.index, lives: 3, input: p.input, invincible: 120, lastShot: 0 }
    })
    bulletsRef.current = []; asteroidsRef.current = spawnAsteroids(6); waveRef.current = 1; frameRef.current = 0
    pointsRef.current = new Map(); setGameOver(false); setScores([])
  }, [players])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (gameOver && (e.key===' '||e.key==='Enter')) restart() }
    window.addEventListener('keydown', fn); return () => window.removeEventListener('keydown', fn)
  }, [gameOver, restart])

  return (
    <div className={css.container}>
      <div className={css.scoreboard}>
        <span className={css.roundInfo}>🌊 {waveRef.current}</span>
        {scores.map(s => (
          <div key={s.idx} className={`${css.scoreItem} ${s.lives<=0?css.dead:''}`}>
            <span className={css.scoreColor} style={{background:s.color}} />
            <span>{s.name}</span>
            <span className={css.scoreValue}>{s.pts}{'❤️'.repeat(Math.max(0,s.lives))}</span>
          </div>
        ))}
      </div>
      <canvas ref={canvasRef} className={css.canvas}  role="img" aria-label="Asteroids canvas"/>
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
          {scores.length>0 && <p className={css.winnerText}>🚀 {[...scores].sort((a,b)=>b.pts-a.pts)[0].name} {t('miniGames.wins','wins')}! ({[...scores].sort((a,b)=>b.pts-a.pts)[0].pts} pts)</p>}
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
