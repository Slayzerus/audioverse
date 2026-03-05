// apiLibraryFiles.ts — Audio file visibility and seed endpoints
import { apiClient, apiPath } from "./audioverseApiClient";

export const LIBRARY_FILES_BASE = "/api/library/files/audio";

/** @internal GET /api/library/files/audio?private=false — Get public samples */
export const fetchPublicAudioSamples = async () => {
    const { data } = await apiClient.get(apiPath(LIBRARY_FILES_BASE, ""), { params: { private: false } });
    return data;
};

/** @internal GET /api/library/files/audio?ownerId=1&private=true — Get admin private files */
export const fetchAdminPrivateAudioFiles = async () => {
    const { data } = await apiClient.get(apiPath(LIBRARY_FILES_BASE, ""), { params: { ownerId: 1, private: true } });
    return data;
};

/** @internal GET /api/library/files/audio — Get files visible to current user */
export const fetchVisibleAudioFiles = async () => {
    const { data } = await apiClient.get(apiPath(LIBRARY_FILES_BASE, ""));
    return data;
};

// Soundfonts visibility and seed logic can be added similarly.