// apiEventComments.ts — Event comment wall (reactions, threads)
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
    QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type { EventComment, PaginatedResponse } from "../../models/modelsKaraoke";

// === Base path builder ===
const commentsPath = (eventId: number, suffix = "") =>
    `/api/events/${eventId}/comments${suffix}`;

// === Query Keys ===
/** @internal  use React Query hooks below */
export const EVENT_COMMENTS_QK = {
    list: (eventId: number) => ["event-comments", eventId] as const,
    single: (eventId: number, commentId: number) =>
        ["event-comments", eventId, commentId] as const,
};

// === Fetchers ===

/** @internal GET /api/events/{eventId}/comments — List comments (paginated) */
export const fetchEventComments = async (
    eventId: number,
    page = 1,
    pageSize = 50,
): Promise<PaginatedResponse<EventComment>> => {
    const { data } = await apiClient.get<PaginatedResponse<EventComment>>(
        apiPath(commentsPath(eventId), ""),
        { params: { page, pageSize } },
    );
    return data;
};

/** POST /api/events/{eventId}/comments — Post a comment */
export interface PostCommentDto {
    text: string;
    parentCommentId?: number | null;
}
/** @internal */
export const postEventComment = async (
    eventId: number,
    dto: PostCommentDto,
): Promise<EventComment> => {
    const { data } = await apiClient.post<EventComment>(
        apiPath(commentsPath(eventId), ""),
        dto,
    );
    return data;
};

/** @internal PUT /api/events/{eventId}/comments/{commentId} — Edit comment */
export const putEventComment = async (
    eventId: number,
    commentId: number,
    dto: { text: string },
): Promise<EventComment> => {
    const { data } = await apiClient.put<EventComment>(
        apiPath(commentsPath(eventId), `/${commentId}`),
        dto,
    );
    return data;
};

/** @internal DELETE /api/events/{eventId}/comments/{commentId} — Delete comment */
export const deleteEventComment = async (
    eventId: number,
    commentId: number,
): Promise<void> => {
    await apiClient.delete(apiPath(commentsPath(eventId), `/${commentId}`));
};

/** POST /api/events/{eventId}/comments/{commentId}/react — Toggle reaction */
export const toggleCommentReaction = async (
    eventId: number,
    commentId: number,
    emoji: string,
): Promise<void> => {
    await apiClient.post(apiPath(commentsPath(eventId), `/${commentId}/react`), { emoji });
};

// === React Query Hooks ===

export const useEventCommentsQuery = (
    eventId: number,
    page = 1,
    pageSize = 50,
    options?: Partial<UseQueryOptions<PaginatedResponse<EventComment>, unknown, PaginatedResponse<EventComment>, QueryKey>>,
) =>
    useQuery({
        queryKey: [...EVENT_COMMENTS_QK.list(eventId), page, pageSize],
        queryFn: () => fetchEventComments(eventId, page, pageSize),
        enabled: eventId > 0,
        ...options,
    });

export const usePostEventCommentMutation = (eventId: number) => {
    const qc = useQueryClient();
    return useMutation<EventComment, unknown, PostCommentDto>({
        mutationFn: (dto) => postEventComment(eventId, dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: EVENT_COMMENTS_QK.list(eventId) });
        },
    });
};

export const useEditEventCommentMutation = (eventId: number) => {
    const qc = useQueryClient();
    return useMutation<EventComment, unknown, { commentId: number; text: string }>({
        mutationFn: ({ commentId, text }) => putEventComment(eventId, commentId, { text }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: EVENT_COMMENTS_QK.list(eventId) });
        },
    });
};

export const useDeleteEventCommentMutation = (eventId: number) => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (commentId) => deleteEventComment(eventId, commentId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: EVENT_COMMENTS_QK.list(eventId) });
        },
    });
};

export const useToggleCommentReactionMutation = (eventId: number) => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { commentId: number; emoji: string }>({
        mutationFn: ({ commentId, emoji }) =>
            toggleCommentReaction(eventId, commentId, emoji),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: EVENT_COMMENTS_QK.list(eventId) });
        },
    });
};

export default {
    fetchEventComments,
    postEventComment,
    putEventComment,
    deleteEventComment,
    toggleCommentReaction,
};
