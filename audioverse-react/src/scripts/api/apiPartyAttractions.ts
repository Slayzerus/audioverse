// apiPartyAttractions.ts
// Mock implementations for Party Attractions (simulating backend).
// Set VITE_USE_MOCK_ATTRACTIONS=false in .env to use real API endpoints.
// Default: mock (localStorage) when env var is not set.
import { PartyAttraction } from "../../models/modelsKaraoke";
import { apiClient, apiPath } from "./audioverseApiClient";

const USE_MOCK = import.meta.env.VITE_USE_MOCK_ATTRACTIONS !== "false";

// ── Mock (localStorage) implementation ──────────────────────────────────

const STORAGE_KEY = "party_attractions_v1";

const getStorage = (): Record<string, PartyAttraction[]> => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
        /* Expected: localStorage or JSON.parse may fail */
        return {};
    }
};

const saveStorage = (data: Record<string, PartyAttraction[]>) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const mockFetch = async (partyId: number): Promise<PartyAttraction[]> => {
    await new Promise((r) => setTimeout(r, 300));
    const data = getStorage();
    return data[partyId] || [];
};

const mockAdd = async (
    partyId: number,
    attraction: Omit<PartyAttraction, "id" | "partyId" | "createdAt" | "votes" | "status">
): Promise<PartyAttraction> => {
    await new Promise((r) => setTimeout(r, 500));
    const data = getStorage();
    const list = data[partyId] || [];

    if (list.some((a: PartyAttraction) => a.type === attraction.type && a.referenceId === attraction.referenceId)) {
        throw new Error("This item is already suggested!");
    }

    const newAttraction: PartyAttraction = {
        ...attraction,
        id: crypto.randomUUID(),
        partyId,
        createdAt: new Date().toISOString(),
        votes: 1,
        status: "suggested",
    };

    list.push(newAttraction);
    data[partyId] = list;
    saveStorage(data);
    return newAttraction;
};

const mockVote = async (partyId: number, attractionId: string, vote: 1 | -1): Promise<void> => {
    await new Promise((r) => setTimeout(r, 200));
    const data = getStorage();
    const list = data[partyId] || [];
    const index = list.findIndex((a: PartyAttraction) => a.id === attractionId);

    if (index !== -1) {
        list[index].votes += vote;
        data[partyId] = list;
        saveStorage(data);
    }
};

const mockDelete = async (partyId: number, attractionId: string): Promise<void> => {
    await new Promise((r) => setTimeout(r, 300));
    const data = getStorage();
    const list = data[partyId] || [];
    data[partyId] = list.filter((a: PartyAttraction) => a.id !== attractionId);
    saveStorage(data);
};

const mockUpdateStatus = async (
    partyId: number,
    attractionId: string,
    status: PartyAttraction["status"],
    sessionId?: number | null,
): Promise<PartyAttraction> => {
    await new Promise((r) => setTimeout(r, 300));
    const data = getStorage();
    const list = data[partyId] || [];
    const idx = list.findIndex((a: PartyAttraction) => a.id === attractionId);
    if (idx === -1) throw new Error("Attraction not found");
    list[idx] = { ...list[idx], status, sessionId: sessionId ?? list[idx].sessionId };
    data[partyId] = list;
    saveStorage(data);
    return list[idx];
};

// ── Real API implementation ─────────────────────────────────────────────

const EVENTS_BASE = "/api/events";
const attractionsPath = (eventId: number, id?: string | number) =>
    id != null
        ? apiPath(EVENTS_BASE, `/${eventId}/attractions/${id}`)
        : apiPath(EVENTS_BASE, `/${eventId}/attractions`);

const apiFetch = async (partyId: number): Promise<PartyAttraction[]> => {
    const { data } = await apiClient.get<PartyAttraction[]>(attractionsPath(partyId));
    return data;
};

const apiAdd = async (
    partyId: number,
    attraction: Omit<PartyAttraction, "id" | "partyId" | "createdAt" | "votes" | "status">
): Promise<PartyAttraction> => {
    const { data } = await apiClient.post<PartyAttraction>(attractionsPath(partyId), attraction);
    return data;
};

const apiVote = async (partyId: number, attractionId: string, vote: 1 | -1): Promise<void> => {
    await apiClient.post(attractionsPath(partyId, attractionId) + "/vote", { vote });
};

const apiDelete = async (partyId: number, attractionId: string): Promise<void> => {
    await apiClient.delete(attractionsPath(partyId, attractionId));
};

const apiUpdateStatus = async (
    partyId: number,
    attractionId: string,
    status: PartyAttraction["status"],
    sessionId?: number | null,
): Promise<PartyAttraction> => {
    const { data } = await apiClient.patch<PartyAttraction>(
        attractionsPath(partyId, attractionId) + "/status",
        { status, sessionId },
    );
    return data;
};

// ── Exported functions (delegate based on feature flag) ─────────────────

/** @internal */
export const fetchPartyAttractions = (partyId: number) =>
    USE_MOCK ? mockFetch(partyId) : apiFetch(partyId);

export const addPartyAttraction = (
    partyId: number,
    attraction: Omit<PartyAttraction, "id" | "partyId" | "createdAt" | "votes" | "status">
) => USE_MOCK ? mockAdd(partyId, attraction) : apiAdd(partyId, attraction);

export const votePartyAttraction = (partyId: number, attractionId: string, vote: 1 | -1) =>
    USE_MOCK ? mockVote(partyId, attractionId, vote) : apiVote(partyId, attractionId, vote);

/** @internal */
export const deletePartyAttraction = (partyId: number, attractionId: string) =>
    USE_MOCK ? mockDelete(partyId, attractionId) : apiDelete(partyId, attractionId);

export const updateAttractionStatus = (
    partyId: number,
    attractionId: string,
    status: PartyAttraction["status"],
    sessionId?: number | null,
) => USE_MOCK
    ? mockUpdateStatus(partyId, attractionId, status, sessionId)
    : apiUpdateStatus(partyId, attractionId, status, sessionId);

// React Query hooks
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/** @internal  use React Query hooks below */
export const ATTRACTIONS_QK = {
    list: (partyId: number) => ["party", partyId, "attractions"] as const,
};

export const usePartyAttractionsQuery = (partyId: number) =>
    useQuery({
        queryKey: ATTRACTIONS_QK.list(partyId),
        queryFn: () => fetchPartyAttractions(partyId),
        enabled: !!partyId,
    });

export const useAddAttractionMutation = (partyId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (attraction: Omit<PartyAttraction, "id" | "partyId" | "createdAt" | "votes" | "status">) =>
            addPartyAttraction(partyId, attraction),
        onSuccess: () => qc.invalidateQueries({ queryKey: ATTRACTIONS_QK.list(partyId) }),
    });
};

export const useVoteAttractionMutation = (partyId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ attractionId, vote }: { attractionId: string; vote: 1 | -1 }) =>
            votePartyAttraction(partyId, attractionId, vote),
        onSuccess: () => qc.invalidateQueries({ queryKey: ATTRACTIONS_QK.list(partyId) }),
    });
};

export const useDeleteAttractionMutation = (partyId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (attractionId: string) => deletePartyAttraction(partyId, attractionId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ATTRACTIONS_QK.list(partyId) }),
    });
};

export const useUpdateAttractionStatusMutation = (partyId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (args: { attractionId: string; status: PartyAttraction["status"]; sessionId?: number | null }) =>
            updateAttractionStatus(partyId, args.attractionId, args.status, args.sessionId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ATTRACTIONS_QK.list(partyId) }),
    });
};
