import type { KillFeed, GameMode } from './types'

//  Split-screen helpers 
export const MAX_PLAYERS = 8
export const GAMEPAD_AIM_SENS = 0.04
export const GAMEPAD_DEADZONE = 0.15

export function clampPitch(p: number): number {
  return Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, p))
}

export function getGrid(n: number): { cols: number; rows: number } {
  if (n <= 1) return { cols: 1, rows: 1 }
  if (n <= 2) return { cols: 2, rows: 1 }
  if (n <= 4) return { cols: 2, rows: 2 }
  if (n <= 6) return { cols: 3, rows: 2 }
  return { cols: 4, rows: 2 }
}

//  Per-player HUD data 
export interface HudData {
  hp: number; maxHp: number; armor: number
  weapon: string; posture: 'stand' | 'crouch' | 'prone'
  name: string; alive: boolean
  /** Bleeding indicator */
  bleeding: boolean
  /** Bandage progress 0-100 */
  bandageProgress: number
  /** Remaining bandages */
  bandages: number
  /** Camera perspective */
  cameraPerspective: 'fpp' | 'tpp'
  /** Aim assist mode */
  aimAssist: 'none' | 'semi' | 'full'
  /** ADS active */
  isAiming: boolean
  /** Look sensitivity (1-10, default 5) */
  sensitivity: number
}

export interface SharedHud {
  tickets: [number, number]
  killFeed: KillFeed[]
  gameOver: boolean; winTeam: number
  mode: GameMode; round: number; roundScore: [number, number]
  // BR-specific
  brAliveCount: number
  brTotalCount: number
  brZonePhase: number
  brZoneTimer: number
  brPlacement: number
  // Voice chat
  vcSpeakers: string[]
  vcMode: string
}
