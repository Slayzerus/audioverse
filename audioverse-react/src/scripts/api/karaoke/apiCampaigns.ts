// apiCampaigns.ts — Campaign & Progress API service
// Backend spec: FRONT.md "Kampania Karaoke + System Postępu"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, apiPath } from "../audioverseApiClient";
import { KARAOKE_BASE } from "./apiKaraokeBase";
import type {
    CampaignTemplate,
    Campaign,
    CampaignRoundProgress,
    PlayerProgress,
    PlayerSkill,
    StartCampaignRequest,
    SubmitRoundScoreRequest,
    AddXpRequest,
} from "../../../models/karaoke/modelsCampaign";

// ══════════════════════════════════════════════════════════════
// === Query Keys ===
// ══════════════════════════════════════════════════════════════

export const CAMPAIGN_QK = {
    templates: ["campaigns", "templates"] as const,
    template: (id: number) => ["campaigns", "templates", id] as const,
    myCampaigns: ["campaigns", "my"] as const,
    campaign: (id: number) => ["campaigns", id] as const,
    playerProgress: (playerId: number) => ["progress", playerId] as const,
    playerSkills: (playerId: number) => ["progress", playerId, "skills"] as const,
};

// ══════════════════════════════════════════════════════════════
// === Campaign Templates ===
// ══════════════════════════════════════════════════════════════

export const fetchCampaignTemplates = async (): Promise<CampaignTemplate[]> => {
    const { data } = await apiClient.get<CampaignTemplate[]>(apiPath(KARAOKE_BASE, "/campaigns/templates"));
    return data ?? [];
};

export const fetchCampaignTemplate = async (templateId: number): Promise<CampaignTemplate> => {
    const { data } = await apiClient.get<CampaignTemplate>(apiPath(KARAOKE_BASE, `/campaigns/templates/${templateId}`));
    return data;
};

export const postCreateCampaignTemplate = async (template: Partial<CampaignTemplate>): Promise<CampaignTemplate> => {
    const { data } = await apiClient.post<CampaignTemplate>(apiPath(KARAOKE_BASE, "/campaigns/templates"), template);
    return data;
};

export const putUpdateCampaignTemplate = async (templateId: number, template: Partial<CampaignTemplate>): Promise<CampaignTemplate> => {
    const { data } = await apiClient.put<CampaignTemplate>(apiPath(KARAOKE_BASE, `/campaigns/templates/${templateId}`), template);
    return data;
};

// ══════════════════════════════════════════════════════════════
// === Campaign Instances ===
// ══════════════════════════════════════════════════════════════

export const postStartCampaign = async (req: StartCampaignRequest): Promise<Campaign> => {
    const { data } = await apiClient.post<Campaign>(apiPath(KARAOKE_BASE, "/campaigns/start"), req);
    return data;
};

export const postJoinCampaign = async (campaignId: number): Promise<void> => {
    await apiClient.post(apiPath(KARAOKE_BASE, `/campaigns/${campaignId}/join`));
};

export const fetchCampaign = async (campaignId: number): Promise<Campaign> => {
    const { data } = await apiClient.get<Campaign>(apiPath(KARAOKE_BASE, `/campaigns/${campaignId}`));
    return data;
};

export const fetchMyCampaigns = async (): Promise<Campaign[]> => {
    const { data } = await apiClient.get<Campaign[]>(apiPath(KARAOKE_BASE, "/campaigns/my"));
    return data ?? [];
};

export const postChooseSong = async (campaignId: number, roundNumber: number, songId: number): Promise<void> => {
    await apiClient.post(apiPath(KARAOKE_BASE, `/campaigns/${campaignId}/rounds/${roundNumber}/choose-song`), songId);
};

export const postSubmitScore = async (campaignId: number, roundNumber: number, req: SubmitRoundScoreRequest): Promise<CampaignRoundProgress> => {
    const { data } = await apiClient.post<CampaignRoundProgress>(
        apiPath(KARAOKE_BASE, `/campaigns/${campaignId}/rounds/${roundNumber}/submit-score`),
        req
    );
    return data;
};

// ══════════════════════════════════════════════════════════════
// === Player Progress ===
// ══════════════════════════════════════════════════════════════

export const fetchPlayerProgress = async (playerId: number): Promise<PlayerProgress[]> => {
    const { data } = await apiClient.get<PlayerProgress[]>(apiPath(KARAOKE_BASE, `/progress/${playerId}`));
    return data ?? [];
};

export const fetchPlayerSkills = async (playerId: number): Promise<PlayerSkill[]> => {
    const { data } = await apiClient.get<PlayerSkill[]>(apiPath(KARAOKE_BASE, `/progress/${playerId}/skills`));
    return data ?? [];
};

export const postAddXp = async (playerId: number, req: AddXpRequest): Promise<void> => {
    await apiClient.post(apiPath(KARAOKE_BASE, `/progress/${playerId}/add-xp`), req);
};

// ══════════════════════════════════════════════════════════════
// === React Query Hooks ===
// ══════════════════════════════════════════════════════════════

// Templates
export const useCampaignTemplatesQuery = () =>
    useQuery({ queryKey: CAMPAIGN_QK.templates, queryFn: fetchCampaignTemplates, staleTime: 60_000 });

export const useCampaignTemplateQuery = (templateId: number) =>
    useQuery({ queryKey: CAMPAIGN_QK.template(templateId), queryFn: () => fetchCampaignTemplate(templateId), enabled: Number.isFinite(templateId) });

// Campaigns
export const useMyCampaignsQuery = () =>
    useQuery({ queryKey: CAMPAIGN_QK.myCampaigns, queryFn: fetchMyCampaigns, staleTime: 30_000 });

export const useCampaignQuery = (campaignId: number) =>
    useQuery({ queryKey: CAMPAIGN_QK.campaign(campaignId), queryFn: () => fetchCampaign(campaignId), enabled: Number.isFinite(campaignId) });

// Mutations
export const useStartCampaignMutation = () => {
    const qc = useQueryClient();
    return useMutation<Campaign, unknown, StartCampaignRequest>({
        mutationFn: postStartCampaign,
        onSuccess: () => { qc.invalidateQueries({ queryKey: CAMPAIGN_QK.myCampaigns }); },
    });
};

export const useJoinCampaignMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: postJoinCampaign,
        onSuccess: () => { qc.invalidateQueries({ queryKey: CAMPAIGN_QK.myCampaigns }); },
    });
};

export const useChooseSongMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { campaignId: number; roundNumber: number; songId: number }>({
        mutationFn: ({ campaignId, roundNumber, songId }) => postChooseSong(campaignId, roundNumber, songId),
        onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: CAMPAIGN_QK.campaign(vars.campaignId) }); },
    });
};

export const useSubmitScoreMutation = () => {
    const qc = useQueryClient();
    return useMutation<CampaignRoundProgress, unknown, { campaignId: number; roundNumber: number; req: SubmitRoundScoreRequest }>({
        mutationFn: ({ campaignId, roundNumber, req }) => postSubmitScore(campaignId, roundNumber, req),
        onSuccess: (_d, vars) => {
            qc.invalidateQueries({ queryKey: CAMPAIGN_QK.campaign(vars.campaignId) });
            qc.invalidateQueries({ queryKey: CAMPAIGN_QK.myCampaigns });
        },
    });
};

// Progress
export const usePlayerProgressQuery = (playerId: number) =>
    useQuery({ queryKey: CAMPAIGN_QK.playerProgress(playerId), queryFn: () => fetchPlayerProgress(playerId), enabled: Number.isFinite(playerId) });

export const usePlayerSkillsQuery = (playerId: number) =>
    useQuery({ queryKey: CAMPAIGN_QK.playerSkills(playerId), queryFn: () => fetchPlayerSkills(playerId), enabled: Number.isFinite(playerId) });
