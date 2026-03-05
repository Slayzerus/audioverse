/**
 * SignalRTransport — IMultiplayerTransport backed by a SignalR GameHub.
 *
 * Wraps HubConnectionBuilder, auto-reconnects, and maps hub events
 * to the generic TransportMessage format so game code stays transport-agnostic.
 *
 * Expected server hub: /hubs/game
 *   Server methods:  CreateRoom, JoinRoom, LeaveRoom, SendGameMessage, StartMatchmaking, CancelMatchmaking
 *   Client events:   GameMessage, RoomJoined, RoomLeft, PlayerJoined, PlayerLeft, MatchFound, Error
 *
 * ⚠️ BACKEND REQUIREMENT: The GameHub does not exist yet on the .NET backend.
 *    See BACKEND_NOTE_ONLINE_MULTIPLAYER.md for the full specification.
 */
import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from '@microsoft/signalr'

import type {
  IMultiplayerTransport,
  TransportState,
  TransportListener,
  TransportMessage,
} from './MultiplayerTransport'
import { logger } from '../utils/logger'
const log = logger.scoped('SignalRTransport')

// ── Resolve hub URL ──────────────────────────────────────────

function resolveGameHubUrl(): string {
  try {
    const fromVite = import.meta.env.VITE_AUDIOVERSE_GAME_HUB as string | undefined
    if (fromVite?.trim()) return fromVite
  } catch { /* Expected: import.meta.env may not be available (SSR/test) */ }
  return '/hubs/game'
}

// ── SignalR transport ────────────────────────────────────────

export class SignalRTransport implements IMultiplayerTransport {
  private connection: HubConnection | null = null
  private listeners = new Map<string, Set<TransportListener>>()
  private stateListeners = new Set<(s: TransportState) => void>()
  private _state: TransportState = 'disconnected'
  private hubUrl: string
  private accessTokenFactory?: () => string | Promise<string>

  constructor(
    hubUrl = resolveGameHubUrl(),
    accessTokenFactory?: () => string | Promise<string>,
  ) {
    this.hubUrl = hubUrl
    this.accessTokenFactory = accessTokenFactory
  }

  get state(): TransportState {
    return this._state
  }

  private setState(s: TransportState) {
    if (this._state === s) return
    this._state = s
    this.stateListeners.forEach(l => l(s))
  }

  // ── Lifecycle ────────────────────────────────────────────

  async connect(): Promise<void> {
    if (this.connection?.state === 'Connected') return

    this.setState('connecting')

    const builder = new HubConnectionBuilder()
    if (this.accessTokenFactory) {
      builder.withUrl(this.hubUrl, { accessTokenFactory: this.accessTokenFactory })
    } else {
      builder.withUrl(this.hubUrl)
    }
    builder.withAutomaticReconnect([0, 1000, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)

    const conn = builder.build()
    this.connection = conn

    // Map reconnection events to our state
    conn.onreconnecting(() => this.setState('reconnecting'))
    conn.onreconnected(() => this.setState('connected'))
    conn.onclose(() => this.setState('disconnected'))

    // Register client-side event handler that dispatches to our listeners
    conn.on('GameMessage', (...args: unknown[]) => {
      const raw = args[0] as TransportMessage
      this.dispatch(raw.type, raw)
    })

    // Additional hub events mapped as transport messages
    for (const evt of ['RoomJoined', 'RoomLeft', 'PlayerJoined', 'PlayerLeft', 'MatchFound', 'Error']) {
      conn.on(evt, (...args: unknown[]) => {
        const payload = (args[0] ?? {}) as Record<string, unknown>
        const msg: TransportMessage = {
          type: evt,
          payload: payload,
          timestamp: Date.now(),
          senderId: 'server',
        }
        this.dispatch(evt, msg)
      })
    }

    try {
      await conn.start()
      this.setState('connected')
    } catch (err) {
      this.setState('disconnected')
      throw err
    }
  }

  disconnect(): void {
    if (this.connection) {
      this.connection.stop().catch(() => { /* Expected: stop may fail if connection already closed */ })
      this.connection = null
    }
    this.setState('disconnected')
  }

  // ── Messaging ────────────────────────────────────────────

  send(type: string, payload: Record<string, unknown>): void {
    if (!this.connection || this.connection.state !== 'Connected') {
      log.warn('not connected, dropping message:', type)
      return
    }
    const msg: TransportMessage = {
      type,
      payload,
      timestamp: Date.now(),
    }
    this.connection.invoke('SendGameMessage', msg).catch(err => {
      log.error('send error:', err)
    })
  }

  on(type: string, listener: TransportListener): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set())
    this.listeners.get(type)!.add(listener)
  }

  off(type: string, listener: TransportListener): void {
    this.listeners.get(type)?.delete(listener)
  }

  onStateChange(listener: (s: TransportState) => void): void {
    this.stateListeners.add(listener)
  }

  // ── Dispatch ─────────────────────────────────────────────

  private dispatch(type: string, msg: TransportMessage): void {
    this.listeners.get(type)?.forEach(l => { try { l(msg) } catch { /* Expected: listener callback may throw */ } })
    this.listeners.get('*')?.forEach(l => { try { l(msg) } catch { /* Expected: listener callback may throw */ } })
  }

  // ── Room & matchmaking convenience methods ───────────────

  async createRoom(gameId: string, isPrivate: boolean, settings?: Record<string, unknown>): Promise<string> {
    if (!this.connection) throw new Error('Not connected')
    return await this.connection.invoke<string>('CreateRoom', gameId, isPrivate, settings ?? {})
  }

  async joinRoom(roomCode: string, playerName: string, playerColor: string): Promise<void> {
    if (!this.connection) throw new Error('Not connected')
    await this.connection.invoke('JoinRoom', roomCode, playerName, playerColor)
  }

  async leaveRoom(): Promise<void> {
    if (!this.connection) throw new Error('Not connected')
    await this.connection.invoke('LeaveRoom')
  }

  async startMatchmaking(gameId: string, skillLevel: number): Promise<void> {
    if (!this.connection) throw new Error('Not connected')
    await this.connection.invoke('StartMatchmaking', gameId, skillLevel)
  }

  async cancelMatchmaking(): Promise<void> {
    if (!this.connection) throw new Error('Not connected')
    await this.connection.invoke('CancelMatchmaking')
  }

  async setReady(ready: boolean): Promise<void> {
    if (!this.connection) throw new Error('Not connected')
    await this.connection.invoke('SetReady', ready)
  }

  async startGame(): Promise<void> {
    if (!this.connection) throw new Error('Not connected')
    await this.connection.invoke('StartGame')
  }
}
