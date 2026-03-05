/**
 * EightMinuteEmpireGame — Card-driven area-control strategy for 2-4 players.
 *
 * Based on the board game "Eight Minute Empire":
 *   - Grid map with territories, continents (row-regions)
 *   - Shared card market (6 visible cards, cost 0-5 coins by position)
 *   - Cards grant: Deploy armies, Move armies, Build cities, Gain coins,
 *     and permanent special abilities collected over the game
 *   - Two combat modes:
 *     • Classic: No combat during play — at game end, majority on
 *       each territory determines control. All armies stay on the board.
 *     • Immediate: When armies meet enemies, resolve battle right away.
 *   - Two turn modes:
 *     • Turn-based: Players take turns picking a card sequentially.
 *       After each round cards shift left (cheaper) and new cards fill.
 *     • Real-time: All players pick simultaneously — first come first served.
 *       Taken card is replaced immediately and remaining cards shift.
 *   - Win condition: After N rounds (turn-based) or a timer (real-time),
 *     score = territories controlled + continent bonuses + city bonuses
 *       + special ability points.
 *
 * Controls:
 *   Mouse: click cards to buy, click territories to deploy/move/build
 *   Keyboard: 1-6 buy card, WASD cursor, Space confirm, Esc cancel
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type PlayerSlot } from '../../pages/games/mini/types'
import { useGamepads } from '../../pages/games/mini/useGamepads'
import { usePause } from '../../pages/games/mini/usePause'
import PauseMenu from '../../pages/games/mini/PauseMenu'
import styles from './SharedGame.module.css'
import { useGameFocusLock } from '../../hooks/useGameFocusLock'

// Re-export types & data so existing consumers of DangeZoneGame keep working
export {
  type Terrain, ALL_TERRAINS, type CardAction, type SpecialAbility,
  ALL_ABILITIES, ALL_ACTIONS, ABILITY_LABELS,
  type MapTemplate, type CardDef, type Territory,
  CARD_TEMPLATES, createDeck, TERRAIN_COLORS,
} from './dangeZoneTypes'

import type { CardDef, GameState, MapTemplate } from './dangeZoneTypes'
import { TERRAIN_COLORS } from './dangeZoneTypes'
import {
  MARKET_SIZE, CARD_COSTS, TERRAIN_PASSABLE,
  initState, buyCard, executeAction, skipAction,
  advanceTurn, endGame, botTurn, calcScore, getController,
} from './dangeZoneLogic'

// ══════════════════════════════════════════════════════════════
//  CONSTANTS (rendering only)
// ══════════════════════════════════════════════════════════════
const CANVAS_W = 900
const CANVAS_H = 640

// ══════════════════════════════════════════════════════════════
//  COMPONENT
// ══════════════════════════════════════════════════════════════

interface Props {
  players: PlayerSlot[]
  config?: Record<string, string>
  customCards?: Omit<CardDef, 'id'>[]
  customMap?: MapTemplate
  onBack: () => void
}

export default function EightMinuteEmpireGame({ players, config = {}, customCards, customMap, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState>(initState(players, config, customCards, customMap))
  const [, forceUpdate] = useState(0)
  const rerender = useCallback(() => forceUpdate(n => n + 1), [])
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })
  const humanIndices = useRef(new Set(players.filter(p => p.joined).map(p => p.index)))

  // ─── Mouse click ────────────────────────────────────────
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const st = stateRef.current
    if (st.gameOver || pauseRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_W / rect.width
    const scaleY = CANVAS_H / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * scaleY

    // Card market click (bottom 120px)
    const marketY = CANVAS_H - 120
    if (my >= marketY) {
      const cardW = 130
      const totalW = MARKET_SIZE * cardW + (MARKET_SIZE - 1) * 8
      const startX = (CANVAS_W - totalW) / 2
      const idx = Math.floor((mx - startX) / (cardW + 8))
      if (idx >= 0 && idx < MARKET_SIZE) {
        const pi = st.turnMode === 'turn-based' ? st.currentPlayer : 0
        if (humanIndices.current.has(pi)) {
          if (buyCard(st, pi, idx)) {
            rerender()
            if (!st.players[pi].pendingAction) {
              if (st.turnMode === 'turn-based') advanceTurn(st)
              rerender()
            }
          }
        }
        return
      }
    }

    // Map territory click
    const mapLeft = 20, mapTop = 10
    const cellW = (CANVAS_W - 40) / st.cols
    const cellH = (CANVAS_H - 150) / st.rows
    const col = Math.floor((mx - mapLeft) / cellW)
    const row = Math.floor((my - mapTop) / cellH)
    if (col >= 0 && col < st.cols && row >= 0 && row < st.rows) {
      const pi = st.turnMode === 'turn-based' ? st.currentPlayer : 0
      if (humanIndices.current.has(pi) && st.players[pi].pendingAction) {
        const ok = executeAction(st, pi, col, row)
        if (ok && !st.players[pi].pendingAction) {
          if (st.turnMode === 'turn-based') advanceTurn(st)
        }
        rerender()
      }
    }
  }, [pauseRef, rerender])

  // ─── Keyboard ───────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (pauseRef.current) return
      const st = stateRef.current
      if (st.gameOver) {
        if (e.key === ' ' || e.key === 'Enter') {
          stateRef.current = initState(players, config, customCards, customMap)
          setGameOver(false); setWinner(null); rerender()
        }
        return
      }
      const pi = st.turnMode === 'turn-based' ? st.currentPlayer : 0
      if (!humanIndices.current.has(pi)) return
      const ps = st.players[pi]

      const numKey = parseInt(e.key)
      if (numKey >= 1 && numKey <= 6) {
        if (buyCard(st, pi, numKey - 1)) {
          if (!ps.pendingAction && st.turnMode === 'turn-based') advanceTurn(st)
        }
        rerender(); return
      }
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') ps.cursorRow = Math.max(0, ps.cursorRow - 1)
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') ps.cursorRow = Math.min(st.rows - 1, ps.cursorRow + 1)
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') ps.cursorCol = Math.max(0, ps.cursorCol - 1)
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') ps.cursorCol = Math.min(st.cols - 1, ps.cursorCol + 1)
      if (e.key === ' ' || e.key === 'Enter') {
        if (ps.pendingAction) {
          const ok = executeAction(st, pi, ps.cursorCol, ps.cursorRow)
          if (ok && !ps.pendingAction && st.turnMode === 'turn-based') advanceTurn(st)
          rerender()
        }
      }
      if (e.key === 'Escape') {
        if (ps.pendingAction) {
          skipAction(ps)
          if (st.turnMode === 'turn-based') advanceTurn(st)
          rerender()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pauseRef, players, config, customCards, customMap, rerender])

  // ─── Bot AI tick (turn-based) ──────────────────────────
  useEffect(() => {
    if (stateRef.current.turnMode !== 'turn-based') return
    const iv = setInterval(() => {
      if (pauseRef.current) return
      const st = stateRef.current
      if (st.gameOver) return
      const cp = st.currentPlayer
      if (!humanIndices.current.has(cp)) {
        botTurn(st, cp)
        const ps = st.players[cp]
        if (ps.pendingAction) skipAction(ps)
        advanceTurn(st)
        rerender()
      }
    }, 800)
    return () => clearInterval(iv)
  }, [pauseRef, rerender])

  // ─── Real-time timer ──────────────────────────────────
  useEffect(() => {
    if (stateRef.current.turnMode !== 'real-time') return
    const iv = setInterval(() => {
      if (pauseRef.current) return
      const st = stateRef.current
      if (st.gameOver) return
      if (Date.now() >= st.endTime) {
        endGame(st); setGameOver(true); setWinner(st.winner); rerender(); return
      }
      for (const ps of st.players) {
        if (!humanIndices.current.has(ps.index) && !ps.pendingAction && Math.random() < 0.15) {
          botTurn(st, ps.index)
          if (ps.pendingAction) skipAction(ps)
        }
      }
      rerender()
    }, 500)
    return () => clearInterval(iv)
  }, [pauseRef, rerender])

  // ─── Game over sync ────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      const st = stateRef.current
      if (st.gameOver && !gameOver) { setGameOver(true); setWinner(st.winner) }
    }, 300)
    return () => clearInterval(iv)
  }, [gameOver])

  // ─── Canvas render ─────────────────────────────────────
  useEffect(() => {
    let raf = 0
    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { raf = requestAnimationFrame(draw); return }
      const st = stateRef.current
      const now = Date.now()

      ctx.fillStyle = '#0a0a1a'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      // ── Map ──────────────────────────────────────────
      const mapLeft = 20, mapTop = 10
      const cellW = (CANVAS_W - 40) / st.cols
      const cellH = (CANVAS_H - 150) / st.rows

      for (let r = 0; r < st.rows; r++) {
        for (let c = 0; c < st.cols; c++) {
          const t = st.territories[r][c]
          const x = mapLeft + c * cellW
          const y = mapTop + r * cellH

          ctx.fillStyle = TERRAIN_COLORS[t.terrain]
          ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2)

          const ctrl = getController(t)
          if (ctrl >= 0) {
            ctx.globalAlpha = 0.25
            ctx.fillStyle = st.players[ctrl]?.color || '#888'
            ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2)
            ctx.globalAlpha = 1
          }

          // Continent border
          if (r > 0 && st.territories[r - 1][c].continent !== t.continent) {
            ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cellW, y); ctx.stroke()
          }

          ctx.strokeStyle = '#333'; ctx.lineWidth = 0.5
          ctx.strokeRect(x, y, cellW, cellH)

          if (!TERRAIN_PASSABLE[t.terrain]) {
            ctx.fillStyle = '#4488cc'; ctx.font = '14px sans-serif'
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
            ctx.fillText('~', x + cellW / 2, y + cellH / 2)
            continue
          }

          // Armies and cities
          let slot = 0
          for (let pi = 0; pi < st.players.length; pi++) {
            const ac = t.armies[pi], cc = t.cities[pi]
            if (ac <= 0 && cc <= 0) continue
            const slotX = x + 6 + (slot % 2) * (cellW / 2 - 4)
            const slotY = y + 6 + Math.floor(slot / 2) * 20
            if (cc > 0) {
              ctx.fillStyle = st.players[pi].color
              ctx.fillRect(slotX - 2, slotY - 1, 9, 9)
              ctx.strokeStyle = '#fff'; ctx.lineWidth = 1
              ctx.strokeRect(slotX - 2, slotY - 1, 9, 9)
            }
            if (ac > 0) {
              ctx.fillStyle = st.players[pi].color
              ctx.font = 'bold 12px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'
              ctx.fillText(`${ac}`, slotX + (cc > 0 ? 12 : 0), slotY - 1)
            }
            slot++
          }
        }
      }

      // Cursor
      const cp = st.turnMode === 'turn-based' ? st.currentPlayer : 0
      const curPs = st.players[cp]
      if (curPs && humanIndices.current.has(cp)) {
        const cx = mapLeft + curPs.cursorCol * cellW
        const cy = mapTop + curPs.cursorRow * cellH
        ctx.strokeStyle = curPs.color; ctx.lineWidth = 3
        ctx.setLineDash([6, 3])
        ctx.strokeRect(cx + 2, cy + 2, cellW - 4, cellH - 4)
        ctx.setLineDash([])
        if (curPs.moveSource) {
          const sx = mapLeft + curPs.moveSource.col * cellW
          const sy = mapTop + curPs.moveSource.row * cellH
          ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2; ctx.setLineDash([4, 4])
          ctx.strokeRect(sx + 3, sy + 3, cellW - 6, cellH - 6)
          ctx.setLineDash([])
        }
      }

      // ── Card Market ──────────────────────────────────
      const marketY = CANVAS_H - 120
      ctx.fillStyle = '#111'; ctx.fillRect(0, marketY, CANVAS_W, 120)
      ctx.strokeStyle = '#555'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(0, marketY); ctx.lineTo(CANVAS_W, marketY); ctx.stroke()

      const cardW = 130, cardH = 95
      const totalW = MARKET_SIZE * cardW + (MARKET_SIZE - 1) * 8
      const startX = (CANVAS_W - totalW) / 2

      for (let i = 0; i < MARKET_SIZE; i++) {
        const card = st.market[i]
        const cx = startX + i * (cardW + 8)
        const cy = marketY + 12
        const cost = CARD_COSTS[i]

        ctx.fillStyle = card ? '#1a2a3a' : '#0a0a0a'
        ctx.fillRect(cx, cy, cardW, cardH)
        ctx.strokeStyle = card ? '#446' : '#222'; ctx.lineWidth = 1.5
        ctx.strokeRect(cx, cy, cardW, cardH)

        // Cost badge
        ctx.fillStyle = cost === 0 ? '#2ecc71' : '#FFD700'
        ctx.beginPath(); ctx.arc(cx + 14, cy + 14, 12, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#000'; ctx.font = 'bold 12px sans-serif'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(String(cost), cx + 14, cy + 14)

        if (!card) {
          ctx.fillStyle = '#333'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'
          ctx.fillText('—', cx + cardW / 2, cy + cardH / 2)
          continue
        }

        ctx.font = '20px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(card.emoji, cx + cardW / 2, cy + 20)
        ctx.fillStyle = '#ddd'; ctx.font = 'bold 11px sans-serif'
        ctx.fillText(card.name, cx + cardW / 2, cy + 40)
        const actionLabel = card.action === 'deploy' ? `Deploy ${card.value}`
          : card.action === 'move' ? `Move ${card.value}`
          : card.action === 'build' ? 'Build City' : `Destroy ${card.value}`
        ctx.fillStyle = '#aaa'; ctx.font = '10px sans-serif'
        ctx.fillText(actionLabel, cx + cardW / 2, cy + 56)
        if (card.coins > 0) {
          ctx.fillStyle = '#FFD700'; ctx.fillText(`+${card.coins} coins`, cx + cardW / 2, cy + 70)
        }
        if (card.special) {
          ctx.fillStyle = '#9b59b6'; ctx.font = '9px sans-serif'
          ctx.fillText(`★ ${card.special}`, cx + cardW / 2, cy + 84)
        }
        ctx.fillStyle = '#555'; ctx.font = '9px monospace'; ctx.textAlign = 'right'
        ctx.fillText(`[${i + 1}]`, cx + cardW - 4, cy + 14)
      }

      // ── HUD ──────────────────────────────────────────
      const hudY = mapTop + st.rows * cellH + 2
      ctx.fillStyle = '#0d0d1a'; ctx.fillRect(0, hudY, CANVAS_W, marketY - hudY)

      if (curPs) {
        ctx.fillStyle = curPs.color; ctx.font = 'bold 13px sans-serif'
        ctx.textAlign = 'left'; ctx.textBaseline = 'top'
        const turnLabel = st.turnMode === 'turn-based'
          ? `Round ${st.round}/${st.maxRounds} — ${curPs.name}'s turn`
          : (() => {
              const rem = Math.max(0, st.endTime - now)
              const min = Math.floor(rem / 60_000)
              const sec = Math.floor((rem % 60_000) / 1000)
              return `Timer ${min}:${sec.toString().padStart(2, '0')} — Real-time`
            })()
        ctx.fillText(turnLabel, 10, hudY + 4)

        if (curPs.pendingAction) {
          ctx.fillStyle = '#FFD700'; ctx.font = '12px sans-serif'
          const msg = curPs.pendingAction.action === 'move' && curPs.actionStep === 0
            ? 'Select source territory for MOVE'
            : curPs.pendingAction.action === 'move' && curPs.actionStep === 1
            ? `Select destination (max ${curPs.pendingAction.value} steps) — Esc skip`
            : `Click territory to ${curPs.pendingAction.action.toUpperCase()} — Esc skip`
          ctx.fillText(msg, 10, hudY + 22)
        } else if (st.turnMode === 'turn-based' && humanIndices.current.has(cp)) {
          ctx.fillStyle = '#aaa'; ctx.font = '12px sans-serif'
          ctx.fillText('Buy a card (click or press 1-6)', 10, hudY + 22)
        }
      }

      // Player stats
      const statX = CANVAS_W - 10
      for (let i = st.players.length - 1; i >= 0; i--) {
        const p = st.players[i]
        const sy = hudY + 4 + i * 16
        p.score = calcScore(st, p.index)
        ctx.textAlign = 'right'; ctx.fillStyle = p.color
        ctx.font = 'bold 11px monospace'
        ctx.fillText(`${p.name}: coins ${p.coins}  VP:${p.score}  ★${p.abilities.length}`, statX, sy)
      }

      // Deck counter
      ctx.fillStyle = '#555'; ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'
      ctx.fillText(`Deck: ${st.deck.length} cards`, CANVAS_W / 2, CANVAS_H - 2)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, config, customCards, customMap)
    setGameOver(false); setWinner(null); rerender()
  }, [players, config, customCards, customMap, rerender])

  return (
    <div className={styles.container}>
      <div className={styles.scoreboard}>
        {stateRef.current.players.map(p => (
          <div key={p.index} className={styles.scoreItem}>
            <span className={styles.scoreColor} style={{ background: p.color }} />
            <span>{p.name}</span>
            <span className={styles.scoreValue}>VP:{p.score}</span>
          </div>
        ))}
      </div>
      <canvas
        ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
        className={styles.canvas} style={{ cursor: 'pointer' }}
        onClick={handleCanvasClick}
        aria-label="Danger Zone game canvas"
      />
      <div className={styles.controls}>
        <button className={styles.btn} onClick={handleRestart}>
          🔄 {t('miniGames.restart', 'Restart')}
        </button>
        <span className={styles.info}>
          {stateRef.current.turnMode === 'turn-based'
            ? '1-6: Buy card | WASD: Cursor | Space: Confirm | Esc: Skip'
            : 'Click cards to buy | Click map to act'}
        </span>
        <span className={styles.info}>
          Combat: {stateRef.current.combatMode === 'classic' ? 'Classic (endgame)' : 'Immediate'}
        </span>
        <button className={styles.btn} onClick={onBack}>
          ← {t('miniGames.back', 'Back')}
        </button>
      </div>
      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}
      {gameOver && (
        <div className={styles.overlay}>
          <h2>🏆 Game Over!</h2>
          {winner && <p className={styles.winnerText}>{winner} wins!</p>}
          <div style={{ color: '#aaa', fontSize: 14, margin: '8px 0' }}>
            {stateRef.current.players.map(p => (
              <div key={p.index} style={{ marginBottom: 4 }}>
                <span style={{ color: p.color }}>■</span> {p.name}: {p.score} VP
                {p.abilities.length > 0 && ` (★ ${p.abilities.length} abilities)`}
                {` · coins: ${p.coins}`}
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
          <p className={styles.overlayHint}>Press Space or Enter to restart</p>
        </div>
      )}
    </div>
  )
}