/**
 * UltimateChickenHorseGame — platform-builder / racer for 1-4 players.
 *
 * Two alternating real-time phases:
 *   BUILD: timed — pick & place platform pieces on the map.
 *   RACE:  all players simultaneously try to reach the goal.
 *
 * Scoring: only players who reach the goal score, but only if at least
 *          one player did NOT reach it.  If all or none reach it → 0 pts.
 *
 * Currencies: coins (reaching goal), gems (style points), stars (round wins).
 *
 * Controls:
 *   Group 0: WASD + Space (move cursor / move player / place / jump)
 *   Group 1: Arrows + Enter
 *   Gamepad: left stick + A button
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
const H = 500
const GRAVITY = 0.45
const JUMP_VEL = -8.5
const MOVE_SPEED = 3.5
const PLAYER_W = 16
const PLAYER_H = 24
const CURSOR_SPEED = 4
const SPRING_VEL = -12
const TICK_MS = 1000 / 60

// ─── Piece types ─────────────────────────────────────────────
type PieceKind = 'platform' | 'wall' | 'spike' | 'spring'
interface Piece { x: number; y: number; w: number; h: number; kind: PieceKind; color: string }

const PIECE_TEMPLATES: { kind: PieceKind; w: number; h: number; color: string; label: string }[] = [
  { kind: 'platform', w: 80, h: 14, color: '#8B5E3C', label: 'Platform' },
  { kind: 'platform', w: 50, h: 14, color: '#6B4226', label: 'Small Plat' },
  { kind: 'wall',     w: 14, h: 60, color: '#555',    label: 'Wall' },
  { kind: 'spike',    w: 30, h: 12, color: '#e74c3c', label: 'Spikes' },
  { kind: 'spring',   w: 24, h: 10, color: '#2ecc71', label: 'Spring' },
]

function randomPieces(n: number) {
  const out: typeof PIECE_TEMPLATES[number][] = []
  const pool = [...PIECE_TEMPLATES]
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    out.push(pool[idx])
  }
  return out
}

// ─── Player state ────────────────────────────────────────────
interface Runner {
  x: number; y: number; vx: number; vy: number
  grounded: boolean; alive: boolean; finished: boolean
  color: string; name: string; index: number
  input: PlayerSlot['input']
  // build phase cursor
  cx: number; cy: number; selectedPiece: number
}

interface Scores { coins: number; gems: number; stars: number; total: number }

// ─── Seed layout ─────────────────────────────────────────────
function seedPieces(): Piece[] {
  return [
    // ground
    { x: 0, y: H - 20, w: W, h: 20, kind: 'platform', color: '#555' },
    // goal platform (top-right)
    { x: W - 100, y: 60, w: 100, h: 16, kind: 'platform', color: '#f1c40f' },
    // a few seed platforms to get started
    { x: 60,  y: 380, w: 90, h: 14, kind: 'platform', color: '#8B5E3C' },
    { x: 250, y: 310, w: 80, h: 14, kind: 'platform', color: '#8B5E3C' },
    { x: 450, y: 240, w: 70, h: 14, kind: 'platform', color: '#8B5E3C' },
    { x: 600, y: 170, w: 80, h: 14, kind: 'platform', color: '#8B5E3C' },
  ]
}

// ─── Input helpers ───────────────────────────────────────────
interface Keys { left: boolean; right: boolean; up: boolean; down: boolean; action: boolean }
const emptyKeys = (): Keys => ({ left: false, right: false, up: false, down: false, action: false })

// ─── Component ───────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function UltimateChickenHorseGame({ players, config, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const maxRounds = (config?.rounds as number) || 5
  const buildTimeSec = (config?.buildTime as number) || 15

  // Mutable game state in refs
  const piecesRef = useRef<Piece[]>(seedPieces())
  const runnersRef = useRef<Runner[]>([])
  const scoresRef = useRef<Scores[]>(players.map(() => ({ coins: 0, gems: 0, stars: 0, total: 0 })))
  const phaseRef = useRef<'build' | 'race' | 'done'>('build')
  const roundRef = useRef(1)
  const buildTimerRef = useRef(buildTimeSec)
  const offersRef = useRef<ReturnType<typeof randomPieces>>([])
  const keysRef = useRef<Map<number, Keys>>(new Map())
  const actionEdgeRef = useRef<Set<number>>(new Set()) // tracks action press edge

  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads

  // React state for UI
  const [uiPhase, setUiPhase] = useState<'build' | 'race' | 'done'>('build')
  const [uiRound, setUiRound] = useState(1)
  const [uiBuildTimer, setUiBuildTimer] = useState(buildTimeSec)
  const [uiScores, setUiScores] = useState<(Scores & { name: string; color: string })[]>(
    players.map(p => ({ coins: 0, gems: 0, stars: 0, total: 0, name: p.name, color: p.color || PLAYER_COLORS[p.index] || '#fff' }))
  )
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // ── Init runners at start of each race ──
  const initRunners = useCallback(() => {
    runnersRef.current = players.map((p, i) => ({
      x: 40 + i * 40, y: H - 20 - PLAYER_H, vx: 0, vy: 0,
      grounded: true, alive: true, finished: false,
      color: p.color || PLAYER_COLORS[p.index] || '#fff',
      name: p.name, index: p.index,
      input: p.input,
      cx: W / 2, cy: H / 2, selectedPiece: 0,
    }))
  }, [players])

  // ── Start new round (build phase) ──
  const startBuild = useCallback(() => {
    phaseRef.current = 'build'
    buildTimerRef.current = buildTimeSec
    offersRef.current = randomPieces(3)
    initRunners() // reset cursor positions
    setUiPhase('build')
    setUiBuildTimer(buildTimeSec)
  }, [buildTimeSec, initRunners])

  // ── Start race phase ──
  const startRace = useCallback(() => {
    phaseRef.current = 'race'
    initRunners()
    setUiPhase('race')
  }, [initRunners])

  // Initialise first round
  useEffect(() => {
    startBuild()
    // Mount-only: first build round started once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Keyboard input ──
  useEffect(() => {
    function handle(e: KeyboardEvent, down: boolean) {
      const mappings: { key: string; group: number; field: keyof Keys }[] = [
        { key: 'a', group: 0, field: 'left' }, { key: 'd', group: 0, field: 'right' },
        { key: 'w', group: 0, field: 'up' },   { key: 's', group: 0, field: 'down' },
        { key: ' ', group: 0, field: 'action' },
        { key: 'ArrowLeft',  group: 1, field: 'left' },  { key: 'ArrowRight', group: 1, field: 'right' },
        { key: 'ArrowUp',    group: 1, field: 'up' },    { key: 'ArrowDown',  group: 1, field: 'down' },
        { key: 'Enter',      group: 1, field: 'action' },
      ]
      for (const m of mappings) {
        if (e.key === m.key || e.key.toLowerCase() === m.key) {
          for (const r of runnersRef.current) {
            if (r.input.type === 'keyboard' && r.input.group === m.group) {
              if (!keysRef.current.has(r.index)) keysRef.current.set(r.index, emptyKeys())
              const k = keysRef.current.get(r.index)!
              if (m.field === 'action' && down && !k.action) actionEdgeRef.current.add(r.index)
              k[m.field] = down
            }
          }
          e.preventDefault()
        }
      }
    }
    const kd = (e: KeyboardEvent) => handle(e, true)
    const ku = (e: KeyboardEvent) => handle(e, false)
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku) }
  }, [])

  // ── Main game loop ──
  useEffect(() => {
    let timer = 0
    let lastBuildTick = Date.now()

    function loop() {
      if (pauseRef.current) { timer = window.setTimeout(loop, TICK_MS); return }
      const phase = phaseRef.current
      if (phase === 'done') return

      // Poll gamepads
      for (const r of runnersRef.current) {
        if (r.input.type !== 'gamepad') continue
        const gp = padsRef.current.find(p => p.index === (r.input as { type: 'gamepad'; padIndex: number }).padIndex)
        if (!gp) continue
        if (!keysRef.current.has(r.index)) keysRef.current.set(r.index, emptyKeys())
        const k = keysRef.current.get(r.index)!
        const prevAction = k.action
        k.left = gp.left; k.right = gp.right; k.up = gp.up; k.down = gp.down
        k.action = gp.a
        if (k.action && !prevAction) actionEdgeRef.current.add(r.index)
      }

      if (phase === 'build') tickBuild()
      else if (phase === 'race') tickRace()

      actionEdgeRef.current.clear()
      timer = window.setTimeout(loop, TICK_MS)
    }

    function tickBuild() {
      const now = Date.now()
      const dt = (now - lastBuildTick) / 1000
      lastBuildTick = now

      buildTimerRef.current -= dt
      setUiBuildTimer(Math.max(0, Math.ceil(buildTimerRef.current)))

      // Move cursors & handle placement
      for (const r of runnersRef.current) {
        const k = keysRef.current.get(r.index) ?? emptyKeys()
        if (k.left) r.cx -= CURSOR_SPEED
        if (k.right) r.cx += CURSOR_SPEED
        if (k.up) r.cy -= CURSOR_SPEED
        if (k.down) r.cy += CURSOR_SPEED
        r.cx = Math.max(0, Math.min(W, r.cx))
        r.cy = Math.max(0, Math.min(H, r.cy))

        // Cycle piece on up/down
        if (actionEdgeRef.current.has(r.index)) {
          const offers = offersRef.current
          if (offers.length > 0) {
            const tmpl = offers[r.selectedPiece % offers.length]
            piecesRef.current.push({
              x: r.cx - tmpl.w / 2, y: r.cy - tmpl.h / 2,
              w: tmpl.w, h: tmpl.h, kind: tmpl.kind, color: tmpl.color,
            })
            // Remove placed piece from offers, give next set
            offers.splice(r.selectedPiece % offers.length, 1)
            if (offers.length === 0) offersRef.current = randomPieces(3)
            r.selectedPiece = 0
          }
        }

        // Cycle selection with up / down when action not pressed
        const k2 = keysRef.current.get(r.index) ?? emptyKeys()
        if (!k2.action) {
          // simple: left/right cycles
        }
      }

      if (buildTimerRef.current <= 0) {
        startRace()
        lastBuildTick = Date.now()
      }
    }

    function tickRace() {
      const pieces = piecesRef.current
      let allDead = true
      let anyAlive = false

      for (const r of runnersRef.current) {
        if (!r.alive || r.finished) continue
        allDead = false
        anyAlive = true
        const k = keysRef.current.get(r.index) ?? emptyKeys()

        // Horizontal movement
        r.vx = 0
        if (k.left) r.vx = -MOVE_SPEED
        if (k.right) r.vx = MOVE_SPEED

        // Jump
        if ((k.action || k.up) && r.grounded) {
          r.vy = JUMP_VEL
          r.grounded = false
        }

        // Gravity
        r.vy += GRAVITY

        // Move X then resolve
        r.x += r.vx
        r.grounded = false
        for (const p of pieces) {
          if (p.kind === 'spike') continue
          if (rectOverlap(r.x, r.y, PLAYER_W, PLAYER_H, p.x, p.y, p.w, p.h)) {
            if (r.vx > 0) r.x = p.x - PLAYER_W
            else if (r.vx < 0) r.x = p.x + p.w
          }
        }

        // Move Y then resolve
        r.y += r.vy
        for (const p of pieces) {
          if (p.kind === 'spike') continue
          if (rectOverlap(r.x, r.y, PLAYER_W, PLAYER_H, p.x, p.y, p.w, p.h)) {
            if (r.vy > 0) { // landing
              r.y = p.y - PLAYER_H
              r.vy = 0
              r.grounded = true
              if (p.kind === 'spring') {
                r.vy = SPRING_VEL
                r.grounded = false
              }
            } else { // hit ceiling
              r.y = p.y + p.h
              r.vy = 0
            }
          }
        }

        // Spike collision
        for (const p of pieces) {
          if (p.kind === 'spike' && rectOverlap(r.x, r.y, PLAYER_W, PLAYER_H, p.x, p.y, p.w, p.h)) {
            r.alive = false
          }
        }

        // Fall off screen
        if (r.y > H + 50) r.alive = false

        // Reached goal? (top-right golden platform region)
        const goal = pieces[1] // goal is always index 1
        if (goal && r.y + PLAYER_H <= goal.y + goal.h + 4 && r.x + PLAYER_W > goal.x && r.x < goal.x + goal.w && r.y < goal.y + 4) {
          r.finished = true
        }
      }

      // Check round end: all dead or finished
      const runners = runnersRef.current
      const allDone = runners.every(r => !r.alive || r.finished)
      if (allDone || (!anyAlive && allDead)) {
        endRound()
      }
    }

    function endRound() {
      const runners = runnersRef.current
      const finished = runners.filter(r => r.finished)
      const notFinished = runners.filter(r => !r.finished)

      // Score: only scorers get points if at least one didn't finish
      if (finished.length > 0 && notFinished.length > 0) {
        for (const r of finished) {
          const s = scoresRef.current[players.findIndex(p => p.index === r.index)]
          if (s) {
            s.coins += 2
            s.gems += 1  // style point for reaching goal
            s.total += 3
          }
        }
        // Best finisher gets a star
        if (finished.length > 0) {
          const best = finished[0] // first to finish in array order
          const s = scoresRef.current[players.findIndex(p => p.index === best.index)]
          if (s) { s.stars += 1; s.total += 2 }
        }
      }

      // Update UI scores
      setUiScores(players.map((p, i) => ({
        ...scoresRef.current[i],
        name: p.name,
        color: p.color || PLAYER_COLORS[p.index] || '#fff',
      })))

      const round = roundRef.current
      if (round >= maxRounds) {
        // Game over
        phaseRef.current = 'done'
        setUiPhase('done')
        setGameOver(true)
        const best = scoresRef.current.reduce((a, b, i) => b.total > scoresRef.current[a].total ? i : a, 0)
        setWinner(players[best]?.name ?? '')
      } else {
        roundRef.current = round + 1
        setUiRound(round + 1)
        startBuild()
      }
    }

    lastBuildTick = Date.now()
    timer = window.setTimeout(loop, TICK_MS)
    return () => clearTimeout(timer)
  }, [players, maxRounds, buildTimeSec, startBuild, startRace, pauseRef])

  // ── Canvas render loop ──
  useEffect(() => {
    let raf = 0
    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { raf = requestAnimationFrame(draw); return }

      canvas.width = W
      canvas.height = H

      // Sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, H)
      grad.addColorStop(0, '#1a1a2e')
      grad.addColorStop(1, '#16213e')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)

      const pieces = piecesRef.current
      const runners = runnersRef.current
      const phase = phaseRef.current

      // Draw pieces
      for (const p of pieces) {
        ctx.fillStyle = p.color
        if (p.kind === 'spike') {
          // Draw spikes as triangles
          ctx.fillStyle = '#e74c3c'
          ctx.beginPath()
          for (let tx = p.x; tx < p.x + p.w; tx += 10) {
            ctx.moveTo(tx, p.y + p.h)
            ctx.lineTo(tx + 5, p.y)
            ctx.lineTo(tx + 10, p.y + p.h)
          }
          ctx.fill()
        } else if (p.kind === 'spring') {
          ctx.fillStyle = '#2ecc71'
          ctx.fillRect(p.x, p.y, p.w, p.h)
          // Coil lines
          ctx.strokeStyle = '#27ae60'
          ctx.lineWidth = 2
          for (let sy = p.y + 2; sy < p.y + p.h; sy += 3) {
            ctx.beginPath()
            ctx.moveTo(p.x + 2, sy)
            ctx.lineTo(p.x + p.w - 2, sy)
            ctx.stroke()
          }
        } else {
          ctx.fillRect(p.x, p.y, p.w, p.h)
          // Border
          ctx.strokeStyle = 'rgba(255,255,255,0.15)'
          ctx.lineWidth = 1
          ctx.strokeRect(p.x, p.y, p.w, p.h)
        }
      }

      // Goal marker (star icon on goal platform)
      const goal = pieces[1]
      if (goal) {
        ctx.fillStyle = '#f1c40f'
        ctx.font = 'bold 20px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('★ GOAL', goal.x + goal.w / 2, goal.y - 6)
      }

      // Draw players
      for (const r of runners) {
        if (!r.alive && !r.finished) { ctx.globalAlpha = 0.25 }
        ctx.fillStyle = r.color
        ctx.fillRect(r.x, r.y, PLAYER_W, PLAYER_H)
        // Eyes
        ctx.fillStyle = '#fff'
        ctx.fillRect(r.x + 3, r.y + 4, 4, 4)
        ctx.fillRect(r.x + PLAYER_W - 7, r.y + 4, 4, 4)
        ctx.fillStyle = '#000'
        ctx.fillRect(r.x + 4, r.y + 5, 2, 2)
        ctx.fillRect(r.x + PLAYER_W - 6, r.y + 5, 2, 2)
        // Finished checkmark
        if (r.finished) {
          ctx.fillStyle = '#2ecc71'
          ctx.font = 'bold 14px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('✓', r.x + PLAYER_W / 2, r.y - 4)
        }
        ctx.globalAlpha = 1
      }

      // Build phase: draw cursors & piece preview
      if (phase === 'build') {
        const offers = offersRef.current
        for (const r of runners) {
          // Cursor crosshair
          ctx.strokeStyle = r.color
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(r.cx - 10, r.cy); ctx.lineTo(r.cx + 10, r.cy)
          ctx.moveTo(r.cx, r.cy - 10); ctx.lineTo(r.cx, r.cy + 10)
          ctx.stroke()

          // Ghost preview of selected piece
          if (offers.length > 0) {
            const tmpl = offers[r.selectedPiece % offers.length]
            ctx.globalAlpha = 0.4
            ctx.fillStyle = tmpl.color
            ctx.fillRect(r.cx - tmpl.w / 2, r.cy - tmpl.h / 2, tmpl.w, tmpl.h)
            ctx.globalAlpha = 1
          }
        }

        // Piece selection HUD (bottom)
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.fillRect(0, H - 40, W, 40)
        ctx.fillStyle = '#fff'
        ctx.font = '13px sans-serif'
        ctx.textAlign = 'center'
        for (let i = 0; i < offers.length; i++) {
          const ox = W / 2 + (i - 1) * 120
          ctx.fillStyle = offers[i].color
          ctx.fillRect(ox - 20, H - 34, 40, 12)
          ctx.fillStyle = '#fff'
          ctx.fillText(offers[i].label, ox, H - 8)
        }

        // Timer
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 24px sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText(`${Math.ceil(buildTimerRef.current)}s`, W - 16, 30)

        // Phase label
        ctx.textAlign = 'left'
        ctx.fillText('BUILD', 16, 30)
      } else if (phase === 'race') {
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 24px sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText('RACE!', 16, 30)
      }

      // Round info
      ctx.fillStyle = '#ccc'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`Round ${roundRef.current} / ${maxRounds}`, W / 2, 20)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [maxRounds])

  // ── Restart ──
  const handleRestart = useCallback(() => {
    piecesRef.current = seedPieces()
    scoresRef.current = players.map(() => ({ coins: 0, gems: 0, stars: 0, total: 0 }))
    roundRef.current = 1
    setUiRound(1)
    setGameOver(false)
    setWinner(null)
    startBuild()
  }, [players, startBuild])

  // Keyboard restart
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (gameOver && (e.key === ' ' || e.key === 'Enter')) handleRestart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameOver, handleRestart])

  return (
    <div className={styles.container}>
      {/* Scoreboard */}
      <div className={styles.scoreboard}>
        {uiScores.map(s => (
          <div key={s.name} className={styles.scoreItem}>
            <span className={styles.scoreColor} style={{ background: s.color }} />
            <span>{s.name}</span>
            <span className={styles.scoreValue} title={`🪙${s.coins} 💎${s.gems} ⭐${s.stars}`}>
              {s.total}
            </span>
          </div>
        ))}
        {uiPhase === 'build' && (
          <span className={styles.roundInfo}>🔨 Build — {uiBuildTimer}s</span>
        )}
        {uiPhase === 'race' && (
          <span className={styles.roundInfo}>🏁 Race! Round {uiRound}/{maxRounds}</span>
        )}
      </div>

      <canvas ref={canvasRef} className={styles.canvas}  role="img" aria-label="Ultimate Chicken Horse canvas"/>

      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && <p className={styles.winnerText}>🏆 {winner} {t('miniGames.wins', 'wins')}!</p>}
          {/* Currency breakdown */}
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {uiScores.map(s => (
              <div key={s.name} style={{ textAlign: 'center', color: s.color }}>
                <div style={{ fontWeight: 700 }}>{s.name}</div>
                <div>🪙 {s.coins}  💎 {s.gems}  ⭐ {s.stars}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{s.total} pts</div>
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

// ─── Collision helper ────────────────────────────────────────
function rectOverlap(ax: number, ay: number, aw: number, ah: number,
                     bx: number, by: number, bw: number, bh: number): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}
