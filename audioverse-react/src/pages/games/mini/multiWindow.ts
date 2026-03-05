/**
 * MultiWindowService — BroadcastChannel-based room system for multi-window gaming.
 *
 * Allows multiple browser windows on the same device to participate in the same
 * game session. One window is the HOST (runs the game loop), others are CLIENTS
 * (send inputs, receive render state for their viewport).
 *
 * Communication uses the BroadcastChannel API (same origin, near-zero latency).
 *
 * Architecture:
 *   HOST window:
 *     - Creates the room with a unique roomId
 *     - Runs the game loop and physics
 *     - Receives input messages from client windows
 *     - Sends viewport state to each client
 *     - Manages the player roster
 *
 *   CLIENT window:
 *     - Joins the room by roomId
 *     - Captures local keyboard/gamepad input
 *     - Sends input deltas to the host
 *     - Receives and renders its viewport
 *
 * Message protocol:
 *   { type: 'join', windowId, playerName, playerColor }
 *   { type: 'join-ack', windowId, playerIndex, roomState }
 *   { type: 'leave', windowId }
 *   { type: 'input', windowId, input }           — client → host
 *   { type: 'state', windowId, state }            — host → client (per-window viewport)
 *   { type: 'phase', phase, config? }             — host → all (lobby/settings/title/game)
 *   { type: 'roster', players }                   — host → all (player list update)
 *   { type: 'ping', windowId }
 *   { type: 'pong', windowId }
 */

import type { GameConfig } from './types'

// ── Types ────────────────────────────────────────────────────────────────────

export type WindowRole = 'host' | 'client'

export interface MultiWindowMessage {
  type: string
  roomId: string
  windowId: string
  [key: string]: unknown
}

export interface JoinMessage extends MultiWindowMessage {
  type: 'join'
  playerName: string
  playerColor: string
}

export interface JoinAckMessage extends MultiWindowMessage {
  type: 'join-ack'
  playerIndex: number
  gamePath: string
  success: boolean
  error?: string
}

export interface LeaveMessage extends MultiWindowMessage {
  type: 'leave'
}

export interface InputMessage extends MultiWindowMessage {
  type: 'input'
  input: {
    dx: number
    dy: number
    action: boolean
    action2: boolean
  }
}

export interface StateMessage extends MultiWindowMessage {
  type: 'state'
  targetWindowId: string
  state: unknown
}

export interface PhaseMessage extends MultiWindowMessage {
  type: 'phase'
  phase: string
  config?: GameConfig
}

export interface RosterMessage extends MultiWindowMessage {
  type: 'roster'
  players: Array<{
    index: number
    name: string
    color: string
    windowId: string
    isHost: boolean
  }>
}

export interface PingMessage extends MultiWindowMessage {
  type: 'ping'
}

export interface PongMessage extends MultiWindowMessage {
  type: 'pong'
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a short human-readable room code (e.g. "ABCD-1234") */
export function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const nums = '0123456789'
  const pick = (set: string, n: number) =>
    Array.from({ length: n }, () => set[Math.floor(Math.random() * set.length)]).join('')
  return `${pick(chars, 4)}-${pick(nums, 4)}`
}

/** Generate unique window identifier */
export function generateWindowId(): string {
  return `win_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

// ── Service ──────────────────────────────────────────────────────────────────

export type MessageHandler = (msg: MultiWindowMessage) => void

export class MultiWindowService {
  readonly roomId: string
  readonly windowId: string
  readonly role: WindowRole

  private channel: BroadcastChannel
  private handlers = new Map<string, Set<MessageHandler>>()
  private alive = true

  constructor(roomId: string, role: WindowRole, windowId?: string) {
    this.roomId = roomId
    this.role = role
    this.windowId = windowId ?? generateWindowId()
    this.channel = new BroadcastChannel(`av-game-room-${roomId}`)

    this.channel.onmessage = (ev: MessageEvent<MultiWindowMessage>) => {
      if (!this.alive) return
      const msg = ev.data
      if (msg.roomId !== this.roomId) return

      // Auto-respond to pings
      if (msg.type === 'ping' && this.role === 'client') {
        this.send({ type: 'pong', roomId: this.roomId, windowId: this.windowId })
        return
      }

      // Dispatch to handlers
      const typeHandlers = this.handlers.get(msg.type)
      if (typeHandlers) {
        for (const h of typeHandlers) h(msg)
      }
      // Also dispatch to '*' catch-all
      const allHandlers = this.handlers.get('*')
      if (allHandlers) {
        for (const h of allHandlers) h(msg)
      }
    }
  }

  /** Register a handler for a specific message type (or '*' for all) */
  on(type: string, handler: MessageHandler): () => void {
    let set = this.handlers.get(type)
    if (!set) {
      set = new Set()
      this.handlers.set(type, set)
    }
    set.add(handler)
    return () => { set!.delete(handler) }
  }

  /** Send a message to all other windows in the room */
  send(msg: MultiWindowMessage): void {
    if (!this.alive) return
    this.channel.postMessage(msg)
  }

  /** Send a typed convenience message */
  sendInput(input: InputMessage['input']): void {
    this.send({
      type: 'input',
      roomId: this.roomId,
      windowId: this.windowId,
      input,
    })
  }

  /** Send phase change to all clients */
  sendPhase(phase: string, config?: GameConfig): void {
    this.send({
      type: 'phase',
      roomId: this.roomId,
      windowId: this.windowId,
      phase,
      config,
    })
  }

  /** Send roster update to all clients */
  sendRoster(players: RosterMessage['players']): void {
    this.send({
      type: 'roster',
      roomId: this.roomId,
      windowId: this.windowId,
      players,
    })
  }

  /** Send viewport state to a specific client */
  sendState(targetWindowId: string, state: unknown): void {
    this.send({
      type: 'state',
      roomId: this.roomId,
      windowId: this.windowId,
      targetWindowId,
      state,
    })
  }

  /** Cleanup — close channel */
  destroy(): void {
    if (!this.alive) return
    this.alive = false
    // Notify departure
    this.send({
      type: 'leave',
      roomId: this.roomId,
      windowId: this.windowId,
    })
    this.channel.close()
    this.handlers.clear()
  }

  /** Check if service is still active */
  get isAlive(): boolean {
    return this.alive
  }
}

// ── Singleton room manager ───────────────────────────────────────────────────

let activeService: MultiWindowService | null = null

/** Get the currently active multi-window service (if any) */
export function getActiveService(): MultiWindowService | null {
  return activeService
}

/** Create a host room */
export function createHostRoom(roomId?: string): MultiWindowService {
  if (activeService) activeService.destroy()
  const id = roomId ?? generateRoomId()
  activeService = new MultiWindowService(id, 'host')
  return activeService
}

/** Join an existing room as a client */
export function joinRoom(roomId: string): MultiWindowService {
  if (activeService) activeService.destroy()
  activeService = new MultiWindowService(roomId, 'client')
  return activeService
}

/** Close the active room */
export function leaveRoom(): void {
  if (activeService) {
    activeService.destroy()
    activeService = null
  }
}
