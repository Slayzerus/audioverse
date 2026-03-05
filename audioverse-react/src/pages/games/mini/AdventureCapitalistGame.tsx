/**
 * AdventureCapitalistGame — idle/clicker investment game for 1-4 couch players.
 *
 * Controls:
 *   W/S or ArrowUp/ArrowDown — Select business
 *   Space/Enter — Collect profit
 *   E/Shift — Buy upgrade (level up)
 *   Q/Ctrl — Hire manager (auto-collect)
 *   I — Toggle instructions
 * Gamepads: stick up/down = select, A = collect, X = upgrade, Y = manager, Select = instructions.
 *
 * Rules:
 *  - 6 businesses per player, each with base cost, profit, cycle time
 *  - Hire managers to auto-collect; prestige at $1B for 2x multiplier
 *  - VS: most money after time limit wins. Coop: shared pool, reach target.
 *  - 3 currencies: coins (profit), gems (milestone bonuses), stars (prestige resets)
 */

import { useCallback, useEffect, useRef } from 'react'
import { useMiniGameFocusTrap } from '../../../hooks/useMiniGameFocusTrap'
import { useTranslation } from 'react-i18next'
import { PLAYER_COLORS, type GameConfig, PlayerSlot } from './types'
import { useGamepads } from './useGamepads'
import { usePause } from './usePause'
import PauseMenu from './PauseMenu'
import styles from './SharedGame.module.css'

// ─── Constants ───────────────────────────────────────────────
const W = 800
const H = 600
const PRESTIGE_THRESHOLD = 1_000_000_000

interface BusinessDef {
  name: string; baseCost: number; baseProfit: number; cycleMs: number
}

const BUSINESSES: BusinessDef[] = [
  { name: 'Lemonade Stand', baseCost: 4,        baseProfit: 4,        cycleMs: 1000 },
  { name: 'Newspaper',      baseCost: 60,       baseProfit: 60,       cycleMs: 3000 },
  { name: 'Car Wash',       baseCost: 720,      baseProfit: 720,      cycleMs: 6000 },
  { name: 'Pizza Delivery',  baseCost: 8640,     baseProfit: 8640,     cycleMs: 12000 },
  { name: 'Bank',           baseCost: 103680,   baseProfit: 103680,   cycleMs: 24000 },
  { name: 'Oil Company',    baseCost: 1244160,  baseProfit: 1244160,  cycleMs: 48000 },
]

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi']
function fmt(n: number): string {
  if (n < 1000) return `$${n.toFixed(n < 10 ? 1 : 0)}`
  let i = 0
  let v = n
  while (v >= 1000 && i < SUFFIXES.length - 1) { v /= 1000; i++ }
  return `$${v.toFixed(2)}${SUFFIXES[i]}`
}

// ─── Player business state ──────────────────────────────────
interface BizState {
  level: number; progress: number; hasManager: boolean
}
interface PState {
  money: number; coins: number; gems: number; stars: number
  prestigeMultiplier: number; selected: number
  businesses: BizState[]; showInstructions: boolean
}

function initPlayer(): PState {
  return {
    money: 4, coins: 0, gems: 0, stars: 0,
    prestigeMultiplier: 1, selected: 0, showInstructions: false,
    businesses: BUSINESSES.map(() => ({ level: 0, progress: 0, hasManager: false })),
  }
}

function bizCost(def: BusinessDef, level: number): number {
  return def.baseCost * Math.pow(2, level)
}
function bizProfit(def: BusinessDef, level: number, mult: number): number {
  return def.baseProfit * Math.max(level, 1) * mult
}
function managerCost(def: BusinessDef): number { return def.baseCost * 10 }

// ─── Keyboard maps ──────────────────────────────────────────
const KB_MAP: Record<string, { group: number; action: string }> = {
  w: { group: 0, action: 'up' }, s: { group: 0, action: 'down' },
  ' ': { group: 0, action: 'collect' }, Enter: { group: 0, action: 'collect' },
  e: { group: 0, action: 'buy' }, Shift: { group: 0, action: 'buy' },
  q: { group: 0, action: 'manager' }, Control: { group: 0, action: 'manager' },
  i: { group: 0, action: 'info' },
  ArrowUp: { group: 1, action: 'up' }, ArrowDown: { group: 1, action: 'down' },
}

interface Props { players: PlayerSlot[]; config?: GameConfig; onBack: () => void }

export default function AdventureCapitalistGame({ players, config = {}, onBack }: Props) {
  useTranslation()
  // Trap focus within the mini-game while active
  useMiniGameFocusTrap(true, 'adventure-capitalist-')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<PState[]>(players.map(() => initPlayer()))
  const gameOverRef = useRef(false)
  const elapsedRef = useRef(0)
  const lastTimeRef = useRef(0)
  const keysRef = useRef<Set<string>>(new Set())

  const gameMode = (config.gameMode as string) || 'idle'
  const timeLimit = ((config.timeLimit as number) || 5) * 60 * 1000
  const startingCash = (config.startingCash as number) || 100
  const isCoop = gameMode === 'coop-target'
  const isVs = gameMode === 'vs-race'
  const coopTarget = 1_000_000_000

  const { isPaused, pauseRef, resume } = usePause({ onBack })
  const pads = useGamepads()

  // Apply starting cash
  useEffect(() => {
    stateRef.current.forEach(p => { p.money = startingCash })
  }, [startingCash])

  // ── Keyboard input ────────────────────────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => { keysRef.current.add(e.key) }
    const onUp = (e: KeyboardEvent) => { keysRef.current.delete(e.key) }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [])

  // ── Process input actions ─────────────────────────────────
  const processedKeys = useRef<Set<string>>(new Set())

  const processInput = useCallback(() => {
    const states = stateRef.current
    const newKeys = new Set<string>()
    keysRef.current.forEach(k => { if (!processedKeys.current.has(k)) newKeys.add(k) })
    processedKeys.current = new Set(keysRef.current)

    for (const key of newKeys) {
      const mapping = KB_MAP[key]
      if (!mapping) continue
      const pi = players.findIndex(p => p.input.type === 'keyboard' && p.input.group === mapping.group)
      if (pi < 0) continue
      const ps = states[pi]
      applyAction(ps, mapping.action)
    }

    // Gamepad input
    pads.forEach((pad, gi) => {
      if (!pad) return
      const pi = players.findIndex(p => p.input.type === 'gamepad' && p.input.padIndex === gi)
      if (pi < 0) return
      const ps = states[pi]
      if (pad.up) applyAction(ps, 'up')
      if (pad.down) applyAction(ps, 'down')
      if (pad.a) applyAction(ps, 'collect')
      if (pad.x) applyAction(ps, 'buy')
      if (pad.y) applyAction(ps, 'manager')
      if (pad.select) applyAction(ps, 'info')
    })
  }, [players, pads])

  function applyAction(ps: PState, action: string) {
    if (action === 'up') ps.selected = Math.max(0, ps.selected - 1)
    else if (action === 'down') ps.selected = Math.min(BUSINESSES.length - 1, ps.selected + 1)
    else if (action === 'collect') {
      const biz = ps.businesses[ps.selected]
      if (biz.level > 0 && biz.progress >= 1) {
        const profit = bizProfit(BUSINESSES[ps.selected], biz.level, ps.prestigeMultiplier)
        ps.money += profit; ps.coins += Math.floor(profit / 100)
        biz.progress = 0
      }
    } else if (action === 'buy') {
      const idx = ps.selected; const def = BUSINESSES[idx]; const biz = ps.businesses[idx]
      const cost = bizCost(def, biz.level)
      if (ps.money >= cost) { ps.money -= cost; biz.level++ }
    } else if (action === 'manager') {
      const idx = ps.selected; const def = BUSINESSES[idx]; const biz = ps.businesses[idx]
      const cost = managerCost(def)
      if (ps.money >= cost && !biz.hasManager && biz.level > 0) { ps.money -= cost; biz.hasManager = true }
    } else if (action === 'info') {
      ps.showInstructions = !ps.showInstructions
    }
  }

  // ── Prestige ──────────────────────────────────────────────
  function tryPrestige(ps: PState) {
    if (ps.money >= PRESTIGE_THRESHOLD) {
      ps.stars++; ps.gems += 10
      ps.prestigeMultiplier *= 2
      ps.money = startingCash
      ps.businesses = BUSINESSES.map(() => ({ level: 0, progress: 0, hasManager: false }))
    }
  }

  // ── Main game loop ────────────────────────────────────────
  useEffect(() => {
    let raf = 0
    const loop = (time: number) => {
      raf = requestAnimationFrame(loop)
      if (pauseRef.current || gameOverRef.current) { lastTimeRef.current = time; return }
      const dt = lastTimeRef.current ? time - lastTimeRef.current : 16
      lastTimeRef.current = time
      elapsedRef.current += dt

      processInput()

      const states = stateRef.current

      // Update business progress
      for (const ps of states) {
        for (let i = 0; i < BUSINESSES.length; i++) {
          const biz = ps.businesses[i]
          if (biz.level <= 0) continue
          const def = BUSINESSES[i]
          biz.progress += dt / def.cycleMs
          if (biz.hasManager && biz.progress >= 1) {
            const profit = bizProfit(def, biz.level, ps.prestigeMultiplier)
            ps.money += profit; ps.coins += Math.floor(profit / 100)
            biz.progress = 0
          }
          biz.progress = Math.min(biz.progress, 1)
        }
        // Gem milestones
        if (ps.money >= 1_000_000 && ps.gems < 5) ps.gems = 5
        if (ps.money >= 100_000_000 && ps.gems < 20) ps.gems = 20
      }

      // Coop: shared pool
      if (isCoop) {
        const total = states.reduce((s, p) => s + p.money, 0)
        if (total >= coopTarget) gameOverRef.current = true
      }

      // VS: time limit
      if (isVs && elapsedRef.current >= timeLimit) gameOverRef.current = true

      draw()
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [processInput, pauseRef, isCoop, isVs, timeLimit])

  // ── Draw ──────────────────────────────────────────────────
  const draw = useCallback(() => {
    const cvs = canvasRef.current; if (!cvs) return
    const ctx = cvs.getContext('2d')!
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, W, H)

    const states = stateRef.current
    const colW = W / players.length

    for (let pi = 0; pi < players.length; pi++) {
      const ps = states[pi]
      const ox = pi * colW
      const color = PLAYER_COLORS[players[pi].index % PLAYER_COLORS.length]

      // Column separator
      if (pi > 0) { ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, H); ctx.stroke() }

      // Player header
      ctx.fillStyle = color; ctx.font = 'bold 13px monospace'
      ctx.fillText(players[pi].name, ox + 6, 18)
      ctx.fillStyle = '#eee'; ctx.font = '12px monospace'
      ctx.fillText(fmt(ps.money), ox + 6, 34)
      ctx.fillStyle = '#f1c40f'; ctx.fillText(`🪙${ps.coins}`, ox + 6, 50)
      ctx.fillStyle = '#9b59b6'; ctx.fillText(`💎${ps.gems}`, ox + colW * 0.35, 50)
      ctx.fillStyle = '#e74c3c'; ctx.fillText(`⭐${ps.stars}`, ox + colW * 0.65, 50)
      ctx.fillStyle = '#2ecc71'; ctx.font = '10px monospace'
      ctx.fillText(`x${ps.prestigeMultiplier}`, ox + 6, 64)

      // Prestige button
      if (ps.money >= PRESTIGE_THRESHOLD) {
        ctx.fillStyle = '#e74c3c'; ctx.fillRect(ox + colW - 70, 4, 64, 20)
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('PRESTIGE', ox + colW - 66, 18)
      }

      // Businesses
      const bizTop = 75; const bizH = 80; const pad = 6
      for (let bi = 0; bi < BUSINESSES.length; bi++) {
        const def = BUSINESSES[bi]; const biz = ps.businesses[bi]
        const by = bizTop + bi * (bizH + pad)
        const bw = colW - 12
        const isSelected = ps.selected === bi

        // Background
        ctx.fillStyle = isSelected ? '#2a2a4e' : '#16213e'
        ctx.fillRect(ox + 6, by, bw, bizH)
        if (isSelected) { ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(ox + 6, by, bw, bizH) }

        // Business name & level
        ctx.fillStyle = '#eee'; ctx.font = 'bold 11px monospace'
        ctx.fillText(`${def.name}`, ox + 12, by + 15)
        ctx.fillStyle = '#aaa'; ctx.font = '10px monospace'
        ctx.fillText(`Lv ${biz.level}`, ox + bw - 36, by + 15)

        // Profit info
        const profit = biz.level > 0 ? bizProfit(def, biz.level, ps.prestigeMultiplier) : 0
        ctx.fillStyle = '#2ecc71'; ctx.fillText(biz.level > 0 ? `${fmt(profit)}/${(def.cycleMs / 1000).toFixed(0)}s` : 'Not owned', ox + 12, by + 30)

        // Progress bar
        const barY = by + 36; const barH = 10; const barW = bw - 12
        ctx.fillStyle = '#333'; ctx.fillRect(ox + 12, barY, barW, barH)
        if (biz.level > 0) {
          const fillW = barW * Math.min(biz.progress, 1)
          ctx.fillStyle = biz.progress >= 1 ? '#27ae60' : '#3498db'
          ctx.fillRect(ox + 12, barY, fillW, barH)
        }

        // Buy button
        const cost = bizCost(def, biz.level)
        const canBuy = ps.money >= cost
        ctx.fillStyle = canBuy ? '#27ae60' : '#555'; ctx.fillRect(ox + 12, by + 52, 70, 18)
        ctx.fillStyle = '#fff'; ctx.font = '9px monospace'
        ctx.fillText(`Buy ${fmt(cost)}`, ox + 15, by + 65)

        // Manager button
        if (biz.level > 0 && !biz.hasManager) {
          const mCost = managerCost(def); const canM = ps.money >= mCost
          ctx.fillStyle = canM ? '#8e44ad' : '#555'; ctx.fillRect(ox + 90, by + 52, 70, 18)
          ctx.fillStyle = '#fff'; ctx.fillText(`Mgr ${fmt(mCost)}`, ox + 93, by + 65)
        } else if (biz.hasManager) {
          ctx.fillStyle = '#8e44ad'; ctx.font = '9px monospace'; ctx.fillText('AUTO', ox + 95, by + 65)
        }

        // Collect indicator
        if (biz.level > 0 && biz.progress >= 1 && !biz.hasManager) {
          ctx.fillStyle = '#f1c40f'; ctx.font = 'bold 10px monospace'
          ctx.fillText('READY!', ox + bw - 45, by + 65)
        }
      }

      // Instructions overlay
      if (ps.showInstructions) {
        ctx.fillStyle = 'rgba(0,0,0,0.88)'; ctx.fillRect(ox + 4, 70, colW - 8, H - 80)
        ctx.fillStyle = '#f1c40f'; ctx.font = 'bold 14px monospace'
        ctx.fillText('🎮 CONTROLS:', ox + 16, 100)
        ctx.fillStyle = '#eee'; ctx.font = '12px monospace'
        const lines = [
          '↑/↓ or W/S — Select business',
          'Space/Enter — Collect profit',
          'E — Buy upgrade',
          'Q — Hire manager (auto-collect)',
          'I — Toggle instructions',
          '',
          '📋 HOW TO PLAY:',
          'Invest in businesses, wait for profit,',
          'collect and reinvest! Hire managers',
          'to automate. Reach $1B to prestige!',
        ]
        lines.forEach((l, li) => {
          if (l.startsWith('📋')) { ctx.fillStyle = '#f1c40f'; ctx.font = 'bold 14px monospace' }
          else { ctx.fillStyle = '#eee'; ctx.font = '12px monospace' }
          ctx.fillText(l, ox + 16, 125 + li * 20)
        })
      }
    }

    // Timer for VS mode
    if (isVs) {
      const remaining = Math.max(0, timeLimit - elapsedRef.current)
      const sec = Math.ceil(remaining / 1000)
      const m = Math.floor(sec / 60); const s = sec % 60
      ctx.fillStyle = '#f1c40f'; ctx.font = 'bold 16px monospace'
      ctx.fillText(`⏱ ${m}:${s.toString().padStart(2, '0')}`, W / 2 - 40, H - 10)
    }

    // Game over overlay
    if (gameOverRef.current) {
      ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#f1c40f'; ctx.font = 'bold 36px monospace'; ctx.textAlign = 'center'
      ctx.fillText('GAME OVER', W / 2, H / 2 - 60)
      if (isCoop) {
        ctx.fillStyle = '#2ecc71'; ctx.font = '20px monospace'
        ctx.fillText('Target reached! Great teamwork!', W / 2, H / 2 - 20)
      } else if (isVs) {
        const winner = stateRef.current.reduce((best, p, i) =>
          p.money > (stateRef.current[best]?.money ?? 0) ? i : best, 0)
        ctx.fillStyle = PLAYER_COLORS[players[winner].index % PLAYER_COLORS.length]
        ctx.font = '22px monospace'
        ctx.fillText(`${players[winner].name} wins with ${fmt(stateRef.current[winner].money)}!`, W / 2, H / 2 - 10)
      }
      ctx.fillStyle = '#aaa'; ctx.font = '16px monospace'
      ctx.fillText('Press ESC to return', W / 2, H / 2 + 40)
      ctx.textAlign = 'left'
    }
  }, [players, isVs, isCoop, timeLimit])

  // ── Prestige key handler ──────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        stateRef.current.forEach(ps => tryPrestige(ps))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [startingCash])

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} width={W} height={H} className={styles.canvas}  role="img" aria-label="Adventure Capitalist canvas"/>
      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}
    </div>
  )
}
