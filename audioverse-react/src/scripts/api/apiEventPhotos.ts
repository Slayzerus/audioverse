// apiEventPhotos.ts — Event photo uploads & gallery
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
    QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type { EventPhoto, PaginatedResponse } from "../../models/modelsKaraoke";

// === Base path builder ===
const photosPath = (eventId: number, suffix = "") => `/api/events/${eventId}/photos${suffix}`;

// === Query Keys ===
/** @internal  use React Query hooks below */
export const EVENT_PHOTOS_QK = {
    list: (eventId: number) => ["event-photos", eventId] as const,
    single: (eventId: number, photoId: number) => ["event-photos", eventId, photoId] as const,
};

// === Fetchers ===

/** @internal GET /api/events/{eventId}/photos — List photos (paginated) */
export const fetchEventPhotos = async (
    eventId: number,
    page = 1,
    pageSize = 20,
): Promise<PaginatedResponse<EventPhoto>> => {
    const { data } = await apiClient.get<PaginatedResponse<EventPhoto>>(
        apiPath(photosPath(eventId), ""),
        { params: { page, pageSize } },
    );
    return data;
};

/** POST /api/events/{eventId}/photos — Upload photo(s) */
export const uploadEventPhoto = async (
    eventId: number,
    formData: FormData,
): Promise<EventPhoto[]> => {
    const { data } = await apiClient.post<EventPhoto[]>(
        apiPath(photosPath(eventId), ""),
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
};

/** @internal DELETE /api/events/{eventId}/photos/{photoId} — Remove photo */
export const deleteEventPhoto = async (eventId: number, photoId: number): Promise<void> => {
    await apiClient.delete(apiPath(photosPath(eventId), `/${photoId}`));
};

/** POST /api/events/{eventId}/photos/{photoId}/like — Toggle like */
export const togglePhotoLike = async (eventId: number, photoId: number): Promise<void> => {
    await apiClient.post(apiPath(photosPath(eventId), `/${photoId}/like`));
};

// === React Query Hooks ===

export const useEventPhotosQuery = (
    eventId: number,
    page = 1,
    pageSize = 20,
    options?: Partial<UseQueryOptions<PaginatedResponse<EventPhoto>, unknown, PaginatedResponse<EventPhoto>, QueryKey>>,
) =>
    useQuery({
        queryKey: [...EVENT_PHOTOS_QK.list(eventId), page, pageSize],
        queryFn: () => fetchEventPhotos(eventId, page, pageSize),
        enabled: eventId > 0,
        ...options,
    });

export const useUploadEventPhotoMutation = (eventId: number) => {
    const qc = useQueryClient();
    return useMutation<EventPhoto[], unknown, FormData>({
        mutationFn: (formData) => uploadEventPhoto(eventId, formData),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: EVENT_PHOTOS_QK.list(eventId) });
        },
    });
};

export const useDeleteEventPhotoMutation = (eventId: number) => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (photoId) => deleteEventPhoto(eventId, photoId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: EVENT_PHOTOS_QK.list(eventId) });
        },
    });
};

export const useTogglePhotoLikeMutation = (eventId: number) => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (photoId) => togglePhotoLike(eventId, photoId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: EVENT_PHOTOS_QK.list(eventId) });
        },
    });
};

export default {
    fetchEventPhotos,
    uploadEventPhoto,
    deleteEventPhoto,
    togglePhotoLike,
};
