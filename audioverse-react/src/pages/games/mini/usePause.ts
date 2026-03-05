/**
 * usePause — hook that manages pause state for mini-games.
 *
 * Listens for ESC key and gamepad Start button.
 * Returns `isPaused` flag and a pause ref (for game loops to check without re-render).
 * When paused, the game loop should skip ticks and rendering.
 *
 * Usage:
 *   const { isPaused, pauseRef, resume, onSave, onSettings, onQuit } = usePause({ onBack })
 *   // In game loop: if (pauseRef.current) return
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useGamepads, useGamepadEdges } from './useGamepads'

export interface UsePauseOptions {
  /** Called when user chooses "Back to Menu" from pause menu */
  onBack: () => void
  /** If true, pause input is disabled (e.g. during game-over screen) */
  disabled?: boolean
}

export interface UsePauseResult {
  /** React state — true when game is paused */
  isPaused: boolean
  /** Ref for game-loop checks (no re-render needed) */
  pauseRef: React.RefObject<boolean>
  /** Resume gameplay */
  resume: () => void
  /** Toggle pause */
  togglePause: () => void
}

export function usePause({ onBack: _onBack, disabled = false }: UsePauseOptions): UsePauseResult {
  const [isPaused, setIsPaused] = useState(false)
  const pauseRef = useRef(false)

  const setPaused = useCallback((val: boolean) => {
    pauseRef.current = val
    setIsPaused(val)
  }, [])

  const resume = useCallback(() => setPaused(false), [setPaused])

  const togglePause = useCallback(() => {
    if (disabled) return
    setPaused(!pauseRef.current)
  }, [disabled, setPaused])

  // ── ESC key ─────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (disabled) return
      if (e.key === 'Escape') {
        e.preventDefault()
        setPaused(!pauseRef.current)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [disabled, setPaused])

  // ── Gamepad Start button ────────────────────────────────
  const pads = useGamepads()
  const padEdges = useGamepadEdges(pads)

  useEffect(() => {
    if (disabled) return
    for (const [, pressed] of padEdges) {
      if (pressed.has('start')) {
        setPaused(!pauseRef.current)
        break // one toggle per frame
      }
    }
  }, [padEdges, disabled, setPaused])

  return { isPaused, pauseRef, resume, togglePause }
}
