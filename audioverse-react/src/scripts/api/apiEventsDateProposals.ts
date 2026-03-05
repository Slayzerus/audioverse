// apiEventsDateProposals.ts — Date proposals fetchers + hooks
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import { EVENTS_BASE, EVENTS_QK } from "./apiEventsKeys";
import type {
    EventDateProposal,
    EventDateVote,
    DateBestResult,
} from "../../models/modelsKaraoke";
import { DateVoteStatus } from "../../models/modelsKaraoke";

// === Low-level fetchers ===

/** @internal POST /api/events/{eventId}/dates — Create a date proposal */
export const postDateProposal = async (
    eventId: number,
    body: { proposedStart: string; proposedEnd?: string; note?: string },
): Promise<EventDateProposal> => {
    const { data } = await apiClient.post<EventDateProposal>(apiPath(EVENTS_BASE, `/${eventId}/dates`), body);
    return data;
};

/** @internal GET /api/events/{eventId}/dates — List date proposals */
export const fetchDateProposals = async (eventId: number): Promise<EventDateProposal[]> => {
    const { data } = await apiClient.get<EventDateProposal[]>(apiPath(EVENTS_BASE, `/${eventId}/dates`));
    return data;
};

/** @internal DELETE /api/events/dates/{proposalId} — Delete a date proposal */
export const deleteDateProposal = async (_eventId: number, proposalId: number): Promise<void> => {
    await apiClient.delete(apiPath(EVENTS_BASE, `/dates/${proposalId}`));
};

/** @internal POST /api/events/dates/{proposalId}/vote — Vote on a date proposal */
export const postDateVote = async (
    proposalId: number,
    body: { status: DateVoteStatus; comment?: string },
): Promise<EventDateVote> => {
    const { data } = await apiClient.post<EventDateVote>(apiPath(EVENTS_BASE, `/dates/${proposalId}/vote`), body);
    return data;
};

/** @internal DELETE /api/events/dates/{proposalId}/vote/{userId} — Remove vote from a date proposal */
export const deleteDateVote = async (proposalId: number, userId: number): Promise<void> => {
    await apiClient.delete(apiPath(EVENTS_BASE, `/dates/${proposalId}/vote/${userId}`));
};

/** @internal GET /api/events/{eventId}/dates/best — Get ranked date results */
export const fetchDateBest = async (eventId: number): Promise<DateBestResult[]> => {
    const { data } = await apiClient.get<DateBestResult[]>(apiPath(EVENTS_BASE, `/${eventId}/dates/best`));
    return data;
};

// === React Query hooks ===

export const useDateProposalsQuery = (eventId: number, options?: Partial<UseQueryOptions<EventDateProposal[]>>) =>
    useQuery({ queryKey: EVENTS_QK.dateProposals(eventId), queryFn: () => fetchDateProposals(eventId), enabled: eventId > 0, retry: 1, ...options });

export const useDateBestQuery = (eventId: number, options?: Partial<UseQueryOptions<DateBestResult[]>>) =>
    useQuery({ queryKey: EVENTS_QK.dateBest(eventId), queryFn: () => fetchDateBest(eventId), enabled: eventId > 0, retry: 1, ...options });

export const useCreateDateProposalMutation = () => {
    const qc = useQueryClient();
    return useMutation<EventDateProposal, unknown, { eventId: number; body: { proposedStart: string; proposedEnd?: string; note?: string } }>({
        mutationFn: ({ eventId, body }) => postDateProposal(eventId, body),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.dateProposals(vars.eventId) });
            qc.invalidateQueries({ queryKey: EVENTS_QK.dateBest(vars.eventId) });
        },
    });
};

export const useDeleteDateProposalMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; proposalId: number }>({
        mutationFn: ({ eventId, proposalId }) => deleteDateProposal(eventId, proposalId),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.dateProposals(vars.eventId) });
            qc.invalidateQueries({ queryKey: EVENTS_QK.dateBest(vars.eventId) });
        },
    });
};

export const useDateVoteMutation = () => {
    const qc = useQueryClient();
    return useMutation<EventDateVote, unknown, { eventId: number; proposalId: number; body: { status: DateVoteStatus; comment?: string } }>({
        mutationFn: ({ proposalId, body }) => postDateVote(proposalId, body),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.dateProposals(vars.eventId) });
            qc.invalidateQueries({ queryKey: EVENTS_QK.dateBest(vars.eventId) });
        },
    });
};

export const useDeleteDateVoteMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; proposalId: number; userId: number }>({
        mutationFn: ({ proposalId, userId }) => deleteDateVote(proposalId, userId),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.dateProposals(vars.eventId) });
            qc.invalidateQueries({ queryKey: EVENTS_QK.dateBest(vars.eventId) });
        },
    });
};
