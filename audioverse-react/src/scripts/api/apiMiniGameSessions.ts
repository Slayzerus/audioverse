/**
 * apiMiniGameSessions.ts — Frontend API client for the mini-game sessions endpoints.
 *
 * Wraps the backend endpoints:
 *   POST /api/minigames/sessions           → create session
 *   POST /api/minigames/sessions/:id/end   → end session
 *   GET  /api/minigames/sessions/:id       → get session details
 *   POST /api/minigames/sessions/:id/rounds → submit round
 *   GET  /api/minigames/leaderboard        → leaderboard
 *   GET  /api/minigames/players/:id/stats  → player stats
 */

import { apiClient } from './audioverseApiClient'

const BASE = '/api/minigames'

// ── Request types ────────────────────────────────────────────

export interface CreateSessionRequest {
  hostPlayerId: number
  eventId?: number
  title?: string
}

export interface SubmitRoundPlayerRequest {
  playerId: number
  score: number
  placement?: number
  resultDetailsJson?: string
}

export interface SubmitRoundRequest {
  game: string
  mode: string
  settingsJson?: string
  durationSeconds?: number
  players: SubmitRoundPlayerRequest[]
}

// ── Response types ───────────────────────────────────────────

export interface MiniGamePlayerXpResult {
  playerId: number
  score: number
  placement: number | null
  isPersonalBest: boolean
  xpEarned: number
  newTotalXp: number
  newLevel: number
  leveledUp: boolean
}

export interface SubmitRoundResult {
  roundId: number
  roundNumber: number
  playerResults: MiniGamePlayerXpResult[]
}

export interface MiniGameRoundPlayerDto {
  playerId: number
  playerName: string | null
  score: number
  placement: number | null
  isPersonalBest: boolean
  xpEarned: number
  completedAtUtc: string
}

export interface MiniGameRoundDto {
  id: number
  roundNumber: number
  game: string
  mode: string
  durationSeconds: number | null
  startedAtUtc: string
  endedAtUtc: string | null
  players: MiniGameRoundPlayerDto[]
}

export interface MiniGameSessionDto {
  id: number
  eventId: number | null
  hostPlayerId: number
  hostPlayerName: string | null
  title: string | null
  startedAtUtc: string
  endedAtUtc: string | null
  rounds: MiniGameRoundDto[]
}

export interface LeaderboardEntry {
  playerId: number
  playerName: string
  bestScore: number
  totalGames: number
  achievedAtUtc: string
}

export interface PlayerMiniGameStat {
  game: string
  mode: string
  bestScore: number
  totalGames: number
  totalXpEarned: number
  lastPlayedAtUtc: string
}

// ── API functions ────────────────────────────────────────────

export async function createMiniGameSession(req: CreateSessionRequest): Promise<{ id: number }> {
  const { data } = await apiClient.post<{ id: number }>(`${BASE}/sessions`, req)
  return data
}

export async function endMiniGameSession(sessionId: number): Promise<void> {
  await apiClient.post(`${BASE}/sessions/${sessionId}/end`)
}

export async function getMiniGameSession(sessionId: number): Promise<MiniGameSessionDto> {
  const { data } = await apiClient.get<MiniGameSessionDto>(`${BASE}/sessions/${sessionId}`)
  return data
}

export async function submitMiniGameRound(sessionId: number, req: SubmitRoundRequest): Promise<SubmitRoundResult> {
  const { data } = await apiClient.post<SubmitRoundResult>(`${BASE}/sessions/${sessionId}/rounds`, req)
  return data
}

export async function getMiniGameLeaderboard(
  game: string,
  mode?: string,
  top = 20,
): Promise<LeaderboardEntry[]> {
  const params: Record<string, string | number> = { game, top }
  if (mode) params.mode = mode
  const { data } = await apiClient.get<LeaderboardEntry[]>(`${BASE}/leaderboard`, { params })
  return data
}

export async function getPlayerMiniGameStats(playerId: number): Promise<PlayerMiniGameStat[]> {
  const { data } = await apiClient.get<PlayerMiniGameStat[]>(`${BASE}/players/${playerId}/stats`)
  return data
}
