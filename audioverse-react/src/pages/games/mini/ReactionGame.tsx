/**
 * ReactionGame — Reaction speed test for 2-8 players.
 * Multiple rounds. Each round: screen turns green after random delay → first to press action key wins.
 * Press too early → eliminated for that round. Best of rounds wins.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PLAYER_COLORS, type GameConfig, PlayerSlot } from './types'
import { useGamepads } from './useGamepads'
import { ACTION_KEYS } from './inputMaps'
import { usePause } from './usePause'
import PauseMenu from './PauseMenu'
import css from './SharedGame.module.css'
import { useGameFocusLock } from '../../../hooks/useGameFocusLock'

const TOTAL_ROUNDS = 5, MIN_DELAY = 1200, MAX_DELAY = 4000
const W = 640, H = 480

type Phase = 'wait' | 'ready' | 'go' | 'result'

interface Props { players: PlayerSlot[]; config?: GameConfig; onBack: () => void }

export default function ReactionGame({ players, config: _config, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const phaseRef = useRef<Phase>('wait')
  const goTimeRef = useRef(0)
  const roundRef = useRef(0)
  const scoresRef = useRef<Map<number, number>>(new Map(players.map(p => [p.index, 0])))
  const eliminatedRef = useRef<Set<number>>(new Set())
  const roundWinnerRef = useRef<number | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [, forceUpdate] = useState(0)
  const pads = useGamepads(); const padsRef = useRef(pads); padsRef.current = pads
  const namesRef = useRef<Map<number,string>>(new Map(players.map(p => [p.index, p.name])))
  const [gameOver, setGameOver] = useState(false)
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  const startRound = useCallback(() => {
    eliminatedRef.current.clear()
    roundWinnerRef.current = null
    phaseRef.current = 'ready'
    forceUpdate(x => x + 1)
    const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY)
    timeoutRef.current = setTimeout(() => {
      phaseRef.current = 'go'; goTimeRef.current = performance.now()
      forceUpdate(x => x + 1)
    }, delay)
  }, [])

  const nextRound = useCallback(() => {
    roundRef.current++
    if (roundRef.current >= TOTAL_ROUNDS) { setGameOver(true); return }
    phaseRef.current = 'wait'
    forceUpdate(x => x + 1)
    setTimeout(startRound, 1500)
  }, [startRound])

  // Start first round
  useEffect(() => { setTimeout(startRound, 1000) }, [startRound])

  // Input handling
  useEffect(() => {
    const prevPad = new Map<number, boolean>()

    const handleAction = (playerIndex: number) => {
      const phase = phaseRef.current
      if (phase === 'result' || phase === 'wait') return
      if (eliminatedRef.current.has(playerIndex)) return

      if (phase === 'ready') {
        // Too early!
        eliminatedRef.current.add(playerIndex)
        forceUpdate(x => x + 1)
        return
      }

      if (phase === 'go' && roundWinnerRef.current === null) {
        roundWinnerRef.current = playerIndex
        const sc = scoresRef.current; sc.set(playerIndex, (sc.get(playerIndex) ?? 0) + 1)
        phaseRef.current = 'result'
        forceUpdate(x => x + 1)
        setTimeout(nextRound, 2000)
      }
    }

    const onDown = (e: KeyboardEvent) => {
      for (const [key, group] of ACTION_KEYS) {
        if (e.key === key) {
          const pl = players.find(p => p.input.type === 'keyboard' && (p.input as {type:'keyboard';group:number}).group === group)
          if (pl) handleAction(pl.index)
        }
      }
    }

    let raf = 0
    const poll = () => {
      for (const p of players) {
        if (p.input.type === 'gamepad') {
          const padIdx = (p.input as {type:'gamepad';padIndex:number}).padIndex
          const gp = padsRef.current.find(g => g.index === padIdx)
          const isPressed = gp?.a ?? false
          const wasPressed = prevPad.get(padIdx) ?? false
          if (isPressed && !wasPressed) handleAction(p.index)
          prevPad.set(padIdx, isPressed)
        }
      }
      raf = requestAnimationFrame(poll)
    }

    window.addEventListener('keydown', onDown)
    raf = requestAnimationFrame(poll)
    return () => { window.removeEventListener('keydown', onDown); cancelAnimationFrame(raf); if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [players, nextRound])

  // Render loop
  useEffect(() => {
    let raf = 0
    const loop = () => {
      if (pauseRef.current) { raf = requestAnimationFrame(loop); return }
      const c = canvasRef.current; if (!c) { raf = requestAnimationFrame(loop); return }
      const ctx = c.getContext('2d'); if (!ctx) { raf = requestAnimationFrame(loop); return }
      c.width = W; c.height = H
      const phase = phaseRef.current

      // Background
      if (phase === 'wait') ctx.fillStyle = '#111'
      else if (phase === 'ready') ctx.fillStyle = '#8b0000'
      else if (phase === 'go') ctx.fillStyle = '#006400'
      else ctx.fillStyle = '#111'
      ctx.fillRect(0, 0, W, H)

      ctx.textAlign = 'center'; ctx.fillStyle = '#fff'

      if (phase === 'wait') {
        ctx.font = '28px sans-serif'; ctx.fillText(`Round ${roundRef.current + 1} / ${TOTAL_ROUNDS}`, W / 2, H / 2 - 20)
        ctx.font = '18px sans-serif'; ctx.fillText('Get ready...', W / 2, H / 2 + 20)
      } else if (phase === 'ready') {
        ctx.font = 'bold 48px sans-serif'; ctx.fillText('WAIT...', W / 2, H / 2)
        ctx.font = '16px sans-serif'; ctx.fillText('(Don\'t press yet!)', W / 2, H / 2 + 40)
      } else if (phase === 'go') {
        ctx.font = 'bold 56px sans-serif'; ctx.fillText('GO!', W / 2, H / 2)
        const elapsed = performance.now() - goTimeRef.current
        ctx.font = '18px sans-serif'; ctx.fillText(`${(elapsed / 1000).toFixed(3)}s`, W / 2, H / 2 + 40)
      } else if (phase === 'result' && roundWinnerRef.current !== null) {
        ctx.font = '32px sans-serif'
        ctx.fillText(`${namesRef.current.get(roundWinnerRef.current)!} wins!`, W / 2, H / 2 - 20)
        const reactionMs = (performance.now() - goTimeRef.current)
        ctx.font = '18px sans-serif'
        ctx.fillText(`Reaction: ${(reactionMs / 1000).toFixed(3)}s`, W / 2, H / 2 + 20)
      }

      // Eliminated markers
      if (phase === 'ready' || phase === 'go') {
        const elim = eliminatedRef.current
        let ex = 20
        for (const idx of elim) {
          ctx.fillStyle = PLAYER_COLORS[idx]; ctx.font = '14px sans-serif'
          ctx.fillText(`${namesRef.current.get(idx)!} ❌ TOO EARLY`, ex + 60, H - 20); ex += 140
        }
      }

      // Scores
      const sc = scoresRef.current
      let sx = 10
      ctx.textAlign = 'left'
      for (const p of players) {
        ctx.fillStyle = PLAYER_COLORS[p.index]; ctx.font = 'bold 16px sans-serif'
        ctx.fillText(`${p.name}: ${sc.get(p.index) ?? 0}`, sx, 24); sx += 80
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [players])

  const restart = useCallback(() => {
    roundRef.current = 0; scoresRef.current = new Map(players.map(p => [p.index, 0]))
    eliminatedRef.current.clear(); roundWinnerRef.current = null; setGameOver(false)
    phaseRef.current = 'wait'; forceUpdate(x => x + 1)
    setTimeout(startRound, 1000)
  }, [players, startRound])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (gameOver && (e.key===' '||e.key==='Enter')) restart() }
    window.addEventListener('keydown', fn); return () => window.removeEventListener('keydown', fn)
  }, [gameOver, restart])

  const sorted = [...scoresRef.current.entries()].sort((a, b) => b[1] - a[1])

  return (
    <div className={css.container}>
      <canvas ref={canvasRef} className={css.canvas}  role="img" aria-label="Reaction canvas"/>
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
          <p className={css.winnerText}>⚡ {namesRef.current.get(sorted[0][0])!} {t('miniGames.wins','wins')}! ({sorted[0][1]}/{TOTAL_ROUNDS} rounds)</p>
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
