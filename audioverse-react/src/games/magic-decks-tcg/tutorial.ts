import type { GameConfig } from '../../pages/games/mini/types'
/**
 * tutorial.ts — Step-by-step tutorial battle system for MagicDecks TCG.
 * Manages tutorial progression, auto-play moments, and description display.
 */
import type { TutorialStep } from './types'
import { TUTORIAL_STEPS } from './constants'
import { LANES } from './gameLogic'

export interface TutorialState {
  active: boolean
  currentStep: number
  totalSteps: number
  steps: TutorialStep[]
  /** Tick when current step started */
  stepStartTick: number
  /** Steps already dismissed by the player */
  dismissedSteps: Set<number>
  /** Whether tutorial is pausing the game right now */
  isPausing: boolean
  /** Whether tutorial is finished */
  completed: boolean
}

/** Create initial tutorial state */
export function initTutorial(): TutorialState {
  return {
    active: true,
    currentStep: 0,
    totalSteps: TUTORIAL_STEPS.length,
    steps: TUTORIAL_STEPS,
    stepStartTick: 0,
    dismissedSteps: new Set(),
    isPausing: TUTORIAL_STEPS[0]?.pauseGame ?? false,
    completed: false,
  }
}

/** Get the current tutorial step (or null if done) */
export function getCurrentTutorialStep(tut: TutorialState): TutorialStep | null {
  if (!tut.active || tut.completed) return null
  return tut.steps[tut.currentStep] ?? null
}

/** Advance to the next tutorial step. Returns true if tutorial is now complete. */
export function advanceTutorialStep(tut: TutorialState): boolean {
  tut.dismissedSteps.add(tut.currentStep)
  tut.currentStep++
  if (tut.currentStep >= tut.totalSteps) {
    tut.completed = true
    tut.active = false
    tut.isPausing = false
    return true
  }
  const step = tut.steps[tut.currentStep]
  tut.isPausing = step?.pauseGame ?? false
  tut.stepStartTick = 0
  return false
}

/** Skip tutorial entirely */
export function skipTutorial(tut: TutorialState): void {
  tut.completed = true
  tut.active = false
  tut.isPausing = false
}

/** Called each game tick while tutorial is active */
export function tickTutorial(tut: TutorialState, gameTick: number): void {
  if (!tut.active || tut.completed) return
  const step = tut.steps[tut.currentStep]
  if (!step) return

  // Initialize step start tick
  if (tut.stepStartTick === 0) tut.stepStartTick = gameTick

  // Auto-advance if the step has autoAdvanceTicks
  if (step.autoAdvanceTicks > 0 && !step.pauseGame) {
    const elapsed = gameTick - tut.stepStartTick
    if (elapsed >= step.autoAdvanceTicks) {
      advanceTutorialStep(tut)
    }
  }
}

/** Should the game be paused (waiting for player to dismiss tutorial step)? */
export function isTutorialPausing(tut: TutorialState): boolean {
  return tut.active && tut.isPausing
}

/** Get highlight region coordinates for the current step's highlight target */
export function getTutorialHighlight(tut: TutorialState, canvasW: number, canvasH: number): {
  x: number; y: number; w: number; h: number
} | null {
  const step = getCurrentTutorialStep(tut)
  if (!step?.highlight) return null

  switch (step.highlight) {
    case 'hand':
      return { x: 30, y: canvasH - 95, w: canvasW - 60, h: 90 }
    case 'field':
      return { x: 80, y: canvasH / 2 - 5, w: LANES * 120 + 40, h: 75 }
    case 'mana':
      return { x: 5, y: canvasH / 2 - 30, w: 90, h: 60 }
    case 'lanes':
      return { x: 80, y: canvasH / 2 - 90, w: LANES * 120 + 40, h: 180 }
    case 'evolve':
      return { x: 80, y: canvasH / 2 - 5, w: LANES * 120 + 40, h: 75 }
    case 'spell':
      return { x: 30, y: canvasH - 95, w: canvasW - 60, h: 90 }
    case 'life':
      return { x: 5, y: 5, w: canvasW - 10, h: 35 }
    default:
      return null
  }
}

/** Create a very easy tutorial game config */
export function getTutorialConfig(): GameConfig {
  return {
    startingLife: 30,
    gameMode: 'duel',
    deckSize: 20,
    difficulty: 'easy',
    isTutorial: true,
  }
}
