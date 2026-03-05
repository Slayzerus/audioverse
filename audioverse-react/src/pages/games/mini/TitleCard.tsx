/**
 * TitleCard — animated intro screen shown before a mini-game starts.
 *
 * Displays the game icon, title, description and player count.
 * Auto-dismisses after `duration` ms, or on any key / gamepad press.
 * After dismissal plays a short wipe transition, then calls `onDone`.
 */
import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { MiniGameMeta } from './types'
import styles from './TitleCard.module.css'

interface TitleCardProps {
  game: MiniGameMeta
  playerCount: number
  /** ms to auto-dismiss (default 2500) */
  duration?: number
  onDone: () => void
}

export default function TitleCard({ game, playerCount, duration = 2500, onDone }: TitleCardProps) {
  const { t } = useTranslation()
  const [phase, setPhase] = useState<'title' | 'wipe' | 'done'>('title')

  const dismiss = useCallback(() => {
    if (phase !== 'title') return
    setPhase('wipe')
    setTimeout(() => {
      setPhase('done')
      onDone()
    }, 500) // wipe animation duration
  }, [phase, onDone])

  // Auto-dismiss timer
  useEffect(() => {
    const timer = setTimeout(dismiss, duration)
    return () => clearTimeout(timer)
  }, [dismiss, duration])

  // Skip on key / gamepad press
  useEffect(() => {
    const onKey = () => dismiss()
    window.addEventListener('keydown', onKey)
    window.addEventListener('gamepadconnected', onKey)

    // Also check gamepad buttons
    let raf: number
    const checkGamepad = () => {
      const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()) : []
      for (const gp of pads) {
        if (gp && gp.buttons.some(b => b.pressed)) {
          dismiss()
          return
        }
      }
      raf = requestAnimationFrame(checkGamepad)
    }
    raf = requestAnimationFrame(checkGamepad)

    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('gamepadconnected', onKey)
      cancelAnimationFrame(raf)
    }
  }, [dismiss])

  if (phase === 'done') return null

  if (phase === 'wipe') {
    return (
      <div className={styles.wipe}>
        <div className={`${styles.wipeBar} ${styles.wipeTop}`} />
        <div className={`${styles.wipeBar} ${styles.wipeBottom}`} />
      </div>
    )
  }

  return (
    <div className={styles.titleCard}>
      <div className={styles.titleIcon}>{game.icon}</div>
      <div className={styles.titleName}>{game.title}</div>
      <div className={styles.titleDesc}>{game.description}</div>
      <div className={styles.titlePlayers}>
        {playerCount} {t('miniGames.players', 'players')}
      </div>
      <div className={styles.titleSkip}>
        {t('miniGames.pressToSkip', 'Press any key to skip')}
      </div>
    </div>
  )
}
