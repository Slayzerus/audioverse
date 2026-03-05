// apiDownload.ts — Library download endpoints
import { apiClient, apiPath } from "./audioverseApiClient";

// === Base path ===
const DOWNLOAD_BASE = "/api/library/download";

// === Fetchers ===

/** @internal POST /api/library/download/audio — Download audio file (returns blob URL) */
export const postDownloadAudio = async (body: {
    songId?: number;
    fileId?: number;
    format?: string;
}): Promise<Blob> => {
    const { data } = await apiClient.post(apiPath(DOWNLOAD_BASE, "/audio"), body, {
        responseType: "blob",
    });
    return data;
};

/**
 * Helper: trigger a browser download for an audio file.
 */
export const downloadAudioAsFile = async (
    body: { songId?: number; fileId?: number; format?: string },
    filename: string,
): Promise<void> => {
    const blob = await postDownloadAudio(body);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export default {
    postDownloadAudio,
    downloadAudioAsFile,
};
