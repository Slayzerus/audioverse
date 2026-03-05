// apiGameCollections.ts — Board game & Video game collections (user libraries)
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
    QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type {
    BoardGameCollection,
    BoardGameCollectionItem,
    VideoGameCollection,
    VideoGameCollectionItem,
} from "../../models/modelsKaraoke";

// === Base paths ===
const BG_COLLECTIONS_BASE = "/api/games/board/collections";
const VG_COLLECTIONS_BASE = "/api/games/video/collections";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const GAME_COLLECTIONS_QK = {
    boardList: ["board-game-collections"] as const,
    boardSingle: (id: number) => ["board-game-collections", id] as const,
    boardByOwner: (ownerId: number) => ["board-game-collections", "owner", ownerId] as const,
    videoList: ["video-game-collections"] as const,
    videoSingle: (id: number) => ["video-game-collections", id] as const,
    videoByOwner: (ownerId: number) => ["video-game-collections", "owner", ownerId] as const,
};

// === DTOs ===
export interface CreateCollectionDto {
    name: string;
    description?: string;
    isPublic?: boolean;
}

export interface UpdateCollectionDto extends Partial<CreateCollectionDto> {
    id: number;
}

export interface AddCollectionItemDto {
    collectionId: number;
    gameId: number;
    notes?: string;
}

// ===================== BOARD GAME COLLECTIONS =====================

/** @internal */
export const fetchBoardGameCollections = async (): Promise<BoardGameCollection[]> => {
    const { data } = await apiClient.get<BoardGameCollection[]>(
        apiPath(BG_COLLECTIONS_BASE, ""),
    );
    return data ?? [];
};

/** @internal */
export const fetchBoardGameCollection = async (id: number): Promise<BoardGameCollection> => {
    const { data } = await apiClient.get<BoardGameCollection>(
        apiPath(BG_COLLECTIONS_BASE, `/${id}`),
    );
    return data;
};

/** @internal */
export const postCreateBoardGameCollection = async (
    dto: CreateCollectionDto,
): Promise<BoardGameCollection> => {
    const { data } = await apiClient.post<BoardGameCollection>(
        apiPath(BG_COLLECTIONS_BASE, ""),
        dto,
    );
    return data;
};

/** @internal */
export const putUpdateBoardGameCollection = async (
    dto: UpdateCollectionDto,
): Promise<BoardGameCollection> => {
    const { data } = await apiClient.put<BoardGameCollection>(
        apiPath(BG_COLLECTIONS_BASE, `/${dto.id}`),
        dto,
    );
    return data;
};

/** @internal */
export const deleteBoardGameCollection = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(BG_COLLECTIONS_BASE, `/${id}`));
};

/** @internal POST /api/games/board/collections/{collectionId}/items — Add game to collection */
export const postAddBoardGameToCollection = async (
    dto: AddCollectionItemDto,
): Promise<BoardGameCollectionItem> => {
    const { data } = await apiClient.post<BoardGameCollectionItem>(
        apiPath(BG_COLLECTIONS_BASE, `/${dto.collectionId}/items`),
        { gameId: dto.gameId, notes: dto.notes },
    );
    return data;
};

/** @internal DELETE /api/games/board/collections/{collectionId}/items/{itemId} */
export const deleteRemoveBoardGameFromCollection = async (
    collectionId: number,
    itemId: number,
): Promise<void> => {
    await apiClient.delete(
        apiPath(BG_COLLECTIONS_BASE, `/${collectionId}/items/${itemId}`),
    );
};

/** @internal GET /api/games/board/collections/owner/{ownerId} — Collections by owner */
export const fetchBoardGameCollectionsByOwner = async (
    ownerId: number,
): Promise<BoardGameCollection[]> => {
    const { data } = await apiClient.get<BoardGameCollection[]>(
        apiPath(BG_COLLECTIONS_BASE, `/owner/${ownerId}`),
    );
    return data ?? [];
};

// ===================== VIDEO GAME COLLECTIONS =====================

/** @internal */
export const fetchVideoGameCollections = async (): Promise<VideoGameCollection[]> => {
    const { data } = await apiClient.get<VideoGameCollection[]>(
        apiPath(VG_COLLECTIONS_BASE, ""),
    );
    return data ?? [];
};

/** @internal */
export const fetchVideoGameCollection = async (id: number): Promise<VideoGameCollection> => {
    const { data } = await apiClient.get<VideoGameCollection>(
        apiPath(VG_COLLECTIONS_BASE, `/${id}`),
    );
    return data;
};

/** @internal */
export const postCreateVideoGameCollection = async (
    dto: CreateCollectionDto,
): Promise<VideoGameCollection> => {
    const { data } = await apiClient.post<VideoGameCollection>(
        apiPath(VG_COLLECTIONS_BASE, ""),
        dto,
    );
    return data;
};

/** @internal */
export const putUpdateVideoGameCollection = async (
    dto: UpdateCollectionDto,
): Promise<VideoGameCollection> => {
    const { data } = await apiClient.put<VideoGameCollection>(
        apiPath(VG_COLLECTIONS_BASE, `/${dto.id}`),
        dto,
    );
    return data;
};

/** @internal */
export const deleteVideoGameCollection = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(VG_COLLECTIONS_BASE, `/${id}`));
};

/** @internal POST /api/games/video/collections/{collectionId}/items — Add game to collection */
export const postAddVideoGameToCollection = async (
    dto: AddCollectionItemDto,
): Promise<VideoGameCollectionItem> => {
    const { data } = await apiClient.post<VideoGameCollectionItem>(
        apiPath(VG_COLLECTIONS_BASE, `/${dto.collectionId}/items`),
        { gameId: dto.gameId, notes: dto.notes },
    );
    return data;
};

/** @internal DELETE /api/games/video/collections/{collectionId}/items/{itemId} */
export const deleteRemoveVideoGameFromCollection = async (
    collectionId: number,
    itemId: number,
): Promise<void> => {
    await apiClient.delete(
        apiPath(VG_COLLECTIONS_BASE, `/${collectionId}/items/${itemId}`),
    );
};

/** @internal GET /api/games/video/collections/owner/{ownerId} — Collections by owner */
export const fetchVideoGameCollectionsByOwner = async (
    ownerId: number,
): Promise<VideoGameCollection[]> => {
    const { data } = await apiClient.get<VideoGameCollection[]>(
        apiPath(VG_COLLECTIONS_BASE, `/owner/${ownerId}`),
    );
    return data ?? [];
};

// ===================== REACT QUERY HOOKS =====================

// Board Games
export const useBoardGameCollectionsQuery = (
    options?: Partial<UseQueryOptions<BoardGameCollection[], unknown, BoardGameCollection[], QueryKey>>,
) =>
    useQuery({
        queryKey: GAME_COLLECTIONS_QK.boardList,
        queryFn: fetchBoardGameCollections,
        ...options,
    });

export const useBoardGameCollectionQuery = (
    id: number,
    options?: Partial<UseQueryOptions<BoardGameCollection, unknown, BoardGameCollection, QueryKey>>,
) =>
    useQuery({
        queryKey: GAME_COLLECTIONS_QK.boardSingle(id),
        queryFn: () => fetchBoardGameCollection(id),
        enabled: id > 0,
        ...options,
    });

export const useCreateBoardGameCollectionMutation = () => {
    const qc = useQueryClient();
    return useMutation<BoardGameCollection, unknown, CreateCollectionDto>({
        mutationFn: (dto) => postCreateBoardGameCollection(dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: GAME_COLLECTIONS_QK.boardList });
        },
    });
};

export const useUpdateBoardGameCollectionMutation = () => {
    const qc = useQueryClient();
    return useMutation<BoardGameCollection, unknown, UpdateCollectionDto>({
        mutationFn: (dto) => putUpdateBoardGameCollection(dto),
        onSuccess: (_, dto) => {
            qc.invalidateQueries({ queryKey: GAME_COLLECTIONS_QK.boardList });
            qc.invalidateQueries({ queryKey: GAME_COLLECTIONS_QK.boardSingle(dto.id) });
        },
    });
};

export const useDeleteBoardGameCollectionMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (id) => deleteBoardGameCollection(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: GAME_COLLECTIONS_QK.boardList });
        },
    });
};

export const useAddBoardGameToCollectionMutation = () => {
    const qc = useQueryClient();
    return useMutation<BoardGameCollectionItem, unknown, AddCollectionItemDto>({
        mutationFn: (dto) => postAddBoardGameToCollection(dto),
        onSuccess: (_, dto) => {
            qc.invalidateQueries({
                queryKey: GAME_COLLECTIONS_QK.boardSingle(dto.collectionId),
            });
        },
    });
};

export const useRemoveBoardGameFromCollectionMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { collectionId: number; itemId: number }>({
        mutationFn: ({ collectionId, itemId }) =>
            deleteRemoveBoardGameFromCollection(collectionId, itemId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: GAME_COLLECTIONS_QK.boardList });
        },
    });
};

export const useBoardGameCollectionsByOwnerQuery = (
    ownerId: number,
    options?: Partial<UseQueryOptions<BoardGameCollection[], unknown, BoardGameCollection[], QueryKey>>,
) =>
    useQuery({
        queryKey: GAME_COLLECTIONS_QK.boardByOwner(ownerId),
        queryFn: () => fetchBoardGameCollectionsByOwner(ownerId),
        enabled: ownerId > 0,
        ...options,
    });

// Video Games
export const useVideoGameCollectionsQuery = (
    options?: Partial<UseQueryOptions<VideoGameCollection[], unknown, VideoGameCollection[], QueryKey>>,
) =>
    useQuery({
        queryKey: GAME_COLLECTIONS_QK.videoList,
        queryFn: fetchVideoGameCollections,
        ...options,
    });

export const useVideoGameCollectionQuery = (
    id: number,
    options?: Partial<UseQueryOptions<VideoGameCollection, unknown, VideoGameCollection, QueryKey>>,
) =>
    useQuery({
        queryKey: GAME_COLLECTIONS_QK.videoSingle(id),
        queryFn: () => fetchVideoGameCollection(id),
        enabled: id > 0,
        ...options,
    });

export const useCreateVideoGameCollectionMutation = () => {
    const qc = useQueryClient();
    return useMutation<VideoGameCollection, unknown, CreateCollectionDto>({
        mutationFn: (dto) => postCreateVideoGameCollection(dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: GAME_COLLECTIONS_QK.videoList });
        },
    });
};

export const useUpdateVideoGameCollectionMutation = () => {
    const qc = useQueryClient();
    return useMutation<VideoGameCollection, unknown, UpdateCollectionDto>({
        mutationFn: (dto) => putUpdateVideoGameCollection(dto),
        onSuccess: (_, dto) => {
            qc.invalidateQueries({ queryKey: GAME_COLLECTIONS_QK.videoList });
            qc.invalidateQueries({ queryKey: GAME_COLLECTIONS_QK.videoSingle(dto.id) });
        },
    });
};

export const useDeleteVideoGameCollectionMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (id) => deleteVideoGameCollection(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: GAME_COLLECTIONS_QK.videoList });
        },
    });
};

export const useAddVideoGameToCollectionMutation = () => {
    const qc = useQueryClient();
    return useMutation<VideoGameCollectionItem, unknown, AddCollectionItemDto>({
        mutationFn: (dto) => postAddVideoGameToCollection(dto),
        onSuccess: (_, dto) => {
            qc.invalidateQueries({
                queryKey: GAME_COLLECTIONS_QK.videoSingle(dto.collectionId),
            });
        },
    });
};

export const useRemoveVideoGameFromCollectionMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { collectionId: number; itemId: number }>({
        mutationFn: ({ collectionId, itemId }) =>
            deleteRemoveVideoGameFromCollection(collectionId, itemId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: GAME_COLLECTIONS_QK.videoList });
        },
    });
};

export const useVideoGameCollectionsByOwnerQuery = (
    ownerId: number,
    options?: Partial<UseQueryOptions<VideoGameCollection[], unknown, VideoGameCollection[], QueryKey>>,
) =>
    useQuery({
        queryKey: GAME_COLLECTIONS_QK.videoByOwner(ownerId),
        queryFn: () => fetchVideoGameCollectionsByOwner(ownerId),
        enabled: ownerId > 0,
        ...options,
    });

export default {
    fetchBoardGameCollections,
    fetchBoardGameCollection,
    postCreateBoardGameCollection,
    putUpdateBoardGameCollection,
    deleteBoardGameCollection,
    postAddBoardGameToCollection,
    deleteRemoveBoardGameFromCollection,
    fetchVideoGameCollections,
    fetchVideoGameCollection,
    postCreateVideoGameCollection,
    putUpdateVideoGameCollection,
    deleteVideoGameCollection,
    postAddVideoGameToCollection,
    deleteRemoveVideoGameFromCollection,
    fetchBoardGameCollectionsByOwner,
    fetchVideoGameCollectionsByOwner,
};
