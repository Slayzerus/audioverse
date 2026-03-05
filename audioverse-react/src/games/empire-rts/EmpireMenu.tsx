/**
 * EmpireMenu — Main menu for Empire RTS
 * Shows profile level/XP, game mode buttons, and stats.
 */
import { useTranslation } from 'react-i18next'
import type { EmpireProfile } from './campaign'
import { getXPProgress } from './campaign'
import css from './SharedGame.module.css'

export type EmpireMenuScreen =
  | 'campaign' | 'skirmish' | 'endless' | 'pvp' | 'online' | 'quickPlay'

interface Props {
  profile: EmpireProfile
  onNavigate: (screen: EmpireMenuScreen) => void
  onBack: () => void
}

export default function EmpireMenu({ profile, onNavigate, onBack }: Props) {
  const { t } = useTranslation()
  const xp = getXPProgress(profile)

  const menuItems: Array<{
    icon: string
    label: string
    screen: EmpireMenuScreen
    locked?: boolean
    desc: string
  }> = [
    {
      icon: '📜', label: t('empire.campaign', 'Campaign'),
      screen: 'campaign', desc: t('empire.campaignDesc', 'Complete chapters and conquer the realm'),
    },
    {
      icon: '⚔️', label: t('empire.skirmish', 'Skirmish'),
      screen: 'skirmish', desc: t('empire.quickMatch', 'Quick match'),
    },
    {
      icon: '♾️', label: t('empire.endless', 'Endless Survival'),
      screen: 'endless', desc: t('empire.endless', 'Endless Survival'),
    },
    {
      icon: '🏴', label: t('empire.pvp', 'PvP'),
      screen: 'pvp', desc: t('empire.pvp', 'PvP'),
    },
    {
      icon: '🌐', label: t('empire.onlinePlay', 'Online'),
      screen: 'online', desc: t('empire.onlinePlay', 'Online'),
      locked: profile.level < 3,
    },
    {
      icon: '🎮', label: t('empire.play', 'Play'),
      screen: 'quickPlay', desc: t('empire.play', 'Play'),
    },
  ]

  return (
    <div className={css.menuContainer}>
      {/* Profile bar */}
      <div className={css.profileBar}>
        <span className={css.profileName}>🏰 {t('empire.title', 'Empire RTS')}</span>
        <span className={css.profileLevel}>Lv.{profile.level}</span>
        <div className={css.xpBarOuter}>
          <div className={css.xpBarInner} style={{ width: `${xp.percent}%` }} />
          <span className={css.xpText}>{xp.current}/{xp.required} XP</span>
        </div>
      </div>

      {/* Menu grid */}
      <div className={css.menuGrid}>
        {menuItems.map(item => (
          <button
            key={item.screen}
            className={`${css.menuCard} ${item.locked ? css.locked : ''}`}
            disabled={item.locked}
            onClick={() => !item.locked && onNavigate(item.screen)}
          >
            <span className={css.menuIcon}>{item.icon}</span>
            <span className={css.menuLabel}>{item.label}</span>
            {item.locked && <span className={css.lockBadge}>🔒 Lv.3</span>}
          </button>
        ))}
      </div>

      {/* Stats summary */}
      <div className={css.statsSummary}>
        <span>🎮 {profile.stats.totalGames}</span>
        <span>🏆 {profile.stats.totalWins}</span>
        <span>⚔️ {profile.stats.totalEnemiesSlain}</span>
        <span>🏗️ {profile.stats.totalBuildingsBuilt}</span>
        <span>♾️ {t('empire.statsTitle', 'Best')}: {t('empire.waveN', 'Wave {{wave}}', { wave: profile.stats.bestEndlessWave })}</span>
      </div>

      {/* Back */}
      <div className={css.menuActions}>
        <button className={css.backBtn} onClick={onBack}>
          ← {t('miniGames.back', 'Back')}
        </button>
      </div>
    </div>
  )
}
