// apiEventLists.ts — Event Lists CRUD, items, bulk operations, favorites
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
    QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";

// === Base path ===
export const EVENT_LISTS_BASE = "/api/EventLists";

// === Models ===

export enum EventListType {
    Custom = 0,
    Favorites = 1,
    Watched = 2,
    ByLocation = 3,
    ByCategory = 4,
    Archive = 5,
}

export enum EventListVisibility {
    Private = 0,
    Shared = 1,
    Public = 2,
}

export interface EventList {
    id: number;
    name: string;
    description?: string;
    type: EventListType;
    visibility: EventListVisibility;
    ownerUserId?: number;
    organizationId?: number;
    leagueId?: number;
    iconKey?: string;
    color?: string;
    isPinned: boolean;
    sortOrder: number;
    shareToken?: string;
    items?: EventListItem[];
    itemCount?: number;
}

export interface EventListItem {
    id: number;
    eventId: number;
    note?: string;
    tags?: string;
    sortOrder: number;
    addedByUserId?: number;
    isObserved?: boolean;
}

export interface CreateEventListRequest {
    name: string;
    description?: string;
    type?: EventListType;
    visibility?: EventListVisibility;
    organizationId?: number;
    leagueId?: number;
    iconKey?: string;
    color?: string;
}

export interface AddEventToListRequest {
    eventId: number;
    note?: string;
    tags?: string;
}

export interface BulkEventIdsRequest {
    eventIds: number[];
}

export interface MoveOrCopyEventsRequest {
    sourceListId: number;
    targetListId: number;
    eventIds: number[];
}

export interface UpdateEventListItemRequest {
    note?: string;
    tags?: string;
    sortOrder?: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
}

// === Query Keys ===

export const EVENT_LISTS_QK = {
    my: ["event-lists", "my"] as const,
    byId: (id: number) => ["event-lists", id] as const,
    shared: (shareToken: string) => ["event-lists", "shared", shareToken] as const,
    organization: (orgId: number) => ["event-lists", "organization", orgId] as const,
    league: (leagueId: number) => ["event-lists", "league", leagueId] as const,
    public: (page: number, pageSize: number) => ["event-lists", "public", page, pageSize] as const,
    eventExists: (listId: number, eventId: number) =>
        ["event-lists", listId, "events", eventId, "exists"] as const,
};

// === Fetch functions ===

/** @internal GET /api/EventLists/my — My lists */
export const fetchMyEventLists = async (): Promise<EventList[]> => {
    const { data } = await apiClient.get<EventList[]>(apiPath(EVENT_LISTS_BASE, "/my"));
    return data ?? [];
};

/** @internal GET /api/EventLists/{id} — List by ID with items */
export const fetchEventListById = async (id: number): Promise<EventList> => {
    const { data } = await apiClient.get<EventList>(apiPath(EVENT_LISTS_BASE, `/${id}`));
    return data;
};

/** @internal GET /api/EventLists/shared/{shareToken} — Shared list */
export const fetchSharedEventList = async (shareToken: string): Promise<EventList> => {
    const { data } = await apiClient.get<EventList>(
        apiPath(EVENT_LISTS_BASE, `/shared/${encodeURIComponent(shareToken)}`),
    );
    return data;
};

/** @internal GET /api/EventLists/organization/{orgId} — Org lists */
export const fetchOrganizationEventLists = async (orgId: number): Promise<EventList[]> => {
    const { data } = await apiClient.get<EventList[]>(apiPath(EVENT_LISTS_BASE, `/organization/${orgId}`));
    return data ?? [];
};

/** @internal GET /api/EventLists/league/{leagueId} — League lists */
export const fetchLeagueEventLists = async (leagueId: number): Promise<EventList[]> => {
    const { data } = await apiClient.get<EventList[]>(apiPath(EVENT_LISTS_BASE, `/league/${leagueId}`));
    return data ?? [];
};

/** @internal GET /api/EventLists/public?page=1&pageSize=20 — Public lists */
export const fetchPublicEventLists = async (
    page = 1,
    pageSize = 20,
): Promise<PaginatedResponse<EventList>> => {
    const { data } = await apiClient.get<PaginatedResponse<EventList>>(
        apiPath(EVENT_LISTS_BASE, "/public"),
        { params: { page, pageSize } },
    );
    return data;
};

/** @internal POST /api/EventLists — Create list */
export const postCreateEventList = async (req: CreateEventListRequest): Promise<EventList> => {
    const { data } = await apiClient.post<EventList>(apiPath(EVENT_LISTS_BASE, ""), req);
    return data;
};

/** @internal PUT /api/EventLists/{id} — Update list */
export const putUpdateEventList = async (
    id: number,
    req: Partial<CreateEventListRequest>,
): Promise<void> => {
    await apiClient.put(apiPath(EVENT_LISTS_BASE, `/${id}`), req);
};

/** @internal DELETE /api/EventLists/{id} — Delete list */
export const deleteEventList = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(EVENT_LISTS_BASE, `/${id}`));
};

/** @internal POST /api/EventLists/{listId}/events — Add event to list */
export const postAddEventToList = async (
    listId: number,
    req: AddEventToListRequest,
): Promise<EventListItem> => {
    const { data } = await apiClient.post<EventListItem>(
        apiPath(EVENT_LISTS_BASE, `/${listId}/events`),
        req,
    );
    return data;
};

/** @internal DELETE /api/EventLists/items/{itemId} — Remove item */
export const deleteEventListItem = async (itemId: number): Promise<void> => {
    await apiClient.delete(apiPath(EVENT_LISTS_BASE, `/items/${itemId}`));
};

/** @internal PUT /api/EventLists/items/{itemId} — Update item */
export const putUpdateEventListItem = async (
    itemId: number,
    req: UpdateEventListItemRequest,
): Promise<void> => {
    await apiClient.put(apiPath(EVENT_LISTS_BASE, `/items/${itemId}`), req);
};

/** @internal GET /api/EventLists/{listId}/events/{eventId}/exists — Check if event in list */
export const fetchEventExistsInList = async (
    listId: number,
    eventId: number,
): Promise<boolean> => {
    const { data } = await apiClient.get<boolean>(
        apiPath(EVENT_LISTS_BASE, `/${listId}/events/${eventId}/exists`),
    );
    return data;
};

/** @internal POST /api/EventLists/{listId}/events/bulk — Bulk add events */
export const postBulkAddEvents = async (
    listId: number,
    req: BulkEventIdsRequest,
): Promise<void> => {
    await apiClient.post(apiPath(EVENT_LISTS_BASE, `/${listId}/events/bulk`), req);
};

/** @internal DELETE /api/EventLists/{listId}/events/bulk — Bulk remove events */
export const deleteBulkRemoveEvents = async (
    listId: number,
    req: BulkEventIdsRequest,
): Promise<void> => {
    await apiClient.delete(apiPath(EVENT_LISTS_BASE, `/${listId}/events/bulk`), { data: req });
};

/** @internal POST /api/EventLists/move — Move events between lists */
export const postMoveEvents = async (req: MoveOrCopyEventsRequest): Promise<void> => {
    await apiClient.post(apiPath(EVENT_LISTS_BASE, "/move"), req);
};

/** @internal POST /api/EventLists/copy — Copy events between lists */
export const postCopyEvents = async (req: MoveOrCopyEventsRequest): Promise<void> => {
    await apiClient.post(apiPath(EVENT_LISTS_BASE, "/copy"), req);
};

/** @internal PUT /api/EventLists/{listId}/reorder — Reorder items */
export const putReorderEventListItems = async (
    listId: number,
    orderedItemIds: number[],
): Promise<void> => {
    await apiClient.put(apiPath(EVENT_LISTS_BASE, `/${listId}/reorder`), orderedItemIds);
};

/** @internal POST /api/EventLists/favorites/toggle/{eventId} — Toggle favorite */
export const postToggleFavorite = async (eventId: number): Promise<void> => {
    await apiClient.post(apiPath(EVENT_LISTS_BASE, `/favorites/toggle/${eventId}`));
};

// === React Query hooks ===

/** GET /api/EventLists/my — My lists */
export const useMyEventListsQuery = (
    options?: Partial<UseQueryOptions<EventList[], unknown, EventList[], QueryKey>>,
) =>
    useQuery({
        queryKey: EVENT_LISTS_QK.my,
        queryFn: fetchMyEventLists,
        ...options,
    });

/** GET /api/EventLists/{id} — List by ID with items */
export const useEventListByIdQuery = (
    id: number,
    options?: Partial<UseQueryOptions<EventList, unknown, EventList, QueryKey>>,
) =>
    useQuery({
        queryKey: EVENT_LISTS_QK.byId(id),
        queryFn: () => fetchEventListById(id),
        enabled: Number.isFinite(id),
        ...options,
    });

/** GET /api/EventLists/shared/{shareToken} — Shared list */
export const useSharedEventListQuery = (
    shareToken: string,
    options?: Partial<UseQueryOptions<EventList, unknown, EventList, QueryKey>>,
) =>
    useQuery({
        queryKey: EVENT_LISTS_QK.shared(shareToken),
        queryFn: () => fetchSharedEventList(shareToken),
        enabled: !!shareToken,
        ...options,
    });

/** GET /api/EventLists/organization/{orgId} — Org lists */
export const useOrganizationEventListsQuery = (
    orgId: number,
    options?: Partial<UseQueryOptions<EventList[], unknown, EventList[], QueryKey>>,
) =>
    useQuery({
        queryKey: EVENT_LISTS_QK.organization(orgId),
        queryFn: () => fetchOrganizationEventLists(orgId),
        enabled: Number.isFinite(orgId),
        ...options,
    });

/** GET /api/EventLists/league/{leagueId} — League lists */
export const useLeagueEventListsQuery = (
    leagueId: number,
    options?: Partial<UseQueryOptions<EventList[], unknown, EventList[], QueryKey>>,
) =>
    useQuery({
        queryKey: EVENT_LISTS_QK.league(leagueId),
        queryFn: () => fetchLeagueEventLists(leagueId),
        enabled: Number.isFinite(leagueId),
        ...options,
    });

/** GET /api/EventLists/public — Public lists (paginated) */
export const usePublicEventListsQuery = (
    page = 1,
    pageSize = 20,
    options?: Partial<UseQueryOptions<PaginatedResponse<EventList>, unknown, PaginatedResponse<EventList>, QueryKey>>,
) =>
    useQuery({
        queryKey: EVENT_LISTS_QK.public(page, pageSize),
        queryFn: () => fetchPublicEventLists(page, pageSize),
        ...options,
    });

/** POST /api/EventLists — Create list */
export const useCreateEventListMutation = () => {
    const qc = useQueryClient();
    return useMutation<EventList, unknown, CreateEventListRequest>({
        mutationFn: (req) => postCreateEventList(req),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: EVENT_LISTS_QK.my });
        },
    });
};

/** PUT /api/EventLists/{id} — Update list */
export const useUpdateEventListMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { id: number; req: Partial<CreateEventListRequest> }>({
        mutationFn: ({ id, req }) => putUpdateEventList(id, req),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENT_LISTS_QK.byId(vars.id) });
            qc.invalidateQueries({ queryKey: EVENT_LISTS_QK.my });
        },
    });
};

/** DELETE /api/EventLists/{id} — Delete list */
export const useDeleteEventListMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (id) => deleteEventList(id),
        onSuccess: (_data, id) => {
            qc.removeQueries({ queryKey: EVENT_LISTS_QK.byId(id) });
            qc.invalidateQueries({ queryKey: EVENT_LISTS_QK.my });
        },
    });
};

/** POST /api/EventLists/{listId}/events — Add event to list */
export const useAddEventToListMutation = () => {
    const qc = useQueryClient();
    return useMutation<EventListItem, unknown, { listId: number; req: AddEventToListRequest }>({
        mutationFn: ({ listId, req }) => postAddEventToList(listId, req),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENT_LISTS_QK.byId(vars.listId) });
        },
    });
};

/** DELETE /api/EventLists/items/{itemId} — Remove item */
export const useRemoveEventListItemMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { itemId: number; listId?: number }>({
        mutationFn: ({ itemId }) => deleteEventListItem(itemId),
        onSuccess: (_data, vars) => {
            if (vars.listId != null) {
                qc.invalidateQueries({ queryKey: EVENT_LISTS_QK.byId(vars.listId) });
            }
            qc.invalidateQueries({ queryKey: EVENT_LISTS_QK.my });
        },
    });
};

/** PUT /api/EventLists/items/{itemId} — Update item */
export const useUpdateEventListItemMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { itemId: number; req: UpdateEventListItemRequest; listId?: number }>({
        mutationFn: ({ itemId, req }) => putUpdateEventListItem(itemId, req),
        onSuccess: (_data, vars) => {
            if (vars.listId != null) {
                qc.invalidateQueries({ queryKey: EVENT_LISTS_QK.byId(vars.listId) });
            }
        },
    });
};

/** GET /api/EventLists/{listId}/events/{eventId}/exists — Check if event in list */
export const useEventExistsInListQuery = (
    listId: number,
    eventId: number,
    options?: Partial<UseQueryOptions<boolean, unknown, boolean, QueryKey>>,
) =>
    useQuery({
        queryKey: EVENT_LISTS_QK.eventExists(listId, eventId),
        queryFn: () => fetchEventExistsInList(listId, eventId),
        enabled: Number.isFinite(listId) && Number.isFinite(eventId),
        ...options,
    });

/** POST /api/EventLists/{listId}/events/bulk — Bulk add events */
export const useBulkAddEventsMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { listId: number; req: BulkEventIdsRequest }>({
        mutationFn: ({ listId, req }) => postBulkAddEvents(listId, req),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENT_LISTS_QK.byId(vars.listId) });
        },
    });
};

/** DELETE /api/EventLists/{listId}/events/bulk — Bulk remove events */
export const useBulkRemoveEventsMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { listId: number; req: BulkEventIdsRequest }>({
        mutationFn: ({ listId, req }) => deleteBulkRemoveEvents(listId, req),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENT_LISTS_QK.byId(vars.listId) });
        },
    });
};

/** POST /api/EventLists/move — Move events between lists */
export const useMoveEventsMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, MoveOrCopyEventsRequest>({
        mutationFn: (req) => postMoveEvents(req),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENT_LISTS_QK.byId(vars.sourceListId) });
            qc.invalidateQueries({ queryKey: EVENT_LISTS_QK.byId(vars.targetListId) });
            qc.invalidateQueries({ queryKey: EVENT_LISTS_QK.my });
        },
    });
};

/** POST /api/EventLists/copy — Copy events between lists */
export const useCopyEventsMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, MoveOrCopyEventsRequest>({
        mutationFn: (req) => postCopyEvents(req),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENT_LISTS_QK.byId(vars.targetListId) });
        },
    });
};

/** PUT /api/EventLists/{listId}/reorder — Reorder items */
export const useReorderEventListItemsMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { listId: number; orderedItemIds: number[] }>({
        mutationFn: ({ listId, orderedItemIds }) => putReorderEventListItems(listId, orderedItemIds),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENT_LISTS_QK.byId(vars.listId) });
        },
    });
};

/** POST /api/EventLists/favorites/toggle/{eventId} — Toggle favorite */
export const useToggleFavoriteMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (eventId) => postToggleFavorite(eventId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: EVENT_LISTS_QK.my });
        },
    });
};
