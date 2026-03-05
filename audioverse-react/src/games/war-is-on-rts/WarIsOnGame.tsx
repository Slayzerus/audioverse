import type { GameConfig } from '../../pages/games/mini/types'
/**
 * WarIsOnGame - Medieval RTS using Tiny Swords sprite pack.
 *
 * Controls (per keyboard group):
 *   Group 0: WASD move, Space build, T train, E rally, Q retreat, R cycle
 *   Group 1: Arrows move, Enter build, . train, Shift rally, Ctrl retreat, / cycle
 * Gamepads: left stick move, A build, B cycle, X rally, Y retreat
 *
 * Resources: Gold (mines), Wood (trees), Meat (sheep). Stars (victories).
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type PlayerSlot } from '../../pages/games/mini/types'
import { useGamepads } from '../../pages/games/mini/useGamepads'
import { usePause } from '../../pages/games/mini/usePause'
import PauseMenu from '../../pages/games/mini/PauseMenu'
import styles from '../../pages/games/mini/SharedGame.module.css'
import useTinySwordsSprites from '../../common/sprites/useTinySwordsSprites2'
import { initState } from './initState'
import { drawFrame } from './renderer'
import { gameTick, type InputState } from './gameLogic'
import type { GameState, PlayerState } from './types'
import { useGameFocusLock } from '../../hooks/useGameFocusLock'

// Component
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function WarIsOnGame({ players, config = {}, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState>(initState(players, config))
  const spr = useTinySwordsSprites()
  const keysRef = useRef<Set<string>>(new Set())
  const [hud, setHud] = useState<PlayerState[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // Keyboard input
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => { keysRef.current.add(e.key) }
    const onUp = (e: KeyboardEvent) => { keysRef.current.delete(e.key) }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [])

  // Main game loop
  useEffect(() => {
    const DT = 1000 / 30
    let timer = 0

    function tick() {
      if (pauseRef.current) { timer = window.setTimeout(tick, DT); return }
      const st = stateRef.current
      if (st.gameOver) return

      const input: InputState = {
        keys: keysRef.current,
        pads: padsRef.current.map(gp => ({
          index: gp.index, up: gp.up, down: gp.down,
          left: gp.left, right: gp.right,
          a: gp.a, b: gp.b, x: gp.x, y: gp.y,
        })),
      }

      gameTick(st, players, input)

      setHud([...st.players])
      if (st.gameOver) {
        setGameOver(true)
        if (st.winnerIdx != null) setWinner(st.players[st.winnerIdx]?.name ?? null)
        return
      }

      timer = window.setTimeout(tick, DT)
    }

    timer = window.setTimeout(tick, DT)
    return () => clearTimeout(timer)
  // Mount-only effect — deps intentionally empty: game tick loop reads from stateRef and padsRef
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Render loop
  useEffect(() => {
    let raf = 0
    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { raf = requestAnimationFrame(draw); return }

      drawFrame(ctx, canvas, stateRef.current, spr)
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  // Render loop — restarts when sprite sheet loads; reads from stateRef
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spr])

  // Restart
  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, config)
    setGameOver(false)
    setWinner(null)
    setHud([])
  }, [players, config])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (gameOver && (e.key === ' ' || e.key === 'Enter')) handleRestart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameOver, handleRestart])

  const factionColorMap: Record<string, string> = {
    blue: '#3498db', red: '#e74c3c', purple: '#9b59b6', yellow: '#f1c40f',
  }

  return (
    <div className={styles.container}>
      <div className={styles.scoreboard}>
        {hud.map((p, i) => (
          <div key={i} className={`${styles.scoreItem} ${!p.alive ? styles.dead : ''}`}>
            <span className={styles.scoreColor} style={{ background: factionColorMap[p.factionColor] || '#888' }} />
            <span>{p.name}</span>
            <span title="Gold">&#x1FA99;{Math.floor(p.gold)}</span>
            <span title="Wood">&#x1FAB5;{Math.floor(p.wood)}</span>
            <span title="Meat">&#x1F356;{Math.floor(p.meat)}</span>
            <span title="Stars">&#x2B50;{p.stars}</span>
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className={styles.canvas}  role="img" aria-label="War Is On canvas"/>

      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && <p className={styles.winnerText}>&#x1F3C6; {winner} {t('miniGames.wins', 'wins')}!</p>}
          {!winner && <p className={styles.winnerText}>{t('miniGames.defeated', 'Defeated!')}</p>}
          <div style={{ display: 'flex', gap: '1rem', fontSize: '1.1rem' }}>
            {hud.map((p, i) => (
              <div key={i} style={{ color: factionColorMap[p.factionColor], textAlign: 'center' }}>
                <div>{p.name}</div>
                <div>&#x1FA99;{Math.floor(p.gold)} &#x1FAB5;{Math.floor(p.wood)} &#x1F356;{Math.floor(p.meat)} &#x2B50;{p.stars}</div>
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
