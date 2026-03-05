/**
 * Multiplayer utilities — unified flow for local and offline multiplayer.
 * Reduces code duplication across karaoke, jam session, and mini-games.
 */

import { PLAYER_COLORS } from '../constants/playerColors';

export type MultiplayerMode = 'local' | 'online' | 'offline';

export interface MultiplayerPlayer {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  isHost: boolean;
  isLocal: boolean;
  isReady: boolean;
  score: number;
  deviceId?: string;
}

export interface MultiplayerLobby {
  id: string;
  code: string;
  mode: MultiplayerMode;
  players: MultiplayerPlayer[];
  maxPlayers: number;
  hostId: string;
  gameType: 'karaoke' | 'jam' | 'minigame' | 'hit-that-note';
  status: 'waiting' | 'starting' | 'playing' | 'finished';
  settings: MultiplayerSettings;
  createdAt: number;
}

export interface MultiplayerSettings {
  rounds: number;
  timePerRound: number;
  difficulty: number;
  allowLateJoin: boolean;
  autoStartOnFull: boolean;
}

export interface MultiplayerEvent {
  type: 'player-joined' | 'player-left' | 'player-ready' | 'game-start' | 'game-end' | 'score-update' | 'round-end';
  playerId: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

// Uses shared `PLAYER_COLORS` from constants so themes/helpers can co-exist.

/** Generate a random 6-character lobby code */
export function generateLobbyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/** Create a new multiplayer lobby */
export function createLobby(
  hostName: string,
  gameType: MultiplayerLobby['gameType'],
  mode: MultiplayerMode = 'local',
  maxPlayers = 8,
): MultiplayerLobby {
  const hostId = `player-${Date.now()}`;
  return {
    id: `lobby-${Date.now()}`,
    code: generateLobbyCode(),
    mode,
    players: [{
      id: hostId,
      name: hostName,
      color: PLAYER_COLORS[0],
      isHost: true,
      isLocal: true,
      isReady: true,
      score: 0,
    }],
    maxPlayers,
    hostId,
    gameType,
    status: 'waiting',
    settings: {
      rounds: 3,
      timePerRound: 120,
      difficulty: 2,
      allowLateJoin: true,
      autoStartOnFull: false,
    },
    createdAt: Date.now(),
  };
}

/** Add a player to the lobby */
export function addPlayerToLobby(lobby: MultiplayerLobby, name: string, isLocal = true): MultiplayerLobby {
  if (lobby.players.length >= lobby.maxPlayers) return lobby;

  const newPlayer: MultiplayerPlayer = {
    id: `player-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    color: PLAYER_COLORS[lobby.players.length % PLAYER_COLORS.length],
    isHost: false,
    isLocal,
    isReady: false,
    score: 0,
  };

  return { ...lobby, players: [...lobby.players, newPlayer] };
}

/** Remove a player from the lobby */
export function removePlayerFromLobby(lobby: MultiplayerLobby, playerId: string): MultiplayerLobby {
  const players = lobby.players.filter(p => p.id !== playerId);
  // Transfer host if host left
  if (playerId === lobby.hostId && players.length > 0) {
    players[0].isHost = true;
    return { ...lobby, players, hostId: players[0].id };
  }
  return { ...lobby, players };
}

/** Toggle player ready state */
export function togglePlayerReady(lobby: MultiplayerLobby, playerId: string): MultiplayerLobby {
  return {
    ...lobby,
    players: lobby.players.map(p =>
      p.id === playerId ? { ...p, isReady: !p.isReady } : p
    ),
  };
}

/** Check if all players are ready */
export function allPlayersReady(lobby: MultiplayerLobby): boolean {
  return lobby.players.length >= 2 && lobby.players.every(p => p.isReady);
}

/** Update lobby status */
export function updateLobbyStatus(lobby: MultiplayerLobby, status: MultiplayerLobby['status']): MultiplayerLobby {
  return { ...lobby, status };
}

/** Update player score */
export function updatePlayerScore(lobby: MultiplayerLobby, playerId: string, score: number): MultiplayerLobby {
  return {
    ...lobby,
    players: lobby.players.map(p =>
      p.id === playerId ? { ...p, score } : p
    ),
  };
}

/** Get sorted leaderboard */
export function getLeaderboard(lobby: MultiplayerLobby): MultiplayerPlayer[] {
  return [...lobby.players].sort((a, b) => b.score - a.score);
}

/** Update lobby settings */
export function updateSettings(lobby: MultiplayerLobby, settings: Partial<MultiplayerSettings>): MultiplayerLobby {
  return { ...lobby, settings: { ...lobby.settings, ...settings } };
}

/** Serialize lobby for storage/transmission */
export function serializeLobby(lobby: MultiplayerLobby): string {
  return JSON.stringify(lobby);
}

/** Deserialize lobby from storage/transmission */
export function deserializeLobby(data: string): MultiplayerLobby {
  return JSON.parse(data) as MultiplayerLobby;
}

/** Save lobby to local storage (offline mode) */
export function saveLobbyOffline(lobby: MultiplayerLobby): void {
  const key = `multiplayer-lobby-${lobby.id}`;
  localStorage.setItem(key, serializeLobby(lobby));
}

/** Load lobby from local storage (offline mode) */
export function loadLobbyOffline(lobbyId: string): MultiplayerLobby | null {
  const key = `multiplayer-lobby-${lobbyId}`;
  const data = localStorage.getItem(key);
  if (!data) return null;
  try {
    return deserializeLobby(data);
  } catch {
    /* Expected: deserialization may fail on corrupt/outdated lobby data */
    return null;
  }
}

/** Create a multiplayer event */
export function createEvent(type: MultiplayerEvent['type'], playerId: string, data?: Record<string, unknown>): MultiplayerEvent {
  return { type, playerId, data, timestamp: Date.now() };
}
