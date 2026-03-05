/**
 * GameVoiceChat — In-game voice + text chat overlay for multiplayer.
 *
 * Point 11 from GAMES.md:
 *   "W każdej grze jest online, więc w każdej musi być teamspeak i chat —
 *    możliwość wyciszenia siebie i innych, wybrania urządzenia wejściowego"
 *
 * Features:
 *  - Push-to-talk (T key / gamepad LB) or voice-activation
 *  - Per-player mute toggle
 *  - Audio input device selection (reuses karaoke input infrastructure)
 *  - Text chat with message history
 *  - Collapsible overlay that sits in the corner during gameplay
 *
 * Transport: Uses SignalRTransport (GameHub) for signaling,
 *            WebRTC for actual audio streaming.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './GameVoiceChat.module.css'

// ── Types ──────────────────────────────────────────────────

export interface VoicePeer {
  id: string
  name: string
  color: string
  isMuted: boolean
  isSpeaking: boolean
  volume: number // 0..1
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: number
}

export interface GameVoiceChatProps {
  /** Current player identity */
  localPlayerId: string
  localPlayerName: string
  /** List of other players in the room */
  peers: VoicePeer[]
  /** Chat messages */
  messages: ChatMessage[]
  /** Whether voice is currently active (push-to-talk held or voice-activated) */
  isTalking: boolean
  /** Whether local mic is muted */
  isLocalMuted: boolean
  /** Available audio input devices */
  audioDevices: MediaDeviceInfo[]
  /** Currently selected device ID */
  selectedDeviceId: string
  /** Voice mode */
  voiceMode: 'push-to-talk' | 'voice-activation' | 'off'
  /** Callbacks */
  onToggleLocalMute: () => void
  onTogglePeerMute: (peerId: string) => void
  onSetPeerVolume: (peerId: string, volume: number) => void
  onSelectDevice: (deviceId: string) => void
  onSetVoiceMode: (mode: 'push-to-talk' | 'voice-activation' | 'off') => void
  onSendMessage: (content: string) => void
  /** Whether the chat is minimized */
  minimized?: boolean
}

export default function GameVoiceChat({
  localPlayerId,
  localPlayerName,
  peers,
  messages,
  isTalking,
  isLocalMuted,
  audioDevices,
  selectedDeviceId,
  voiceMode,
  onToggleLocalMute,
  onTogglePeerMute,
  onSetPeerVolume,
  onSelectDevice,
  onSetVoiceMode,
  onSendMessage,
  minimized: initialMinimized = true,
}: GameVoiceChatProps) {
  const { t } = useTranslation()
  const [minimized, setMinimized] = useState(initialMinimized)
  const [activeTab, setActiveTab] = useState<'voice' | 'chat' | 'settings'>('voice')
  const [chatInput, setChatInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = useCallback(() => {
    const trimmed = chatInput.trim()
    if (!trimmed) return
    onSendMessage(trimmed)
    setChatInput('')
  }, [chatInput, onSendMessage])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
    // Stop game-level key handling while typing
    e.stopPropagation()
  }, [handleSend])

  // ── Minimized badge ──────────────────────────────────────

  if (minimized) {
    return (
      <div
        className={styles.minimizedBadge}
        onClick={() => setMinimized(false)}
        title={t('gameVoiceChat.expand', 'Open voice & chat')}
      >
        <span className={styles.badgeIcon}>
          {voiceMode === 'off' ? '🔇' : isTalking ? '🎙️' : '🎤'}
        </span>
        {messages.length > 0 && (
          <span className={styles.unreadDot} />
        )}
        <span className={styles.peerCount}>{peers.length + 1}</span>
      </div>
    )
  }

  // ── Full panel ───────────────────────────────────────────

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.panelHeader}>
        <div className={styles.tabRow}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'voice' ? styles.activeTabBtn : ''}`}
            onClick={() => setActiveTab('voice')}
          >
            🎤 {t('gameVoiceChat.voice', 'Voice')}
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'chat' ? styles.activeTabBtn : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            💬 {t('gameVoiceChat.chat', 'Chat')}
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'settings' ? styles.activeTabBtn : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️
          </button>
        </div>
        <button className={styles.minimizeBtn} onClick={() => setMinimized(true)}>—</button>
      </div>

      {/* Voice tab */}
      {activeTab === 'voice' && (
        <div className={styles.tabContent}>
          {/* Local player */}
          <div className={`${styles.playerRow} ${isTalking ? styles.speaking : ''}`}>
            <div className={styles.playerDot} style={{ background: '#3498db' }} />
            <span className={styles.playerName}>{localPlayerName}</span>
            <span className={styles.youBadge}>{t('gameVoiceChat.you', 'You')}</span>
            <button
              className={`${styles.muteBtn} ${isLocalMuted ? styles.muted : ''}`}
              onClick={onToggleLocalMute}
              title={isLocalMuted
                ? t('gameVoiceChat.unmute', 'Unmute')
                : t('gameVoiceChat.mute', 'Mute')
              }
            >
              {isLocalMuted ? '🔇' : '🔊'}
            </button>
          </div>

          {/* Peers */}
          {peers.map(peer => (
            <div
              key={peer.id}
              className={`${styles.playerRow} ${peer.isSpeaking ? styles.speaking : ''}`}
            >
              <div className={styles.playerDot} style={{ background: peer.color }} />
              <span className={styles.playerName}>{peer.name}</span>
              <input
                type="range"
                className={styles.volumeSlider}
                min={0}
                max={100}
                value={Math.round(peer.volume * 100)}
                onChange={e => onSetPeerVolume(peer.id, Number(e.target.value) / 100)}
                title={t('gameVoiceChat.volume', 'Volume')}
              />
              <button
                className={`${styles.muteBtn} ${peer.isMuted ? styles.muted : ''}`}
                onClick={() => onTogglePeerMute(peer.id)}
              >
                {peer.isMuted ? '🔇' : '🔊'}
              </button>
            </div>
          ))}

          {peers.length === 0 && (
            <p className={styles.emptyHint}>
              {t('gameVoiceChat.noPeers', 'No other players connected')}
            </p>
          )}

          {/* Push-to-talk indicator */}
          {voiceMode === 'push-to-talk' && (
            <div className={styles.pttHint}>
              {t('gameVoiceChat.pttHint', 'Hold [T] or [LB] to talk')}
            </div>
          )}
        </div>
      )}

      {/* Chat tab */}
      {activeTab === 'chat' && (
        <div className={styles.tabContent}>
          <div className={styles.chatMessages}>
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`${styles.chatMsg} ${msg.senderId === localPlayerId ? styles.ownMsg : ''}`}
              >
                <span className={styles.chatSender}>{msg.senderName}</span>
                <span className={styles.chatText}>{msg.content}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className={styles.chatInputRow}>
            <input
              ref={inputRef}
              type="text"
              className={styles.chatInput}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('gameVoiceChat.typePlaceholder', 'Type a message...')}
              maxLength={200}
            />
            <button className={styles.sendBtn} onClick={handleSend}>
              {t('gameVoiceChat.send', 'Send')}
            </button>
          </div>
        </div>
      )}

      {/* Settings tab */}
      {activeTab === 'settings' && (
        <div className={styles.tabContent}>
          <div className={styles.settingGroup}>
            <label className={styles.settingLabel}>
              {t('gameVoiceChat.voiceMode', 'Voice Mode')}
            </label>
            <select
              className={styles.settingSelect}
              value={voiceMode}
              onChange={e => onSetVoiceMode(e.target.value as 'push-to-talk' | 'voice-activation' | 'off')}
            >
              <option value="push-to-talk">{t('gameVoiceChat.pushToTalk', 'Push to Talk')}</option>
              <option value="voice-activation">{t('gameVoiceChat.voiceActivation', 'Voice Activation')}</option>
              <option value="off">{t('gameVoiceChat.voiceOff', 'Off')}</option>
            </select>
          </div>

          <div className={styles.settingGroup}>
            <label className={styles.settingLabel}>
              {t('gameVoiceChat.inputDevice', 'Input Device')}
            </label>
            <select
              className={styles.settingSelect}
              value={selectedDeviceId}
              onChange={e => onSelectDevice(e.target.value)}
            >
              {audioDevices.length === 0 && (
                <option value="">{t('gameVoiceChat.noDevices', 'No devices found')}</option>
              )}
              {audioDevices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `${t('gameVoiceChat.microphone', 'Microphone')} ${d.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>

          <p className={styles.settingHint}>
            {t('gameVoiceChat.settingsHint', 'Audio settings are shared with karaoke microphone configuration.')}
          </p>
        </div>
      )}
    </div>
  )
}
