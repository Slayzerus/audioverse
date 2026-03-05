// ── Campaign & Progress models ──
// Based on FRONT.md spec: Kampania Karaoke + System Postępu

import type { KaraokeRoundMode } from './modelsKaraokeCore';

// ── Enums ──

export enum CampaignCoopMode {
    Solo = 0,
    AllMustPass = 1,
    AnyOnePass = 2,
}

export enum CampaignRoundStatus {
    Locked = 0,
    Unlocked = 1,
    Completed = 2,
}

export enum ProgressCategory {
    Karaoke = 0,
    HonestLiving = 1,
    Campaign = 2,
    Editor = 3,
    Social = 4,
}

export enum SkillScope {
    CampaignOnly = 0,
    Global = 1,
}

// ── Campaign Template ──

export interface CampaignTemplate {
    id: number;
    name: string;
    description: string | null;
    difficulty: number;       // 1–5
    isPublic: boolean;
    createdByPlayerId: number | null;
    configJson: string | null;
    rounds: CampaignTemplateRound[];
}

export interface CampaignTemplateRound {
    id: number;
    roundNumber: number;
    name: string | null;
    scoreThreshold: number;
    singingMode: KaraokeRoundMode;
    songsToChoose: number;
    timeLimitSeconds: number | null;
    xpReward: number;
    rewardSkillDefinitionId: number | null;
    rewardSkillDefinition: SkillDefinition | null;
    songPool: CampaignTemplateRoundSong[];
}

export interface CampaignTemplateRoundSong {
    id: number;
    songId: number;
    song: { id: number; title: string; artist: string } | null;
}

// ── Campaign Instance ──

export interface Campaign {
    id: number;
    templateId: number;
    template: CampaignTemplate | null;
    coopMode: CampaignCoopMode;
    startedAt: string;
    completedAt: string | null;
    currentRound: number;
    totalScore: number;
    totalXpEarned: number;
    players: CampaignPlayer[];
    roundProgress: CampaignRoundProgress[];
}

export interface CampaignPlayer {
    id: number;
    campaignId: number;
    playerId: number;
    player: { id: number; name: string } | null;
    totalScore: number;
    joinedAt: string;
}

export interface CampaignRoundProgress {
    id: number;
    campaignId: number;
    roundNumber: number;
    status: CampaignRoundStatus;
    chosenSongId: number | null;
    bestScore: number | null;
    xpEarned: number;
    completedAt: string | null;
    singingId: number | null;
}

// ── Player Progress ──

export interface PlayerProgress {
    id: number;
    playerId: number;
    category: ProgressCategory;
    xp: number;
    level: number;
    xpToNextLevel: number;
    updatedAt: string;
}

export interface SkillDefinition {
    id: number;
    name: string;
    description: string | null;
    iconUrl: string | null;
    scope: SkillScope;
    effectKey: string;
    effectValue: string | null;
    requiredLevel: number;
    requiredCategory: ProgressCategory | null;
}

export interface PlayerSkill {
    id: number;
    playerId: number;
    skillDefinitionId: number;
    skillDefinition: SkillDefinition | null;
    unlockedInCampaignId: number | null;
    unlockedAt: string;
    usageCount: number;
}

// ── Request types ──

export interface StartCampaignRequest {
    templateId: number;
    coopMode?: CampaignCoopMode;
}

export interface SubmitRoundScoreRequest {
    score: number;
    singingId?: number;
}

export interface AddXpRequest {
    category: ProgressCategory;
    amount: number;
    source?: string;
}
