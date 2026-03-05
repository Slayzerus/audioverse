/**
 * apiDiagrams.ts — Admin Diagrams API
 *
 * Endpoints for the auto-generated data model diagram.
 * All endpoints require Admin role.
 */
import { useQuery } from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type { DiagramJson, DiagramListEntry } from "../../models/modelsDiagrams";

const DIAGRAMS_BASE = "/api/admin/diagrams";

// ── Raw fetch functions ────────────────────────────────────────────

/** GET /api/admin/diagrams — list all .drawio files. */
export const getDiagramList = async (): Promise<DiagramListEntry[]> => {
    const { data } = await apiClient.get<DiagramListEntry[]>(DIAGRAMS_BASE);
    return data;
};

/** GET /api/admin/diagrams/data-model — auto-generated diagram JSON. */
export const getDataModelDiagram = async (): Promise<DiagramJson> => {
    const { data } = await apiClient.get<DiagramJson>(
        apiPath(DIAGRAMS_BASE, "data-model"),
    );
    return data;
};

/** GET /api/admin/diagrams/data-model/drawio — download .drawio XML as Blob. */
export const downloadDataModelDrawio = async (): Promise<Blob> => {
    const { data } = await apiClient.get(
        apiPath(DIAGRAMS_BASE, "data-model/drawio"),
        { responseType: "blob" },
    );
    return data as Blob;
};

// ── React Query hooks ──────────────────────────────────────────────

/** Fetch the list of all diagram files. */
export const useDiagramListQuery = () =>
    useQuery({
        queryKey: ["admin", "diagrams", "list"],
        queryFn: getDiagramList,
        staleTime: 5 * 60_000, // 5 min
    });

/** Fetch the auto-generated data model diagram JSON. */
export const useDataModelDiagramQuery = () =>
    useQuery({
        queryKey: ["admin", "diagrams", "data-model"],
        queryFn: getDataModelDiagram,
        staleTime: 5 * 60_000,
    });
