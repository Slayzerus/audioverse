/**
 * PlayerLobby — couch-multiplayer join screen.
 *
 * Up to 8 players join via keyboard groups or gamepads.
 * Profile players from the backend can be assigned to slots.
 * Persists the last set of joined players via MiniGameLobbyContext.
 *
 * Keyboard groups (always available):
 *   Group 0: WASD + Space
 *   Group 1: Arrow keys + Enter
 *   Group 2: IJKL + U
 *   Group 3: Numpad 8456 + Numpad 0
 *
 * Gamepads: press A or Start to join (indices 0-7).
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PLAYER_COLORS, PLAYER_NAMES, type InputSource, type PlayerSlot } from './types'
import { useGamepads, useGamepadEdges } from './useGamepads'
import { useMiniGameLobby } from '../../../contexts/MiniGameLobbyContext'
import { useMultiWindowHost } from './useMultiWindow'
import { generateRoomId } from './multiWindow'
import styles from './PlayerLobby.module.css'

interface Props {
  minPlayers: number
  maxPlayers: number
  onStart: (players: PlayerSlot[]) => void
  onBack: () => void
  title: string
}

/** Keyboard groups and their "join" key */
const KB_GROUPS: { keys: Record<string, string>; joinKey: string; label: string }[] = [
  { keys: {}, joinKey: ' ',         label: 'WASD + Space' },
  { keys: {}, joinKey: 'Enter',     label: 'Arrows + Enter' },
  { keys: {}, joinKey: 'u',         label: 'IJKL + U' },
  { keys: {}, joinKey: '0',         label: 'Numpad 8456 + Num0' },
]

function createSlot(index: number, input: InputSource, name?: string, color?: string, profilePlayerId?: number): PlayerSlot {
  return {
    index,
    name: name ?? (PLAYER_NAMES[index] ?? `Player ${index + 1}`),
    color: color ?? (PLAYER_COLORS[index] ?? '#999'),
    input,
    joined: true,
    ready: false,
    profilePlayerId,
  }
}

export default function PlayerLobby({ minPlayers, maxPlayers, onStart, onBack, title }: Props) {
  const { t } = useTranslation()
  const { persistedPlayers, savePlayers, profilePlayers } = useMiniGameLobby()
  const [players, setPlayers] = useState<PlayerSlot[]>(() => {
    // Restore persisted players if available (up to maxPlayers)
    if (persistedPlayers.length > 0) {
      return persistedPlayers.slice(0, maxPlayers).map(p => ({ ...p, ready: true }))
    }
    return []
  })
  const pads = useGamepads()
  const padEdges = useGamepadEdges(pads)
  const processedRef = useRef(new Set<string>())
  const [editingSlot, setEditingSlot] = useState<number | null>(null)

  // --- Multi-window room ---
  const { roomId, clients, createRoom, closeRoom } = useMultiWindowHost()

  // When a remote client joins via BroadcastChannel, add a slot
  useEffect(() => {
    for (const client of clients) {
      const sourceId = `remote-${client.windowId}`
      if (processedRef.current.has(sourceId)) continue
      setPlayers(prev => {
        if (prev.length >= maxPlayers) return prev
        if (prev.some(p => p.input.type === 'remote' && p.input.windowId === client.windowId)) return prev
        processedRef.current.add(sourceId)
        const idx = prev.length
        const slot = createSlot(
          idx,
          { type: 'remote', windowId: client.windowId },
          client.playerName || undefined,
          client.playerColor || PLAYER_COLORS[idx],
        )
        slot.ready = true
        return [...prev, slot]
      })
    }
    // Remove players whose remote client disconnected
    const activeIds = new Set(clients.map(c => c.windowId))
    setPlayers(prev => {
      const filtered = prev.filter(p => {
        if (p.input.type !== 'remote') return true
        return activeIds.has(p.input.windowId)
      })
      if (filtered.length === prev.length) return prev
      // Clean up processedRef for removed remotes
      for (const p of prev) {
        if (p.input.type === 'remote' && !activeIds.has(p.input.windowId)) {
          processedRef.current.delete(`remote-${p.input.windowId}`)
        }
      }
      return filtered.map((p, i) => ({ ...p, index: i }))
    })
  }, [clients, maxPlayers])

  const handleCreateRoom = useCallback(() => {
    const id = generateRoomId()
    createRoom(id)
    // Open a new browser window pointing to the join page
    const joinUrl = `${window.location.origin}/mini-games/join/${id}`
    window.open(joinUrl, '_blank', 'width=600,height=700')
  }, [createRoom])

  const handleCloseRoom = useCallback(() => {
    // Remove all remote players first
    setPlayers(prev => {
      for (const p of prev) {
        if (p.input.type === 'remote') {
          processedRef.current.delete(`remote-${p.input.windowId}`)
        }
      }
      const filtered = prev.filter(p => p.input.type !== 'remote')
      return filtered.map((p, i) => ({ ...p, index: i }))
    })
    closeRoom()
  }, [closeRoom])

  // Mark already-used inputs as processed
  useEffect(() => {
    for (const p of players) {
      const sid = p.input.type === 'keyboard' ? `kb-${p.input.group}` : `gp-${(p.input as { type: 'gamepad'; padIndex: number }).padIndex}`
      processedRef.current.add(sid)
    }
    // Mount-only effect — deps intentionally empty: snapshot initial players into processedRef once
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Keyboard join ---
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // If we're editing a slot, ignore join keys
    if (editingSlot !== null) return

    // Escape: disconnect last keyboard player. If none remain, go back.
    if (e.key === 'Escape') {
      e.preventDefault()
      let hadKeyboardPlayers = false
      setPlayers(prev => {
        const kbPlayers = prev.filter(p => p.input.type === 'keyboard')
        if (kbPlayers.length > 0) {
          hadKeyboardPlayers = true
          const last = kbPlayers[kbPlayers.length - 1]
          const lastIdx = prev.indexOf(last)
          // Un-mark input
          const sid = `kb-${(last.input as { type: 'keyboard'; group: number }).group}`
          processedRef.current.delete(sid)
          const remaining = prev.filter((_, i) => i !== lastIdx)
          return remaining.map((p, i) => ({ ...p, index: i }))
        }
        return prev
      })
      // If no keyboard players were present, go back
      if (!hadKeyboardPlayers) {
        onBack()
      }
      return
    }

    for (let g = 0; g < KB_GROUPS.length; g++) {
      const group = KB_GROUPS[g]
      if (e.key.toLowerCase() === group.joinKey.toLowerCase() || e.key === group.joinKey) {
        const sourceId = `kb-${g}`
        if (processedRef.current.has(sourceId)) continue
        setPlayers(prev => {
          if (prev.length >= maxPlayers) return prev
          if (prev.some(p => p.input.type === 'keyboard' && p.input.group === g)) return prev
          processedRef.current.add(sourceId)
          const idx = prev.length
          // Try to find a profile player not already assigned
          const usedIds = new Set(prev.map(p => p.profilePlayerId).filter(Boolean))
          const available = profilePlayers.find(pp => !usedIds.has(pp.id))
          const slot = createSlot(
            idx,
            { type: 'keyboard', group: g },
            available?.name,
            available?.color ?? PLAYER_COLORS[idx],
            available?.id,
          )
          slot.ready = true
          return [...prev, slot]
        })
      }
    }
  }, [maxPlayers, onBack, editingSlot, profilePlayers])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // --- Gamepad join ---
  useEffect(() => {
    if (editingSlot !== null) return
    for (const [padIdx, pressed] of padEdges) {
      if (pressed.has('a') || pressed.has('start')) {
        const sourceId = `gp-${padIdx}`
        if (processedRef.current.has(sourceId)) continue
        setPlayers(prev => {
          if (prev.length >= maxPlayers) return prev
          if (prev.some(p => p.input.type === 'gamepad' && p.input.padIndex === padIdx)) return prev
          processedRef.current.add(sourceId)
          const idx = prev.length
          const usedIds = new Set(prev.map(p => p.profilePlayerId).filter(Boolean))
          const available = profilePlayers.find(pp => !usedIds.has(pp.id))
          const slot = createSlot(
            idx,
            { type: 'gamepad', padIndex: padIdx },
            available?.name,
            available?.color ?? PLAYER_COLORS[idx],
            available?.id,
          )
          slot.ready = true
          return [...prev, slot]
        })
      }
    }
  }, [padEdges, maxPlayers, editingSlot, profilePlayers])

  // --- Gamepad Y to edit selected player ---
  useEffect(() => {
    for (const [padIdx, pressed] of padEdges) {
      if (pressed.has('y')) {
        const playerIdx = players.findIndex(p => p.input.type === 'gamepad' && p.input.padIndex === padIdx)
        if (playerIdx >= 0) {
          setEditingSlot(prev => prev === playerIdx ? null : playerIdx)
        }
      }
    }
  }, [padEdges, players])

  // --- Handle profile player selection for a slot ---
  const assignProfilePlayer = useCallback((slotIndex: number, profilePlayerId: number | null) => {
    setPlayers(prev => prev.map((p, i) => {
      if (i !== slotIndex) return p
      if (profilePlayerId === null) {
        // Use default
        return {
          ...p,
          name: PLAYER_NAMES[p.index] ?? `Player ${p.index + 1}`,
          color: PLAYER_COLORS[p.index] ?? '#999',
          profilePlayerId: undefined,
        }
      }
      const pp = profilePlayers.find(x => x.id === profilePlayerId)
      if (!pp) return p
      return {
        ...p,
        name: pp.name,
        color: pp.color || PLAYER_COLORS[p.index] || '#999',
        profilePlayerId: pp.id,
      }
    }))
    setEditingSlot(null)
  }, [profilePlayers])

  // --- Remove player from slot ---
  const removePlayer = useCallback((slotIndex: number) => {
    setPlayers(prev => {
      const player = prev[slotIndex]
      if (!player) return prev
      // Un-mark input as processed
      const sid = player.input.type === 'keyboard'
        ? `kb-${player.input.group}`
        : player.input.type === 'remote'
          ? `remote-${player.input.windowId}`
          : `gp-${(player.input as { type: 'gamepad'; padIndex: number }).padIndex}`
      processedRef.current.delete(sid)
      // Remove + re-index remaining
      const remaining = prev.filter((_, i) => i !== slotIndex)
      return remaining.map((p, i) => ({ ...p, index: i }))
    })
    setEditingSlot(null)
  }, [])

  // --- Gamepad B to disconnect player ---
  useEffect(() => {
    for (const [padIdx, pressed] of padEdges) {
      if (pressed.has('b')) {
        const playerIdx = players.findIndex(p => p.input.type === 'gamepad' && p.input.padIndex === padIdx)
        if (playerIdx >= 0) {
          removePlayer(playerIdx)
        }
      }
    }
  }, [padEdges, players, removePlayer])

  const canStart = players.length >= minPlayers
  const readyPlayers = players.filter(p => p.ready)

  const handleStart = useCallback(() => {
    savePlayers(readyPlayers)
    onStart(readyPlayers)
  }, [readyPlayers, savePlayers, onStart])

  // Compute which profile players are already assigned to a slot
  const assignedProfileIds = new Set(players.map(p => p.profilePlayerId).filter(Boolean))

  return (
    <div className={styles.lobby}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.hint}>
        {t('miniGames.lobbyHint', 'Press Space / Enter / U / Num0 or gamepad A / Start to join · Esc / B to disconnect')}
      </p>
      {profilePlayers.length > 0 && (
        <p className={styles.hint} style={{ opacity: 0.5, fontSize: '0.85rem' }}>
          {t('miniGames.lobbyProfileHint', 'Press Y on gamepad or click a player slot to change profile')}
        </p>
      )}

      {/* Multi-window room controls */}
      <div className={styles.multiWindowBar}>
        {roomId ? (
          <>
            <span className={styles.roomBadge}>
              🖥️ {t('miniGames.roomCode', 'Room')}: <strong>{roomId}</strong>
              {clients.length > 0 && (
                <span className={styles.clientCount}>
                  ({clients.length} {t('miniGames.connected', 'connected')})
                </span>
              )}
            </span>
            <button className={styles.roomBtn} onClick={() => {
              const joinUrl = `${window.location.origin}/mini-games/join/${roomId}`
              window.open(joinUrl, '_blank', 'width=600,height=700')
            }}>
              + {t('miniGames.addWindow', 'Add window')}
            </button>
            <button className={styles.roomBtnClose} onClick={handleCloseRoom}>
              ✕ {t('miniGames.closeRoom', 'Close room')}
            </button>
          </>
        ) : (
          <button className={styles.roomBtn} onClick={handleCreateRoom}>
            🖥️ {t('miniGames.openNewWindow', 'Open extra window')}
          </button>
        )}
      </div>

      <div className={styles.slots}>
        {Array.from({ length: maxPlayers }).map((_, i) => {
          const player = players[i]
          const isEditing = editingSlot === i
          return (
            <div
              key={i}
              className={`${styles.slot} ${player ? styles.slotJoined : styles.slotEmpty}`}
              style={player ? { borderColor: player.color, color: player.color } : undefined}
              onClick={player ? () => setEditingSlot(isEditing ? null : i) : undefined}
            >
              {player ? (
                <>
                  <div className={styles.slotIcon} style={{ background: player.color }}>
                    {i + 1}
                  </div>
                  <div className={styles.slotName}>{player.name}</div>
                  <div className={styles.slotInput}>
                    {player.input.type === 'keyboard'
                      ? KB_GROUPS[player.input.group]?.label ?? 'Keyboard'
                      : player.input.type === 'remote'
                        ? `🖥️ ${t('miniGames.remoteWindow', 'Remote')}`
                        : `🎮 Gamepad ${player.input.padIndex + 1}`}
                  </div>
                  {player.profilePlayerId && (
                    <div className={styles.slotProfile}>👤</div>
                  )}
                  <div className={styles.slotReady}>✓ {t('miniGames.ready', 'Ready')}</div>

                  {/* Profile player picker dropdown */}
                  {isEditing && (
                    <div className={styles.profilePicker} onClick={e => e.stopPropagation()}>
                      <div className={styles.profilePickerTitle}>
                        {t('miniGames.selectPlayer', 'Select player')}
                      </div>
                      <button
                        className={styles.profilePickerItem}
                        onClick={() => assignProfilePlayer(i, null)}
                      >
                        {PLAYER_NAMES[player.index] ?? `Player ${player.index + 1}`}
                        <span className={styles.profilePickerDefault}>
                          ({t('miniGames.default', 'default')})
                        </span>
                      </button>
                      {profilePlayers.map(pp => {
                        const isUsed = assignedProfileIds.has(pp.id) && player.profilePlayerId !== pp.id
                        return (
                          <button
                            key={pp.id}
                            className={`${styles.profilePickerItem} ${isUsed ? styles.profilePickerUsed : ''}`}
                            disabled={isUsed}
                            onClick={() => assignProfilePlayer(i, pp.id)}
                          >
                            <span
                              className={styles.profilePickerColor}
                              style={{ background: pp.color }}
                            />
                            {pp.name}
                            {pp.isPrimary && <span className={styles.profilePickerPrimary}>★</span>}
                          </button>
                        )
                      })}
                      <button
                        className={`${styles.profilePickerItem} ${styles.profilePickerRemove}`}
                        onClick={() => removePlayer(i)}
                      >
                        ✕ {t('miniGames.removePlayer', 'Remove')}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.slotPlaceholder}>
                  <div className={styles.slotIconEmpty}>{i + 1}</div>
                  <div>{t('miniGames.pressToJoin', 'Press to join')}</div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className={styles.actions}>
        <button className={styles.backBtn} onClick={onBack}>
          ← {t('miniGames.back', 'Back')}
        </button>
        {canStart && (
          <button
            className={styles.startBtn}
            onClick={handleStart}
          >
            {t('miniGames.startGame', 'Start Game')} ({readyPlayers.length} {t('miniGames.players', 'players')})
          </button>
        )}
        {!canStart && (
          <span className={styles.waitingText}>
            {t('miniGames.needMore', 'Need at least {{count}} players', { count: minPlayers })}
          </span>
        )}
      </div>
    </div>
  )
}
