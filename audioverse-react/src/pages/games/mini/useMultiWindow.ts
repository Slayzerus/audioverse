/**
 * useMultiWindow — React hook for multi-window game communication.
 *
 * HOST usage:
 *   const { service, clients, createRoom, closeRoom } = useMultiWindowHost()
 *
 * CLIENT usage:
 *   const { service, phase, roster, joinRoom } = useMultiWindowClient()
 *
 * The host service is stored in a module-level variable so it persists
 * beyond the PlayerLobby component lifecycle (lobby → settings → game).
 * Game pages should call `broadcastGamePhase(phase)` on phase transitions
 * and `destroyHostService()` when the game page unmounts entirely.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  MultiWindowService,
  generateRoomId,
  type WindowRole,
  type MultiWindowMessage,
  type JoinMessage,
  type InputMessage,
  type RosterMessage,
  type PhaseMessage,
} from './multiWindow'
import type { GameConfig } from './types'

// ── Module-level host service (persists across component re-mounts) ──────────

let _hostService: MultiWindowService | null = null
let _hostRoomId: string | null = null
let _hostCleanups: Array<() => void> = []
let _hostSetClients: ((fn: (prev: ConnectedClient[]) => ConnectedClient[]) => void) | null = null

/** Broadcast the current game phase to all remote clients */
export function broadcastGamePhase(phase: string, config?: GameConfig): void {
  _hostService?.sendPhase(phase, config)
}

/** Get the host service (for reading client input from game loops) */
export function getHostService(): MultiWindowService | null {
  return _hostService
}

/** Get the latest input from a remote client by windowId (game-loop use) */
export function getRemoteClientInput(windowId: string): InputMessage['input'] | null {
  // This requires the clients state — but for game-loop access we use a cached map
  return _clientInputCache.get(windowId) ?? null
}

const _clientInputCache = new Map<string, InputMessage['input']>()

/** Destroy the host service entirely (call when game page unmounts) */
export function destroyHostService(): void {
  for (const cleanup of _hostCleanups) cleanup()
  _hostCleanups = []
  _hostService?.destroy()
  _hostService = null
  _hostRoomId = null
  _hostSetClients = null
  _clientInputCache.clear()
}

// ── Host-side connected client ───────────────────────────────────────────────

export interface ConnectedClient {
  windowId: string
  playerIndex: number
  playerName: string
  playerColor: string
  lastInput: InputMessage['input']
  lastSeen: number
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface UseMultiWindowHostResult {
  service: MultiWindowService | null
  roomId: string | null
  clients: ConnectedClient[]
  createRoom: (roomId?: string) => MultiWindowService
  closeRoom: () => void
  /** Get the latest input from a remote client by windowId */
  getClientInput: (windowId: string) => InputMessage['input'] | null
}

interface UseMultiWindowClientResult {
  service: MultiWindowService | null
  roomId: string | null
  connected: boolean
  playerIndex: number | null
  phase: string
  roster: RosterMessage['players']
  joinRoom: (roomId: string, name: string, color: string) => void
  leaveRoom: () => void
  sendInput: (input: InputMessage['input']) => void
}

export type UseMultiWindowResult<R extends WindowRole> =
  R extends 'host' ? UseMultiWindowHostResult : UseMultiWindowClientResult

export function useMultiWindowHost(): UseMultiWindowHostResult {
  const [roomId, setRoomId] = useState<string | null>(_hostRoomId)
  const [clients, setClients] = useState<ConnectedClient[]>([])

  // Keep module-level ref to setClients so input cache can be updated
  useEffect(() => {
    _hostSetClients = (fn) => setClients(fn)
    // If a service already exists (re-mount), sync state
    if (_hostService && _hostRoomId) {
      setRoomId(_hostRoomId)
    }
    return () => { _hostSetClients = null }
  }, [])

  const closeRoom = useCallback(() => {
    destroyHostService()
    setRoomId(null)
    setClients([])
  }, [])

  const createRoom = useCallback((id?: string): MultiWindowService => {
    // Cleanup previous
    if (_hostService) {
      destroyHostService()
      setClients([])
    }

    const rid = id ?? generateRoomId()
    const svc = new MultiWindowService(rid, 'host')
    _hostService = svc
    _hostRoomId = rid
    setRoomId(rid)

    let nextIndex = 100 // remote players start at index 100 to avoid collisions

    // Handle join requests
    const offJoin = svc.on('join', (msg) => {
      const joinMsg = msg as JoinMessage
      const playerIndex = nextIndex++

      // Acknowledge join
      svc.send({
        type: 'join-ack',
        roomId: rid,
        windowId: svc.windowId,
        targetWindowId: joinMsg.windowId,
        playerIndex,
        gamePath: window.location.pathname,
        success: true,
      } as MultiWindowMessage)

      // Add to client list
      const updateClients = _hostSetClients ?? setClients
      updateClients(prev => {
        const existing = prev.find(c => c.windowId === joinMsg.windowId)
        if (existing) return prev
        return [...prev, {
          windowId: joinMsg.windowId,
          playerIndex,
          playerName: joinMsg.playerName,
          playerColor: joinMsg.playerColor,
          lastInput: { dx: 0, dy: 0, action: false, action2: false },
          lastSeen: Date.now(),
        }]
      })
    })

    // Handle input from clients
    const offInput = svc.on('input', (msg) => {
      const inputMsg = msg as InputMessage
      // Update cache for game-loop access
      _clientInputCache.set(inputMsg.windowId, inputMsg.input as InputMessage['input'])
      // Update React state
      const updateClients = _hostSetClients ?? setClients
      updateClients(prev => prev.map(c =>
        c.windowId === inputMsg.windowId
          ? { ...c, lastInput: inputMsg.input as InputMessage['input'], lastSeen: Date.now() }
          : c
      ))
    })

    // Handle client leaving
    const offLeave = svc.on('leave', (msg) => {
      _clientInputCache.delete(msg.windowId)
      const updateClients = _hostSetClients ?? setClients
      updateClients(prev => prev.filter(c => c.windowId !== msg.windowId))
    })

    _hostCleanups = [offJoin, offInput, offLeave]

    return svc
  }, [])

  const getClientInput = useCallback((windowId: string): InputMessage['input'] | null => {
    return _clientInputCache.get(windowId) ?? null
  }, [])

  // NOTE: Do NOT auto-destroy on unmount — service persists for the game lifecycle.
  // Game pages should call destroyHostService() when they unmount entirely.

  return { service: _hostService, roomId, clients, createRoom, closeRoom, getClientInput }
}

export function useMultiWindowClient(): UseMultiWindowClientResult {
  const serviceRef = useRef<MultiWindowService | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [playerIndex, setPlayerIndex] = useState<number | null>(null)
  const [phase, setPhase] = useState<string>('lobby')
  const [roster, setRoster] = useState<RosterMessage['players']>([])
  const cleanupRef = useRef<Array<() => void>>([])

  const leaveRoom = useCallback(() => {
    for (const cleanup of cleanupRef.current) cleanup()
    cleanupRef.current = []
    serviceRef.current?.destroy()
    serviceRef.current = null
    setRoomId(null)
    setConnected(false)
    setPlayerIndex(null)
    setPhase('lobby')
    setRoster([])
  }, [])

  const joinRoom = useCallback((rid: string, name: string, color: string) => {
    if (serviceRef.current) leaveRoom()

    const svc = new MultiWindowService(rid, 'client')
    serviceRef.current = svc
    setRoomId(rid)

    // Listen for join acknowledgment
    const offAck = svc.on('join-ack', (msg) => {
      const ack = msg as unknown as { targetWindowId: string; playerIndex: number; success: boolean }
      if (ack.targetWindowId === svc.windowId && ack.success) {
        setConnected(true)
        setPlayerIndex(ack.playerIndex)
      }
    })

    // Listen for phase changes
    const offPhase = svc.on('phase', (msg) => {
      const pm = msg as PhaseMessage
      setPhase(pm.phase)
    })

    // Listen for roster updates
    const offRoster = svc.on('roster', (msg) => {
      const rm = msg as RosterMessage
      setRoster(rm.players)
    })

    // Listen for host leaving
    const offLeave = svc.on('leave', (msg) => {
      // If host left, disconnect
      if (msg.windowId !== svc.windowId) {
        setConnected(false)
        setPhase('disconnected')
      }
    })

    cleanupRef.current = [offAck, offPhase, offRoster, offLeave]

    // Send join request
    svc.send({
      type: 'join',
      roomId: rid,
      windowId: svc.windowId,
      playerName: name,
      playerColor: color,
    } as JoinMessage)
  }, [leaveRoom])

  const sendInput = useCallback((input: InputMessage['input']) => {
    serviceRef.current?.sendInput(input)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => { leaveRoom() }
  }, [leaveRoom])

  return {
    service: serviceRef.current, roomId, connected, playerIndex,
    phase, roster, joinRoom, leaveRoom, sendInput,
  }
}
