// apiPlaylistManager.ts — Advanced Playlist Manager API layer
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type {
    ManagedPlaylist,
    PlaylistFolder,
    PlaylistTag,
    PlaylistTrack,
    PlaylistExportFormat,
    PlaylistImportOptions,
    ExternalPlaylist,
    ExternalPlaylistTrack,
    ServiceConnection,
} from "../../models/modelsPlaylistManager";
import { MusicPlatform } from "../../models/modelsMusicPlatform";

// ══════════════════════════════════════════════════════════════
// Base paths
// ══════════════════════════════════════════════════════════════

const PM_BASE = "/api/playlist-manager";
const PM_FOLDERS = `${PM_BASE}/folders`;
const PM_TAGS = `${PM_BASE}/tags`;
const PM_SERVICES = `${PM_BASE}/services`;

// ══════════════════════════════════════════════════════════════
// Query Keys
// ══════════════════════════════════════════════════════════════

/** @internal  use React Query hooks below */
export const PM_QK = {
    playlists: () => ["pm", "playlists"] as const,
    playlist: (id: string) => ["pm", "playlists", id] as const,
    folders: () => ["pm", "folders"] as const,
    tags: () => ["pm", "tags"] as const,
    services: () => ["pm", "services"] as const,
    externalPlaylists: (platform: MusicPlatform) => ["pm", "external", platform] as const,
    externalTracks: (platform: MusicPlatform, playlistId: string) =>
        ["pm", "external", platform, playlistId] as const,
    searchTracks: (q: string, source: string) => ["pm", "search", source, q] as const,
};

// ══════════════════════════════════════════════════════════════
// Playlist CRUD
// ══════════════════════════════════════════════════════════════

/** @internal */
export const fetchManagedPlaylists = async (): Promise<ManagedPlaylist[]> => {
    const { data } = await apiClient.get<ManagedPlaylist[]>(apiPath(PM_BASE, "/playlists"));
    return data ?? [];
};

/** @internal */
export const fetchManagedPlaylist = async (id: string): Promise<ManagedPlaylist> => {
    const { data } = await apiClient.get<ManagedPlaylist>(apiPath(PM_BASE, `/playlists/${id}`));
    return data;
};

/** @internal */
export const postCreateManagedPlaylist = async (
    playlist: Partial<ManagedPlaylist>,
): Promise<ManagedPlaylist> => {
    const { data } = await apiClient.post<ManagedPlaylist>(apiPath(PM_BASE, "/playlists"), playlist);
    return data;
};

/** @internal */
export const putUpdateManagedPlaylist = async (
    id: string,
    playlist: Partial<ManagedPlaylist>,
): Promise<ManagedPlaylist> => {
    const { data } = await apiClient.put<ManagedPlaylist>(
        apiPath(PM_BASE, `/playlists/${id}`),
        playlist,
    );
    return data;
};

/** @internal */
export const deleteManagedPlaylist = async (id: string): Promise<void> => {
    await apiClient.delete(apiPath(PM_BASE, `/playlists/${id}`));
};

/** @internal */
export const postDuplicatePlaylist = async (id: string): Promise<ManagedPlaylist> => {
    const { data } = await apiClient.post<ManagedPlaylist>(
        apiPath(PM_BASE, `/playlists/${id}/duplicate`),
    );
    return data;
};

// ── Track operations within a playlist ────────────────────────

/** @internal */
export const postAddTracks = async (
    playlistId: string,
    tracks: Partial<PlaylistTrack>[],
): Promise<ManagedPlaylist> => {
    const { data } = await apiClient.post<ManagedPlaylist>(
        apiPath(PM_BASE, `/playlists/${playlistId}/tracks`),
        { tracks },
    );
    return data;
};

/** @internal */
export const deleteRemoveTracks = async (
    playlistId: string,
    trackIds: string[],
): Promise<void> => {
    await apiClient.delete(apiPath(PM_BASE, `/playlists/${playlistId}/tracks`), {
        data: { trackIds },
    });
};

/** @internal */
export const putReorderTracks = async (
    playlistId: string,
    trackIds: string[],
): Promise<void> => {
    await apiClient.put(apiPath(PM_BASE, `/playlists/${playlistId}/tracks/reorder`), {
        trackIds,
    });
};

/** @internal */
export const postMoveTracks = async (
    sourcePlaylistId: string,
    targetPlaylistId: string,
    trackIds: string[],
): Promise<void> => {
    await apiClient.post(apiPath(PM_BASE, "/playlists/move-tracks"), {
        sourcePlaylistId,
        targetPlaylistId,
        trackIds,
    });
};

/** @internal */
export const postCopyTracks = async (
    sourcePlaylistId: string,
    targetPlaylistId: string,
    trackIds: string[],
): Promise<void> => {
    await apiClient.post(apiPath(PM_BASE, "/playlists/copy-tracks"), {
        sourcePlaylistId,
        targetPlaylistId,
        trackIds,
    });
};

// ── Merge playlists ───────────────────────────────────────────

/** @internal */
export const postMergePlaylists = async (
    targetPlaylistId: string,
    sourcePlaylistIds: string[],
    removeDuplicates: boolean,
): Promise<ManagedPlaylist> => {
    const { data } = await apiClient.post<ManagedPlaylist>(
        apiPath(PM_BASE, "/playlists/merge"),
        { targetPlaylistId, sourcePlaylistIds, removeDuplicates },
    );
    return data;
};

// ══════════════════════════════════════════════════════════════
// Folders CRUD
// ══════════════════════════════════════════════════════════════

/** @internal */
export const fetchFolders = async (): Promise<PlaylistFolder[]> => {
    const { data } = await apiClient.get<PlaylistFolder[]>(apiPath(PM_FOLDERS, ""));
    return data ?? [];
};

/** @internal */
export const postCreateFolder = async (
    folder: Partial<PlaylistFolder>,
): Promise<PlaylistFolder> => {
    const { data } = await apiClient.post<PlaylistFolder>(apiPath(PM_FOLDERS, ""), folder);
    return data;
};

/** @internal */
export const putUpdateFolder = async (
    id: string,
    folder: Partial<PlaylistFolder>,
): Promise<PlaylistFolder> => {
    const { data } = await apiClient.put<PlaylistFolder>(apiPath(PM_FOLDERS, `/${id}`), folder);
    return data;
};

/** @internal */
export const deleteFolder = async (id: string): Promise<void> => {
    await apiClient.delete(apiPath(PM_FOLDERS, `/${id}`));
};

/** @internal */
export const putMovePlaylistToFolder = async (
    playlistId: string,
    folderId: string | null,
): Promise<void> => {
    await apiClient.put(apiPath(PM_BASE, `/playlists/${playlistId}/folder`), {
        folderId,
    });
};

// ══════════════════════════════════════════════════════════════
// Tags CRUD
// ══════════════════════════════════════════════════════════════

/** @internal */
export const fetchTags = async (): Promise<PlaylistTag[]> => {
    const { data } = await apiClient.get<PlaylistTag[]>(apiPath(PM_TAGS, ""));
    return data ?? [];
};

/** @internal */
export const postCreateTag = async (tag: Partial<PlaylistTag>): Promise<PlaylistTag> => {
    const { data } = await apiClient.post<PlaylistTag>(apiPath(PM_TAGS, ""), tag);
    return data;
};

/** @internal */
export const putUpdateTag = async (
    id: string,
    tag: Partial<PlaylistTag>,
): Promise<PlaylistTag> => {
    const { data } = await apiClient.put<PlaylistTag>(apiPath(PM_TAGS, `/${id}`), tag);
    return data;
};

/** @internal */
export const deleteTag = async (id: string): Promise<void> => {
    await apiClient.delete(apiPath(PM_TAGS, `/${id}`));
};

/** @internal */
export const postTagTracks = async (
    trackIds: string[],
    tagIds: string[],
): Promise<void> => {
    await apiClient.post(apiPath(PM_TAGS, "/assign"), { trackIds, tagIds });
};

/** @internal */
export const postUntagTracks = async (
    trackIds: string[],
    tagIds: string[],
): Promise<void> => {
    await apiClient.post(apiPath(PM_TAGS, "/unassign"), { trackIds, tagIds });
};

// ══════════════════════════════════════════════════════════════
// External services
// ══════════════════════════════════════════════════════════════

/** @internal */
export const fetchServiceConnections = async (): Promise<ServiceConnection[]> => {
    const { data } = await apiClient.get<ServiceConnection[]>(apiPath(PM_SERVICES, ""));
    return data ?? [];
};

/** @internal */
export const postConnectService = async (platform: MusicPlatform): Promise<{ authUrl: string }> => {
    const { data } = await apiClient.post<{ authUrl: string }>(
        apiPath(PM_SERVICES, "/connect"),
        { platform },
    );
    return data;
};

/** @internal */
export const postDisconnectService = async (platform: MusicPlatform): Promise<void> => {
    await apiClient.post(apiPath(PM_SERVICES, "/disconnect"), { platform });
};

/** @internal */
export const fetchExternalPlaylists = async (
    platform: MusicPlatform,
): Promise<ExternalPlaylist[]> => {
    const { data } = await apiClient.get<ExternalPlaylist[]>(
        apiPath(PM_SERVICES, `/playlists?platform=${platform}`),
    );
    return data ?? [];
};

/** @internal */
export const fetchExternalPlaylistTracks = async (
    platform: MusicPlatform,
    playlistId: string,
): Promise<ExternalPlaylistTrack[]> => {
    const { data } = await apiClient.get<ExternalPlaylistTrack[]>(
        apiPath(PM_SERVICES, `/playlists/${playlistId}/tracks?platform=${platform}`),
    );
    return data ?? [];
};

/** @internal */
export const postImportExternalPlaylist = async (
    platform: MusicPlatform,
    externalPlaylistId: string,
    targetFolderId?: string,
): Promise<ManagedPlaylist> => {
    const { data } = await apiClient.post<ManagedPlaylist>(
        apiPath(PM_SERVICES, "/import"),
        { platform, externalPlaylistId, targetFolderId },
    );
    return data;
};

/** @internal */
export const postExportToService = async (
    playlistId: string,
    platform: MusicPlatform,
): Promise<{ url: string }> => {
    const { data } = await apiClient.post<{ url: string }>(
        apiPath(PM_SERVICES, "/export"),
        { playlistId, platform },
    );
    return data;
};

// ══════════════════════════════════════════════════════════════
// Import / Export (JSON/file)
// ══════════════════════════════════════════════════════════════

/** @internal */
export const postImportPlaylistFile = async (
    file: File,
    options: PlaylistImportOptions,
): Promise<ManagedPlaylist[]> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("options", JSON.stringify(options));
    const { data } = await apiClient.post<ManagedPlaylist[]>(
        apiPath(PM_BASE, "/import"),
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data ?? [];
};

/** @internal */
export const fetchExportPlaylistFile = async (
    playlistIds: string[],
    includeFolders: boolean,
): Promise<PlaylistExportFormat> => {
    const { data } = await apiClient.post<PlaylistExportFormat>(
        apiPath(PM_BASE, "/export"),
        { playlistIds, includeFolders },
    );
    return data;
};

// ══════════════════════════════════════════════════════════════
// Search (unified across sources)
// ══════════════════════════════════════════════════════════════

export const searchTracks = async (
    q: string,
    source: string,
    limit = 30,
): Promise<PlaylistTrack[]> => {
    const { data } = await apiClient.get<PlaylistTrack[]>(
        apiPath(PM_BASE, "/search"),
        { params: { q, source, limit } },
    );
    return data ?? [];
};

// ══════════════════════════════════════════════════════════════
// React Query Hooks
// ══════════════════════════════════════════════════════════════

export const useManagedPlaylistsQuery = () =>
    useQuery({
        queryKey: PM_QK.playlists(),
        queryFn: fetchManagedPlaylists,
    });

export const useManagedPlaylistQuery = (id: string) =>
    useQuery({
        queryKey: PM_QK.playlist(id),
        queryFn: () => fetchManagedPlaylist(id),
        enabled: !!id,
    });

export const useCreateManagedPlaylistMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (req: Partial<ManagedPlaylist>) => postCreateManagedPlaylist(req),
        onSuccess: () => qc.invalidateQueries({ queryKey: PM_QK.playlists() }),
    });
};

export const useUpdateManagedPlaylistMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...rest }: Partial<ManagedPlaylist> & { id: string }) =>
            putUpdateManagedPlaylist(id, rest),
        onSuccess: (_d, vars) => {
            qc.invalidateQueries({ queryKey: PM_QK.playlists() });
            qc.invalidateQueries({ queryKey: PM_QK.playlist(vars.id) });
        },
    });
};

export const useDeleteManagedPlaylistMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteManagedPlaylist(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: PM_QK.playlists() }),
    });
};

export const useDuplicatePlaylistMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => postDuplicatePlaylist(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: PM_QK.playlists() }),
    });
};

export const useAddTracksMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ playlistId, tracks }: { playlistId: string; tracks: Partial<PlaylistTrack>[] }) =>
            postAddTracks(playlistId, tracks),
        onSuccess: (_d, vars) => {
            qc.invalidateQueries({ queryKey: PM_QK.playlist(vars.playlistId) });
            qc.invalidateQueries({ queryKey: PM_QK.playlists() });
        },
    });
};

export const useRemoveTracksMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ playlistId, trackIds }: { playlistId: string; trackIds: string[] }) =>
            deleteRemoveTracks(playlistId, trackIds),
        onSuccess: (_d, vars) => {
            qc.invalidateQueries({ queryKey: PM_QK.playlist(vars.playlistId) });
            qc.invalidateQueries({ queryKey: PM_QK.playlists() });
        },
    });
};

export const useReorderTracksMutation = () =>
    useMutation({
        mutationFn: ({ playlistId, trackIds }: { playlistId: string; trackIds: string[] }) =>
            putReorderTracks(playlistId, trackIds),
    });

export const useMoveTracksMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (args: { sourcePlaylistId: string; targetPlaylistId: string; trackIds: string[] }) =>
            postMoveTracks(args.sourcePlaylistId, args.targetPlaylistId, args.trackIds),
        onSuccess: () => qc.invalidateQueries({ queryKey: PM_QK.playlists() }),
    });
};

export const useCopyTracksMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (args: { sourcePlaylistId: string; targetPlaylistId: string; trackIds: string[] }) =>
            postCopyTracks(args.sourcePlaylistId, args.targetPlaylistId, args.trackIds),
        onSuccess: () => qc.invalidateQueries({ queryKey: PM_QK.playlists() }),
    });
};

export const useMergePlaylistsMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (args: { targetPlaylistId: string; sourcePlaylistIds: string[]; removeDuplicates: boolean }) =>
            postMergePlaylists(args.targetPlaylistId, args.sourcePlaylistIds, args.removeDuplicates),
        onSuccess: () => qc.invalidateQueries({ queryKey: PM_QK.playlists() }),
    });
};

// ── Folder hooks ──────────────────────────────────────────────

export const useFoldersQuery = () =>
    useQuery({ queryKey: PM_QK.folders(), queryFn: fetchFolders });

export const useCreateFolderMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (f: Partial<PlaylistFolder>) => postCreateFolder(f),
        onSuccess: () => qc.invalidateQueries({ queryKey: PM_QK.folders() }),
    });
};

export const useUpdateFolderMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...rest }: Partial<PlaylistFolder> & { id: string }) =>
            putUpdateFolder(id, rest),
        onSuccess: () => qc.invalidateQueries({ queryKey: PM_QK.folders() }),
    });
};

export const useDeleteFolderMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteFolder(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: PM_QK.folders() }),
    });
};

export const useMovePlaylistToFolderMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ playlistId, folderId }: { playlistId: string; folderId: string | null }) =>
            putMovePlaylistToFolder(playlistId, folderId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: PM_QK.playlists() });
            qc.invalidateQueries({ queryKey: PM_QK.folders() });
        },
    });
};

// ── Tag hooks ─────────────────────────────────────────────────

export const useTagsQuery = () =>
    useQuery({ queryKey: PM_QK.tags(), queryFn: fetchTags });

export const useCreateTagMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (t: Partial<PlaylistTag>) => postCreateTag(t),
        onSuccess: () => qc.invalidateQueries({ queryKey: PM_QK.tags() }),
    });
};

export const useUpdateTagMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...rest }: Partial<PlaylistTag> & { id: string }) =>
            putUpdateTag(id, rest),
        onSuccess: () => qc.invalidateQueries({ queryKey: PM_QK.tags() }),
    });
};

export const useDeleteTagMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteTag(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: PM_QK.tags() }),
    });
};

export const useTagTracksMutation = () =>
    useMutation({
        mutationFn: ({ trackIds, tagIds }: { trackIds: string[]; tagIds: string[] }) =>
            postTagTracks(trackIds, tagIds),
    });

export const useUntagTracksMutation = () =>
    useMutation({
        mutationFn: ({ trackIds, tagIds }: { trackIds: string[]; tagIds: string[] }) =>
            postUntagTracks(trackIds, tagIds),
    });

// ── Service hooks ─────────────────────────────────────────────

export const useServiceConnectionsQuery = () =>
    useQuery({ queryKey: PM_QK.services(), queryFn: fetchServiceConnections });

export const useConnectServiceMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (platform: MusicPlatform) => postConnectService(platform),
        onSuccess: () => qc.invalidateQueries({ queryKey: PM_QK.services() }),
    });
};

export const useDisconnectServiceMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (platform: MusicPlatform) => postDisconnectService(platform),
        onSuccess: () => qc.invalidateQueries({ queryKey: PM_QK.services() }),
    });
};

export const useExternalPlaylistsQuery = (platform: MusicPlatform, enabled = true) =>
    useQuery({
        queryKey: PM_QK.externalPlaylists(platform),
        queryFn: () => fetchExternalPlaylists(platform),
        enabled: enabled && platform !== MusicPlatform.None,
    });

export const useExternalPlaylistTracksQuery = (platform: MusicPlatform, playlistId: string) =>
    useQuery({
        queryKey: PM_QK.externalTracks(platform, playlistId),
        queryFn: () => fetchExternalPlaylistTracks(platform, playlistId),
        enabled: !!playlistId && platform !== MusicPlatform.None,
    });

export const useImportExternalPlaylistMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (args: { platform: MusicPlatform; externalPlaylistId: string; targetFolderId?: string }) =>
            postImportExternalPlaylist(args.platform, args.externalPlaylistId, args.targetFolderId),
        onSuccess: () => qc.invalidateQueries({ queryKey: PM_QK.playlists() }),
    });
};

export const useExportToServiceMutation = () =>
    useMutation({
        mutationFn: (args: { playlistId: string; platform: MusicPlatform }) =>
            postExportToService(args.playlistId, args.platform),
    });

// ── Import/Export hooks ───────────────────────────────────────

export const useImportPlaylistFileMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ file, options }: { file: File; options: PlaylistImportOptions }) =>
            postImportPlaylistFile(file, options),
        onSuccess: () => qc.invalidateQueries({ queryKey: PM_QK.playlists() }),
    });
};

export const useExportPlaylistFileMutation = () =>
    useMutation({
        mutationFn: ({ playlistIds, includeFolders }: { playlistIds: string[]; includeFolders: boolean }) =>
            fetchExportPlaylistFile(playlistIds, includeFolders),
    });

// ── Search hook ───────────────────────────────────────────────

export const useSearchTracksQuery = (q: string, source: string, limit = 30) =>
    useQuery({
        queryKey: PM_QK.searchTracks(q, source),
        queryFn: () => searchTracks(q, source, limit),
        enabled: !!q && q.length >= 2,
    });

// ══════════════════════════════════════════════════════════════
// Default export
// ══════════════════════════════════════════════════════════════

export default {
    fetchManagedPlaylists,
    fetchManagedPlaylist,
    postCreateManagedPlaylist,
    putUpdateManagedPlaylist,
    deleteManagedPlaylist,
    postDuplicatePlaylist,
    postAddTracks,
    deleteRemoveTracks,
    putReorderTracks,
    postMoveTracks,
    postCopyTracks,
    postMergePlaylists,
    fetchFolders,
    postCreateFolder,
    putUpdateFolder,
    deleteFolder,
    putMovePlaylistToFolder,
    fetchTags,
    postCreateTag,
    putUpdateTag,
    deleteTag,
    postTagTracks,
    postUntagTracks,
    fetchServiceConnections,
    postConnectService,
    postDisconnectService,
    fetchExternalPlaylists,
    fetchExternalPlaylistTracks,
    postImportExternalPlaylist,
    postExportToService,
    postImportPlaylistFile,
    fetchExportPlaylistFile,
    searchTracks,
};
