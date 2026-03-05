// apiEventVideos.ts — Event video uploads & gallery (mirrors apiEventPhotos.ts)
import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryOptions,
    type QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type { EventVideo, PaginatedResponse } from "../../models/modelsKaraoke";

// === Base path builder ===
const videosPath = (eventId: number, suffix = "") => `/api/events/${eventId}/videos${suffix}`;

// === Query Keys ===
/** @internal  use React Query hooks below */
export const EVENT_VIDEOS_QK = {
    list: (eventId: number) => ["event-videos", eventId] as const,
    single: (eventId: number, videoId: number) => ["event-videos", eventId, videoId] as const,
};

// === Fetchers ===

/** @internal GET /api/events/{eventId}/videos — List videos (paginated) */
export const fetchEventVideos = async (
    eventId: number,
    page = 1,
    pageSize = 20,
): Promise<PaginatedResponse<EventVideo>> => {
    const { data } = await apiClient.get<PaginatedResponse<EventVideo>>(
        apiPath(videosPath(eventId), ""),
        { params: { page, pageSize } },
    );
    return data;
};

/** POST /api/events/{eventId}/videos — Upload video */
export const uploadEventVideo = async (
    eventId: number,
    formData: FormData,
): Promise<EventVideo[]> => {
    const { data } = await apiClient.post<EventVideo[]>(
        apiPath(videosPath(eventId), ""),
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
};

/** @internal DELETE /api/events/{eventId}/videos/{videoId} — Remove video */
export const deleteEventVideo = async (eventId: number, videoId: number): Promise<void> => {
    await apiClient.delete(apiPath(videosPath(eventId), `/${videoId}`));
};

/** POST /api/events/{eventId}/videos/{videoId}/like — Toggle like */
export const toggleVideoLike = async (eventId: number, videoId: number): Promise<void> => {
    await apiClient.post(apiPath(videosPath(eventId), `/${videoId}/like`));
};

// === React Query Hooks ===

export const useEventVideosQuery = (
    eventId: number,
    page = 1,
    pageSize = 20,
    options?: Partial<UseQueryOptions<PaginatedResponse<EventVideo>, unknown, PaginatedResponse<EventVideo>, QueryKey>>,
) =>
    useQuery({
        queryKey: [...EVENT_VIDEOS_QK.list(eventId), page, pageSize],
        queryFn: () => fetchEventVideos(eventId, page, pageSize),
        enabled: eventId > 0,
        ...options,
    });

export const useUploadEventVideoMutation = (eventId: number) => {
    const qc = useQueryClient();
    return useMutation<EventVideo[], unknown, FormData>({
        mutationFn: (formData) => uploadEventVideo(eventId, formData),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: EVENT_VIDEOS_QK.list(eventId) });
        },
    });
};

export const useDeleteEventVideoMutation = (eventId: number) => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (videoId) => deleteEventVideo(eventId, videoId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: EVENT_VIDEOS_QK.list(eventId) });
        },
    });
};

export const useToggleVideoLikeMutation = (eventId: number) => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (videoId) => toggleVideoLike(eventId, videoId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: EVENT_VIDEOS_QK.list(eventId) });
        },
    });
};

export default {
    fetchEventVideos,
    uploadEventVideo,
    deleteEventVideo,
    toggleVideoLike,
};
