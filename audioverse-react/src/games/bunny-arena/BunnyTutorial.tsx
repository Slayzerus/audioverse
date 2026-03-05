/**
 * BunnyTutorial.tsx — In-game tutorial overlay for BunnyGame.
 *
 * Shows a step-by-step walkthrough of the core mechanics:
 * movement, pose (doggy/plank), leg-kick attacking, grab, and modes.
 * Each step has a translated title + description with navigation.
 * Completion is persisted to localStorage so it only shows once.
 */
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import css from './SharedGame.module.css'

interface Props {
  onComplete: () => void
}

const STORAGE_KEY = 'bunny-tutorial-completed'

interface TutorialStep {
  titleKey: string
  descKey: string
  icon: string
  /** Optional extra tip key shown below the description */
  tipKey?: string
}

const STEPS: TutorialStep[] = [
  {
    titleKey: 'bunny.tutorialWelcome',
    descKey: 'bunny.tutorialWelcomeDesc',
    icon: '🐰',
  },
  {
    titleKey: 'bunny.tutorialMovement',
    descKey: 'bunny.tutorialMovementDesc',
    icon: '🏃',
  },
  {
    titleKey: 'bunny.tutorialStand',
    descKey: 'bunny.tutorialStandDesc',
    icon: '🧍',
  },
  {
    titleKey: 'bunny.tutorialAttack',
    descKey: 'bunny.tutorialAttackDesc',
    icon: '🦵',
    tipKey: 'bunny.tutorialAttackTip',
  },
  {
    titleKey: 'bunny.tutorialGrab',
    descKey: 'bunny.tutorialGrabDesc',
    icon: '🤝',
  },
  {
    titleKey: 'bunny.tutorialModes',
    descKey: 'bunny.tutorialModesDesc',
    icon: '🎮',
  },
]

export function isTutorialCompleted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export default function BunnyTutorial({ onComplete }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)

  const finish = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch { /* Expected: localStorage may be full or unavailable */ }
    onComplete()
  }, [onComplete])

  // Allow skip with any key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        finish()
      } else if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (step < STEPS.length - 1) setStep(s => s + 1)
        else finish()
      } else if (e.key === 'ArrowLeft') {
        if (step > 0) setStep(s => s - 1)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [step, finish])

  const s = STEPS[step]

  return (
    <div className={css.tutorialOverlay}>
      <div className={css.tutorialCard}>
        <div className={css.tutorialIcon}>{s.icon}</div>
        <h2 className={css.tutorialTitle}>{t(s.titleKey)}</h2>
        <p className={css.tutorialDesc}>{t(s.descKey)}</p>
        {s.tipKey && (
          <p className={css.tutorialTip}>💡 {t(s.tipKey)}</p>
        )}

        <div className={css.tutorialProgress}>
          {t('bunny.tutorialStep', { current: step + 1, total: STEPS.length })}
        </div>

        <div className={css.tutorialNav}>
          {step > 0 && (
            <button className={css.tutorialBtn} onClick={() => setStep(s => s - 1)}>
              ← {t('bunny.tutorialPrev')}
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button className={css.tutorialBtn} onClick={() => setStep(s => s + 1)}>
              {t('bunny.tutorialNext')} →
            </button>
          ) : (
            <button className={css.tutorialBtnPrimary} onClick={finish}>
              {t('bunny.tutorialFinish')} ✓
            </button>
          )}
        </div>

        <div className={css.tutorialSkip}>
          <button className={css.tutorialSkipBtn} onClick={finish}>
            {t('bunny.tutorialSkip')}
          </button>
        </div>
      </div>
    </div>
  )
}
