/**
 * useGamePhase — wraps React useState for game phase with automatic
 * multi-window phase broadcasting and cleanup.
 *
 * Usage (drop-in replacement for useState in game pages):
 *   const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
 *
 * Automatically:
 *  - Broadcasts phase changes to all remote BroadcastChannel clients
 *  - Destroys the host service when the game page unmounts
 */

import { useState, useEffect, useCallback, type Dispatch, type SetStateAction } from 'react'
import { broadcastGamePhase, destroyHostService } from './useMultiWindow'

export function useGamePhase<T extends string>(
  initial: T
): [T, Dispatch<SetStateAction<T>>] {
  const [phase, _setPhase] = useState<T>(initial)

  // Wrap setPhase to also broadcast
  const setPhase = useCallback<Dispatch<SetStateAction<T>>>((action) => {
    _setPhase(prev => {
      const next = typeof action === 'function'
        ? (action as (prev: T) => T)(prev)
        : action
      if (next !== prev) {
        broadcastGamePhase(next)
      }
      return next
    })
  }, [])

  // Cleanup host service on game page unmount
  useEffect(() => {
    return () => { destroyHostService() }
  }, [])

  return [phase, setPhase]
}
