// apiModeration.ts — Moderation & ModerationAdmin endpoints
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import { AbuseReportRequest, ResolveAbuseReportRequest } from "../../models/modelsKaraoke";

export const MODERATION_BASE = "/api/moderation";

/** @internal  use React Query hooks below */
export const MODERATION_QK = {
    reports: (status?: string) => ["moderation", "reports", status] as const,
};

// === Fetchers ===

/** @internal POST /api/moderation/report — Submit an abuse report */
export const postAbuseReport = async (request: AbuseReportRequest): Promise<void> => {
    await apiClient.post(apiPath(MODERATION_BASE, "/report"), request);
};

/** @internal GET /api/moderation/admin/reports — Get abuse reports (moderator panel) */
export const fetchAdminReports = async (status?: string, take = 100): Promise<Record<string, unknown>[]> => {
    const { data } = await apiClient.get<Record<string, unknown>[]>(apiPath(MODERATION_BASE, "/admin/reports"), {
        params: { status, take },
    });
    return data ?? [];
};

/** @internal PUT /api/moderation/admin/report/{id}/resolve — Resolve an abuse report */
export const putResolveReport = async (id: number, request: ResolveAbuseReportRequest): Promise<void> => {
    await apiClient.put(apiPath(MODERATION_BASE, `/admin/report/${id}/resolve`), request);
};

// === React Query hooks ===

export const useAdminReportsQuery = (status?: string, take = 100) =>
    useQuery({
        queryKey: MODERATION_QK.reports(status),
        queryFn: () => fetchAdminReports(status, take),
        staleTime: 30_000,
    });

export const useAbuseReportMutation = () =>
    useMutation<void, unknown, AbuseReportRequest>({
        mutationFn: (request) => postAbuseReport(request),
    });

export const useResolveReportMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { id: number; request: ResolveAbuseReportRequest }>({
        mutationFn: ({ id, request }) => putResolveReport(id, request),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["moderation", "reports"] });
        },
    });
};
