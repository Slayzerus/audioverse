/**
 * SimonGame — 2-8 players. Watch a color sequence, then repeat it. Wrong = eliminated. Last alive wins.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PLAYER_COLORS, type GameConfig, PlayerSlot } from './types'
import { useGamepads } from './useGamepads'
import { KEY_LOOKUP, gamepadDir } from './inputMaps'
import css from './SharedGame.module.css'
import { usePause } from './usePause'
import PauseMenu from './PauseMenu'
import { useGameFocusLock } from '../../../hooks/useGameFocusLock'

const W = 640, H = 480
const SIMON_COLORS = ['up', 'down', 'left', 'right'] as const
const COLOR_MAP: Record<string, { hex: string; label: string }> = {
  up: { hex: '#e74c3c', label: '⬆ RED' },
  down: { hex: '#3498db', label: '⬇ BLUE' },
  left: { hex: '#2ecc71', label: '⬅ GREEN' },
  right: { hex: '#f1c40f', label: '➡ YELLOW' },
}

interface P { idx: number; name: string; color: string; alive: boolean; input: PlayerSlot['input']; step: number }

function dirFromInput(dx: number, dy: number): string | null {
  if (dy < 0) return 'up'; if (dy > 0) return 'down'; if (dx < 0) return 'left'; if (dx > 0) return 'right'
  return null
}

export default function SimonGame({ players, config: _config, onBack }: { players: PlayerSlot[]; config?: GameConfig; onBack: () => void }) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [winner, setWinner] = useState<string | null>(null)
  const pads = useGamepads();const padsRef=useRef(pads);padsRef.current=pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: !!winner })
  const state = useRef({
    ps: players.map(p => ({ idx: p.index, name: p.name, color: p.color || PLAYER_COLORS[p.index] || '#fff', alive: true, input: p.input, step: 0 })) as P[],
    sequence: [SIMON_COLORS[Math.floor(Math.random() * 4)]] as string[],
    phase: 'show' as 'show' | 'input' | 'next',
    showIdx: 0, timer: 0, flash: '', msg: '', keys: new Set<string>(), prevDirs: new Map<number, string | null>()
  })

  const restart = useCallback(() => {
    state.current = {
      ps: players.map(p => ({ idx: p.index, name: p.name, color: p.color || PLAYER_COLORS[p.index] || '#fff', alive: true, input: p.input, step: 0 })),
      sequence: [SIMON_COLORS[Math.floor(Math.random() * 4)]],
      phase: 'show', showIdx: 0, timer: 0, flash: '', msg: '', keys: new Set(), prevDirs: new Map()
    }; setWinner(null)
  }, [players])

  useEffect(() => {
    const kd = (e: KeyboardEvent) => state.current.keys.add(e.code)
    const ku = (e: KeyboardEvent) => state.current.keys.delete(e.code)
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku)
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku) }
  }, [])

  useEffect(() => {
    if (winner) return
    const id = setInterval(() => {
      if (pauseRef.current) return
      const s = state.current; s.timer++
      const padsSnap = padsRef.current

      if (s.phase === 'show') {
        s.msg = 'Watch the pattern...'
        if (s.timer % 40 === 0) {
          if (s.showIdx < s.sequence.length) { s.flash = s.sequence[s.showIdx]; s.showIdx++ }
          else { s.phase = 'input'; s.timer = 0; s.flash = ''; s.ps.forEach(p => { if (p.alive) p.step = 0 }); s.prevDirs.clear() }
        }
        if (s.timer % 40 === 20) s.flash = ''
      } else if (s.phase === 'input') {
        s.msg = 'Your turn! Repeat the pattern.'
        for (const p of s.ps) {
          if (!p.alive || p.step >= s.sequence.length) continue
          let dir: string | null = null
          if (p.input.type === 'keyboard') {
            for (const [code, v] of KEY_LOOKUP) if (v.group === (p.input as { type: 'keyboard'; group: number }).group && s.keys.has(code)) dir = dirFromInput(v.dir.dx, v.dir.dy)
          } else { const gp = padsSnap[(p.input as { type: 'gamepad'; padIndex: number }).padIndex]; if (gp) { const d = gamepadDir(gp); if (d) dir = dirFromInput(d.dx, d.dy) } }
          const prev = s.prevDirs.get(p.idx)
          if (dir && dir !== prev) {
            if (dir === s.sequence[p.step]) { p.step++; s.flash = dir }
            else { p.alive = false; s.msg = `${p.name} eliminated!` }
          }
          s.prevDirs.set(p.idx, dir)
        }
        const alive = s.ps.filter(p => p.alive)
        if (alive.length <= 1 && s.ps.length > 1) { setWinner(alive[0] ? alive[0].name : 'Draw'); return }
        // All alive players completed?
        if (alive.every(p => p.step >= s.sequence.length)) { s.phase = 'next'; s.timer = 0 }
        if (s.timer > 300) { /* timeout - eliminate slowest */ s.ps.filter(p => p.alive && p.step < s.sequence.length).forEach(p => p.alive = false) }
      } else if (s.phase === 'next') {
        s.msg = 'Correct! Next round...'
        if (s.timer > 60) {
          s.sequence.push(SIMON_COLORS[Math.floor(Math.random() * 4)])
          s.phase = 'show'; s.showIdx = 0; s.timer = 0; s.flash = ''
        }
      }

      // Draw
      const ctx = canvasRef.current?.getContext('2d'); if (!ctx) return
      ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, W, H)
      // Four color quadrants
      const qSize = 100, cx = W / 2, cy = H / 2
      for (const [dir, info] of Object.entries(COLOR_MAP)) {
        const ox = dir === 'left' ? -qSize - 10 : dir === 'right' ? 10 : -qSize / 2
        const oy = dir === 'up' ? -qSize - 10 : dir === 'down' ? 10 : -qSize / 2
        ctx.globalAlpha = s.flash === dir ? 1 : 0.3
        ctx.fillStyle = info.hex; ctx.fillRect(cx + ox, cy + oy, qSize, qSize)
      }
      ctx.globalAlpha = 1
      // Message
      ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(s.msg, W / 2, 40)
      // Sequence length
      ctx.fillStyle = '#aaa'; ctx.font = '14px monospace'; ctx.fillText(`Length: ${s.sequence.length}`, W / 2, H - 10)
      // Player status
      const gap = W / (s.ps.length + 1)
      for (let i = 0; i < s.ps.length; i++) {
        const p = s.ps[i]
        ctx.fillStyle = p.alive ? p.color : '#555'; ctx.font = '14px monospace'; ctx.textAlign = 'center'
        ctx.fillText(`${p.name}${p.alive ? '' : ' ✗'}`, gap * (i + 1), H - 30)
      }
    }, 1000 / 60)
    return () => clearInterval(id)
  }, [winner, pads, players])

  return (<div className={css.container}>
    <canvas ref={canvasRef} width={W} height={H} className={css.canvas}  role="img" aria-label="Simon canvas"/>
    {isPaused && (
      <PauseMenu
        onResume={resume}
        onBack={onBack}
        players={players}
      />
    )}
    {winner && <div className={css.overlay}><div className={css.winnerText}>{winner} {t('miniGames.wins', 'wins')}!</div>
      <div className={css.overlayActions}><button className={css.restartBtn} onClick={restart}>{t('miniGames.restart', 'Restart')}</button>
        <button className={css.backBtnOverlay} onClick={onBack}>{t('miniGames.back', 'Back')}</button></div></div>}
  </div>)
}
