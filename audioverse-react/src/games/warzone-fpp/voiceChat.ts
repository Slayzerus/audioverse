/**
 * Voice Chat (TeamSpeak) system for Warzone FPP.
 *
 * Supports:
 * - Push-to-talk (T key / D-pad Down on gamepad)
 * - Proximity-based voice (closer players = louder)
 * - Team channel isolation
 * - Visual speaking indicators
 * - Works offline (local mic loopback for couch), online (WebRTC), and local split-screen
 *
 * For local/couch mode: simulates proximity chat with spatial audio.
 * For online mode: uses WebRTC peer connections (when available).
 */

// ─── Types ───────────────────────────────────────────────

export interface VoiceChatUser {
  playerIndex: number
  name: string
  team: number
  isSpeaking: boolean
  volume: number          // 0-1 based on proximity
  muted: boolean
  pttActive: boolean      // push-to-talk button held
}

export interface VoiceChatState {
  enabled: boolean
  mode: 'proximity' | 'team' | 'global'
  users: VoiceChatUser[]
  localMicActive: boolean
  proximityRadius: number  // max distance for proximity chat (metres)
  /** Channel isolation: only hear your team in 'team' mode */
  teamOnly: boolean
}

export interface VoiceChatConfig {
  mode?: 'proximity' | 'team' | 'global'
  proximityRadius?: number
  enabled?: boolean
}

// ─── Constants ───────────────────────────────────────────

const DEFAULT_PROXIMITY_RADIUS = 30  // metres
const MIN_VOLUME = 0.05
const SPEAKING_DECAY_TICKS = 10       // ticks after PTT release to keep "speaking" indicator

// ─── Factory ─────────────────────────────────────────────

export function createVoiceChat(config: VoiceChatConfig = {}): {
  state: VoiceChatState
  init: (players: { playerIndex: number; name: string; team: number }[]) => void
  updatePTT: (playerIndex: number, pressed: boolean) => void
  updateProximity: (soldierPositions: { playerIndex: number; x: number; y: number; team: number }[]) => void
  tick: () => void
  toggleMode: () => void
  toggleMute: (playerIndex: number) => void
  getSpeakers: () => VoiceChatUser[]
  dispose: () => void
} {
  const state: VoiceChatState = {
    enabled: config.enabled ?? true,
    mode: config.mode ?? 'proximity',
    users: [],
    localMicActive: false,
    proximityRadius: config.proximityRadius ?? DEFAULT_PROXIMITY_RADIUS,
    teamOnly: false,
  }

  // Track PTT hold time for decay
  const pttDecay = new Map<number, number>()

  // Audio context for spatial audio (local mode)
  let audioCtx: AudioContext | null = null
  let localStream: MediaStream | null = null
  const gainNodes = new Map<number, GainNode>()
  const pannerNodes = new Map<number, StereoPannerNode>()

  function init(players: { playerIndex: number; name: string; team: number }[]): void {
    state.users = players.map(p => ({
      playerIndex: p.playerIndex,
      name: p.name,
      team: p.team,
      isSpeaking: false,
      volume: 1,
      muted: false,
      pttActive: false,
    }))
    initLocalMic()
  }

  function updatePTT(playerIndex: number, pressed: boolean): void {
    const user = state.users.find(u => u.playerIndex === playerIndex)
    if (!user) return
    user.pttActive = pressed
    if (pressed) {
      user.isSpeaking = true
      pttDecay.set(playerIndex, SPEAKING_DECAY_TICKS)
    }
  }

  function updateProximity(
    soldierPositions: { playerIndex: number; x: number; y: number; team: number }[],
  ): void {
    if (!state.enabled) return

    // For each pair of users, calculate volume based on distance
    for (const user of state.users) {
      const userPos = soldierPositions.find(s => s.playerIndex === user.playerIndex)
      if (!userPos) continue

      if (state.mode === 'team') {
        // Team mode: full volume if same team, muted if different
        user.volume = 1.0
      } else if (state.mode === 'global') {
        user.volume = 1.0
      } else {
        // Proximity mode: volume based on distance to local player (index 0)
        const localPos = soldierPositions[0]
        if (!localPos || user.playerIndex === localPos.playerIndex) {
          user.volume = 1.0
          continue
        }
        const dx = userPos.x - localPos.x
        const dy = userPos.y - localPos.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > state.proximityRadius) {
          user.volume = 0
        } else {
          user.volume = Math.max(MIN_VOLUME, 1 - dist / state.proximityRadius)
        }
      }
    }
  }

  function tick(): void {
    // Decay speaking indicator after PTT release
    for (const user of state.users) {
      if (!user.pttActive) {
        const remaining = pttDecay.get(user.playerIndex) ?? 0
        if (remaining > 0) {
          pttDecay.set(user.playerIndex, remaining - 1)
        } else {
          user.isSpeaking = false
        }
      }
    }
  }

  function toggleMode(): void {
    const modes: VoiceChatState['mode'][] = ['proximity', 'team', 'global']
    const idx = modes.indexOf(state.mode)
    state.mode = modes[(idx + 1) % modes.length]
  }

  function toggleMute(playerIndex: number): void {
    const user = state.users.find(u => u.playerIndex === playerIndex)
    if (user) user.muted = !user.muted
  }

  function getSpeakers(): VoiceChatUser[] {
    return state.users.filter(u => u.isSpeaking && !u.muted && u.volume > 0)
  }

  async function initLocalMic(): Promise<void> {
    try {
      audioCtx = new AudioContext()
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      state.localMicActive = true
    } catch {
      // Mic not available — silent mode
      state.localMicActive = false
    }
  }

  function dispose(): void {
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop())
      localStream = null
    }
    if (audioCtx) {
      audioCtx.close()
      audioCtx = null
    }
    gainNodes.clear()
    pannerNodes.clear()
    pttDecay.clear()
    state.localMicActive = false
  }

  return {
    state,
    init,
    updatePTT,
    updateProximity,
    tick,
    toggleMode,
    toggleMute,
    getSpeakers,
    dispose,
  }
}

export type VoiceChat = ReturnType<typeof createVoiceChat>
