// apiAudioEditor.ts — Audio editor project CRUD, tracks, clips, export
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
    QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";

// === Types ===
export interface AudioEditorProject {
    id: number;
    name: string;
    description?: string | null;
    bpm?: number;
    timeSignature?: string | null;
    createdAt?: string;
    updatedAt?: string;
    tracks?: AudioEditorTrack[];
}

export interface AudioEditorTrack {
    id: number;
    projectId: number;
    name: string;
    volume?: number;
    pan?: number;
    isMuted?: boolean;
    isSolo?: boolean;
    clips?: AudioEditorClip[];
}

export interface AudioEditorClip {
    id: number;
    trackId: number;
    assetId?: number;
    startMs: number;
    durationMs: number;
    offsetMs?: number;
    name?: string | null;
}

export interface AudioEditorAsset {
    id: number;
    name: string;
    objectKey: string;
    mimeType?: string | null;
    durationMs?: number;
}

// === Base path ===
const AE_BASE = "/api/audio-editor";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const AUDIO_EDITOR_QK = {
    projects: ["audio-editor", "projects"] as const,
    project: (id: number) => ["audio-editor", "projects", id] as const,
};

// === Assets ===

/** @internal POST /api/audio-editor/assets — Upload asset (multipart) */
export const postUploadAsset = async (file: File): Promise<AudioEditorAsset> => {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post<AudioEditorAsset>(
        apiPath(AE_BASE, "/assets"),
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
};

// === Projects ===

/** @internal GET /api/audio-editor/projects */
export const fetchAudioEditorProjects = async (): Promise<AudioEditorProject[]> => {
    const { data } = await apiClient.get<AudioEditorProject[]>(apiPath(AE_BASE, "/projects"));
    return data ?? [];
};

/** @internal POST /api/audio-editor/projects */
export const postCreateAudioEditorProject = async (
    dto: Pick<AudioEditorProject, "name" | "description" | "bpm" | "timeSignature">,
): Promise<AudioEditorProject> => {
    const { data } = await apiClient.post<AudioEditorProject>(apiPath(AE_BASE, "/projects"), dto);
    return data;
};

/** @internal GET /api/audio-editor/projects/{id} */
export const fetchAudioEditorProject = async (
    id: number,
): Promise<AudioEditorProject> => {
    const { data } = await apiClient.get<AudioEditorProject>(apiPath(AE_BASE, `/projects/${id}`));
    return data;
};

/** @internal PUT /api/audio-editor/projects/{id} */
export const putUpdateAudioEditorProject = async (
    dto: AudioEditorProject,
): Promise<AudioEditorProject> => {
    const { data } = await apiClient.put<AudioEditorProject>(
        apiPath(AE_BASE, `/projects/${dto.id}`),
        dto,
    );
    return data;
};

// === Tracks ===

/** @internal POST /api/audio-editor/projects/{id}/tracks */
export const postCreateTrack = async (
    projectId: number,
    dto: Pick<AudioEditorTrack, "name" | "volume" | "pan">,
): Promise<AudioEditorTrack> => {
    const { data } = await apiClient.post<AudioEditorTrack>(
        apiPath(AE_BASE, `/projects/${projectId}/tracks`),
        dto,
    );
    return data;
};

/** @internal DELETE /api/audio-editor/projects/{id}/tracks/{trackId} */
export const deleteTrack = async (
    projectId: number,
    trackId: number,
): Promise<void> => {
    await apiClient.delete(apiPath(AE_BASE, `/projects/${projectId}/tracks/${trackId}`));
};

// === Clips ===

/** @internal POST /api/audio-editor/projects/{id}/tracks/{trackId}/clips */
export const postCreateClip = async (
    projectId: number,
    trackId: number,
    dto: Pick<AudioEditorClip, "assetId" | "startMs" | "durationMs" | "offsetMs" | "name">,
): Promise<AudioEditorClip> => {
    const { data } = await apiClient.post<AudioEditorClip>(
        apiPath(AE_BASE, `/projects/${projectId}/tracks/${trackId}/clips`),
        dto,
    );
    return data;
};

// === Export ===

/** @internal POST /api/audio-editor/projects/{id}/export */
export const postExportProject = async (id: number): Promise<{ taskId: string }> => {
    const { data } = await apiClient.post<{ taskId: string }>(
        apiPath(AE_BASE, `/projects/${id}/export`),
    );
    return data;
};

/** @internal GET /api/audio-editor/projects/{id}/download — Download exported audio */
export const fetchExportDownload = async (id: number): Promise<Blob> => {
    const { data } = await apiClient.get(apiPath(AE_BASE, `/projects/${id}/download`), {
        responseType: "blob",
    });
    return data;
};

// === React Query Hooks ===

export const useAudioEditorProjectsQuery = (
    options?: Partial<UseQueryOptions<AudioEditorProject[], unknown, AudioEditorProject[], QueryKey>>,
) =>
    useQuery({
        queryKey: AUDIO_EDITOR_QK.projects,
        queryFn: fetchAudioEditorProjects,
        ...options,
    });

export const useAudioEditorProjectQuery = (
    id: number,
    options?: Partial<UseQueryOptions<AudioEditorProject, unknown, AudioEditorProject, QueryKey>>,
) =>
    useQuery({
        queryKey: AUDIO_EDITOR_QK.project(id),
        queryFn: () => fetchAudioEditorProject(id),
        enabled: id > 0,
        ...options,
    });

export const useCreateAudioEditorProjectMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: Pick<AudioEditorProject, "name" | "description" | "bpm" | "timeSignature">) =>
            postCreateAudioEditorProject(dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: AUDIO_EDITOR_QK.projects });
        },
    });
};

export const useUpdateAudioEditorProjectMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: AudioEditorProject) => putUpdateAudioEditorProject(dto),
        onSuccess: (_, dto) => {
            qc.invalidateQueries({ queryKey: AUDIO_EDITOR_QK.project(dto.id) });
            qc.invalidateQueries({ queryKey: AUDIO_EDITOR_QK.projects });
        },
    });
};

export const useCreateTrackMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, dto }: { projectId: number; dto: Pick<AudioEditorTrack, "name" | "volume" | "pan"> }) =>
            postCreateTrack(projectId, dto),
        onSuccess: (_, { projectId }) => {
            qc.invalidateQueries({ queryKey: AUDIO_EDITOR_QK.project(projectId) });
        },
    });
};

export const useDeleteTrackMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, trackId }: { projectId: number; trackId: number }) =>
            deleteTrack(projectId, trackId),
        onSuccess: (_, { projectId }) => {
            qc.invalidateQueries({ queryKey: AUDIO_EDITOR_QK.project(projectId) });
        },
    });
};

export const useCreateClipMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            projectId,
            trackId,
            dto,
        }: {
            projectId: number;
            trackId: number;
            dto: Pick<AudioEditorClip, "assetId" | "startMs" | "durationMs" | "offsetMs" | "name">;
        }) => postCreateClip(projectId, trackId, dto),
        onSuccess: (_, { projectId }) => {
            qc.invalidateQueries({ queryKey: AUDIO_EDITOR_QK.project(projectId) });
        },
    });
};

export const useUploadAssetMutation = () =>
    useMutation({
        mutationFn: (file: File) => postUploadAsset(file),
    });

export const useExportProjectMutation = () =>
    useMutation({
        mutationFn: (id: number) => postExportProject(id),
    });

export default {
    postUploadAsset,
    fetchAudioEditorProjects,
    postCreateAudioEditorProject,
    fetchAudioEditorProject,
    putUpdateAudioEditorProject,
    postCreateTrack,
    deleteTrack,
    postCreateClip,
    postExportProject,
    fetchExportDownload,
};
