// apiEventPolls.ts — Event polls: CRUD, results, voting, email
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
    QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type {
    EventPoll,
    EventPollOption,
    VotePollRequest,
    SendPollEmailsRequest,
} from "../../models/modelsKaraoke";

// === Base paths ===
// NOTE: Backend uses /api/events/{eventId}/polls
const POLLS_BASE = "/api/events";
const POLLS_PUBLIC_BASE = "/api/events/polls";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const POLLS_QK = {
    polls: (eventId: number) => ["polls", eventId] as const,
    poll: (eventId: number, pollId: number) => ["polls", eventId, pollId] as const,
    results: (eventId: number, pollId: number) => ["polls", eventId, pollId, "results"] as const,
    view: (token: string) => ["polls", "view", token] as const,
};

// ── CRUD ──────────────────────────────────────────────────────

/** @internal GET /api/events/events/{eventId}/polls — List all polls for event */
export const fetchPolls = async (eventId: number): Promise<EventPoll[]> => {
    const { data } = await apiClient.get<EventPoll[]>(apiPath(POLLS_BASE, `/${eventId}/polls`));
    return data ?? [];
};

/** @internal POST /api/events/events/{eventId}/polls — Create poll */
export const postCreatePoll = async (eventId: number, poll: Partial<EventPoll>): Promise<EventPoll> => {
    const { data } = await apiClient.post<EventPoll>(apiPath(POLLS_BASE, `/${eventId}/polls`), poll);
    return data;
};

/** @internal GET /api/events/events/{eventId}/polls/{pollId} — Get poll by id */
export const fetchPollById = async (eventId: number, pollId: number): Promise<EventPoll> => {
    const { data } = await apiClient.get<EventPoll>(apiPath(POLLS_BASE, `/${eventId}/polls/${pollId}`));
    return data;
};

/** @internal PUT /api/events/events/{eventId}/polls/{pollId} — Update poll */
export const putUpdatePoll = async (eventId: number, pollId: number, poll: Partial<EventPoll>): Promise<void> => {
    await apiClient.put(apiPath(POLLS_BASE, `/${eventId}/polls/${pollId}`), poll);
};

/** @internal DELETE /api/events/events/{eventId}/polls/{pollId} — Delete poll */
export const deletePoll = async (eventId: number, pollId: number): Promise<void> => {
    await apiClient.delete(apiPath(POLLS_BASE, `/${eventId}/polls/${pollId}`));
};

// ── Results / Actions ─────────────────────────────────────────

/** @internal GET /api/events/events/{eventId}/polls/{pollId}/results — Poll results */
export const fetchPollResults = async (eventId: number, pollId: number): Promise<EventPollOption[]> => {
    const { data } = await apiClient.get<EventPollOption[]>(apiPath(POLLS_BASE, `/${eventId}/polls/${pollId}/results`));
    return data ?? [];
};

/** @internal POST /api/events/events/{eventId}/polls/{pollId}/send — Send poll via email */
export const postSendPollEmails = async (eventId: number, pollId: number, body: SendPollEmailsRequest): Promise<void> => {
    await apiClient.post(apiPath(POLLS_BASE, `/${eventId}/polls/${pollId}/send`), body);
};

/** @internal POST /api/events/events/{eventId}/polls/{pollId}/populate — Populate poll options */
export const postPopulatePoll = async (eventId: number, pollId: number): Promise<void> => {
    await apiClient.post(apiPath(POLLS_BASE, `/${eventId}/polls/${pollId}/populate`));
};

// ── Public (token-based, no auth) ─────────────────────────────

/** @internal GET /api/events/polls/view/{token} — View poll (public) */
export const fetchPollByToken = async (token: string): Promise<EventPoll> => {
    const { data } = await apiClient.get<EventPoll>(apiPath(POLLS_PUBLIC_BASE, `/view/${token}`));
    return data;
};

/** @internal POST /api/events/polls/vote/{token} — Vote on poll (public) */
export const postVotePoll = async (token: string, body: VotePollRequest): Promise<void> => {
    await apiClient.post(apiPath(POLLS_PUBLIC_BASE, `/vote/${token}`), body);
};

// === React Query Hooks ===

export const usePollsQuery = (eventId: number, options?: Partial<UseQueryOptions<EventPoll[], unknown, EventPoll[], QueryKey>>) =>
    useQuery({ queryKey: POLLS_QK.polls(eventId), queryFn: () => fetchPolls(eventId), enabled: Number.isFinite(eventId), ...options });

export const usePollQuery = (eventId: number, pollId: number) =>
    useQuery({ queryKey: POLLS_QK.poll(eventId, pollId), queryFn: () => fetchPollById(eventId, pollId), enabled: Number.isFinite(eventId) && Number.isFinite(pollId) });

export const usePollResultsQuery = (eventId: number, pollId: number) =>
    useQuery({ queryKey: POLLS_QK.results(eventId, pollId), queryFn: () => fetchPollResults(eventId, pollId), enabled: Number.isFinite(eventId) && Number.isFinite(pollId) });

export const usePollByTokenQuery = (token: string) =>
    useQuery({ queryKey: POLLS_QK.view(token), queryFn: () => fetchPollByToken(token), enabled: !!token });

export const useCreatePollMutation = () => {
    const qc = useQueryClient();
    return useMutation<EventPoll, unknown, { eventId: number; poll: Partial<EventPoll> }>({
        mutationFn: ({ eventId, poll }) => postCreatePoll(eventId, poll),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: POLLS_QK.polls(v.eventId) }); },
    });
};

export const useUpdatePollMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; pollId: number; poll: Partial<EventPoll> }>({
        mutationFn: ({ eventId, pollId, poll }) => putUpdatePoll(eventId, pollId, poll),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: POLLS_QK.polls(v.eventId) }); qc.invalidateQueries({ queryKey: POLLS_QK.poll(v.eventId, v.pollId) }); },
    });
};

export const useDeletePollMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; pollId: number }>({
        mutationFn: ({ eventId, pollId }) => deletePoll(eventId, pollId),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: POLLS_QK.polls(v.eventId) }); },
    });
};

export const useSendPollEmailsMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; pollId: number; body: SendPollEmailsRequest }>({
        mutationFn: ({ eventId, pollId, body }) => postSendPollEmails(eventId, pollId, body),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: POLLS_QK.poll(v.eventId, v.pollId) }); },
    });
};

export const usePopulatePollMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; pollId: number }>({
        mutationFn: ({ eventId, pollId }) => postPopulatePoll(eventId, pollId),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: POLLS_QK.poll(v.eventId, v.pollId) }); qc.invalidateQueries({ queryKey: POLLS_QK.results(v.eventId, v.pollId) }); },
    });
};

export const useVotePollMutation = () => {
    return useMutation<void, unknown, { token: string; body: VotePollRequest }>({
        mutationFn: ({ token, body }) => postVotePoll(token, body),
    });
};

export default {
    fetchPolls,
    postCreatePoll,
    fetchPollById,
    putUpdatePoll,
    deletePoll,
    fetchPollResults,
    postSendPollEmails,
    postPopulatePoll,
    fetchPollByToken,
    postVotePoll,
};
