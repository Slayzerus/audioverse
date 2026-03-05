// apiRadio.ts — Radio station: voice, chat, schedule, reactions, comments, follow, invites, archive
import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type {
    VoiceSessionResponse,
    VoiceStatusDto,
    ArchiveTimelineEntry,
    ArchiveSegmentDto,
    CreateRadioInviteRequest,
    RadioInviteDto,
    AcceptInviteRequest,
    InviteVerifyResponse,
    RadioScheduleSlot,
    CreateScheduleSlotRequest,
    RadioChatMessageDto,
    SendChatMessageRequest,
    SendReactionRequest,
    ReactionSummaryDto,
    RadioCommentDto,
    PostCommentRequest,
    CommentsPageResponse,
    FollowStatusDto,
} from "../../models/modelsRadio";

// === Base path ===
export const RADIO_BASE = "/api/radio";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const RADIO_QK = {
    voiceStatus: (radioId: number) => ["radio", radioId, "voice", "status"] as const,
    archive: (radioId: number, date: string) => ["radio", radioId, "archive", date] as const,
    archiveSegments: (radioId: number, date: string) => ["radio", radioId, "archive", date, "segments"] as const,
    invites: (radioId: number) => ["radio", radioId, "invites"] as const,
    inviteVerify: (token: string) => ["radio", "invites", "verify", token] as const,
    schedule: (radioId: number) => ["radio", radioId, "schedule"] as const,
    scheduleAll: (radioId: number) => ["radio", radioId, "schedule", "all"] as const,
    chat: (radioId: number) => ["radio", radioId, "chat"] as const,
    reactions: (radioId: number, trackId?: number) => ["radio", radioId, "reactions", trackId] as const,
    comments: (radioId: number, page?: number) => ["radio", radioId, "comments", page] as const,
    followStatus: (radioId: number) => ["radio", radioId, "follow"] as const,
};

// ── Voice ──────────────────────────────────────────────────────────

/** @internal POST /api/radio/{id}/voice/start */
export const postVoiceStart = async (radioId: number): Promise<VoiceSessionResponse> => {
    const { data } = await apiClient.post<VoiceSessionResponse>(
        apiPath(RADIO_BASE, `/${radioId}/voice/start`),
    );
    return data;
};

/** @internal POST /api/radio/{id}/voice/stop */
export const postVoiceStop = async (radioId: number): Promise<void> => {
    await apiClient.post(apiPath(RADIO_BASE, `/${radioId}/voice/stop`));
};

/** @internal GET /api/radio/{id}/voice/status */
export const fetchVoiceStatus = async (radioId: number): Promise<VoiceStatusDto> => {
    const { data } = await apiClient.get<VoiceStatusDto>(
        apiPath(RADIO_BASE, `/${radioId}/voice/status`),
    );
    return data;
};

// ── Archive ────────────────────────────────────────────────────────

/** @internal GET /api/radio/{id}/archive/{date} */
export const fetchArchiveTimeline = async (
    radioId: number,
    date: string,
): Promise<ArchiveTimelineEntry[]> => {
    const { data } = await apiClient.get<ArchiveTimelineEntry[]>(
        apiPath(RADIO_BASE, `/${radioId}/archive/${encodeURIComponent(date)}`),
    );
    return data ?? [];
};

/** @internal GET /api/radio/{id}/archive/{date}/segments */
export const fetchArchiveSegments = async (
    radioId: number,
    date: string,
): Promise<ArchiveSegmentDto[]> => {
    const { data } = await apiClient.get<ArchiveSegmentDto[]>(
        apiPath(RADIO_BASE, `/${radioId}/archive/${encodeURIComponent(date)}/segments`),
    );
    return data ?? [];
};

// ── Invites ────────────────────────────────────────────────────────

/** @internal POST /api/radio/{id}/invites */
export const postRadioInvite = async (
    radioId: number,
    body: CreateRadioInviteRequest,
): Promise<RadioInviteDto> => {
    const { data } = await apiClient.post<RadioInviteDto>(
        apiPath(RADIO_BASE, `/${radioId}/invites`),
        body,
    );
    return data;
};

/** @internal GET /api/radio/{id}/invites */
export const fetchRadioInvites = async (radioId: number): Promise<RadioInviteDto[]> => {
    const { data } = await apiClient.get<RadioInviteDto[]>(
        apiPath(RADIO_BASE, `/${radioId}/invites`),
    );
    return data ?? [];
};

/** @internal DELETE /api/radio/{id}/invites/{inviteId} */
export const deleteRadioInvite = async (radioId: number, inviteId: number): Promise<void> => {
    await apiClient.delete(apiPath(RADIO_BASE, `/${radioId}/invites/${inviteId}`));
};

/** @internal GET /api/radio/invites/verify/{token} (public) */
export const fetchVerifyInvite = async (token: string): Promise<InviteVerifyResponse> => {
    const { data } = await apiClient.get<InviteVerifyResponse>(
        apiPath(RADIO_BASE, `/invites/verify/${encodeURIComponent(token)}`),
    );
    return data;
};

/** @internal POST /api/radio/invites/accept/{token} (public) */
export const postAcceptInvite = async (
    token: string,
    body?: AcceptInviteRequest,
): Promise<void> => {
    await apiClient.post(
        apiPath(RADIO_BASE, `/invites/accept/${encodeURIComponent(token)}`),
        body ?? {},
    );
};

// ── Schedule ───────────────────────────────────────────────────────

/** @internal GET /api/radio/{id}/schedule (public — confirmed only) */
export const fetchSchedule = async (radioId: number): Promise<RadioScheduleSlot[]> => {
    const { data } = await apiClient.get<RadioScheduleSlot[]>(
        apiPath(RADIO_BASE, `/${radioId}/schedule`),
    );
    return data ?? [];
};

/** @internal GET /api/radio/{id}/schedule/all (admin — all slots) */
export const fetchScheduleAll = async (radioId: number): Promise<RadioScheduleSlot[]> => {
    const { data } = await apiClient.get<RadioScheduleSlot[]>(
        apiPath(RADIO_BASE, `/${radioId}/schedule/all`),
    );
    return data ?? [];
};

/** @internal POST /api/radio/{id}/schedule */
export const postScheduleSlot = async (
    radioId: number,
    body: CreateScheduleSlotRequest,
): Promise<RadioScheduleSlot> => {
    const { data } = await apiClient.post<RadioScheduleSlot>(
        apiPath(RADIO_BASE, `/${radioId}/schedule`),
        body,
    );
    return data;
};

/** @internal PUT /api/radio/{id}/schedule/{slotId} */
export const putScheduleSlot = async (
    radioId: number,
    slotId: number,
    body: CreateScheduleSlotRequest,
): Promise<RadioScheduleSlot> => {
    const { data } = await apiClient.put<RadioScheduleSlot>(
        apiPath(RADIO_BASE, `/${radioId}/schedule/${slotId}`),
        body,
    );
    return data;
};

/** @internal DELETE /api/radio/{id}/schedule/{slotId} */
export const deleteScheduleSlot = async (radioId: number, slotId: number): Promise<void> => {
    await apiClient.delete(apiPath(RADIO_BASE, `/${radioId}/schedule/${slotId}`));
};

// ── Chat ───────────────────────────────────────────────────────────

/** @internal GET /api/radio/{id}/chat?limit=50 */
export const fetchChatMessages = async (
    radioId: number,
    limit = 50,
): Promise<RadioChatMessageDto[]> => {
    const { data } = await apiClient.get<RadioChatMessageDto[]>(
        apiPath(RADIO_BASE, `/${radioId}/chat`),
        { params: { limit } },
    );
    return data ?? [];
};

/** @internal POST /api/radio/{id}/chat */
export const postChatMessage = async (
    radioId: number,
    body: SendChatMessageRequest,
): Promise<RadioChatMessageDto> => {
    const { data } = await apiClient.post<RadioChatMessageDto>(
        apiPath(RADIO_BASE, `/${radioId}/chat`),
        body,
    );
    return data;
};

/** @internal DELETE /api/radio/{id}/chat/{messageId} (admin) */
export const deleteChatMessage = async (radioId: number, messageId: number): Promise<void> => {
    await apiClient.delete(apiPath(RADIO_BASE, `/${radioId}/chat/${messageId}`));
};

// ── Reactions ──────────────────────────────────────────────────────

/** @internal POST /api/radio/{id}/reactions */
export const postReaction = async (radioId: number, body: SendReactionRequest): Promise<void> => {
    await apiClient.post(apiPath(RADIO_BASE, `/${radioId}/reactions`), body);
};

/** @internal GET /api/radio/{id}/reactions/summary?trackId=... */
export const fetchReactionSummary = async (
    radioId: number,
    trackId?: number,
): Promise<ReactionSummaryDto> => {
    const { data } = await apiClient.get<ReactionSummaryDto>(
        apiPath(RADIO_BASE, `/${radioId}/reactions/summary`),
        { params: { trackId } },
    );
    return data;
};

// ── Comments & Ratings ─────────────────────────────────────────────

/** @internal GET /api/radio/{id}/comments?page=1&pageSize=20 */
export const fetchComments = async (
    radioId: number,
    page = 1,
    pageSize = 20,
): Promise<CommentsPageResponse> => {
    const { data } = await apiClient.get<CommentsPageResponse>(
        apiPath(RADIO_BASE, `/${radioId}/comments`),
        { params: { page, pageSize } },
    );
    return data;
};

/** @internal POST /api/radio/{id}/comments */
export const postComment = async (
    radioId: number,
    body: PostCommentRequest,
): Promise<RadioCommentDto> => {
    const { data } = await apiClient.post<RadioCommentDto>(
        apiPath(RADIO_BASE, `/${radioId}/comments`),
        body,
    );
    return data;
};

/** @internal DELETE /api/radio/{id}/comments/{commentId} (admin) */
export const deleteComment = async (radioId: number, commentId: number): Promise<void> => {
    await apiClient.delete(apiPath(RADIO_BASE, `/${radioId}/comments/${commentId}`));
};

// ── Follow ─────────────────────────────────────────────────────────

/** @internal POST /api/radio/{id}/follow */
export const postFollow = async (radioId: number): Promise<void> => {
    await apiClient.post(apiPath(RADIO_BASE, `/${radioId}/follow`));
};

/** @internal DELETE /api/radio/{id}/follow */
export const deleteFollow = async (radioId: number): Promise<void> => {
    await apiClient.delete(apiPath(RADIO_BASE, `/${radioId}/follow`));
};

/** @internal GET /api/radio/{id}/follow/status */
export const fetchFollowStatus = async (radioId: number): Promise<FollowStatusDto> => {
    const { data } = await apiClient.get<FollowStatusDto>(
        apiPath(RADIO_BASE, `/${radioId}/follow/status`),
    );
    return data;
};

// === React Query Hooks ===

export const useVoiceStatusQuery = (radioId: number, enabled = true) =>
    useQuery({
        queryKey: RADIO_QK.voiceStatus(radioId),
        queryFn: () => fetchVoiceStatus(radioId),
        enabled: !!radioId && enabled,
        refetchInterval: 5000, // poll every 5s during live sessions
    });

export const useArchiveTimelineQuery = (radioId: number, date: string) =>
    useQuery({
        queryKey: RADIO_QK.archive(radioId, date),
        queryFn: () => fetchArchiveTimeline(radioId, date),
        enabled: !!radioId && !!date,
    });

export const useArchiveSegmentsQuery = (radioId: number, date: string) =>
    useQuery({
        queryKey: RADIO_QK.archiveSegments(radioId, date),
        queryFn: () => fetchArchiveSegments(radioId, date),
        enabled: !!radioId && !!date,
    });

export const useRadioInvitesQuery = (radioId: number) =>
    useQuery({
        queryKey: RADIO_QK.invites(radioId),
        queryFn: () => fetchRadioInvites(radioId),
        enabled: !!radioId,
    });

export const useVerifyInviteQuery = (token: string) =>
    useQuery({
        queryKey: RADIO_QK.inviteVerify(token),
        queryFn: () => fetchVerifyInvite(token),
        enabled: !!token,
    });

export const useScheduleQuery = (radioId: number) =>
    useQuery({
        queryKey: RADIO_QK.schedule(radioId),
        queryFn: () => fetchSchedule(radioId),
        enabled: !!radioId,
    });

export const useScheduleAllQuery = (radioId: number) =>
    useQuery({
        queryKey: RADIO_QK.scheduleAll(radioId),
        queryFn: () => fetchScheduleAll(radioId),
        enabled: !!radioId,
    });

export const useChatMessagesQuery = (radioId: number, limit = 50) =>
    useQuery({
        queryKey: RADIO_QK.chat(radioId),
        queryFn: () => fetchChatMessages(radioId, limit),
        enabled: !!radioId,
    });

export const useReactionSummaryQuery = (radioId: number, trackId?: number) =>
    useQuery({
        queryKey: RADIO_QK.reactions(radioId, trackId),
        queryFn: () => fetchReactionSummary(radioId, trackId),
        enabled: !!radioId,
    });

export const useCommentsQuery = (radioId: number, page = 1, pageSize = 20) =>
    useQuery({
        queryKey: RADIO_QK.comments(radioId, page),
        queryFn: () => fetchComments(radioId, page, pageSize),
        enabled: !!radioId,
        placeholderData: keepPreviousData,
    });

export const useFollowStatusQuery = (radioId: number) =>
    useQuery({
        queryKey: RADIO_QK.followStatus(radioId),
        queryFn: () => fetchFollowStatus(radioId),
        enabled: !!radioId,
    });

// ── Mutations ─────────────────────────────────────────────────────

export const useVoiceStartMutation = () =>
    useMutation({ mutationFn: (radioId: number) => postVoiceStart(radioId) });

export const useVoiceStopMutation = () =>
    useMutation({ mutationFn: (radioId: number) => postVoiceStop(radioId) });

export const useCreateInviteMutation = (radioId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: CreateRadioInviteRequest) => postRadioInvite(radioId, body),
        onSuccess: () => qc.invalidateQueries({ queryKey: RADIO_QK.invites(radioId) }),
    });
};

export const useDeleteInviteMutation = (radioId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (inviteId: number) => deleteRadioInvite(radioId, inviteId),
        onSuccess: () => qc.invalidateQueries({ queryKey: RADIO_QK.invites(radioId) }),
    });
};

export const useAcceptInviteMutation = () =>
    useMutation({
        mutationFn: ({ token, body }: { token: string; body?: AcceptInviteRequest }) =>
            postAcceptInvite(token, body),
    });

export const useCreateSlotMutation = (radioId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: CreateScheduleSlotRequest) => postScheduleSlot(radioId, body),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: RADIO_QK.schedule(radioId) });
            qc.invalidateQueries({ queryKey: RADIO_QK.scheduleAll(radioId) });
        },
    });
};

export const useUpdateSlotMutation = (radioId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ slotId, body }: { slotId: number; body: CreateScheduleSlotRequest }) =>
            putScheduleSlot(radioId, slotId, body),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: RADIO_QK.schedule(radioId) });
            qc.invalidateQueries({ queryKey: RADIO_QK.scheduleAll(radioId) });
        },
    });
};

export const useDeleteSlotMutation = (radioId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (slotId: number) => deleteScheduleSlot(radioId, slotId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: RADIO_QK.schedule(radioId) });
            qc.invalidateQueries({ queryKey: RADIO_QK.scheduleAll(radioId) });
        },
    });
};

export const useSendChatMutation = (radioId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: SendChatMessageRequest) => postChatMessage(radioId, body),
        onSuccess: () => qc.invalidateQueries({ queryKey: RADIO_QK.chat(radioId) }),
    });
};

export const useDeleteChatMutation = (radioId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (messageId: number) => deleteChatMessage(radioId, messageId),
        onSuccess: () => qc.invalidateQueries({ queryKey: RADIO_QK.chat(radioId) }),
    });
};

export const useSendReactionMutation = (radioId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: SendReactionRequest) => postReaction(radioId, body),
        onSuccess: () => qc.invalidateQueries({ queryKey: RADIO_QK.reactions(radioId) }),
    });
};

export const usePostCommentMutation = (radioId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: PostCommentRequest) => postComment(radioId, body),
        onSuccess: () => qc.invalidateQueries({ queryKey: RADIO_QK.comments(radioId) }),
    });
};

export const useDeleteCommentMutation = (radioId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (commentId: number) => deleteComment(radioId, commentId),
        onSuccess: () => qc.invalidateQueries({ queryKey: RADIO_QK.comments(radioId) }),
    });
};

export const useFollowMutation = (radioId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => postFollow(radioId),
        onSuccess: () => qc.invalidateQueries({ queryKey: RADIO_QK.followStatus(radioId) }),
    });
};

export const useUnfollowMutation = (radioId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => deleteFollow(radioId),
        onSuccess: () => qc.invalidateQueries({ queryKey: RADIO_QK.followStatus(radioId) }),
    });
};

export default {
    postVoiceStart,
    postVoiceStop,
    fetchVoiceStatus,
    fetchArchiveTimeline,
    fetchArchiveSegments,
    postRadioInvite,
    fetchRadioInvites,
    deleteRadioInvite,
    fetchVerifyInvite,
    postAcceptInvite,
    fetchSchedule,
    fetchScheduleAll,
    postScheduleSlot,
    putScheduleSlot,
    deleteScheduleSlot,
    fetchChatMessages,
    postChatMessage,
    deleteChatMessage,
    postReaction,
    fetchReactionSummary,
    fetchComments,
    postComment,
    deleteComment,
    postFollow,
    deleteFollow,
    fetchFollowStatus,
};
