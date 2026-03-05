/**
 * MiniGameLobbyContext — persists couch mini-game players between games.
 *
 * Remembers who joined (name, color, input, profile player link) so players
 * don't have to re-join when switching between mini-games. Also loads profile
 * players from the backend for selection in the lobby.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { PlayerSlot } from '../pages/games/mini/types'
import { PLAYER_COLORS } from '../pages/games/mini/types'
import { useUser } from './UserContext'
import { ProfilePlayerService } from '../services/ProfilePlayerService'

/** Backend profile player shape (subset) */
export interface ProfilePlayerInfo {
  id: number
  name: string
  color: string
  isPrimary?: boolean
}

interface MiniGameLobbyContextType {
  /** Players that are currently "joined" across mini-game sessions */
  persistedPlayers: PlayerSlot[]
  /** Save a set of players after a lobby session */
  savePlayers: (players: PlayerSlot[]) => void
  /** Clear persisted players */
  clearPlayers: () => void
  /** Available profile players from backend */
  profilePlayers: ProfilePlayerInfo[]
  /** Reload profile players from backend */
  reloadProfilePlayers: () => Promise<void>
  /** Whether profile players are loading */
  profilePlayersLoading: boolean
}

const MiniGameLobbyContext = createContext<MiniGameLobbyContextType | undefined>(undefined)

const STORAGE_KEY = 'miniGameLobbyPlayers'

function loadPersistedPlayers(): PlayerSlot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
  } catch { /* Expected: localStorage or JSON parse may fail */ }
  return []
}

function savePersistedPlayers(players: PlayerSlot[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players))
  } catch { /* Expected: localStorage may be full or unavailable */ }
}

export const MiniGameLobbyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [persistedPlayers, setPersistedPlayers] = useState<PlayerSlot[]>(() => loadPersistedPlayers())
  const [profilePlayers, setProfilePlayers] = useState<ProfilePlayerInfo[]>([])
  const [profilePlayersLoading, setProfilePlayersLoading] = useState(false)
  const { currentUser } = useUser()
  const loadedRef = useRef(false)

  const getProfileId = useCallback((): number | undefined => {
    if (!currentUser) return undefined
    const u = currentUser as unknown as Record<string, unknown>
    return (u?.userProfileId ?? u?.profileId ?? (u?.userProfile as Record<string, unknown> | undefined)?.id ?? (u?.profile as Record<string, unknown> | undefined)?.id) as number | undefined
  }, [currentUser])

  const reloadProfilePlayers = useCallback(async () => {
    const pid = getProfileId()
    if (!pid) return
    setProfilePlayersLoading(true)
    try {
      const res = await ProfilePlayerService.getAll(pid)
      const list = (res || []).map((p: { id: number | string; name?: string; displayName?: string; color?: string; isPrimary?: boolean }) => ({
        id: p.id,
        name: p.name || p.displayName || `Player ${p.id}`,
        color: p.color || PLAYER_COLORS[0],
        isPrimary: !!p.isPrimary,
      }))
      setProfilePlayers(list)
    } catch {
      /* Expected: API may fail; keeping existing player list */
    } finally {
      setProfilePlayersLoading(false)
    }
  }, [getProfileId])

  // Auto-load profile players on auth
  useEffect(() => {
    if (currentUser && !loadedRef.current) {
      loadedRef.current = true
      reloadProfilePlayers()
    }
  }, [currentUser, reloadProfilePlayers])

  const savePlayers = useCallback((players: PlayerSlot[]) => {
    setPersistedPlayers(players)
    savePersistedPlayers(players)
  }, [])

  const clearPlayers = useCallback(() => {
    setPersistedPlayers([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <MiniGameLobbyContext.Provider value={{
      persistedPlayers, savePlayers, clearPlayers,
      profilePlayers, reloadProfilePlayers, profilePlayersLoading,
    }}>
      {children}
    </MiniGameLobbyContext.Provider>
  )
}

export function useMiniGameLobby() {
  const ctx = useContext(MiniGameLobbyContext)
  if (!ctx) throw new Error('useMiniGameLobby must be used within MiniGameLobbyProvider')
  return ctx
}
