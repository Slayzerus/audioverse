// apiEditor.ts
import { apiClient, apiPath } from "./audioverseApiClient";

import {
    AudioProject,
    AudioLayerItem,
    AudioClip,
    AudioInputPreset,
    AudioEffect,
    AudioLayerEffect,
    AudioProjectCollaborator,
    AudioSamplePack,
    AudioSample,
} from "../../models/modelsEditor";

export interface UpdateProjectPayload {
    name: string;
    isTemplate?: boolean;
    volume?: number;
}

export interface UpdateSectionPayload {
    name: string;
    orderNumber: number;
}

export interface UpdateLayerPayload {
    name: string;
    audioClipId?: number;
}

// Establish base path like in DMX (without full URL in code)
export const EDITOR_BASE = "/api/editor";

// ---------------- Low-level API (fetchers) ----------------

// 🔹 Dodawanie projektu
export const addProject = async (name: string, userProfileId: number) => {
    const res = await apiClient.post<number>(apiPath(EDITOR_BASE, "/project"), {
        name,
        userProfileId,
    });
    return res.data;
};

// 🔹 Aktualizacja projektu
export const updateProject = async (
    projectId: number,
    payload: UpdateProjectPayload
) => {
    const res = await apiClient.put<void>(
        apiPath(EDITOR_BASE, `/project/${projectId}`),
        payload
    );
    return res.data;
};

// 🔹 Usuwanie projektu
/** @internal */
export const deleteProject = async (projectId: number) => {
    await apiClient.delete(apiPath(EDITOR_BASE, `/project/${projectId}`));
};

// 🔹 Dodawanie sekcji do projektu
export const addSection = async (
    projectId: number,
    name: string,
    orderNumber: number
) => {
    const res = await apiClient.post<number>(apiPath(EDITOR_BASE, "/section"), {
        projectId,
        name,
        orderNumber,
    });
    return res.data;
};

// 🔹 Aktualizacja sekcji
export const updateSection = async (
    sectionId: number,
    payload: UpdateSectionPayload
) => {
    const res = await apiClient.put<void>(
        apiPath(EDITOR_BASE, `/section/${sectionId}`),
        payload
    );
    return res.data;
};

// 🔹 Usuwanie sekcji
/** @internal */
export const deleteSection = async (sectionId: number) => {
    await apiClient.delete(apiPath(EDITOR_BASE, `/section/${sectionId}`));
};

// 🔹 Dodawanie warstwy do sekcji
// apiEditor.ts
export const addLayer = async (
    sectionId: number,
    name: string,
    audioSource: string,
    audioSourceParameters: string
) => {
    const res = await apiClient.post<number>(
        apiPath(EDITOR_BASE, "/layer"),
        { sectionId, name, audioSource, audioSourceParameters }
    );
    return res.data;
};

// 🔹 Aktualizacja warstwy
export const updateLayer = async (
    layerId: number,
    payload: UpdateLayerPayload
) => {
    const res = await apiClient.put<void>(
        apiPath(EDITOR_BASE, `/layer/${layerId}`),
        payload
    );
    return res.data;
};

// 🔹 Usuwanie warstwy
/** @internal */
export const deleteLayer = async (layerId: number) => {
    await apiClient.delete(apiPath(EDITOR_BASE, `/layer/${layerId}`));
};


// 🔹 Dodawanie pojedynczego elementu do warstwy
export const addLayerItem = async (
    layerId: number,
    startTime: string,
    parameters: string
) => {
    const res = await apiClient.post<number>(
        apiPath(EDITOR_BASE, "/layer/item"),
        { layerId, startTime, parameters }
    );
    return res.data;
};

// 🔹 Usuwanie pojedynczego elementu warstwy
/** @internal */
export const deleteLayerItem = async (layerItemId: number) => {
    await apiClient.delete(apiPath(EDITOR_BASE, `/layer/item/${layerItemId}`));
};

// 🔹 Adding multiple elements to a layer
export const addLayerItems = async (items: AudioLayerItem[]) => {
    await apiClient.post(apiPath(EDITOR_BASE, "/layer/items"), { items });
};

// 🔹 Getting project list
export const getProjects = async () => {
    const res = await apiClient.get<AudioProject[]>(
        apiPath(EDITOR_BASE, "/projects")
    );
    return res.data;
};

// 🔹 Getting project template list
export const getTemplateProjects = async (): Promise<AudioProject[]> => {
    const res = await apiClient.get<AudioProject[]>(
        apiPath(EDITOR_BASE, "/projects/templates")
    );
    return res.data;
};

// 🔹 Getting detailed project
export const getProjectDetails = async (projectId: number) => {
    const res = await apiClient.get<AudioProject>(
        apiPath(EDITOR_BASE, `/project/${projectId}`)
    );
    return res.data;
};

// 🔹 Dodawanie AudioClip
export const addAudioClip = async (clip: Omit<AudioClip, "id">) => {
    const res = await apiClient.post<number>(
        apiPath(EDITOR_BASE, "/audioclip"),
        clip
    );
    return res.data;
};

// 🔹 Usuwanie AudioClip
/** @internal */
export const deleteAudioClip = async (clipId: number) => {
    await apiClient.delete(apiPath(EDITOR_BASE, `/audioclip/${clipId}`));
};

// 🔹 Pobieranie pojedynczego AudioClipu
export const getAudioClip = async (clipId: number) => {
    const res = await apiClient.get<AudioClip>(
        apiPath(EDITOR_BASE, `/audioclip/${clipId}`)
    );
    return res.data;
};

// 🔹 Getting AudioClip list (pagination, tag, search)
export const getAudioClips = async (
    skip: number,
    take: number,
    tag?: string,
    search?: string
) => {
    const res = await apiClient.get<AudioClip[]>(
        apiPath(EDITOR_BASE, "/audioclips"),
        { params: { skip, take, tag, search } }
    );
    return res.data;
};

// 🔹 Dodawanie Input Presetu
export const addInputPreset = async (
    version: string,
    name: string,
    userProfileId?: number
) => {
    const res = await apiClient.post<number>(
        apiPath(EDITOR_BASE, "/inputpreset"),
        { version, name, userProfileId }
    );
    return res.data;
};

// 🔹 Pobieranie pojedynczego Input Presetu
export const getInputPreset = async (presetId: number) => {
    const res = await apiClient.get<AudioInputPreset>(
        apiPath(EDITOR_BASE, `/inputpreset/${presetId}`)
    );
    return res.data;
};

// 🔹 Getting Input Preset list (pagination, search)
export const getInputPresets = async (
    skip: number,
    take: number,
    search?: string
) => {
    const res = await apiClient.get<AudioInputPreset[]>(
        apiPath(EDITOR_BASE, "/inputpresets"),
        { params: { skip, take, search } }
    );
    return res.data;
};

// 🔹 Dodawanie tagu do AudioClip
// Note: if backend expects a bare string in body (not { tag }),
// we leave it as it was:
export const addTagToAudioClip = async (clipId: number, tag: string) => {
    await apiClient.post(apiPath(EDITOR_BASE, `/audioclip/${clipId}/tag`), tag);
};

// 🔹 Usuwanie tagu z AudioClip
export const removeTagFromAudioClip = async (clipId: number, tag: string) => {
    await apiClient.delete(apiPath(EDITOR_BASE, `/audioclip/${clipId}/tag`), {
        data: tag,
    });
};

// ── Audio Clip Streaming ──────────────────────────────────────

/** GET /api/editor/audioclip/{id}/stream — Stream audio clip data */
export const streamAudioClip = (clipId: number): string =>
    apiPath(EDITOR_BASE, `/audioclip/${clipId}/stream`);

// ── Audio Effects ─────────────────────────────────────────────

/** GET /api/editor/effects — List all available audio effects */
export const getEffects = async (): Promise<AudioEffect[]> => {
    const res = await apiClient.get<AudioEffect[]>(apiPath(EDITOR_BASE, "/effects"));
    return res.data ?? [];
};

/** POST /api/editor/effects — Create a reusable audio effect preset */
export const createEffect = async (effect: AudioEffect): Promise<AudioEffect> => {
    const res = await apiClient.post<AudioEffect>(apiPath(EDITOR_BASE, "/effects"), effect);
    return res.data;
};

/** PUT /api/editor/effects/{id} — Update an audio effect */
export const updateEffect = async (id: number, effect: AudioEffect): Promise<void> => {
    await apiClient.put(apiPath(EDITOR_BASE, `/effects/${id}`), effect);
};

/** @internal DELETE /api/editor/effects/{id} — Delete an audio effect */
export const deleteEffect = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(EDITOR_BASE, `/effects/${id}`));
};

// ── Layer Effects ─────────────────────────────────────────────

/** GET /api/editor/layers/{layerId}/effects — List effects on a layer (ordered) */
export const getLayerEffects = async (layerId: number): Promise<AudioLayerEffect[]> => {
    const res = await apiClient.get<AudioLayerEffect[]>(apiPath(EDITOR_BASE, `/layers/${layerId}/effects`));
    return res.data ?? [];
};

/** POST /api/editor/layers/{layerId}/effects — Assign effect to layer */
export const addLayerEffect = async (layerId: number, effect: AudioLayerEffect): Promise<AudioLayerEffect> => {
    const res = await apiClient.post<AudioLayerEffect>(apiPath(EDITOR_BASE, `/layers/${layerId}/effects`), effect);
    return res.data;
};

/** DELETE /api/editor/layer-effects/{id} — Remove effect from layer */
export const removeLayerEffect = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(EDITOR_BASE, `/layer-effects/${id}`));
};

// ── Collaborators ─────────────────────────────────────────────

/** GET /api/editor/project/{projectId}/collaborators — List project collaborators */
export const getCollaborators = async (projectId: number): Promise<AudioProjectCollaborator[]> => {
    const res = await apiClient.get<AudioProjectCollaborator[]>(apiPath(EDITOR_BASE, `/project/${projectId}/collaborators`));
    return res.data ?? [];
};

/** POST /api/editor/project/{projectId}/collaborators — Add collaborator */
export const addCollaborator = async (projectId: number, collab: AudioProjectCollaborator): Promise<AudioProjectCollaborator> => {
    const res = await apiClient.post<AudioProjectCollaborator>(apiPath(EDITOR_BASE, `/project/${projectId}/collaborators`), collab);
    return res.data;
};

/** PUT /api/editor/project/{projectId}/collaborators/{id} — Update collaborator permission */
export const updateCollaborator = async (projectId: number, id: number, collab: AudioProjectCollaborator): Promise<void> => {
    await apiClient.put(apiPath(EDITOR_BASE, `/project/${projectId}/collaborators/${id}`), collab);
};

/** DELETE /api/editor/project/{projectId}/collaborators/{id} — Remove collaborator */
export const removeCollaborator = async (projectId: number, id: number): Promise<void> => {
    await apiClient.delete(apiPath(EDITOR_BASE, `/project/${projectId}/collaborators/${id}`));
};

// ── Export ─────────────────────────────────────────────────────

/** POST /api/editor/project/{projectId}/export — Request project export (mixdown) */
export const exportProject = async (projectId: number): Promise<{ taskId: string }> => {
    const res = await apiClient.post<{ taskId: string }>(apiPath(EDITOR_BASE, `/project/${projectId}/export`));
    return res.data;
};

/** GET /api/editor/export/{taskId}/status — Check export task status */
export const getExportStatus = async (taskId: string): Promise<unknown> => {
    const res = await apiClient.get(apiPath(EDITOR_BASE, `/export/${taskId}/status`));
    return res.data;
};

// ── Sample Packs ──────────────────────────────────────────────

/** GET /api/editor/sample-packs — List all sample packs */
export const getSamplePacks = async (genre?: string, instrument?: string): Promise<AudioSamplePack[]> => {
    const params: Record<string, string> = {};
    if (genre) params.genre = genre;
    if (instrument) params.instrument = instrument;
    const res = await apiClient.get<AudioSamplePack[]>(apiPath(EDITOR_BASE, "/sample-packs"), { params });
    return res.data ?? [];
};

/** POST /api/editor/sample-packs — Create a sample pack */
export const createSamplePack = async (pack: AudioSamplePack): Promise<AudioSamplePack> => {
    const res = await apiClient.post<AudioSamplePack>(apiPath(EDITOR_BASE, "/sample-packs"), pack);
    return res.data;
};

/** GET /api/editor/sample-packs/{id} — Get sample pack with samples */
export const getSamplePack = async (id: number): Promise<AudioSamplePack> => {
    const res = await apiClient.get<AudioSamplePack>(apiPath(EDITOR_BASE, `/sample-packs/${id}`));
    return res.data;
};

/** @internal DELETE /api/editor/sample-packs/{id} — Delete sample pack */
export const deleteSamplePack = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(EDITOR_BASE, `/sample-packs/${id}`));
};

/** POST /api/editor/sample-packs/{packId}/samples — Add sample to pack */
export const addSample = async (packId: number, sample: AudioSample): Promise<AudioSample> => {
    const res = await apiClient.post<AudioSample>(apiPath(EDITOR_BASE, `/sample-packs/${packId}/samples`), sample);
    return res.data;
};

/** @internal DELETE /api/editor/samples/{id} — Delete a sample */
export const deleteSample = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(EDITOR_BASE, `/samples/${id}`));
};

export default {
    addProject,
    updateProject,
    deleteProject,
    addSection,
    updateSection,
    deleteSection,
    addLayer,
    updateLayer,
    deleteLayer,
    addLayerItem,
    addLayerItems,
    deleteLayerItem,
    getProjects,
    getTemplateProjects,
    getProjectDetails,
    addAudioClip,
    deleteAudioClip,
    getAudioClip,
    getAudioClips,
    addInputPreset,
    getInputPreset,
    getInputPresets,
    addTagToAudioClip,
    removeTagFromAudioClip,
    // Phase 9: new endpoints
    streamAudioClip,
    getEffects,
    createEffect,
    updateEffect,
    deleteEffect,
    getLayerEffects,
    addLayerEffect,
    removeLayerEffect,
    getCollaborators,
    addCollaborator,
    updateCollaborator,
    removeCollaborator,
    exportProject,
    getExportStatus,
    getSamplePacks,
    createSamplePack,
    getSamplePack,
    deleteSamplePack,
    addSample,
    deleteSample,
};
