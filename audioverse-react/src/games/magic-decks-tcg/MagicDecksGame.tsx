import type { GameConfig } from '../../pages/games/mini/types'
/**
 * MagicDecksGame — Pokemon-style TCG with 6 elements, 3-stage evolution,
 * real sprite art, element-themed particles, passive/active abilities,
 * 5-lane real-time combat, deck building, bot AI, co-op boss mode.
 *
 * Now with: tutorial overlay, contextual hints, battle-result tracking.
 *
 * Controls:
 *   Group 0: A/D select card, W/S select lane, Space play card, E evolve
 *   Group 1: ←/→ select card, ↑/↓ select lane, Enter play card, / evolve
 *   Gamepads: D-pad navigate, A play card, B evolve
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PLAYER_COLORS, type PlayerSlot } from '../../pages/games/mini/types'
import { useGamepads } from '../../pages/games/mini/useGamepads'
import { usePause } from '../../pages/games/mini/usePause'
import PauseMenu from '../../pages/games/mini/PauseMenu'
import styles from './SharedGame.module.css'
import type { GameState, BattleResult, AutoPlayMode } from './types'
import { initState, gameTick, playCard, evolveCreature, LANES, tickAutoPlay } from './gameLogic'
import { draw as drawFrame, drawGameOver, drawControls, W, H } from './renderer'
import { initTutorial, tickTutorial, isTutorialPausing, type TutorialState } from './tutorial'
import { initHintState, tickHints, getCurrentHintKey, dismissHint, type HintState } from './hints'
import TutorialOverlay from './TutorialOverlay'
import { useGameFocusLock } from '../../hooks/useGameFocusLock'

// ─── Component ───────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
  /** Called when the game ends with a result summary */
  onBattleEnd?: (result: BattleResult) => void
}

export default function MagicDecksGame({ players, config = {}, onBack, onBattleEnd }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState>(initState(players, config))
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const pads = useGamepads()
  const padsRef = useRef(pads); padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // Tutorial & hints
  const isTutorial = config.isTutorial === true
  const tutorialRef = useRef<TutorialState | null>(isTutorial ? initTutorial() : null)
  const hintsRef = useRef<HintState>(initHintState())
  const [, forceUpdate] = useState(0)

  // Battle result tracking
  const resultReported = useRef(false)

  // Auto-play
  const [autoPlay, setAutoPlay] = useState<AutoPlayMode>('off')
  const autoPlayRef = useRef<AutoPlayMode>('off')
  useEffect(() => { autoPlayRef.current = autoPlay }, [autoPlay])

  // ── Keyboard input ──────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (pauseRef.current) return
      const st = stateRef.current; if (st.gameOver) return

      // Tutorial: Space/Enter advances step
      if (tutorialRef.current && isTutorialPausing(tutorialRef.current)) {
        if (e.key === ' ' || e.key === 'Enter') {
          forceUpdate(n => n + 1)
        }
        return
      }

      const keyMap: Record<string, { group: number; action: string }> = {
        a: { group: 0, action: 'left' }, d: { group: 0, action: 'right' },
        w: { group: 0, action: 'up' }, s: { group: 0, action: 'down' },
        ' ': { group: 0, action: 'play' },
        e: { group: 0, action: 'evolve' },
        ArrowLeft: { group: 1, action: 'left' }, ArrowRight: { group: 1, action: 'right' },
        ArrowUp: { group: 1, action: 'up' }, ArrowDown: { group: 1, action: 'down' },
        Enter: { group: 1, action: 'play' },
        '/': { group: 1, action: 'evolve' },
      }
      const m = keyMap[e.key]; if (!m) return
      for (const p of st.players) {
        if (p.input.type !== 'keyboard' || p.input.group !== m.group) continue
        if (m.action === 'left') p.selectedCard = Math.max(0, p.selectedCard - 1)
        else if (m.action === 'right') p.selectedCard = Math.min(p.hand.length - 1, p.selectedCard + 1)
        else if (m.action === 'up') p.selectedLane = Math.max(0, p.selectedLane - 1)
        else if (m.action === 'down') p.selectedLane = Math.min(LANES - 1, p.selectedLane + 1)
        else if (m.action === 'play') playCard(st, p, performance.now())
        else if (m.action === 'evolve') evolveCreature(st, p, p.selectedLane)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── Gamepad polling ─────────────────────────────────────
  useEffect(() => {
    const held = new Map<number, Set<string>>()
    let raf = 0
    function poll() {
      if (!pauseRef.current && !stateRef.current.gameOver) {
        const st = stateRef.current
        for (const p of st.players) {
          if (p.input.type !== 'gamepad') continue
          const pi = (p.input as { type: 'gamepad'; padIndex: number }).padIndex
          const gp = padsRef.current.find(g => g.index === pi); if (!gp) continue
          if (!held.has(pi)) held.set(pi, new Set())
          const h = held.get(pi)!
          const dirs: [boolean, string][] = [
            [gp.left, 'l'], [gp.right, 'r'], [gp.up, 'u'], [gp.down, 'd'],
            [gp.a, 'a'], [gp.b, 'b'],
          ]
          for (const [pressed, key] of dirs) {
            if (pressed && !h.has(key)) {
              h.add(key)
              if (key === 'l') p.selectedCard = Math.max(0, p.selectedCard - 1)
              else if (key === 'r') p.selectedCard = Math.min(p.hand.length - 1, p.selectedCard + 1)
              else if (key === 'u') p.selectedLane = Math.max(0, p.selectedLane - 1)
              else if (key === 'd') p.selectedLane = Math.min(LANES - 1, p.selectedLane + 1)
              else if (key === 'a') playCard(st, p, performance.now())
              else if (key === 'b') evolveCreature(st, p, p.selectedLane)
            }
            if (!pressed) h.delete(key)
          }
        }
      }
      raf = requestAnimationFrame(poll)
    }
    raf = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ── Main game loop + render (requestAnimationFrame) ─────
  useEffect(() => {
    let raf = 0
    function loop() {
      const st = stateRef.current
      const tutPausing = tutorialRef.current && isTutorialPausing(tutorialRef.current)

      // --- tick logic ---
      if (!pauseRef.current && !st.gameOver && !tutPausing) {
        gameTick(st)

        // Tick tutorial
        if (tutorialRef.current) {
          tickTutorial(tutorialRef.current, st.tick)
        }

        // Tick hints (for human player 0)
        if (hintsRef.current.enabled && st.players[0]) {
          tickHints(hintsRef.current, st, st.players[0].index)
        }

        // Auto-play for human player 0
        if (autoPlayRef.current !== 'off' && st.players[0]?.input.type === 'keyboard') {
          tickAutoPlay(st, st.players[0], autoPlayRef.current)
        }
      }

      // --- check game over ---
      if (st.gameOver && !gameOver) {
        setGameOver(true)
        if (st.winner === -1) setWinner('Team')
        else if (st.winner != null) {
          const w = st.players.find(p => p.index === st.winner)
          setWinner(w?.name ?? 'Player')
        }

        // Report battle result
        if (onBattleEnd && !resultReported.current) {
          resultReported.current = true
          const player = st.players[0]
          const won = st.winner === player?.index || st.winner === -1
          const result: BattleResult = {
            won,
            xpGained: 0,
            cardCaptured: null,
            damageDealt: st.events.filter(e => e.sourceOwner === player?.index && (e.kind === 'attack' || e.kind === 'directHit')).reduce((s, e) => s + e.value, 0),
            creaturesKilled: st.events.filter(e => e.kind === 'death' && e.sourceOwner !== player?.index).length,
            cardsPlayed: player?.discard.length ?? 0,
            turnsPlayed: Math.floor(st.tick / 60),
            isCampaign: !!config.isCampaign,
            chapterCompleted: false,
          }
          onBattleEnd(result)
        }
      }

      // --- render ---
      const cvs = canvasRef.current
      if (cvs) {
        const ctx = cvs.getContext('2d')
        if (ctx) {
          cvs.width = W; cvs.height = H
          drawFrame(ctx, st)
          drawControls(ctx, st)
          if (st.gameOver) drawGameOver(ctx, st)
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [gameOver])

  // ── Restart ─────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, config)
    resultReported.current = false
    if (isTutorial) tutorialRef.current = initTutorial()
    hintsRef.current = initHintState()
    setGameOver(false); setWinner(null)
  }, [players, config, isTutorial])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (gameOver && (e.key === ' ' || e.key === 'Enter')) handleRestart() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameOver, handleRestart])

  // Hint text
  const hintKey = getCurrentHintKey(hintsRef.current)

  return (
    <div className={styles.container}>
      <div className={styles.scoreboard}>
        {stateRef.current.players.map((p, i) => (
          <div key={i} className={`${styles.scoreItem} ${p.life <= 0 ? styles.dead : ''}`}>
            <span className={styles.scoreColor} style={{ background: players[i]?.color || PLAYER_COLORS[i] }} />
            <span>{players[i]?.name}</span>
            <span className={styles.scoreValue}>♥{Math.max(0, Math.ceil(p.life))} ⚡{p.mana} | 🪙{p.coins} 💎{p.gems} ⭐{p.stars}</span>
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className={styles.canvas} width={W} height={H}  role="img" aria-label="Magic Decks canvas"/>

      {/* Auto-play dropdown */}
      <div className={styles.autoPlayBar}>
        <label className={styles.autoPlayLabel}>
          🤖 {t('magicDecks.autoPlay.label', 'Auto-play')}:
        </label>
        <select
          className={styles.autoPlaySelect}
          value={autoPlay}
          onChange={e => setAutoPlay(e.target.value as AutoPlayMode)}
        >
          <option value="off">{t('magicDecks.autoPlay.off', 'Off')}</option>
          <option value="expensive">{t('magicDecks.autoPlay.expensive', 'Most Expensive')}</option>
          <option value="cheap">{t('magicDecks.autoPlay.cheap', 'Cheapest')}</option>
          <option value="rarest">{t('magicDecks.autoPlay.rarest', 'Rarest → Expensive')}</option>
        </select>
      </div>

      {/* Tutorial overlay */}
      {tutorialRef.current && !tutorialRef.current.completed && (
        <TutorialOverlay
          tutorial={tutorialRef.current}
          canvasWidth={W}
          canvasHeight={H}
          onUpdate={() => forceUpdate(n => n + 1)}
        />
      )}

      {/* Hint bar */}
      {hintKey && !gameOver && (
        <div className={styles.hintBar} onClick={() => { dismissHint(hintsRef.current); forceUpdate(n => n + 1) }}>
          💡 {t(hintKey, 'Tip')}
        </div>
      )}

      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && <p className={styles.winnerText}>🏆 {winner} {t('miniGames.wins', 'wins')}!</p>}
          {!winner && <p className={styles.winnerText}>{stateRef.current.coopBoss ? 'Boss wins...' : 'Draw!'}</p>}
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
