/**
 * MiniGamesPage — hub listing all available couch mini-games.
 * Links to /mini-games/:gameId for each game.
 * Games hidden via Feature Visibility are filtered out.
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MINI_GAMES } from './gameRegistry'
import { useFeatureVisibility } from '../../../hooks/useFeatureVisibility'
import styles from './MiniGamesPage.module.css'

export default function MiniGamesPage() {
  const { t } = useTranslation()
  const { isFeatureVisible } = useFeatureVisibility()

  // Filter out games hidden by admin (featureId = "game-<id>")
  const visibleGames = useMemo(
    () => MINI_GAMES.filter(g => isFeatureVisible(`game-${g.id}`)),
    [isFeatureVisible],
  )

  return (
    <div className={styles.hub}>
      <div className={styles.header}>
        <h1>🎮 {t('miniGames.title', 'Mini Games')}</h1>
        <p className={styles.subtitle}>
          {t('miniGames.subtitle', 'Couch multiplayer — keyboard & gamepads — up to 8 players')}
        </p>
      </div>

      <div className={styles.grid}>
        {visibleGames.map(game => (
          <Link key={game.id} to={`/mini-games/${game.id}`} className={styles.card}>
            <span className={styles.cardIcon}>{game.icon}</span>
            <span className={styles.cardTitle}>{game.title}</span>
            <span className={styles.cardDesc}>{game.description}</span>
            <span className={styles.cardPlayers}>
              {game.minPlayers === game.maxPlayers
                ? `${game.minPlayers} ${t('miniGames.players', 'players')}`
                : `${game.minPlayers}–${game.maxPlayers} ${t('miniGames.players', 'players')}`}
            </span>
          </Link>
        ))}
      </div>

      <Link to="/" className={styles.backLink}>
        ← {t('miniGames.backHome', 'Back to Home')}
      </Link>
    </div>
  )
}
