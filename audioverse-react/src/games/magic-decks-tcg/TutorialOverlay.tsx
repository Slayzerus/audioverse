/**
 * TutorialOverlay.tsx — Step-by-step tutorial overlay during battles.
 * Shows highlighted areas, tooltip with description, and next/skip buttons.
 */
import { useTranslation } from 'react-i18next'
import type { TutorialState } from './tutorial'
import { getCurrentTutorialStep, advanceTutorialStep, skipTutorial, getTutorialHighlight } from './tutorial'
import styles from './SharedGame.module.css'

interface Props {
  tutorial: TutorialState
  canvasWidth: number
  canvasHeight: number
  onUpdate: () => void
}

export default function TutorialOverlay({ tutorial, canvasWidth, canvasHeight, onUpdate }: Props) {
  const { t } = useTranslation()
  const step = getCurrentTutorialStep(tutorial)
  if (!step) return null

  const highlight = getTutorialHighlight(tutorial, canvasWidth, canvasHeight)

  const handleNext = () => {
    advanceTutorialStep(tutorial)
    onUpdate()
  }

  const handleSkip = () => {
    skipTutorial(tutorial)
    onUpdate()
  }

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = { left: '50%', transform: 'translateX(-50%)' }
    switch (step.tooltipPosition) {
      case 'top': return { ...base, top: '40px' }
      case 'bottom': return { ...base, bottom: '40px' }
      case 'left': return { top: '50%', left: '20px', transform: 'translateY(-50%)' }
      case 'right': return { top: '50%', right: '20px', transform: 'translateY(-50%)' }
      case 'center':
      default: return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    }
  }

  return (
    <div className={styles.tutorialOverlay}>
      {/* Semi-transparent backdrop */}
      {step.pauseGame && <div className={styles.tutorialBackdrop} onClick={handleNext} />}

      {/* Highlight area */}
      {highlight && (
        <div
          className={styles.tutorialHighlight}
          style={{
            left: highlight.x,
            top: highlight.y,
            width: highlight.w,
            height: highlight.h,
          }}
        />
      )}

      {/* Tooltip */}
      <div className={styles.tutorialTooltip} style={getTooltipStyle()}>
        <div className={styles.tutorialTitle}>
          {t(step.titleKey, `Step ${step.id}`)}
        </div>
        <div className={styles.tutorialDesc}>
          {t(step.descriptionKey, 'Tutorial step description')}
        </div>
        <div className={styles.tutorialActions}>
          <span className={styles.tutorialStep}>
            {step.id}/{tutorial.totalSteps}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className={styles.tutorialSkipBtn} onClick={handleSkip}>
              {t('magicDecks.tutorial.skip', 'Skip')}
            </button>
            {step.pauseGame && (
              <button className={styles.tutorialNextBtn} onClick={handleNext}>
                {step.id < tutorial.totalSteps
                  ? t('magicDecks.tutorial.next', 'Next →')
                  : t('magicDecks.tutorial.finish', 'Start Playing!')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
