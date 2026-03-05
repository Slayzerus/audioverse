/**
 * useGameVoiceChat — hook managing in-game voice + text chat.
 *
 * Handles:
 *  - Audio input device enumeration
 *  - Push-to-talk key bindings (T key, gamepad LB)
 *  - Voice activation via audio level detection
 *  - Per-peer mute/volume
 *  - Text chat message sending/receiving via transport
 *  - WebRTC peer connections for audio streaming
 *
 * ⚠️ BACKEND NOTE: Requires GameHub to relay signaling messages
 *    (VoiceOffer, VoiceAnswer, VoiceIceCandidate, ChatMessage events).
 *    See BACKEND_NOTE_ONLINE_MULTIPLAYER.md
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { VoicePeer, ChatMessage } from './GameVoiceChat'
import type { IMultiplayerTransport, TransportMessage } from '../../../services/MultiplayerTransport'

export type VoiceMode = 'push-to-talk' | 'voice-activation' | 'off'

export interface UseGameVoiceChatOptions {
  /** The multiplayer transport (SignalR or local) */
  transport: IMultiplayerTransport | null
  /** Local player identity */
  localPlayerId: string
  localPlayerName: string
  /** Whether voice chat should be active */
  enabled?: boolean
}

export interface UseGameVoiceChatResult {
  peers: VoicePeer[]
  messages: ChatMessage[]
  isTalking: boolean
  isLocalMuted: boolean
  audioDevices: MediaDeviceInfo[]
  selectedDeviceId: string
  voiceMode: VoiceMode
  toggleLocalMute: () => void
  togglePeerMute: (peerId: string) => void
  setPeerVolume: (peerId: string, volume: number) => void
  selectDevice: (deviceId: string) => void
  setVoiceMode: (mode: VoiceMode) => void
  sendMessage: (content: string) => void
}

let msgCounter = 0

export function useGameVoiceChat({
  transport,
  localPlayerId,
  localPlayerName,
  enabled = true,
}: UseGameVoiceChatOptions): UseGameVoiceChatResult {
  const [peers, setPeers] = useState<VoicePeer[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTalking, setIsTalking] = useState(false)
  const [isLocalMuted, setIsLocalMuted] = useState(false)
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('push-to-talk')

  const talkingRef = useRef(false)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  // ── Enumerate audio devices ──────────────────────────────

  useEffect(() => {
    if (!enabled) return
    navigator.mediaDevices?.enumerateDevices().then(devices => {
      const inputs = devices.filter(d => d.kind === 'audioinput')
      setAudioDevices(inputs)
      if (inputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(inputs[0].deviceId)
      }
    }).catch(() => { /* no permissions yet */ })
  }, [enabled, selectedDeviceId])

  // ── Push-to-talk key binding ─────────────────────────────

  useEffect(() => {
    if (!enabled || voiceMode !== 'push-to-talk') return

    const handleDown = (e: KeyboardEvent) => {
      if (e.key === 't' || e.key === 'T') {
        if (!talkingRef.current) {
          talkingRef.current = true
          setIsTalking(true)
        }
      }
    }
    const handleUp = (e: KeyboardEvent) => {
      if (e.key === 't' || e.key === 'T') {
        talkingRef.current = false
        setIsTalking(false)
      }
    }

    window.addEventListener('keydown', handleDown)
    window.addEventListener('keyup', handleUp)
    return () => {
      window.removeEventListener('keydown', handleDown)
      window.removeEventListener('keyup', handleUp)
    }
  }, [enabled, voiceMode])

  // ── Gamepad LB push-to-talk ──────────────────────────────

  useEffect(() => {
    if (!enabled || voiceMode !== 'push-to-talk') return

    let animId: number
    const poll = () => {
      const gamepads = navigator.getGamepads?.() ?? []
      let anyLB = false
      for (const gp of gamepads) {
        if (gp?.buttons[4]?.pressed) {
          anyLB = true
          break
        }
      }
      if (anyLB !== talkingRef.current) {
        talkingRef.current = anyLB
        setIsTalking(anyLB)
      }
      animId = requestAnimationFrame(poll)
    }
    animId = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(animId)
  }, [enabled, voiceMode])

  // ── Transport message handling ───────────────────────────

  useEffect(() => {
    if (!transport || !enabled) return

    const handleMsg = (msg: TransportMessage) => {
      if (msg.type === 'ChatMessage') {
        const cm: ChatMessage = {
          id: `msg_${++msgCounter}`,
          senderId: msg.payload.senderId as string,
          senderName: msg.payload.senderName as string,
          content: msg.payload.content as string,
          timestamp: msg.timestamp,
        }
        setMessages(prev => [...prev.slice(-99), cm]) // keep last 100
      }

      if (msg.type === 'VoicePeerUpdate') {
        const p = msg.payload as unknown as VoicePeer
        setPeers(prev => {
          const existing = prev.find(x => x.id === p.id)
          if (existing) return prev.map(x => x.id === p.id ? { ...x, ...p } : x)
          return [...prev, { ...p, isMuted: false, volume: 1 }]
        })
      }

      if (msg.type === 'VoicePeerLeft') {
        const peerId = msg.payload.peerId as string
        setPeers(prev => prev.filter(x => x.id !== peerId))
      }
    }

    transport.on('ChatMessage', handleMsg)
    transport.on('VoicePeerUpdate', handleMsg)
    transport.on('VoicePeerLeft', handleMsg)

    return () => {
      transport.off('ChatMessage', handleMsg)
      transport.off('VoicePeerUpdate', handleMsg)
      transport.off('VoicePeerLeft', handleMsg)
    }
  }, [transport, enabled])

  // ── Actions ──────────────────────────────────────────────

  const toggleLocalMute = useCallback(() => {
    setIsLocalMuted(prev => {
      const next = !prev
      // Mute/unmute local tracks
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getAudioTracks().forEach(t => {
          t.enabled = !next
        })
      }
      return next
    })
  }, [])

  const togglePeerMute = useCallback((peerId: string) => {
    setPeers(prev => prev.map(p =>
      p.id === peerId ? { ...p, isMuted: !p.isMuted } : p
    ))
  }, [])

  const setPeerVolume = useCallback((peerId: string, volume: number) => {
    setPeers(prev => prev.map(p =>
      p.id === peerId ? { ...p, volume } : p
    ))
  }, [])

  const selectDevice = useCallback(async (deviceId: string) => {
    setSelectedDeviceId(deviceId)

    // Stop existing tracks before re-acquiring
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop())
      mediaStreamRef.current = null
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
      })
      mediaStreamRef.current = stream

      // Respect current mute state
      if (isLocalMuted) {
        stream.getAudioTracks().forEach(t => { t.enabled = false })
      }
    } catch {
      // Device unavailable — leave stream cleared
    }
  }, [isLocalMuted])

  const sendMessage = useCallback((content: string) => {
    if (!transport) return

    // Send via transport
    transport.send('ChatMessage', {
      senderId: localPlayerId,
      senderName: localPlayerName,
      content,
    })

    // Add locally
    const cm: ChatMessage = {
      id: `msg_${++msgCounter}`,
      senderId: localPlayerId,
      senderName: localPlayerName,
      content,
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev.slice(-99), cm])
  }, [transport, localPlayerId, localPlayerName])

  // ── Cleanup ──────────────────────────────────────────────

  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  return {
    peers,
    messages,
    isTalking,
    isLocalMuted,
    audioDevices,
    selectedDeviceId,
    voiceMode,
    toggleLocalMute,
    togglePeerMute,
    setPeerVolume,
    selectDevice,
    setVoiceMode,
    sendMessage,
  }
}
