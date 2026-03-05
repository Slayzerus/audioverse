// apiOrganizations.ts — Organizations API + React Query hooks
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type { Organization } from "../../models/modelsKaraoke";

export const ORGANIZATIONS_BASE = "/api/organizations";

/** @internal  use React Query hooks below */
export const ORG_QK = {
    all: ["organizations"] as const,
    detail: (id: number) => ["organizations", id] as const,
};

/** @internal GET /api/organizations — List organizations */
export const fetchOrganizations = async (): Promise<Organization[]> => {
    const { data } = await apiClient.get<Organization[]>(apiPath(ORGANIZATIONS_BASE, ""));
    return data ?? [];
};

/** @internal GET /api/organizations/{id} — Organization details */
export const fetchOrganizationById = async (id: number): Promise<Organization> => {
    const { data } = await apiClient.get<Organization>(apiPath(ORGANIZATIONS_BASE, `/${id}`));
    return data;
};

/** POST /api/organizations — Create organization */
export const createOrganization = async (payload: Partial<Organization>): Promise<Organization> => {
    const { data } = await apiClient.post<Organization>(apiPath(ORGANIZATIONS_BASE, ""), payload);
    return data;
};

/** PUT /api/organizations/{id} — Update organization */
export const updateOrganization = async (id: number, payload: Partial<Organization>): Promise<Organization> => {
    const { data } = await apiClient.put<Organization>(apiPath(ORGANIZATIONS_BASE, `/${id}`), payload);
    return data;
};

/** @internal DELETE /api/organizations/{id} — Delete organization */
export const deleteOrganization = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(ORGANIZATIONS_BASE, `/${id}`));
};

// ── React Query Hooks ──

export const useOrganizationsQuery = () =>
    useQuery({ queryKey: ORG_QK.all, queryFn: fetchOrganizations });

export const useOrganizationQuery = (id: number) =>
    useQuery({ queryKey: ORG_QK.detail(id), queryFn: () => fetchOrganizationById(id), enabled: Number.isFinite(id) });

export const useCreateOrganizationMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: Partial<Organization>) => createOrganization(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ORG_QK.all }),
    });
};

export const useUpdateOrganizationMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Partial<Organization> }) => updateOrganization(id, payload),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ORG_QK.all });
            qc.invalidateQueries({ queryKey: ORG_QK.detail(vars.id) });
        },
    });
};

export const useDeleteOrganizationMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteOrganization(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ORG_QK.all }),
    });
};

