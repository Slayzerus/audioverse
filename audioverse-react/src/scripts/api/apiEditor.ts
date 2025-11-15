// apiEditor.ts
import { apiClient, apiPath } from "./audioverseApiClient";

import {
    AudioProject,
    AudioLayerItem,
    AudioClip,
    AudioInputPreset,
} from "../../models/modelsEditor";

// Ustal bazową ścieżkę jak w DMX (bez pełnego URL w kodzie)
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

// 🔹 Dodawanie wielu elementów do warstwy
export const addLayerItems = async (items: AudioLayerItem[]) => {
    await apiClient.post(apiPath(EDITOR_BASE, "/layer/items"), { items });
};

// 🔹 Pobieranie listy projektów
export const getProjects = async () => {
    const res = await apiClient.get<AudioProject[]>(
        apiPath(EDITOR_BASE, "/projects")
    );
    return res.data;
};

// 🔹 Pobieranie listy szablonów projektów
export const getTemplateProjects = async (): Promise<AudioProject[]> => {
    const res = await apiClient.get<AudioProject[]>(
        apiPath(EDITOR_BASE, "/projects/templates")
    );
    return res.data;
};

// 🔹 Pobieranie szczegółowego projektu
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

// 🔹 Pobieranie pojedynczego AudioClipu
export const getAudioClip = async (clipId: number) => {
    const res = await apiClient.get<AudioClip>(
        apiPath(EDITOR_BASE, `/audioclip/${clipId}`)
    );
    return res.data;
};

// 🔹 Pobieranie listy AudioClipów (paginacja, tag, wyszukiwanie)
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

// 🔹 Pobieranie listy Input Presetów (paginacja, wyszukiwanie)
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
// Uwaga: jeśli backend oczekuje "gołego" stringa w body (a nie { tag }),
// zostawiamy tak jak było:
export const addTagToAudioClip = async (clipId: number, tag: string) => {
    await apiClient.post(apiPath(EDITOR_BASE, `/audioclip/${clipId}/tag`), tag);
};

// 🔹 Usuwanie tagu z AudioClip
export const removeTagFromAudioClip = async (clipId: number, tag: string) => {
    await apiClient.delete(apiPath(EDITOR_BASE, `/audioclip/${clipId}/tag`), {
        data: tag,
    });
};

export default {
    addProject,
    addSection,
    addLayer,
    addLayerItem,
    addLayerItems,
    getProjects,
    getTemplateProjects,
    getProjectDetails,
    addAudioClip,
    getAudioClip,
    getAudioClips,
    addInputPreset,
    getInputPreset,
    getInputPresets,
    addTagToAudioClip,
    removeTagFromAudioClip,
};
