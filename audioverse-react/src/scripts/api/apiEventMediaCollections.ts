// apiEventMediaCollections.ts — API hooks dla kolekcji mediów eventowych
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type { EventMediaCollection } from "../../models/karaoke/modelsEventMedia";

const collectionsPath = (eventId: number, suffix = "") => `/api/events/${eventId}/media-collections${suffix}`;

/** @internal */
export const fetchEventMediaCollections = async (eventId: number): Promise<EventMediaCollection[]> => {
    const { data } = await apiClient.get(apiPath(collectionsPath(eventId), ""));
    return data;
};

export const createEventMediaCollection = async (eventId: number, name: string, description?: string) => {
    const { data } = await apiClient.post(apiPath(collectionsPath(eventId), ""), { name, description });
    return data;
};

export const useEventMediaCollectionsQuery = (eventId: number) =>
    useQuery({
        queryKey: ["event-media-collections", eventId],
        queryFn: () => fetchEventMediaCollections(eventId),
        enabled: eventId > 0,
    });

export const useCreateEventMediaCollectionMutation = (eventId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ name, description }: { name: string; description?: string }) => createEventMediaCollection(eventId, name, description),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["event-media-collections", eventId] });
        },
    });
};
