/**
 * OnlineLobby — UI for creating/joining online multiplayer rooms.
 *
 * Phases:
 *  1. Connect to SignalR hub
 *  2. Choose: Create Private Room / Create Public Room / Join by Code / Matchmaking
 *  3. Lobby: see players, ready up, host starts
 *  4. Transitions to game
 *
 * ⚠️ BACKEND REQUIREMENT: Requires GameHub. See BACKEND_NOTE_ONLINE_MULTIPLAYER.md
 */

import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PLAYER_COLORS } from './types'
import { useOnlineMultiplayer, type OnlinePlayer } from './useOnlineMultiplayer'
import { useMiniGameLobby } from '../../../contexts/MiniGameLobbyContext'
import styles from './OnlineLobby.module.css'

interface Props {
  gameId: string
  gameTitle: string
  onStart: (players: OnlinePlayer[], sessionId: number | null) => void
  onBack: () => void
}

export default function OnlineLobby({ gameId, gameTitle, onStart, onBack }: Props) {
  const { t } = useTranslation()
  const { profilePlayers } = useMiniGameLobby()

  // Use first profile player as default identity
  const defaultPlayer = profilePlayers[0]
  const defaultName = defaultPlayer?.name ?? 'Player'
  const defaultColor = defaultPlayer?.color ?? PLAYER_COLORS[0]

  const {
    phase, transportState, roomCode, isHost, players, error,
    sessionId,
    connect, disconnect, createRoom, joinRoom, leaveRoom,
    startMatchmaking, cancelMatchmaking, setReady,
    startGame,
  } = useOnlineMultiplayer(defaultPlayer?.id)

  const [joinCode, setJoinCode] = useState('')
  const [playerName, setPlayerName] = useState(defaultName)
  const [playerColor, _setPlayerColor] = useState(defaultColor)

  // ── Auto-connect on mount ────────────────────────────────
  const handleConnect = useCallback(async () => {
    // Get token from cookie/storage for auth
    const tokenEl = document.cookie.split(';').find(c => c.trim().startsWith('access_token='))
    const token = tokenEl?.split('=')?.[1]
    await connect(token ? () => token : undefined)
  }, [connect])

  // ── Actions ──────────────────────────────────────────────

  const handleCreatePrivate = useCallback(async () => {
    await createRoom(gameId, true)
  }, [createRoom, gameId])

  const handleCreatePublic = useCallback(async () => {
    await createRoom(gameId, false)
  }, [createRoom, gameId])

  const handleJoin = useCallback(async () => {
    if (!joinCode.trim()) return
    await joinRoom(joinCode.trim().toUpperCase(), playerName, playerColor)
  }, [joinRoom, joinCode, playerName, playerColor])

  const handleMatchmaking = useCallback(async () => {
    // Use a default skill level of 1000 (Elo-like)
    await startMatchmaking(gameId, 1000)
  }, [startMatchmaking, gameId])

  const handleStart = useCallback(() => {
    startGame()
    // Small delay for the "starting" phase animation, then transition
    setTimeout(() => {
      onStart(players, sessionId)
    }, 1500)
  }, [startGame, onStart, players, sessionId])

  const allReady = players.length >= 2 && players.every(p => p.isReady)

  // ── Render ───────────────────────────────────────────────

  // Disconnected — show connect button
  if (phase === 'disconnected' || phase === 'connecting') {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>🌐 {gameTitle} — {t('onlineLobby.online', 'Online')}</h2>
        <div className={styles.card}>
          {phase === 'connecting' ? (
            <div className={styles.spinner}>
              {t('onlineLobby.connecting', 'Connecting to server…')}
            </div>
          ) : (
            <>
              <p className={styles.hint}>
                {t('onlineLobby.connectHint', 'Connect to the game server to play online.')}
              </p>
              <div className={styles.identity}>
                <label>{t('onlineLobby.yourName', 'Your Name')}</label>
                <input
                  className={styles.input}
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  maxLength={20}
                />
              </div>
              <button className={styles.primaryBtn} onClick={handleConnect}>
                🔌 {t('onlineLobby.connect', 'Connect')}
              </button>
            </>
          )}
        </div>
        <button className={styles.backBtn} onClick={onBack}>
          ← {t('miniGames.back', 'Back')}
        </button>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    )
  }

  // Error state
  if (phase === 'error') {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>❌ {t('onlineLobby.error', 'Error')}</h2>
        <p className={styles.error}>{error}</p>
        <button className={styles.primaryBtn} onClick={handleConnect}>
          {t('onlineLobby.retry', 'Retry')}
        </button>
        <button className={styles.backBtn} onClick={() => { disconnect(); onBack() }}>
          ← {t('miniGames.back', 'Back')}
        </button>
      </div>
    )
  }

  // Idle — choose mode
  if (phase === 'idle') {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>🌐 {gameTitle} — {t('onlineLobby.online', 'Online')}</h2>
        <div className={styles.statusBadge}>
          ✓ {t('onlineLobby.connectedAs', 'Connected as')} <strong>{playerName}</strong>
        </div>

        <div className={styles.modeGrid}>
          <button className={styles.modeCard} onClick={handleCreatePrivate}>
            <span className={styles.modeIcon}>🔒</span>
            <span className={styles.modeName}>{t('onlineLobby.privateRoom', 'Private Room')}</span>
            <span className={styles.modeDesc}>
              {t('onlineLobby.privateDesc', 'Share a code with friends')}
            </span>
          </button>

          <button className={styles.modeCard} onClick={handleCreatePublic}>
            <span className={styles.modeIcon}>🌍</span>
            <span className={styles.modeName}>{t('onlineLobby.publicRoom', 'Public Room')}</span>
            <span className={styles.modeDesc}>
              {t('onlineLobby.publicDesc', 'Anyone can join')}
            </span>
          </button>

          <button className={styles.modeCard} onClick={handleMatchmaking}>
            <span className={styles.modeIcon}>⚔️</span>
            <span className={styles.modeName}>{t('onlineLobby.matchmaking', 'Matchmaking')}</span>
            <span className={styles.modeDesc}>
              {t('onlineLobby.matchmakingDesc', 'Find players at your skill level')}
            </span>
          </button>

          <div className={styles.joinSection}>
            <h3>{t('onlineLobby.joinByCode', 'Join by Code')}</h3>
            <div className={styles.joinRow}>
              <input
                className={styles.codeInput}
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABCD-1234"
                maxLength={9}
              />
              <button
                className={styles.joinBtn}
                onClick={handleJoin}
                disabled={joinCode.length < 4}
              >
                {t('onlineLobby.join', 'Join')}
              </button>
            </div>
          </div>
        </div>

        <button className={styles.backBtn} onClick={() => { disconnect(); onBack() }}>
          ← {t('miniGames.back', 'Back')}
        </button>
      </div>
    )
  }

  // Matchmaking — searching
  if (phase === 'matchmaking') {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>⚔️ {t('onlineLobby.searching', 'Searching for match…')}</h2>
        <div className={styles.spinner}>
          <div className={styles.spinnerDot} />
          <p>{t('onlineLobby.searchingHint', 'Looking for players at a similar skill level…')}</p>
        </div>
        <button className={styles.cancelBtn} onClick={cancelMatchmaking}>
          ✕ {t('onlineLobby.cancel', 'Cancel')}
        </button>
      </div>
    )
  }

  // Lobby — in a room
  if (phase === 'lobby' || phase === 'creating' || phase === 'joining' || phase === 'starting') {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>🎮 {gameTitle}</h2>

        {roomCode && (
          <div className={styles.roomInfo}>
            <span className={styles.roomLabel}>{t('onlineLobby.roomCode', 'Room Code')}:</span>
            <span className={styles.roomCodeValue}>{roomCode}</span>
            <button
              className={styles.copyBtn}
              onClick={() => navigator.clipboard?.writeText(roomCode)}
              title={t('onlineLobby.copy', 'Copy')}
            >
              📋
            </button>
          </div>
        )}

        <div className={styles.playerList}>
          <h3>{t('onlineLobby.players', 'Players')} ({players.length})</h3>
          {players.map((p, i) => (
            <div key={p.connectionId ?? i} className={styles.playerRow}>
              <span className={styles.playerDot} style={{ background: p.color }} />
              <span className={styles.playerName}>
                {p.name}
                {p.isHost && <span className={styles.hostBadge}>👑</span>}
              </span>
              <span className={`${styles.readyBadge} ${p.isReady ? styles.readyYes : styles.readyNo}`}>
                {p.isReady
                  ? `✓ ${t('onlineLobby.ready', 'Ready')}`
                  : t('onlineLobby.notReady', 'Not Ready')}
              </span>
            </div>
          ))}
          {players.length < 2 && (
            <p className={styles.waitingText}>
              {t('onlineLobby.waitingForPlayers', 'Waiting for more players to join…')}
            </p>
          )}
        </div>

        <div className={styles.lobbyActions}>
          {!isHost && (
            <button
              className={styles.readyBtn}
              onClick={() => {
                const me = players.find(p => !p.isHost)
                setReady(!me?.isReady)
              }}
            >
              ✓ {t('onlineLobby.toggleReady', 'Toggle Ready')}
            </button>
          )}

          {isHost && (
            <button
              className={`${styles.startBtn} ${!allReady ? styles.startBtnDisabled : ''}`}
              onClick={handleStart}
              disabled={!allReady || phase === 'starting'}
            >
              {phase === 'starting'
                ? t('onlineLobby.starting', 'Starting…')
                : `🚀 ${t('onlineLobby.startGame', 'Start Game')}`}
            </button>
          )}

          <button className={styles.leaveBtn} onClick={leaveRoom}>
            🚪 {t('onlineLobby.leave', 'Leave Room')}
          </button>
        </div>

        {transportState === 'reconnecting' && (
          <p className={styles.reconnecting}>
            ⚠️ {t('onlineLobby.reconnecting', 'Reconnecting…')}
          </p>
        )}
      </div>
    )
  }

  // Default / playing / results — these states are handled by the game component
  return null
}
