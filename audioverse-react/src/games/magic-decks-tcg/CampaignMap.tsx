/**
 * CampaignMap.tsx — Campaign progress screen for MagicDecks TCG.
 * Shows chapters, battle progress, and "szukanie zaczepki" (random encounter).
 */
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlayerProfile, CampaignBattle } from './types'
import { ELEMENT_ICONS } from './types'
import { getChaptersWithStatus } from './campaign'
import { generateSkirmishOpponent, type SkirmishOpponent } from './campaign'
import styles from './SharedGame.module.css'

interface Props {
  profile: PlayerProfile
  onStartBattle: (chapterId: string, battleIndex: number, battle: CampaignBattle) => void
  onStartSkirmish: (opponent: SkirmishOpponent) => void
  onBack: () => void
}

export default function CampaignMap({ profile, onStartBattle, onStartSkirmish, onBack }: Props) {
  const { t } = useTranslation()
  const chapters = getChaptersWithStatus(profile)
  const [skirmishOpp, setSkirmishOpp] = useState<SkirmishOpponent | null>(null)

  const handleSkirmish = useCallback(() => {
    const opp = generateSkirmishOpponent(profile)
    setSkirmishOpp(opp)
  }, [profile])

  return (
    <div className={styles.menuContainer}>
      <h2 className={styles.menuTitle}>
        {t('magicDecks.campaign.title', '⚔️ Campaign')}
      </h2>
      <p className={styles.menuSubtitle}>
        {t('magicDecks.campaign.subtitle', 'Battle through chapters to earn cards and XP')}
      </p>

      <div className={styles.campaignContainer}>
        {chapters.map(({ chapter, unlocked, completed, current }) => (
          <div
            key={chapter.id}
            className={`${styles.campaignChapter} ${
              completed ? styles.campaignChapterCompleted :
              current ? styles.campaignChapterCurrent :
              unlocked ? styles.campaignChapterUnlocked : ''
            }`}
          >
            <div className={styles.campaignHeader}>
              <span className={styles.campaignTitle}>
                {ELEMENT_ICONS[chapter.element]} {t(chapter.nameKey, chapter.id)}
              </span>
              {completed && (
                <span className={`${styles.campaignBadge} ${styles.campaignBadgeComplete}`}>
                  ✓ {t('magicDecks.campaign.complete', 'Complete')}
                </span>
              )}
              {current && !completed && (
                <span className={`${styles.campaignBadge} ${styles.campaignBadgeCurrent}`}>
                  {t('magicDecks.campaign.inProgress', 'In Progress')}
                </span>
              )}
              {!unlocked && (
                <span className={`${styles.campaignBadge} ${styles.campaignBadgeLocked}`}>
                  🔒 {t('magicDecks.campaign.requireLevel', 'Lv. {{level}}', { level: chapter.requiredLevel })}
                </span>
              )}
            </div>

            {unlocked && (
              <div className={styles.campaignBattles}>
                {chapter.battles.map((battle, idx) => {
                  const isDone = completed || (current && idx < profile.campaignProgress.currentBattleIndex)
                  const isActive = current && idx === profile.campaignProgress.currentBattleIndex && !completed
                  return (
                    <div
                      key={battle.id}
                      className={`${styles.campaignBattleNode} ${
                        isDone ? styles.campaignBattleDone :
                        isActive ? styles.campaignBattleActive : ''
                      } ${battle.isBoss ? styles.campaignBattleBoss : ''}`}
                      onClick={() => {
                        if (isActive) onStartBattle(chapter.id, idx, battle)
                      }}
                      title={t(battle.opponentNameKey, battle.id)}
                    >
                      {battle.isBoss ? '👑' : isDone ? '✓' : idx + 1}
                    </div>
                  )
                })}
              </div>
            )}

            {completed && (
              <div className={styles.campaignReward}>
                {t('magicDecks.campaign.reward', 'Reward')}: +{chapter.reward.xp} XP, {chapter.reward.cards.length} {t('magicDecks.campaign.cards', 'cards')}
              </div>
            )}
          </div>
        ))}

        {/* Skirmish / "szukanie zaczepki" */}
        <div className={styles.skirmishSection}>
          <h3>{t('magicDecks.campaign.skirmishTitle', '🎲 Looking for Trouble')}</h3>
          <p className={styles.menuSubtitle}>
            {t('magicDecks.campaign.skirmishDesc', 'Fight a random opponent at your level. Capture cards by defeating them decisively!')}
          </p>

          {skirmishOpp ? (
            <div style={{ marginTop: '0.5rem' }}>
              <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                {t(skirmishOpp.nameKey, skirmishOpp.name)}
              </p>
              <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                {t('magicDecks.campaign.oppLevel', 'Level {{level}}', { level: skirmishOpp.level })} · {skirmishOpp.elements.map(e => ELEMENT_ICONS[e]).join(' ')} · ♥{skirmishOpp.life}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.5rem' }}>
                <button className={styles.skirmishBtn} onClick={() => onStartSkirmish(skirmishOpp)}>
                  {t('magicDecks.campaign.fight', '⚔️ Fight!')}
                </button>
                <button className={styles.menuBackBtn} onClick={handleSkirmish}>
                  {t('magicDecks.campaign.reroll', '🔄 Different opponent')}
                </button>
              </div>
            </div>
          ) : (
            <button className={styles.skirmishBtn} onClick={handleSkirmish}>
              {t('magicDecks.campaign.lookForTrouble', '🎲 Find Opponent')}
            </button>
          )}
        </div>
      </div>

      <button className={styles.menuBackBtn} onClick={onBack}>
        ← {t('miniGames.back', 'Back')}
      </button>
    </div>
  )
}
