// apiEventMediaTags.ts — API hooks for photo & video tags (people tagging)
import { useQuery, useMutation, useQueryClient, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type { EventMediaTag } from "../../models/karaoke/modelsEventMedia";

// ── Path helpers ──────────────────────────────────────────────

const photoTagsPath = (eventId: number, photoId: number, suffix = "") =>
    `/api/events/${eventId}/photos/${photoId}/tags${suffix}`;

const videoTagsPath = (eventId: number, videoId: number, suffix = "") =>
    `/api/events/${eventId}/videos/${videoId}/tags${suffix}`;

// ── Query keys ────────────────────────────────────────────────

/** @internal  use React Query hooks below */
export const MEDIA_TAGS_QK = {
    photoTags: (eventId: number, photoId: number): QueryKey => ["event-media-tags", "photo", eventId, photoId],
    videoTags: (eventId: number, videoId: number): QueryKey => ["event-media-tags", "video", eventId, videoId],
};

// ── Fetchers ──────────────────────────────────────────────────

/** @internal GET /api/events/{eventId}/photos/{photoId}/tags */
export const fetchPhotoTags = async (eventId: number, photoId: number): Promise<EventMediaTag[]> => {
    const { data } = await apiClient.get<EventMediaTag[]>(apiPath(photoTagsPath(eventId, photoId), ""));
    return data ?? [];
};

/** POST /api/events/{eventId}/photos/{photoId}/tags */
export const addPhotoTag = async (eventId: number, photoId: number, tag: Partial<EventMediaTag>): Promise<EventMediaTag> => {
    const { data } = await apiClient.post<EventMediaTag>(apiPath(photoTagsPath(eventId, photoId), ""), tag);
    return data;
};

/** @internal DELETE /api/events/{eventId}/photos/{photoId}/tags/{tagId} */
export const deletePhotoTag = async (eventId: number, photoId: number, tagId: number): Promise<void> => {
    await apiClient.delete(apiPath(photoTagsPath(eventId, photoId), `/${tagId}`));
};

/** @internal GET /api/events/{eventId}/videos/{videoId}/tags */
export const fetchVideoTags = async (eventId: number, videoId: number): Promise<EventMediaTag[]> => {
    const { data } = await apiClient.get<EventMediaTag[]>(apiPath(videoTagsPath(eventId, videoId), ""));
    return data ?? [];
};

/** POST /api/events/{eventId}/videos/{videoId}/tags */
export const addVideoTag = async (eventId: number, videoId: number, tag: Partial<EventMediaTag>): Promise<EventMediaTag> => {
    const { data } = await apiClient.post<EventMediaTag>(apiPath(videoTagsPath(eventId, videoId), ""), tag);
    return data;
};

/** @internal DELETE /api/events/{eventId}/videos/{videoId}/tags/{tagId} */
export const deleteVideoTag = async (eventId: number, videoId: number, tagId: number): Promise<void> => {
    await apiClient.delete(apiPath(videoTagsPath(eventId, videoId), `/${tagId}`));
};

// ── React Query hooks ─────────────────────────────────────────

export const usePhotoTagsQuery = (
    eventId: number,
    photoId: number,
    options?: Partial<UseQueryOptions<EventMediaTag[], unknown, EventMediaTag[], QueryKey>>,
) =>
    useQuery({
        queryKey: MEDIA_TAGS_QK.photoTags(eventId, photoId),
        queryFn: () => fetchPhotoTags(eventId, photoId),
        enabled: eventId > 0 && photoId > 0,
        ...options,
    });

export const useVideoTagsQuery = (
    eventId: number,
    videoId: number,
    options?: Partial<UseQueryOptions<EventMediaTag[], unknown, EventMediaTag[], QueryKey>>,
) =>
    useQuery({
        queryKey: MEDIA_TAGS_QK.videoTags(eventId, videoId),
        queryFn: () => fetchVideoTags(eventId, videoId),
        enabled: eventId > 0 && videoId > 0,
        ...options,
    });

export const useAddPhotoTagMutation = (eventId: number, photoId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (tag: Partial<EventMediaTag>) => addPhotoTag(eventId, photoId, tag),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: MEDIA_TAGS_QK.photoTags(eventId, photoId) });
        },
    });
};

export const useDeletePhotoTagMutation = (eventId: number, photoId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (tagId: number) => deletePhotoTag(eventId, photoId, tagId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: MEDIA_TAGS_QK.photoTags(eventId, photoId) });
        },
    });
};

export const useAddVideoTagMutation = (eventId: number, videoId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (tag: Partial<EventMediaTag>) => addVideoTag(eventId, videoId, tag),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: MEDIA_TAGS_QK.videoTags(eventId, videoId) });
        },
    });
};

export const useDeleteVideoTagMutation = (eventId: number, videoId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (tagId: number) => deleteVideoTag(eventId, videoId, tagId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: MEDIA_TAGS_QK.videoTags(eventId, videoId) });
        },
    });
};

const mediaTags = {
    fetchPhotoTags,
    addPhotoTag,
    deletePhotoTag,
    fetchVideoTags,
    addVideoTag,
    deleteVideoTag,
    usePhotoTagsQuery,
    useVideoTagsQuery,
    useAddPhotoTagMutation,
    useDeletePhotoTagMutation,
    useAddVideoTagMutation,
    useDeleteVideoTagMutation,
};

export default mediaTags;
