// apiSocial.ts — Social API: ratings, tags, comments, user lists
// Pattern: low-level fetchers + React Query hooks
import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "./audioverseApiClient";
import type {
    EntityTypeString,
    UpsertRatingRequest,
    AddTagRequest,
    AddCommentRequest,
    UpdateCommentRequest,
    AddToListRequest,
    RatingAggregateDto,
    RatingsPage,
    TagCloudEntry,
    CommentPage,
    UserListEntryDto,
} from "../../models/modelsSocial";

// ── Base paths ─────────────────────────────────────────────────────

const RATINGS_BASE   = "/api/social/ratings";
const TAGS_BASE      = "/api/social/tags";
const COMMENTS_BASE  = "/api/social/comments";
const LISTS_BASE     = "/api/social/lists";

// ── Query Keys ─────────────────────────────────────────────────────

/** @internal  use React Query hooks below */
export const SOCIAL_QK = {
    // Ratings
    ratings:          (et: string, eid: number) => ["social-ratings", et, eid] as const,
    ratingAggregate:  (et: string, eid: number) => ["social-rating-agg", et, eid] as const,

    // Tags
    tagCloud:         (et: string, eid: number) => ["social-tags", et, eid] as const,

    // Comments
    comments:         (et: string, eid: number) => ["social-comments", et, eid] as const,

    // Lists
    userList:         (playerId: number, listName?: string) => ["social-list", playerId, listName ?? "all"] as const,
    userListEntity:   (playerId: number, et: string, eid: number) => ["social-list-entity", playerId, et, eid] as const,
};

// ═══════════════════════════════════════════════════════════════════
//  RATINGS
// ═══════════════════════════════════════════════════════════════════

/** POST /api/social/ratings — upsert */
export const upsertRating = async (req: UpsertRatingRequest): Promise<{ id: number }> => {
    const { data } = await apiClient.post<{ id: number }>(RATINGS_BASE, req);
    return data;
};

/** @internal DELETE /api/social/ratings/{id}?playerId=X */
export const deleteRating = async (id: number, playerId: number): Promise<void> => {
    await apiClient.delete(`${RATINGS_BASE}/${id}`, { params: { playerId } });
};

/** @internal GET /api/social/ratings?entityType=X&entityId=Y — paginated */
export const fetchRatings = async (
    entityType: EntityTypeString,
    entityId: number,
    page = 1,
    pageSize = 20,
): Promise<RatingsPage> => {
    const { data } = await apiClient.get<RatingsPage>(RATINGS_BASE, {
        params: { entityType, entityId, page, pageSize },
    });
    return data;
};

/** @internal GET /api/social/ratings/aggregate?entityType=X&entityId=Y */
export const fetchRatingAggregate = async (
    entityType: EntityTypeString,
    entityId: number,
): Promise<RatingAggregateDto> => {
    const { data } = await apiClient.get<RatingAggregateDto>(`${RATINGS_BASE}/aggregate`, {
        params: { entityType, entityId },
    });
    return data;
};

// ═══════════════════════════════════════════════════════════════════
//  TAGS
// ═══════════════════════════════════════════════════════════════════

/** POST /api/social/tags */
export const addTag = async (req: AddTagRequest): Promise<{ id: number }> => {
    const { data } = await apiClient.post<{ id: number }>(TAGS_BASE, req);
    return data;
};

/** @internal DELETE /api/social/tags/{id}?playerId=X */
export const deleteTag = async (id: number, playerId: number): Promise<void> => {
    await apiClient.delete(`${TAGS_BASE}/${id}`, { params: { playerId } });
};

/** @internal GET /api/social/tags/cloud?entityType=X&entityId=Y */
export const fetchTagCloud = async (
    entityType: EntityTypeString,
    entityId: number,
): Promise<TagCloudEntry[]> => {
    const { data } = await apiClient.get<TagCloudEntry[]>(`${TAGS_BASE}/cloud`, {
        params: { entityType, entityId },
    });
    return data;
};

// ═══════════════════════════════════════════════════════════════════
//  COMMENTS
// ═══════════════════════════════════════════════════════════════════

/** POST /api/social/comments */
export const addComment = async (req: AddCommentRequest): Promise<{ id: number }> => {
    const { data } = await apiClient.post<{ id: number }>(COMMENTS_BASE, req);
    return data;
};

/** PUT /api/social/comments/{id}?playerId=X */
export const updateComment = async (
    id: number,
    playerId: number,
    req: UpdateCommentRequest,
): Promise<void> => {
    await apiClient.put(`${COMMENTS_BASE}/${id}`, req, { params: { playerId } });
};

/** @internal DELETE /api/social/comments/{id}?playerId=X */
export const deleteComment = async (id: number, playerId: number): Promise<void> => {
    await apiClient.delete(`${COMMENTS_BASE}/${id}`, { params: { playerId } });
};

/** @internal GET /api/social/comments?entityType=X&entityId=Y — threaded, paginated */
export const fetchComments = async (
    entityType: EntityTypeString,
    entityId: number,
    page = 1,
    pageSize = 20,
): Promise<CommentPage> => {
    const { data } = await apiClient.get<CommentPage>(COMMENTS_BASE, {
        params: { entityType, entityId, page, pageSize },
    });
    return data;
};

/** POST /api/social/comments/{id}/reactions?playerId=X&reaction=Y — toggle */
export const toggleCommentReaction = async (
    commentId: number,
    playerId: number,
    reaction: string,
): Promise<{ added: boolean }> => {
    const { data } = await apiClient.post<{ added: boolean }>(
        `${COMMENTS_BASE}/${commentId}/reactions`,
        null,
        { params: { playerId, reaction } },
    );
    return data;
};

// ═══════════════════════════════════════════════════════════════════
//  USER LISTS
// ═══════════════════════════════════════════════════════════════════

/** POST /api/social/lists */
export const addToList = async (req: AddToListRequest): Promise<{ id: number }> => {
    const { data } = await apiClient.post<{ id: number }>(LISTS_BASE, req);
    return data;
};

/** DELETE /api/social/lists/{id}?playerId=X */
export const removeFromList = async (id: number, playerId: number): Promise<void> => {
    await apiClient.delete(`${LISTS_BASE}/${id}`, { params: { playerId } });
};

/** @internal GET /api/social/lists?playerId=X&listName=Y&entityType=Z */
export const fetchUserList = async (
    playerId: number,
    listName?: string,
    entityType?: EntityTypeString,
): Promise<UserListEntryDto[]> => {
    const { data } = await apiClient.get<UserListEntryDto[]>(LISTS_BASE, {
        params: { playerId, listName, entityType },
    });
    return data;
};

// ═══════════════════════════════════════════════════════════════════
//  REACT QUERY HOOKS
// ═══════════════════════════════════════════════════════════════════

// ── Ratings ────────────────────────────────────────────────────────

export const useRatingsQuery = (
    entityType: EntityTypeString,
    entityId: number,
    page = 1,
    pageSize = 20,
) =>
    useQuery({
        queryKey: [...SOCIAL_QK.ratings(entityType, entityId), page, pageSize],
        queryFn: () => fetchRatings(entityType, entityId, page, pageSize),
        enabled: entityId > 0,
    });

export const useRatingAggregateQuery = (
    entityType: EntityTypeString,
    entityId: number,
) =>
    useQuery({
        queryKey: SOCIAL_QK.ratingAggregate(entityType, entityId),
        queryFn: () => fetchRatingAggregate(entityType, entityId),
        enabled: entityId > 0,
    });

export const useUpsertRatingMutation = (entityType: EntityTypeString, entityId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: upsertRating,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: SOCIAL_QK.ratings(entityType, entityId) });
            qc.invalidateQueries({ queryKey: SOCIAL_QK.ratingAggregate(entityType, entityId) });
        },
    });
};

export const useDeleteRatingMutation = (entityType: EntityTypeString, entityId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, playerId }: { id: number; playerId: number }) => deleteRating(id, playerId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: SOCIAL_QK.ratings(entityType, entityId) });
            qc.invalidateQueries({ queryKey: SOCIAL_QK.ratingAggregate(entityType, entityId) });
        },
    });
};

// ── Tags ───────────────────────────────────────────────────────────

export const useTagCloudQuery = (entityType: EntityTypeString, entityId: number) =>
    useQuery({
        queryKey: SOCIAL_QK.tagCloud(entityType, entityId),
        queryFn: () => fetchTagCloud(entityType, entityId),
        enabled: entityId > 0,
    });

export const useAddTagMutation = (entityType: EntityTypeString, entityId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: addTag,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: SOCIAL_QK.tagCloud(entityType, entityId) });
        },
    });
};

export const useDeleteTagMutation = (entityType: EntityTypeString, entityId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, playerId }: { id: number; playerId: number }) => deleteTag(id, playerId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: SOCIAL_QK.tagCloud(entityType, entityId) });
        },
    });
};

// ── Comments ───────────────────────────────────────────────────────

export const useCommentsQuery = (
    entityType: EntityTypeString,
    entityId: number,
    page = 1,
    pageSize = 20,
) =>
    useQuery({
        queryKey: [...SOCIAL_QK.comments(entityType, entityId), page, pageSize],
        queryFn: () => fetchComments(entityType, entityId, page, pageSize),
        enabled: entityId > 0,
    });

export const useAddCommentMutation = (entityType: EntityTypeString, entityId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: addComment,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: SOCIAL_QK.comments(entityType, entityId) });
        },
    });
};

export const useUpdateCommentMutation = (entityType: EntityTypeString, entityId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, playerId, content }: { id: number; playerId: number; content: string }) =>
            updateComment(id, playerId, { content }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: SOCIAL_QK.comments(entityType, entityId) });
        },
    });
};

export const useDeleteCommentMutation = (entityType: EntityTypeString, entityId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, playerId }: { id: number; playerId: number }) => deleteComment(id, playerId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: SOCIAL_QK.comments(entityType, entityId) });
        },
    });
};

export const useToggleReactionMutation = (entityType: EntityTypeString, entityId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ commentId, playerId, reaction }: { commentId: number; playerId: number; reaction: string }) =>
            toggleCommentReaction(commentId, playerId, reaction),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: SOCIAL_QK.comments(entityType, entityId) });
        },
    });
};

// ── User Lists ─────────────────────────────────────────────────────

export const useUserListQuery = (
    playerId: number,
    listName?: string,
    entityType?: EntityTypeString,
) =>
    useQuery({
        queryKey: SOCIAL_QK.userList(playerId, listName),
        queryFn: () => fetchUserList(playerId, listName, entityType),
        enabled: playerId > 0,
    });

export const useAddToListMutation = (playerId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: addToList,
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: SOCIAL_QK.userList(playerId, vars.listName) });
            qc.invalidateQueries({ queryKey: SOCIAL_QK.userList(playerId) });
            qc.invalidateQueries({ queryKey: SOCIAL_QK.userListEntity(playerId, vars.entityType, vars.entityId) });
        },
    });
};

export const useRemoveFromListMutation = (playerId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id }: { id: number }) => removeFromList(id, playerId),
        onSuccess: () => {
            // Invalidate all list caches for this player
            qc.invalidateQueries({ queryKey: ["social-list", playerId] });
            qc.invalidateQueries({ queryKey: ["social-list-entity", playerId] });
        },
    });
};
