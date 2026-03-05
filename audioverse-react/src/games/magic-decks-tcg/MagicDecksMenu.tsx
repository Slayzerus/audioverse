/**
 * MagicDecksMenu.tsx — Main menu for MagicDecks TCG.
 * Displays player profile, XP bar, and navigation to:
 * Tutorial, Campaign, Skirmish, Online, Collection, Deck Builder.
 */
import { useTranslation } from 'react-i18next'
import type { PlayerProfile, MenuScreen } from './types'
import { getXPProgress } from './progression'
import styles from './SharedGame.module.css'

interface Props {
  profile: PlayerProfile
  onNavigate: (screen: MenuScreen) => void
  onBack: () => void
}

export default function MagicDecksMenu({ profile, onNavigate, onBack }: Props) {
  const { t } = useTranslation()
  const xp = getXPProgress(profile)

  const menuItems: Array<{
    screen: MenuScreen; icon: string; titleKey: string; descKey: string
    locked?: boolean; lockKey?: string
  }> = [
    {
      screen: 'tutorial', icon: '📖',
      titleKey: 'magicDecks.menu.tutorial',
      descKey: 'magicDecks.menu.tutorialDesc',
    },
    {
      screen: 'campaign', icon: '⚔️',
      titleKey: 'magicDecks.menu.campaign',
      descKey: 'magicDecks.menu.campaignDesc',
    },
    {
      screen: 'skirmish', icon: '🎲',
      titleKey: 'magicDecks.menu.skirmish',
      descKey: 'magicDecks.menu.skirmishDesc',
    },
    {
      screen: 'online', icon: '🌐',
      titleKey: 'magicDecks.menu.online',
      descKey: 'magicDecks.menu.onlineDesc',
      locked: !profile.unlocks.includes('online_play') && profile.level < 10,
      lockKey: 'magicDecks.menu.onlineLock',
    },
    {
      screen: 'collection', icon: '🃏',
      titleKey: 'magicDecks.menu.collection',
      descKey: 'magicDecks.menu.collectionDesc',
    },
    {
      screen: 'deckBuilder', icon: '🔧',
      titleKey: 'magicDecks.menu.deckBuilder',
      descKey: 'magicDecks.menu.deckBuilderDesc',
    },
    {
      screen: 'shop', icon: '🛒',
      titleKey: 'magicDecks.menu.shop',
      descKey: 'magicDecks.menu.shopDesc',
    },
  ]

  return (
    <div className={styles.menuContainer}>
      <h1 className={styles.menuTitle}>
        {t('magicDecks.menu.title', '🃏 Magic Decks TCG')}
      </h1>
      <p className={styles.menuSubtitle}>
        {t('magicDecks.menu.subtitle', 'Collect cards, build decks, battle opponents!')}
      </p>

      {/* Profile bar */}
      <div className={styles.profileBar}>
        <span className={styles.profileName}>{profile.name}</span>
        <span className={styles.profileLevel}>
          {t('magicDecks.menu.level', 'Lv.')} {profile.level}
        </span>
        <div className={styles.xpBar}>
          <div className={styles.xpFill} style={{ width: `${xp.percent}%` }} />
        </div>
        <span className={styles.xpText}>
          {xp.current}/{xp.required} XP
        </span>
        <span className={styles.profileCurrency}>
          🪙 {profile.coins?.toLocaleString() ?? 0} | 💎 {profile.gems?.toLocaleString() ?? 0}
        </span>
      </div>

      {/* Menu grid */}
      <div className={styles.menuGrid}>
        {menuItems.map(item => (
          <div
            key={item.screen}
            className={`${styles.menuCard} ${item.locked ? styles.menuCardLocked : ''}`}
            onClick={() => !item.locked && onNavigate(item.screen)}
          >
            <span className={styles.menuCardIcon}>{item.icon}</span>
            <span className={styles.menuCardTitle}>{t(item.titleKey, item.titleKey)}</span>
            <span className={styles.menuCardDesc}>{t(item.descKey, item.descKey)}</span>
            {item.locked && item.lockKey && (
              <span className={styles.menuCardLock}>🔒 {t(item.lockKey, 'Unlock at level 10')}</span>
            )}
          </div>
        ))}
      </div>

      {/* Stats summary */}
      <p className={styles.menuSubtitle}>
        {t('magicDecks.menu.statsLine', 'Battles: {{total}} | Wins: {{wins}} | Cards: {{cards}}', {
          total: profile.stats.totalBattles,
          wins: profile.stats.wins,
          cards: new Set(profile.collection).size,
        })}
      </p>

      <button className={styles.menuBackBtn} onClick={onBack}>
        ← {t('miniGames.backToMenu', 'Back to Menu')}
      </button>
    </div>
  )
}
