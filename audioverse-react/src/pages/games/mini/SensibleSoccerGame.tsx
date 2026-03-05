/**
 * SensibleSoccerGame — top-down football inspired by Sensible World of Soccer.
 *
 * Controls (per keyboard group):
 *   Group 0: W/A/S/D  move, Space shoot/pass, E tackle, Q switch player
 *   Group 1: Arrows   move, Enter shoot/pass, Shift tackle, Tab switch player
 * Gamepads: left stick move, A shoot/pass, X tackle, Y switch player
 *
 * 3 currencies: coins (goals), gems (assists/skills), stars (match wins).
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
const PITCH_PAD = 30
const GOAL_W = 8
const GOAL_H = 80
const BALL_R = 6
const PLAYER_R = 10
const FRICTION = 0.97
const SHOOT_POWER = 8
const PASS_POWER = 5
const TACKLE_RANGE = 28
const TACKLE_LUNGE = 5
const BALL_BOUNCE = 0.7
const MAX_CHARGE = 40  // frames
const AI_SPEED = 1.8
const HUMAN_SPEED = 2.5
const SWITCH_COOLDOWN = 15 // frames

// ─── Keyboard mappings ──────────────────────────────────────
interface KBAction { group: number; action: 'up' | 'down' | 'left' | 'right' | 'shoot' | 'tackle' | 'switch' }
const KB_MAP: Record<string, KBAction> = {
  w: { group: 0, action: 'up' }, s: { group: 0, action: 'down' },
  a: { group: 0, action: 'left' }, d: { group: 0, action: 'right' },
  ' ': { group: 0, action: 'shoot' }, e: { group: 0, action: 'tackle' },
  q: { group: 0, action: 'switch' },
  ArrowUp: { group: 1, action: 'up' }, ArrowDown: { group: 1, action: 'down' },
  ArrowLeft: { group: 1, action: 'left' }, ArrowRight: { group: 1, action: 'right' },
  Enter: { group: 1, action: 'shoot' }, Shift: { group: 1, action: 'tackle' },
  Tab: { group: 1, action: 'switch' },
}

// ─── Types ───────────────────────────────────────────────────
interface Vec2 { x: number; y: number }
interface Ball { x: number; y: number; vx: number; vy: number }

interface Footballer {
  x: number; y: number
  vx: number; vy: number
  facingX: number; facingY: number
  team: number         // 0 or 1
  isHuman: boolean
  controlIndex: number // which human player controls (index into players[])
  hasBall: boolean
  color: string
  ringColor: string
  id: number
}

interface MatchState {
  ball: Ball
  footballers: Footballer[]
  score: [number, number]
  timeLeft: number     // seconds
  goalScored: boolean
  goalTimer: number
  gameOver: boolean
  winner: number | null // team index or null for draw
  // Currency tracking
  coins: number[]      // per human player
  gems: number[]
  stars: number[]
  lastTouched: number  // footballer id who last touched ball
  assistId: number     // footballer id who passed before goal
}

// ─── Helpers ─────────────────────────────────────────────────
function dist(a: Vec2, b: Vec2) { return Math.hypot(a.x - b.x, a.y - b.y) }
function norm(x: number, y: number) { const l = Math.hypot(x, y) || 1; return { x: x / l, y: y / l } }

function pitchBounds() {
  return { left: PITCH_PAD, right: W - PITCH_PAD, top: PITCH_PAD, bottom: H - PITCH_PAD }
}
function goalY() { return H / 2 - GOAL_H / 2 }

function parseTeamSize(ts: string): number {
  const n = parseInt(ts)
  return isNaN(n) ? 5 : n
}

// ─── Create initial state ────────────────────────────────────
function createState(players: PlayerSlot[], config: GameConfig): MatchState {
  const pb = pitchBounds()
  const teamSz = parseTeamSize(config.teamSize || '5v5')
  const isCoop = config.playerMode === 'coop' || config.gameMode === 'coop-vs-ai'
  const duration = (Number(config.matchDuration) || 3) * 60

  // Assign humans to teams
  const humanTeams: number[] = []
  if (isCoop) {
    players.forEach(() => humanTeams.push(0))
  } else {
    players.forEach((_, i) => humanTeams.push(i % 2))
  }

  const footballers: Footballer[] = []
  let nextId = 0

  // Create both teams
  for (let team = 0; team < 2; team++) {
    const teamHumans = players.filter((_, i) => humanTeams[i] === team)
    const aiCount = Math.max(0, teamSz - teamHumans.length)
    const isLeftTeam = team === 0
    const teamColor = team === 0 ? '#e74c3c' : '#3498db'
    const ringColor = team === 0 ? '#ff6b6b' : '#74b9ff'
    const lightColor = team === 0 ? '#e88' : '#8bc' // AI lighter shade

    // Spread positions across team half
    const cx = isLeftTeam ? pb.left + (pb.right - pb.left) * 0.25 : pb.left + (pb.right - pb.left) * 0.75
    const totalInTeam = teamHumans.length + aiCount

    // Place humans first
    teamHumans.forEach((p, hi) => {
      const slot = hi / Math.max(1, totalInTeam - 1)
      const y = pb.top + 40 + slot * (pb.bottom - pb.top - 80)
      footballers.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: totalInTeam === 1 ? H / 2 : y,
        vx: 0, vy: 0,
        facingX: isLeftTeam ? 1 : -1, facingY: 0,
        team, isHuman: true,
        controlIndex: players.indexOf(p),
        hasBall: false,
        color: p.color || PLAYER_COLORS[p.index] || teamColor,
        ringColor,
        id: nextId++,
      })
    })

    // Fill AI teammates
    for (let i = 0; i < aiCount; i++) {
      const slot = (teamHumans.length + i) / Math.max(1, totalInTeam - 1)
      const y = pb.top + 40 + slot * (pb.bottom - pb.top - 80)
      footballers.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: totalInTeam === 1 ? H / 2 : y,
        vx: 0, vy: 0,
        facingX: isLeftTeam ? 1 : -1, facingY: 0,
        team, isHuman: false, controlIndex: -1,
        hasBall: false,
        color: lightColor,
        ringColor,
        id: nextId++,
      })
    }
  }

  const coins = players.map(() => 0)
  const gems = players.map(() => 0)
  const stars = players.map(() => 0)

  return {
    ball: { x: W / 2, y: H / 2, vx: 0, vy: 0 },
    footballers,
    score: [0, 0],
    timeLeft: duration,
    goalScored: false,
    goalTimer: 0,
    gameOver: false,
    winner: null,
    coins, gems, stars,
    lastTouched: -1,
    assistId: -1,
  }
}

function resetPositions(st: MatchState) {
  const pb = pitchBounds()
  st.ball.x = W / 2; st.ball.y = H / 2; st.ball.vx = 0; st.ball.vy = 0
  st.goalScored = false; st.goalTimer = 0
  const teams = [
    st.footballers.filter(f => f.team === 0),
    st.footballers.filter(f => f.team === 1),
  ]
  teams.forEach((team, ti) => {
    const cx = ti === 0 ? pb.left + (pb.right - pb.left) * 0.25 : pb.left + (pb.right - pb.left) * 0.75
    team.forEach((f, i) => {
      const slot = i / Math.max(1, team.length - 1)
      f.x = cx + (Math.random() - 0.5) * 30
      f.y = team.length === 1 ? H / 2 : pb.top + 40 + slot * (pb.bottom - pb.top - 80)
      f.vx = 0; f.vy = 0
      f.hasBall = false
    })
  })
  st.lastTouched = -1
  st.assistId = -1
}

// ─── Component ───────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function SensibleSoccerGame({ players, config = {}, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<MatchState>(createState(players, config))
  const keysRef = useRef<Set<string>>(new Set())
  const chargeRef = useRef<number[]>(players.map(() => 0))
  const switchCdRef = useRef<number[]>(players.map(() => 0))
  const frameRef = useRef(0)

  const [scoreDisplay, setScoreDisplay] = useState<[number, number]>([0, 0])
  const [timeDisplay, setTimeDisplay] = useState('')
  const [gameOver, setGameOver] = useState(false)
  const [winText, setWinText] = useState('')
  const [currencyDisplay, setCurrencyDisplay] = useState<{ coins: number[]; gems: number[]; stars: number[] }>({ coins: [], gems: [], stars: [] })

  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // Track active (controlled) footballer per human
  const activeRef = useRef<number[]>(
    players.map((_, i) => {
      const st = stateRef.current
      const f = st.footballers.find(f2 => f2.isHuman && f2.controlIndex === i)
      return f ? f.id : -1
    })
  )

  // ── Keyboard events ──
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key)
      // Prevent Tab default
      if (e.key === 'Tab') e.preventDefault()
    }
    const onUp = (e: KeyboardEvent) => { keysRef.current.delete(e.key) }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [])

  // ── Find nearest teammate to ball ──
  function nearestTeammate(st: MatchState, team: number, excludeId: number): Footballer | null {
    let best: Footballer | null = null
    let bestD = Infinity
    for (const f of st.footballers) {
      if (f.team !== team || f.id === excludeId) continue
      const d = dist(f, st.ball)
      if (d < bestD) { bestD = d; best = f }
    }
    return best
  }

  // ── Main game loop ──
  useEffect(() => {
    let raf = 0
    let lastTime = performance.now()
    const FPS = 60
    const frameDur = 1000 / FPS

    function update() {
      raf = requestAnimationFrame(update)
      if (pauseRef.current) return

      const now = performance.now()
      if (now - lastTime < frameDur) return
      lastTime = now

      const st = stateRef.current
      if (st.gameOver) return

      frameRef.current++

      // ── Timer ──
      if (frameRef.current % FPS === 0 && !st.goalScored) {
        st.timeLeft--
        if (st.timeLeft <= 0) {
          st.timeLeft = 0
          st.gameOver = true
          if (st.score[0] > st.score[1]) st.winner = 0
          else if (st.score[1] > st.score[0]) st.winner = 1
          else st.winner = null

          // Award stars
          if (st.winner != null) {
            st.footballers.filter(f => f.isHuman && f.team === st.winner).forEach(f => {
              st.stars[f.controlIndex]++
            })
          }

          setGameOver(true)
          setWinText(st.winner === 0 ? 'Team Red wins!' : st.winner === 1 ? 'Team Blue wins!' : 'Draw!')
          setCurrencyDisplay({ coins: [...st.coins], gems: [...st.gems], stars: [...st.stars] })
          return
        }
      }

      const pb = pitchBounds()
      const gy = goalY()
      const keys = keysRef.current
      const currentPads = padsRef.current

      // ── Goal scored pause ──
      if (st.goalScored) {
        st.goalTimer--
        if (st.goalTimer <= 0) resetPositions(st)
        return
      }

      // ── Process human input ──
      players.forEach((p, pi) => {
        const activeId = activeRef.current[pi]
        const f = st.footballers.find(f2 => f2.id === activeId)
        if (!f) return

        let mx = 0, my = 0
        let shooting = false
        let tackling = false
        let switching = false

        if (p.input.type === 'keyboard') {
          const g = p.input.group
          for (const [key, mapping] of Object.entries(KB_MAP)) {
            if (mapping.group !== g) continue
            if (!keys.has(key)) continue
            switch (mapping.action) {
              case 'up': my -= 1; break
              case 'down': my += 1; break
              case 'left': mx -= 1; break
              case 'right': mx += 1; break
              case 'shoot': shooting = true; break
              case 'tackle': tackling = true; break
              case 'switch': switching = true; break
            }
          }
        } else if (p.input.type === 'gamepad') {
          const gp = currentPads.find(pad => pad.index === (p.input as { type: 'gamepad'; padIndex: number }).padIndex)
          if (gp) {
            if (gp.up) my -= 1
            if (gp.down) my += 1
            if (gp.left) mx -= 1
            if (gp.right) mx += 1
            if (gp.a) shooting = true
            if (gp.x) tackling = true
            if (gp.y) switching = true
          }
        }

        // Move
        if (mx !== 0 || my !== 0) {
          const n = norm(mx, my)
          f.vx = n.x * HUMAN_SPEED
          f.vy = n.y * HUMAN_SPEED
          f.facingX = n.x
          f.facingY = n.y
        } else {
          f.vx *= 0.8
          f.vy *= 0.8
        }

        // Shoot / Pass charge
        if (shooting) {
          chargeRef.current[pi] = Math.min(chargeRef.current[pi] + 1, MAX_CHARGE)
        } else if (chargeRef.current[pi] > 0) {
          // Release kick
          if (f.hasBall) {
            const power = PASS_POWER + (SHOOT_POWER - PASS_POWER) * (chargeRef.current[pi] / MAX_CHARGE)
            st.ball.vx = f.facingX * power
            st.ball.vy = f.facingY * power
            f.hasBall = false
            st.assistId = st.lastTouched
            st.lastTouched = f.id
            // Gem for skillful kick (charged > 50%)
            if (chargeRef.current[pi] > MAX_CHARGE * 0.5 && f.isHuman) {
              st.gems[f.controlIndex]++
            }
          }
          chargeRef.current[pi] = 0
        }

        // Tackle
        if (tackling) {
          // Lunge forward
          f.vx += f.facingX * TACKLE_LUNGE
          f.vy += f.facingY * TACKLE_LUNGE
          // Check nearby opponents with ball
          for (const opp of st.footballers) {
            if (opp.team === f.team || !opp.hasBall) continue
            if (dist(f, opp) < TACKLE_RANGE) {
              opp.hasBall = false
              st.ball.vx = f.facingX * 2
              st.ball.vy = f.facingY * 2
              // gem for successful tackle
              if (f.isHuman) st.gems[f.controlIndex]++
            }
          }
        }

        // Switch player
        if (switchCdRef.current[pi] > 0) switchCdRef.current[pi]--
        if (switching && switchCdRef.current[pi] === 0) {
          const nearest = nearestTeammate(st, f.team, f.id)
          if (nearest) {
            activeRef.current[pi] = nearest.id
            switchCdRef.current[pi] = SWITCH_COOLDOWN
          }
        }
      })

      // ── AI behaviour ──
      for (const f of st.footballers) {
        if (f.isHuman) continue
        const teamHasBall = st.footballers.some(t => t.team === f.team && t.hasBall)
        const isClosest = !st.footballers.some(t => t.team === f.team && t.id !== f.id && dist(t, st.ball) < dist(f, st.ball))
        const goalX = f.team === 0 ? pb.right : pb.left

        if (f.hasBall) {
          // Dribble toward opponent goal
          const n = norm(goalX - f.x, H / 2 - f.y)
          f.vx = n.x * AI_SPEED
          f.vy = n.y * AI_SPEED * 0.5
          f.facingX = n.x; f.facingY = n.y
          // Shoot if close to goal
          if (Math.abs(f.x - goalX) < 120) {
            st.ball.vx = f.facingX * SHOOT_POWER
            st.ball.vy = (Math.random() - 0.5) * 3
            f.hasBall = false
            st.assistId = st.lastTouched
            st.lastTouched = f.id
          }
        } else if (!teamHasBall && isClosest) {
          // Chase ball
          const n = norm(st.ball.x - f.x, st.ball.y - f.y)
          f.vx = n.x * AI_SPEED
          f.vy = n.y * AI_SPEED
          f.facingX = n.x; f.facingY = n.y
        } else {
          // Positional play
          const homeX = f.team === 0 ? pb.left + (pb.right - pb.left) * 0.35 : pb.left + (pb.right - pb.left) * 0.65
          const targetX = teamHasBall ? homeX + (goalX - homeX) * 0.3 : homeX
          const n = norm(targetX - f.x, H / 2 - f.y + (Math.sin(frameRef.current * 0.02 + f.id) * 60))
          f.vx = n.x * AI_SPEED * 0.5
          f.vy = n.y * AI_SPEED * 0.5
        }
      }

      // ── Move footballers ──
      for (const f of st.footballers) {
        f.x += f.vx
        f.y += f.vy
        f.vx *= 0.9
        f.vy *= 0.9
        // Clamp to pitch
        f.x = Math.max(pb.left + PLAYER_R, Math.min(pb.right - PLAYER_R, f.x))
        f.y = Math.max(pb.top + PLAYER_R, Math.min(pb.bottom - PLAYER_R, f.y))
      }

      // ── Ball pickup ──
      if (!st.footballers.some(f => f.hasBall)) {
        let closest: Footballer | null = null
        let closestD = PLAYER_R + BALL_R + 2
        for (const f of st.footballers) {
          const d = dist(f, st.ball)
          if (d < closestD) { closestD = d; closest = f }
        }
        if (closest) {
          closest.hasBall = true
          st.ball.vx = 0; st.ball.vy = 0
          if (st.lastTouched !== closest.id) {
            st.assistId = st.lastTouched
          }
          st.lastTouched = closest.id
        }
      }

      // ── Ball physics ──
      if (!st.footballers.some(f => f.hasBall)) {
        st.ball.x += st.ball.vx
        st.ball.y += st.ball.vy
        st.ball.vx *= FRICTION
        st.ball.vy *= FRICTION
        if (Math.abs(st.ball.vx) < 0.05) st.ball.vx = 0
        if (Math.abs(st.ball.vy) < 0.05) st.ball.vy = 0

        // Bounce off top/bottom
        if (st.ball.y - BALL_R < pb.top) { st.ball.y = pb.top + BALL_R; st.ball.vy = Math.abs(st.ball.vy) * BALL_BOUNCE }
        if (st.ball.y + BALL_R > pb.bottom) { st.ball.y = pb.bottom - BALL_R; st.ball.vy = -Math.abs(st.ball.vy) * BALL_BOUNCE }

        // Check goals
        const inGoalY = st.ball.y > gy && st.ball.y < gy + GOAL_H
        // Left goal (team 1 scores)
        if (st.ball.x - BALL_R < pb.left && inGoalY) {
          st.score[1]++
          st.goalScored = true
          st.goalTimer = 90
          awardGoalCurrency(st, 1)
        }
        // Right goal (team 0 scores)
        else if (st.ball.x + BALL_R > pb.right && inGoalY) {
          st.score[0]++
          st.goalScored = true
          st.goalTimer = 90
          awardGoalCurrency(st, 0)
        }
        // Bounce off side walls (not goal area)
        else if (st.ball.x - BALL_R < pb.left || st.ball.x + BALL_R > pb.right) {
          st.ball.vx *= -BALL_BOUNCE
          if (st.ball.x - BALL_R < pb.left) st.ball.x = pb.left + BALL_R
          if (st.ball.x + BALL_R > pb.right) st.ball.x = pb.right - BALL_R
        }
      } else {
        // Ball follows carrier
        const carrier = st.footballers.find(f => f.hasBall)!
        st.ball.x = carrier.x + carrier.facingX * (PLAYER_R + BALL_R)
        st.ball.y = carrier.y + carrier.facingY * (PLAYER_R + BALL_R)
      }

      // Update display
      const mins = Math.floor(st.timeLeft / 60)
      const secs = st.timeLeft % 60
      setScoreDisplay([...st.score] as [number, number])
      setTimeDisplay(`${mins}:${secs.toString().padStart(2, '0')}`)
      setCurrencyDisplay({ coins: [...st.coins], gems: [...st.gems], stars: [...st.stars] })
    }

    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [players])

  function awardGoalCurrency(st: MatchState, scoringTeam: number) {
    // Coin for scorer
    const scorer = st.footballers.find(f => f.id === st.lastTouched && f.team === scoringTeam)
    if (scorer?.isHuman) st.coins[scorer.controlIndex]++
    // Gem for assist
    if (st.assistId >= 0 && st.assistId !== st.lastTouched) {
      const assister = st.footballers.find(f => f.id === st.assistId && f.team === scoringTeam)
      if (assister?.isHuman) st.gems[assister.controlIndex]++
    }
  }

  // ── Render ──
  useEffect(() => {
    let raf = 0
    function draw() {
      raf = requestAnimationFrame(draw)
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const st = stateRef.current

      canvas.width = W
      canvas.height = H

      const pb = pitchBounds()
      const gy = goalY()
      const pitchW = pb.right - pb.left
      const pitchH = pb.bottom - pb.top

      // ── Pitch background ──
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#2d6a4f'
      ctx.fillRect(pb.left, pb.top, pitchW, pitchH)

      // ── Pitch lines ──
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'
      ctx.lineWidth = 2
      // Outline
      ctx.strokeRect(pb.left, pb.top, pitchW, pitchH)
      // Center line
      ctx.beginPath()
      ctx.moveTo(W / 2, pb.top); ctx.lineTo(W / 2, pb.bottom); ctx.stroke()
      // Center circle
      ctx.beginPath()
      ctx.arc(W / 2, H / 2, 40, 0, Math.PI * 2); ctx.stroke()
      // Center dot
      ctx.fillStyle = '#fff'
      ctx.beginPath(); ctx.arc(W / 2, H / 2, 3, 0, Math.PI * 2); ctx.fill()

      // Penalty areas
      const penW = 60, penH = 140
      ctx.strokeRect(pb.left, H / 2 - penH / 2, penW, penH)
      ctx.strokeRect(pb.right - penW, H / 2 - penH / 2, penW, penH)

      // Goal areas (smaller box)
      const goalAreaW = 25, goalAreaH = 80
      ctx.strokeRect(pb.left, H / 2 - goalAreaH / 2, goalAreaW, goalAreaH)
      ctx.strokeRect(pb.right - goalAreaW, H / 2 - goalAreaH / 2, goalAreaW, goalAreaH)

      // ── Goals ──
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      // Left goal
      ctx.fillRect(pb.left - GOAL_W, gy, GOAL_W, GOAL_H)
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.strokeRect(pb.left - GOAL_W, gy, GOAL_W, GOAL_H)
      // Right goal
      ctx.fillRect(pb.right, gy, GOAL_W, GOAL_H)
      ctx.strokeRect(pb.right, gy, GOAL_W, GOAL_H)

      // ── Footballers ──
      for (const f of st.footballers) {
        // Team ring
        ctx.beginPath()
        ctx.arc(f.x, f.y, PLAYER_R + 2, 0, Math.PI * 2)
        ctx.fillStyle = f.ringColor
        ctx.fill()

        // Player body
        ctx.beginPath()
        ctx.arc(f.x, f.y, PLAYER_R, 0, Math.PI * 2)
        ctx.fillStyle = f.color
        ctx.fill()

        // Active highlight (white outline)
        if (activeRef.current.includes(f.id)) {
          ctx.strokeStyle = '#fff'
          ctx.lineWidth = 2.5
          ctx.beginPath()
          ctx.arc(f.x, f.y, PLAYER_R + 4, 0, Math.PI * 2)
          ctx.stroke()
        }

        // Facing indicator
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(f.x, f.y)
        ctx.lineTo(f.x + f.facingX * (PLAYER_R + 4), f.y + f.facingY * (PLAYER_R + 4))
        ctx.stroke()
      }

      // ── Ball ──
      ctx.beginPath()
      ctx.arc(st.ball.x, st.ball.y, BALL_R, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 1
      ctx.stroke()

      // Ball shadow
      ctx.beginPath()
      ctx.ellipse(st.ball.x + 2, st.ball.y + 3, BALL_R, BALL_R * 0.5, 0, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0,0,0,0.2)'
      ctx.fill()

      // ── Charge bar ──
      players.forEach((_, pi) => {
        if (chargeRef.current[pi] > 0) {
          const af = st.footballers.find(f => f.id === activeRef.current[pi])
          if (af) {
            const pct = chargeRef.current[pi] / MAX_CHARGE
            ctx.fillStyle = 'rgba(0,0,0,0.5)'
            ctx.fillRect(af.x - 15, af.y - PLAYER_R - 10, 30, 4)
            ctx.fillStyle = pct > 0.7 ? '#e74c3c' : '#f1c40f'
            ctx.fillRect(af.x - 15, af.y - PLAYER_R - 10, 30 * pct, 4)
          }
        }
      })

      // ── Goal flash ──
      if (st.goalScored) {
        ctx.fillStyle = `rgba(255,255,100,${0.3 * Math.sin(frameRef.current * 0.3)})`
        ctx.fillRect(0, 0, W, H)
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 48px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('GOAL!', W / 2, H / 2)
      }
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [players])

  // ── Restart ──
  const handleRestart = useCallback(() => {
    stateRef.current = createState(players, config)
    frameRef.current = 0
    chargeRef.current = players.map(() => 0)
    switchCdRef.current = players.map(() => 0)
    activeRef.current = players.map((_, i) => {
      const st = stateRef.current
      const f = st.footballers.find(f2 => f2.isHuman && f2.controlIndex === i)
      return f ? f.id : -1
    })
    setGameOver(false)
    setWinText('')
  }, [players, config])

  // Keyboard restart
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gameOver && (e.key === ' ' || e.key === 'Enter')) handleRestart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameOver, handleRestart])

  return (
    <div className={styles.container}>
      {/* Scoreboard */}
      <div className={styles.scoreboard}>
        <div className={styles.scoreItem}>
          <span className={styles.scoreColor} style={{ background: '#e74c3c' }} />
          <span>Red</span>
          <span className={styles.scoreValue}>{scoreDisplay[0]}</span>
        </div>
        <div className={styles.scoreItem} style={{ fontSize: '1.2rem', fontWeight: 700 }}>
          {timeDisplay}
        </div>
        <div className={styles.scoreItem}>
          <span className={styles.scoreColor} style={{ background: '#3498db' }} />
          <span>Blue</span>
          <span className={styles.scoreValue}>{scoreDisplay[1]}</span>
        </div>
      </div>

      {/* Per-player currency */}
      {players.length > 0 && (
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#ccc' }}>
          {players.map((p, i) => (
            <div key={p.index} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <span style={{ color: p.color || PLAYER_COLORS[p.index], fontWeight: 700 }}>{p.name}</span>
              <span title="Coins (goals)">🪙{currencyDisplay.coins[i] ?? 0}</span>
              <span title="Gems (assists/skills)">💎{currencyDisplay.gems[i] ?? 0}</span>
              <span title="Stars (wins)">⭐{currencyDisplay.stars[i] ?? 0}</span>
            </div>
          ))}
        </div>
      )}

      <canvas ref={canvasRef} width={W} height={H} className={styles.canvas}  role="img" aria-label="Sensible Soccer canvas"/>

      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          <p className={styles.winnerText}>🏆 {winText}</p>
          <p style={{ color: '#aaa' }}>
            {scoreDisplay[0]} – {scoreDisplay[1]}
          </p>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#ccc', marginTop: '0.5rem' }}>
            {players.map((p, i) => (
              <div key={p.index}>
                <span style={{ color: p.color || PLAYER_COLORS[p.index], fontWeight: 600 }}>{p.name}: </span>
                🪙{currencyDisplay.coins[i] ?? 0} 💎{currencyDisplay.gems[i] ?? 0} ⭐{currencyDisplay.stars[i] ?? 0}
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
          <p className={styles.overlayHint}>{t('miniGames.pressRestart', 'Press Space or Enter to restart')}</p>
        </div>
      )}
    </div>
  )
}
