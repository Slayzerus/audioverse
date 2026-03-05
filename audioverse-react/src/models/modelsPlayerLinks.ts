// modelsPlayerLinks.ts — Player Links & KaraokeSettings DTOs

// === KaraokeSettings (embedded in Player) ===

export interface KaraokeBarFill {
  color: string | null;
  capStyleName: string;
  patternName: string | null;
  patternColor: string | null;
  patternOnly: boolean;
  highlight: number;
  glow: number;
  glass: number;
  textureUrl: string | null;
  textureScale: number;
}

export interface KaraokeFontSettings {
  fontFamily: string | null;
  fontSize: number;
  fontColor: string | null;
  outlineColor: string | null;
  outlineWidth: number;
  shadow: string | null;
}

export interface KaraokeSettings {
  filledBar: KaraokeBarFill;
  emptyBar: KaraokeBarFill;
  goldFilledBar: KaraokeBarFill;
  goldEmptyBar: KaraokeBarFill;
  font: KaraokeFontSettings;
}

// Default factory for KaraokeSettings
export function createDefaultKaraokeSettings(): KaraokeSettings {
  const defaultBar: KaraokeBarFill = {
    color: null,
    capStyleName: "Pill",
    patternName: null,
    patternColor: null,
    patternOnly: false,
    highlight: 70,
    glow: 55,
    glass: 0,
    textureUrl: null,
    textureScale: 1.0,
  };
  return {
    filledBar: { ...defaultBar },
    emptyBar: { ...defaultBar, color: "#d1d5db", glass: 85 },
    goldFilledBar: { ...defaultBar, patternName: "Stars" },
    goldEmptyBar: { ...defaultBar, color: "#b4af9f", patternName: "Stars" },
    font: {
      fontFamily: null,
      fontSize: 18,
      fontColor: null,
      outlineColor: null,
      outlineWidth: 0,
      shadow: null,
    },
  };
}

// === Player Link scope flags ===

export enum PlayerLinkScope {
  Progress = 1,
  Appearance = 2,
  KaraokeSettings = 4,
  All = 7,
}

export enum PlayerLinkStatus {
  Active = 0,
  Revoked = 1,
}

// === Request DTOs ===

export interface PlayerLinkSearchRequest {
  login: string;
  password: string;
}

export interface PlayerLinkConfirmRequest {
  targetPlayerId: number;
  scope?: number;
}

// === Response DTOs ===

export interface LinkCandidatePlayerDto {
  playerId: number;
  playerName: string;
  isPrimary: boolean;
  preferredColors: string;
}

export interface PlayerLinkSearchResponse {
  success: boolean;
  players: LinkCandidatePlayerDto[];
}

export interface PlayerLinkDto {
  id: number;
  sourcePlayerId: number;
  sourcePlayerName: string;
  sourceProfileId: number;
  targetPlayerId: number;
  targetPlayerName: string;
  targetProfileId: number;
  scope: number;
  status: number;
  createdAt: string;
}

export interface PlayerLinksResponse {
  success: boolean;
  links: PlayerLinkDto[];
}
