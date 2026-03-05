// apiPlaylists.ts
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import {
    CreateFromInfosRequest,
    CreatePlaylistResult,
    GetTidalStreamsResult,
    PlaylistDto,
    SongDescriptorDto,
} from "../../models/modelsPlaylists";
import { SongInformation } from "../../models/modelsAudio";

export const PLAYLISTS_BASE = "/api/library/playlists";

export interface CreatePlaylistRequest {
    platform?: string | number | null;
    name?: string | null;
    description?: string | null;
    trackIds?: string[] | null;
}

// ---- Low-level API ----
/** @internal */
export const postCreatePlaylist = async (req: CreatePlaylistRequest): Promise<CreatePlaylistResult> => {
    const res = await apiClient.post<CreatePlaylistResult>(apiPath(PLAYLISTS_BASE, ""), req);
    return res.data;
};

/** @internal */
export const postCreatePlaylistFromInfos = async (req: CreateFromInfosRequest): Promise<CreatePlaylistResult> => {
    const res = await apiClient.post<CreatePlaylistResult>(apiPath(PLAYLISTS_BASE, "/from-infos"), req);
    return res.data;
};

// body = SongDescriptorDto[]
/** @internal */
export const postGetTidalStreams = async (songs: SongDescriptorDto[]): Promise<GetTidalStreamsResult> => {
    const res = await apiClient.post<GetTidalStreamsResult>(apiPath(PLAYLISTS_BASE, "/tidal/streams"), songs);
    return res.data;
};

// body = { songs: SongInformation[] }
/** @internal */
export const postGetTidalStreamsFromInfos = async (songs: SongInformation[]): Promise<GetTidalStreamsResult> => {
    const res = await apiClient.post<GetTidalStreamsResult>(apiPath(PLAYLISTS_BASE, "/tidal/streams/from-infos"), {
        songs,
    });
    return res.data;
};

// ---- Read endpoints (list / get) ----
export const getAllPlaylists = async (): Promise<PlaylistDto[]> => {
    const res = await apiClient.get<PlaylistDto[]>(apiPath(PLAYLISTS_BASE, ""));
    return res.data;
};

export const getPlaylistById = async (id: number): Promise<PlaylistDto> => {
    const res = await apiClient.get<PlaylistDto>(apiPath(PLAYLISTS_BASE, `/${id}`));
    return res.data;
};

export const usePlaylistsQuery = () => {
    return useQuery({ queryKey: ["playlists"], queryFn: getAllPlaylists });
};

// ---- React Query hooks ----
export const useCreatePlaylistMutation = () => useMutation({
    mutationFn: (req: CreatePlaylistRequest) => postCreatePlaylist(req),
});

export const useCreatePlaylistFromInfosMutation = () => useMutation({
    mutationFn: (req: CreateFromInfosRequest) => postCreatePlaylistFromInfos(req),
});

export const useGetTidalStreamsMutation = () => useMutation({
    mutationFn: (songs: SongDescriptorDto[]) => postGetTidalStreams(songs),
});

export const useGetTidalStreamsFromInfosMutation = () => useMutation({
    mutationFn: (songs: SongInformation[]) => postGetTidalStreamsFromInfos(songs),
});

// Re-exports (opcjonalnie – wygoda przy importach)
export { MusicPlatform } from "../../models/modelsMusicPlatform";
export type {
    SongDescriptorDto,
    CreatePlaylistResult,
    GetTidalStreamsResult,
    CreateFromInfosRequest,
    CreatePlaylistOnPlatformRequest,
    PlaylistDto,
    PlaylistItemDto,
    PlaylistLinkDto,
} from "../../models/modelsPlaylists";
export { PlaylistAccess, RequestMechanism } from "../../models/modelsPlaylists";
// CreatePlaylistRequest is declared/exported above; no re-export wrapper needed.
export type { SongInformation } from "../../models/modelsAudio";
