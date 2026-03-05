/**
 * EmpireCampaignMap — Chapter selection screen for Empire RTS campaign.
 * Shows 5 chapters with unlock/completion status and start buttons.
 */
import { useTranslation } from 'react-i18next'
import type { EmpireProfile, CampaignChapter } from './campaign'
import { getChaptersWithStatus } from './campaign'
import css from './SharedGame.module.css'

interface Props {
  profile: EmpireProfile
  onStartChapter: (chapter: CampaignChapter) => void
  onBack: () => void
}

export default function EmpireCampaignMap({ profile, onStartChapter, onBack }: Props) {
  const { t } = useTranslation()
  const chapters = getChaptersWithStatus(profile)

  return (
    <div className={css.menuContainer}>
      <h2 className={css.campaignTitle}>
        📜 {t('empire.campaignTitle', 'Campaign')}
      </h2>
      <p className={css.campaignDesc}>
        {t('empire.campaignDesc', 'Complete the chapters and conquer the realm')}
      </p>

      <div className={css.chapterList}>
        {chapters.map(({ chapter, unlocked, completed, current }, i) => (
          <div
            key={chapter.id}
            className={`${css.chapterCard} ${completed ? css.chapterDone : ''} ${!unlocked ? css.chapterLocked : ''} ${current ? css.chapterCurrent : ''}`}
          >
            <div className={css.chapterHeader}>
              <span className={css.chapterNum}>
                {t('empire.chapter', 'Chapter {{n}}', { n: i + 1 })}
              </span>
              <span className={css.chapterBadge}>
                {completed
                  ? `✅ ${t('empire.chCompleted', 'Completed')}`
                  : !unlocked
                    ? `🔒 ${t('empire.chLocked', 'Locked')}`
                    : `🎯 ${t('empire.chCurrent', 'Available')}`}
              </span>
            </div>

            <h3 className={css.chapterName}>{t(chapter.nameKey, chapter.id)}</h3>
            <p className={css.chapterDescText}>{t(chapter.descKey, '')}</p>

            <div className={css.chapterMeta}>
              <span>🌊 {chapter.wavesToSurvive} {t('empire.hudWave', 'waves')}</span>
              <span>⚙️ {chapter.difficulty === 1
                ? t('empire.diffEasy', 'Easy')
                : chapter.difficulty === 2
                  ? t('empire.diffNormal', 'Normal')
                  : t('empire.diffHard', 'Hard')}</span>
              {chapter.hasBoss && <span>👹 Boss</span>}
            </div>

            <div className={css.chapterResources}>
              {t('empire.chStartResources', 'Start: {{gold}}g {{wood}}w {{meat}}m', {
                gold: chapter.startGold, wood: chapter.startWood, meat: chapter.startMeat,
              })}
            </div>

            {/* Best record */}
            {profile.campaignProgress.bestWaves[chapter.id] != null && (
              <div className={css.chapterBest}>
                🏆 {t('empire.waveN', 'Wave {{wave}}', { wave: profile.campaignProgress.bestWaves[chapter.id] })}
                / {chapter.wavesToSurvive}
              </div>
            )}

            {unlocked && !completed && (
              <button
                className={css.chapterBtn}
                onClick={() => onStartChapter(chapter)}
              >
                ⚔️ {t('empire.play', 'Play')}
              </button>
            )}
            {completed && (
              <button
                className={`${css.chapterBtn} ${css.replayBtn}`}
                onClick={() => onStartChapter(chapter)}
              >
                🔄 Replay
              </button>
            )}
          </div>
        ))}
      </div>

      <div className={css.menuActions}>
        <button className={css.backBtn} onClick={onBack}>
          ← {t('miniGames.back', 'Back')}
        </button>
      </div>
    </div>
  )
}
