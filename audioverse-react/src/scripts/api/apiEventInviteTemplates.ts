// apiEventInviteTemplates.ts — Event invite templates & bulk invites
import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryOptions,
    type QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";

// === Types ===

export interface EventInviteTemplate {
    id: number;
    eventId: number;
    name?: string;
    subject?: string;
    bodyHtml?: string;
    bodyText?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface BulkInviteRequest {
    templateId?: number;
    emails?: string[];
    userIds?: number[];
    message?: string;
}

export interface BulkInviteJobStatus {
    jobId: string;
    status?: string;
    total?: number;
    sent?: number;
    failed?: number;
    completedAt?: string;
}

// === Base path ===
const EVENTS_BASE = "/api/events";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const INVITE_TEMPLATES_QK = {
    list: (eventId: number) => ["events", eventId, "invite-templates"] as const,
    bulkJob: (eventId: number, jobId: string) => ["events", eventId, "bulk-invite", jobId] as const,
};

// ── Templates CRUD ───────────────────────────────────────────

/** @internal GET /api/events/{eventId}/invite-templates */
export const fetchInviteTemplates = async (eventId: number): Promise<EventInviteTemplate[]> => {
    const { data } = await apiClient.get<EventInviteTemplate[]>(apiPath(EVENTS_BASE, `/${eventId}/invite-templates`));
    return data ?? [];
};

/** @internal POST /api/events/{eventId}/invite-templates */
export const postCreateInviteTemplate = async (eventId: number, template: Partial<EventInviteTemplate>): Promise<EventInviteTemplate> => {
    const { data } = await apiClient.post<EventInviteTemplate>(apiPath(EVENTS_BASE, `/${eventId}/invite-templates`), template);
    return data;
};

/** @internal PUT /api/events/{eventId}/invite-templates/{id} */
export const putUpdateInviteTemplate = async (eventId: number, id: number, template: Partial<EventInviteTemplate>): Promise<void> => {
    await apiClient.put(apiPath(EVENTS_BASE, `/${eventId}/invite-templates/${id}`), template);
};

/** @internal DELETE /api/events/{eventId}/invite-templates/{id} */
export const deleteInviteTemplate = async (eventId: number, id: number): Promise<void> => {
    await apiClient.delete(apiPath(EVENTS_BASE, `/${eventId}/invite-templates/${id}`));
};

// ── Bulk Invite ──────────────────────────────────────────────

/** @internal POST /api/events/{eventId}/bulk-invite */
export const postBulkInvite = async (eventId: number, request: BulkInviteRequest): Promise<{ jobId: string }> => {
    const { data } = await apiClient.post<{ jobId: string }>(apiPath(EVENTS_BASE, `/${eventId}/bulk-invite`), request);
    return data;
};

/** @internal GET /api/events/{eventId}/bulk-invite/{jobId} */
export const fetchBulkInviteStatus = async (eventId: number, jobId: string): Promise<BulkInviteJobStatus> => {
    const { data } = await apiClient.get<BulkInviteJobStatus>(apiPath(EVENTS_BASE, `/${eventId}/bulk-invite/${jobId}`));
    return data;
};

// === React Query Hooks ===

export const useInviteTemplatesQuery = (eventId: number, options?: Partial<UseQueryOptions<EventInviteTemplate[], unknown, EventInviteTemplate[], QueryKey>>) =>
    useQuery({ queryKey: INVITE_TEMPLATES_QK.list(eventId), queryFn: () => fetchInviteTemplates(eventId), enabled: Number.isFinite(eventId), ...options });

export const useCreateInviteTemplateMutation = () => {
    const qc = useQueryClient();
    return useMutation<EventInviteTemplate, unknown, { eventId: number; template: Partial<EventInviteTemplate> }>({
        mutationFn: ({ eventId, template }) => postCreateInviteTemplate(eventId, template),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: INVITE_TEMPLATES_QK.list(v.eventId) }); },
    });
};

export const useUpdateInviteTemplateMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; id: number; template: Partial<EventInviteTemplate> }>({
        mutationFn: ({ eventId, id, template }) => putUpdateInviteTemplate(eventId, id, template),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: INVITE_TEMPLATES_QK.list(v.eventId) }); },
    });
};

export const useDeleteInviteTemplateMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; id: number }>({
        mutationFn: ({ eventId, id }) => deleteInviteTemplate(eventId, id),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: INVITE_TEMPLATES_QK.list(v.eventId) }); },
    });
};

export const useBulkInviteMutation = () => {
    return useMutation<{ jobId: string }, unknown, { eventId: number; request: BulkInviteRequest }>({
        mutationFn: ({ eventId, request }) => postBulkInvite(eventId, request),
    });
};

export const useBulkInviteStatusQuery = (eventId: number, jobId: string) =>
    useQuery({
        queryKey: INVITE_TEMPLATES_QK.bulkJob(eventId, jobId),
        queryFn: () => fetchBulkInviteStatus(eventId, jobId),
        enabled: Number.isFinite(eventId) && !!jobId,
        refetchInterval: 3000, // poll every 3s while job is running
    });
