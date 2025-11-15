// apiPlaylists.ts
import { useMutation } from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import {
    CreateFromInfosRequest,
    CreatePlaylistOnPlatformRequest,
    CreatePlaylistResult,
    GetTidalStreamsResult,
    SongDescriptorDto,
} from "../../models/modelsPlaylists";
import { SongInformation } from "../../models/modelsAudio";

export const PLAYLISTS_BASE = "/api/playlist";

// ---- Low-level API ----
export const postCreatePlaylist = async (req: CreatePlaylistOnPlatformRequest): Promise<CreatePlaylistResult> => {
    const res = await apiClient.post<CreatePlaylistResult>(apiPath(PLAYLISTS_BASE, ""), req);
    return res.data;
};

export const postCreatePlaylistFromInfos = async (req: CreateFromInfosRequest): Promise<CreatePlaylistResult> => {
    const res = await apiClient.post<CreatePlaylistResult>(apiPath(PLAYLISTS_BASE, "/from-infos"), req);
    return res.data;
};

// body = SongDescriptorDto[]
export const postGetTidalStreams = async (songs: SongDescriptorDto[]): Promise<GetTidalStreamsResult> => {
    const res = await apiClient.post<GetTidalStreamsResult>(apiPath(PLAYLISTS_BASE, "/tidal/streams"), songs);
    return res.data;
};

// body = { songs: SongInformation[] }
export const postGetTidalStreamsFromInfos = async (songs: SongInformation[]): Promise<GetTidalStreamsResult> => {
    const res = await apiClient.post<GetTidalStreamsResult>(apiPath(PLAYLISTS_BASE, "/tidal/streams/from-infos"), {
        songs,
    });
    return res.data;
};

// ---- React Query hooks ----
export const useCreatePlaylistMutation = () => useMutation({
    mutationFn: (req: CreatePlaylistOnPlatformRequest) => postCreatePlaylist(req),
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
    CreatePlaylistOnPlatformRequest,
    CreatePlaylistResult,
    GetTidalStreamsResult,
    CreateFromInfosRequest,
} from "../../models/modelsPlaylists";
export type { SongInformation } from "../../models/modelsAudio";
