/**
 * useOnlineMultiplayer — React hook for online multiplayer game sessions.
 *
 * Manages:
 *  - SignalR transport connection
 *  - Room creation (private/public)
 *  - Room joining via code
 *  - Matchmaking by skill level
 *  - Player roster tracking
 *  - Session lifecycle (create → rounds → end)
 *
 * ⚠️ BACKEND REQUIREMENT: Requires a GameHub at /hubs/game.
 *    See BACKEND_NOTE_ONLINE_MULTIPLAYER.md
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { SignalRTransport } from '../../../services/SignalRTransport'
import {
  createMiniGameSession,
  endMiniGameSession,
  submitMiniGameRound,
  type SubmitRoundRequest,
  type SubmitRoundResult,
} from '../../../scripts/api/apiMiniGameSessions'
import type { TransportMessage, TransportState } from '../../../services/MultiplayerTransport'
import { logger } from '../../../utils/logger'
import type { GameConfig } from './types'

const log = logger.scoped('useOnlineMultiplayer')

// ── Types ────────────────────────────────────────────────────

export interface OnlinePlayer {
  connectionId: string
  name: string
  color: string
  isHost: boolean
  isReady: boolean
  skillLevel?: number
}

export type OnlineLobbyPhase =
  | 'disconnected'   // not connected to hub
  | 'connecting'     // connecting to SignalR
  | 'idle'           // connected, no room
  | 'creating'       // creating a room
  | 'joining'        // joining a room by code
  | 'matchmaking'    // searching for a match
  | 'lobby'          // in a room, waiting for players
  | 'starting'       // host pressed Start, countdown
  | 'playing'        // game in progress
  | 'results'        // round ended, showing results
  | 'error'          // something went wrong

export interface UseOnlineMultiplayerResult {
  /** Current lobby phase */
  phase: OnlineLobbyPhase
  /** SignalR transport state */
  transportState: TransportState
  /** Room code (when in a room) */
  roomCode: string | null
  /** Whether current user is the host */
  isHost: boolean
  /** List of players in the room */
  players: OnlinePlayer[]
  /** Error message if phase === 'error' */
  error: string | null
  /** Session ID from backend */
  sessionId: number | null
  /** Last round result */
  lastRoundResult: SubmitRoundResult | null

  // Actions
  connect: (accessTokenFactory?: () => string | Promise<string>) => Promise<void>
  disconnect: () => void
  createRoom: (gameId: string, isPrivate: boolean, settings?: GameConfig) => Promise<void>
  joinRoom: (roomCode: string, playerName: string, playerColor: string) => Promise<void>
  leaveRoom: () => void
  startMatchmaking: (gameId: string, skillLevel: number) => Promise<void>
  cancelMatchmaking: () => void
  setReady: (ready: boolean) => void
  startGame: () => void
  submitRound: (req: SubmitRoundRequest) => Promise<SubmitRoundResult | null>
  endSession: () => Promise<void>
  sendGameMessage: (type: string, payload: GameConfig) => void
  onGameMessage: (type: string, handler: (msg: TransportMessage) => void) => () => void
}

// ── Hook ─────────────────────────────────────────────────────

export function useOnlineMultiplayer(hostPlayerId?: number): UseOnlineMultiplayerResult {
  const transportRef = useRef<SignalRTransport | null>(null)
  const [phase, setPhase] = useState<OnlineLobbyPhase>('disconnected')
  const [transportState, setTransportState] = useState<TransportState>('disconnected')
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [isHost, setIsHost] = useState(false)
  const [players, setPlayers] = useState<OnlinePlayer[]>([])
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [lastRoundResult, setLastRoundResult] = useState<SubmitRoundResult | null>(null)

  // Clean up on unmount
  useEffect(() => {
    return () => {
      transportRef.current?.disconnect()
    }
  }, [])

  // ── Connect to hub ───────────────────────────────────────

  const connect = useCallback(async (accessTokenFactory?: () => string | Promise<string>) => {
    if (transportRef.current?.state === 'connected') return

    setPhase('connecting')
    setError(null)

    const transport = new SignalRTransport(undefined, accessTokenFactory)
    transportRef.current = transport

    transport.onStateChange((s: TransportState) => {
      setTransportState(s)
      if (s === 'disconnected') {
        setPhase('disconnected')
        setRoomCode(null)
        setPlayers([])
      }
    })

    // Register hub event handlers
    transport.on('RoomJoined', (msg: TransportMessage) => {
      const p = msg.payload
      setRoomCode(p.roomCode as string)
      setIsHost(p.isHost as boolean)
      setPlayers(p.players as OnlinePlayer[] ?? [])
      setPhase('lobby')
    })

    transport.on('PlayerJoined', (msg: TransportMessage) => {
      const player = msg.payload as unknown as OnlinePlayer
      setPlayers(prev => [...prev.filter(p => p.connectionId !== player.connectionId), player])
    })

    transport.on('PlayerLeft', (msg: TransportMessage) => {
      const connId = msg.payload.connectionId as string
      setPlayers(prev => prev.filter(p => p.connectionId !== connId))
    })

    transport.on('RoomLeft', () => {
      setRoomCode(null)
      setPlayers([])
      setIsHost(false)
      setPhase('idle')
    })

    transport.on('MatchFound', (msg: TransportMessage) => {
      const p = msg.payload
      setRoomCode(p.roomCode as string)
      setIsHost(p.isHost as boolean)
      setPlayers(p.players as OnlinePlayer[] ?? [])
      setPhase('lobby')
    })

    transport.on('Error', (msg: TransportMessage) => {
      setError(msg.payload.message as string ?? 'Unknown error')
      setPhase('error')
    })

    try {
      await transport.connect()
      setTransportState('connected')
      setPhase('idle')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
      setPhase('error')
    }
  // Mount-only: SignalR transport connection established once
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const disconnect = useCallback(() => {
    transportRef.current?.disconnect()
    transportRef.current = null
    setPhase('disconnected')
    setRoomCode(null)
    setPlayers([])
    setIsHost(false)
    setSessionId(null)
  }, [])

  // ── Room management ──────────────────────────────────────

  const createRoom = useCallback(async (gameId: string, isPrivate: boolean, settings?: GameConfig) => {
    const transport = transportRef.current
    if (!transport) throw new Error('Not connected')

    setPhase('creating')
    setError(null)
    try {
      const code = await transport.createRoom(gameId, isPrivate, settings)
      setRoomCode(code)
      setIsHost(true)
      setPhase('lobby')

      // Also create a backend session
      if (hostPlayerId) {
        try {
          const { id } = await createMiniGameSession({ hostPlayerId })
          setSessionId(id)
        } catch {
          // Non-fatal — session tracking is optional
          log.warn('failed to create backend session')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room')
      setPhase('error')
    }
  }, [hostPlayerId])

  const joinRoom = useCallback(async (code: string, playerName: string, playerColor: string) => {
    const transport = transportRef.current
    if (!transport) throw new Error('Not connected')

    setPhase('joining')
    setError(null)
    try {
      await transport.joinRoom(code, playerName, playerColor)
      // RoomJoined event will update state
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room')
      setPhase('error')
    }
  }, [])

  const leaveRoom = useCallback(() => {
    transportRef.current?.leaveRoom().catch(() => { /* Expected: leaveRoom may fail if already disconnected */ })
    setRoomCode(null)
    setPlayers([])
    setIsHost(false)
    setPhase('idle')
  }, [])

  // ── Matchmaking ──────────────────────────────────────────

  const startMatchmaking = useCallback(async (gameId: string, skillLevel: number) => {
    const transport = transportRef.current
    if (!transport) throw new Error('Not connected')

    setPhase('matchmaking')
    setError(null)
    try {
      await transport.startMatchmaking(gameId, skillLevel)
      // MatchFound event will update state
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Matchmaking failed')
      setPhase('error')
    }
  }, [])

  const cancelMatchmaking = useCallback(() => {
    transportRef.current?.cancelMatchmaking().catch(() => { /* Expected: cancelMatchmaking may fail if not in queue */ })
    setPhase('idle')
  }, [])

  // ── Game flow ────────────────────────────────────────────

  const setReady = useCallback((ready: boolean) => {
    transportRef.current?.setReady(ready).catch(() => { /* Expected: setReady may fail if room was closed */ })
  }, [])

  const startGame = useCallback(() => {
    if (!isHost) return
    setPhase('starting')
    transportRef.current?.startGame().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to start game')
      setPhase('error')
    })
    // After a brief countdown the server will broadcast game-start
    setTimeout(() => setPhase('playing'), 1500)
  }, [isHost])

  const submitRoundAction = useCallback(async (req: SubmitRoundRequest): Promise<SubmitRoundResult | null> => {
    if (!sessionId) return null
    try {
      const result = await submitMiniGameRound(sessionId, req)
      setLastRoundResult(result)
      setPhase('results')
      return result
    } catch (err) {
      log.error('submitRound error:', err)
      return null
    }
  }, [sessionId])

  const endSession = useCallback(async () => {
    if (sessionId) {
      try {
        await endMiniGameSession(sessionId)
      } catch {
        log.warn('failed to end session')
      }
    }
    leaveRoom()
    setSessionId(null)
    setLastRoundResult(null)
  }, [sessionId, leaveRoom])

  // ── Raw messaging ────────────────────────────────────────

  const sendGameMessage = useCallback((type: string, payload: GameConfig) => {
    transportRef.current?.send(type, payload)
  }, [])

  const onGameMessage = useCallback((type: string, handler: (msg: TransportMessage) => void) => {
    transportRef.current?.on(type, handler)
    return () => { transportRef.current?.off(type, handler) }
  }, [])

  return {
    phase,
    transportState,
    roomCode,
    isHost,
    players,
    error,
    sessionId,
    lastRoundResult,
    connect,
    disconnect,
    createRoom,
    joinRoom,
    leaveRoom,
    startMatchmaking,
    cancelMatchmaking,
    setReady,
    startGame,
    submitRound: submitRoundAction,
    endSession,
    sendGameMessage,
    onGameMessage,
  }
}
