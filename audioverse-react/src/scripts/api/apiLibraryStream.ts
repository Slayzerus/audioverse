// apiLibraryStream.ts
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
    QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import { API_ROOT } from "../../config/apiConfig";
import {SongFileInformation, SongRecord} from "../../models/modelsAudio.ts";

// === Path bases ===
export const AUDIO_BASE = "/api/audio";
export const YOUTUBE_BASE = "/api/karaoke/songs/youtube";

// === Pomocnicze ===
export const buildStreamUrl = (id: string) =>
    `${API_ROOT.replace(/\/$/, "")}${apiPath(AUDIO_BASE, `/stream/${id}`)}`;

// === Query Keys ===
/** @internal  use React Query hooks below */
export const LIB_QK = {
    audioFiles: ["library", "audio", "files"] as const,
    audioRecords: ["library", "audio", "records"] as const,
    audioRecord: (id: string) => ["library", "audio", "record", id] as const,
    ytSearch: (artist: string, title: string) =>
        ["library", "yt-search", artist ?? "", title ?? ""] as const,
};

// === Low-level API (fetchers) ===
/** @internal */
export const postScanAudio = async (): Promise<number> => {
    const { data } = await apiClient.post<number>(apiPath(AUDIO_BASE, "/scan"));
    return Number.isFinite(data as number) ? (data as number) : 0;
};

/** @internal */
export const fetchAudioFiles = async (): Promise<SongFileInformation[]> => {
    const { data } = await apiClient.get<SongFileInformation[]>(
        apiPath(AUDIO_BASE, "/songs")
    );
    return Array.isArray(data) ? data : [];
};

/** @internal */
export const fetchAudioRecords = async (): Promise<SongRecord[]> => {
    const { data } = await apiClient.get<SongRecord[]>(
        apiPath(AUDIO_BASE, "/songs/records")
    );
    return Array.isArray(data) ? data : [];
};

// (brak dedykowanego endpointu po id – selekcja po kliencie)
export const selectRecordById =
    (id: string) =>
        (records: SongRecord[] | undefined): SongRecord | undefined =>
            records?.find((r) => r.id === id);

// === React Query: Queries ===
export const useAudioFilesQuery = (
    options?: Partial<
        UseQueryOptions<SongFileInformation[], unknown, SongFileInformation[], QueryKey>
    >
) =>
    useQuery({
        queryKey: LIB_QK.audioFiles,
        queryFn: fetchAudioFiles,
        staleTime: 60_000,
        placeholderData: (prev) => prev ?? [],
        ...options,
    });

export const useAudioRecordsQuery = (
    options?: Partial<UseQueryOptions<SongRecord[], unknown, SongRecord[], QueryKey>>
) =>
    useQuery({
        queryKey: LIB_QK.audioRecords,
        queryFn: fetchAudioRecords,
        staleTime: 60_000,
        placeholderData: (prev) => prev ?? [],
        ...options,
    });

export const useAudioRecordQuery = (
    id: string,
    options?: Partial<UseQueryOptions<SongRecord | undefined, unknown, SongRecord | undefined, QueryKey>>
) =>
    useQuery({
        queryKey: LIB_QK.audioRecord(id),
        // we fetch the list and choose locally – no /record/{id} endpoint
        queryFn: async () => selectRecordById(id)(await fetchAudioRecords()),
        enabled: Boolean(id),
        staleTime: 60_000,
        ...options,
    });

// === React Query: Mutations ===
export const useScanAudioMutation = () => {
    const qc = useQueryClient();
    return useMutation<number>({
        mutationFn: () => postScanAudio(),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: LIB_QK.audioFiles });
            qc.invalidateQueries({ queryKey: LIB_QK.audioRecords });
        },
    });
};

// === Compatibility re-exports (old names) ===
export {
    fetchAudioFiles as getAllAudioFiles,
    fetchAudioRecords as getAllAudioRecords,
    postScanAudio as scanAudio
};

// === Default export (opcjonalny) ===
export default {
    // audio
    scanAudio: postScanAudio,
    getAllAudioFiles: fetchAudioFiles,
    getAllAudioRecords: fetchAudioRecords,
    buildStreamUrl,
};
