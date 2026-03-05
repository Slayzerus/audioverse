import React from "react";
import { useTranslation } from 'react-i18next';
import { useParams } from "react-router-dom";
import { usePartyQuery, usePartyStatusQuery, putUpdateParty } from "../../scripts/api/apiKaraoke";
import { useAddParticipantMutation, useDeleteParticipantMutation, useEventParticipantsQuery, useRsvpMutation, useArriveMutation, useCancelParticipationMutation } from "../../scripts/api/apiEvents";
import { useConfirm } from '../../components/ui/ConfirmProvider';
import { useUser } from "../../contexts/UserContext";
import { PartyStatus } from "../../models/modelsKaraoke";
import { EventLocationType, EventAccessType } from "../../models/karaoke/modelsEvent";
import type { KaraokePartyStatus, KaraokePlayer, EventParticipant, CreatePartyRequest } from "../../models/modelsKaraoke";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useSongsQuery, useAddRoundMutation, useAddSessionMutation, useAddRoundPartMutation, fetchPartyInvites, postSendPartyInvite, postRespondInvite, postCancelInvite } from "../../scripts/api/apiKaraoke";
import { useRTC } from "../../contexts/RTCContext";
import { getAccessToken } from "../../scripts/api/apiUser";
import type { PartyTab } from "../../components/controls/party/PartyNavbar";
import { useToast } from '../../components/ui/ToastProvider';
import { useAddAttractionMutation } from "../../scripts/api/apiPartyAttractions";
import type { AttractionType } from "../../models/modelsKaraoke";
import { dkLog } from '../../constants/debugKaraoke';

/** Fields passed to the update-party mutation from various UI controls. */
export interface UpdatePartyFields {
    status?: string;
    start?: string | null;
    end?: string | null;
    type?: string | EventLocationType;
    access?: string | EventAccessType;
    code?: string;
}

/** Body for sending a party invite. */
export interface InviteBody {
    ToUserId?: number;
    ToEmail?: string;
}

/** SignalR lobby member payload. */
export interface LobbyMember {
    ConnectionId?: string;
    Username?: string;
}

/** SignalR player event payload (PlayerAssigned, PlayerMovedIn, PlayerMovedOut). */
interface SignalRPlayerPayload {
    player?: { id: number; name?: string };
    /** @deprecated backend will send userId */
    playerId?: number;
    userId?: number;
    toChannel?: string;
    fromChannel?: string;
    channel?: string;
}

/** SignalR permissions event payload. */
interface SignalRPermissionsPayload {
    /** @deprecated backend will send UserId */
    PlayerId?: number;
    /** @deprecated backend will send userId */
    playerId?: number;
    UserId?: number;
    userId?: number;
}

const partsPageSize = 6;

export function usePartyPage() {
    const { t } = useTranslation();
    // route params
    const params = useParams();
    const id = Number(params.id ?? params.partyId ?? NaN);
    const partyId = (params.id ?? params.partyId) as string | undefined;

    const { data: party, isLoading: partyLoading } = usePartyQuery(id);
    const { data: status } = usePartyStatusQuery(id);
    const { currentUser, userId, username, playerIds } = useUser();

    React.useEffect(() => {
        dkLog('INIT', `Strona imprezy załadowana — partyId=${id}, zalogowany: ${username} (userId=${userId})`, { playerIds });
    }, [id, userId, username]);

    const queryClient = useQueryClient();
    const rtc = useRTC();
    const addParticipantMutation = useAddParticipantMutation();
    const deleteParticipantMutation = useDeleteParticipantMutation();
    const rsvpMutation = useRsvpMutation();
    const arriveMutation = useArriveMutation();
    const cancelParticipationMutation = useCancelParticipationMutation();
    const { showToast } = useToast();
    const confirm = useConfirm();

    // Songs + add-round mutation
    const { data: songs, isLoading: songsLoading } = useSongsQuery();
    const addRoundMutation = useAddRoundMutation();
    const addSessionMutation = useAddSessionMutation();
    const addRoundPartMutation = useAddRoundPartMutation();
    const [showPartsModal, setShowPartsModal] = React.useState(false);
    const [partsModalRoundId] = React.useState<number | null>(null);
    const [showPlayersModal, setShowPlayersModal] = React.useState(false);
    const [playersModalRoundId] = React.useState<number | null>(null);
    const [newPartNumber, setNewPartNumber] = React.useState<number>(1);
    const [newPartPlayerId, setNewPartPlayerId] = React.useState<number | null>(null);
    const [partsPage, setPartsPage] = React.useState(1);
    const [partsSortBy, setPartsSortBy] = React.useState<'partNumber' | 'player'>('partNumber');
    const [partsSortDir, setPartsSortDir] = React.useState<'asc' | 'desc'>('asc');
    const [showAttractionPicker, setShowAttractionPicker] = React.useState(false);
    const addAttractionMutation = useAddAttractionMutation(id);
    const [editingPartKey, setEditingPartKey] = React.useState<string | null>(null);
    const [editingPlayerId, setEditingPlayerId] = React.useState<number | null>(null);
    const [showAddRound, setShowAddRound] = React.useState(false);
    const [songIndex, setSongIndex] = React.useState(0);
    const [sessionName, setSessionName] = React.useState<string>('');
    const [selectedSessionId, setSelectedSessionId] = React.useState<number | null>(null);

    // Lobby mode: 'participants' = lobby for party players, 'spectators' = non-player lobby
    const [lobbyMode, setLobbyMode] = React.useState<'participants' | 'spectators'>('spectators');
    const [lobbyMembers, setLobbyMembers] = React.useState<LobbyMember[]>([]);
    const [activeTab, setActiveTab] = React.useState<PartyTab>('participants');
    const [chatUnread, setChatUnread] = React.useState(0);
    const [chatTotal, setChatTotal] = React.useState(0);
    // Helper: convert string enum value (or numeric) to backend int index
    const enumToInt = (enumObj: Record<string, string | number>, val: string | number | undefined): number | undefined => {
        if (typeof val === "number") return val;
        if (typeof val === "string") {
            const vals = Object.values(enumObj) as string[];
            const idx = vals.indexOf(val);
            return idx >= 0 ? idx : undefined;
        }
        return undefined;
    };
    // Helper: convert backend numeric enum to frontend string value (or pass through string)
    const normalizeEnumToString = (enumObj: Record<string, string | number>, val: string | number | undefined): string | undefined => {
        if (typeof val === 'number') {
            const vals = Object.values(enumObj) as string[];
            return vals[val] ?? undefined;
        }
        if (typeof val === 'string') return val;
        return undefined;
    };
    // Helpers to convert ISO <-> input[type=datetime-local] value (YYYY-MM-DDTHH:MM)
    const isoToLocalInput = (iso?: string | null): string => {
        if (!iso) return "";
        const d = new Date(iso);
        const tzOffset = d.getTimezoneOffset();
        const local = new Date(d.getTime() - tzOffset * 60000);
        return local.toISOString().slice(0, 16);
    };
    const localInputToIso = (val?: string | null): string | undefined => {
        if (!val) return undefined;
        // val is like 'YYYY-MM-DDTHH:MM' interpreted as local time
        const d = new Date(val);
        return d.toISOString();
    };
    const updatePartyMutation = useMutation({
        mutationFn: async (fields: UpdatePartyFields) => {
            if (!party) return;
            dkLog('MUTATION', `updateParty called`, fields);
            // Determine new status string (fields.status is the frontend string label)
            const incomingStatusString: string = fields.status ?? normalizeEnumToString(PartyStatus, party.status) ?? PartyStatus.Draft;
            // Determine startTime: if organizer provided `start` in fields, use it (allow null); otherwise use existing
            const incomingStartRaw = fields.start;
            let startTimeValue: string | null | undefined = party.startTime;
            if (incomingStartRaw !== undefined) {
                startTimeValue = incomingStartRaw ? localInputToIso(incomingStartRaw) ?? null : null;
            }
            // Determine endTime: if status becomes Finished set to now; else if organizer provided `end` in fields use it (allow null)
            let endTimeValue: string | null | undefined = party.endTime;
            if (incomingStatusString === PartyStatus.Finished) {
                endTimeValue = new Date().toISOString();
            } else {
                const incomingEndRaw = fields.end;
                if (incomingEndRaw !== undefined) {
                    endTimeValue = incomingEndRaw ? localInputToIso(incomingEndRaw) ?? null : null;
                }
            }
            // Spread the full existing party so the backend receives a complete Event
            // entity (including Id, Title, nav props). Only override the fields that
            // the settings form actually changes.
            const payload = {
                ...party,
                // Id is required by PUT /api/events/{id} — ev.Id must equal the URL id
                id: party.id,
                // C# Event uses Title (not name) for the display name
                title: party.title ?? party.name ?? '',
                description: party.description ?? '',
                organizerId: party.organizerId ?? 0,
                startTime: startTimeValue ?? undefined,
                endTime: endTimeValue ?? undefined,
                status: enumToInt(PartyStatus, incomingStatusString ?? party.status),
                // C# Event uses LocationType (not type) for Virtual/Physical
                locationType: enumToInt(EventLocationType, fields.type ?? party.locationType),
                access: enumToInt(EventAccessType, fields.access ?? party.access),
                code: fields.code ?? undefined,
                // Don't send navigation collections — they would be ignored by EF anyway
                // but sending them avoids any deserialization noise.
                tabs: undefined,
            };
            await putUpdateParty(party.id, payload as unknown as CreatePartyRequest);
        },
        onSuccess: () => party && queryClient.invalidateQueries({ queryKey: ["karaoke", "party", party.id] }),
    });

    // Local state for access selection (must be a top-level hook to preserve hook order)
    const [accessSelection, setAccessSelection] = React.useState<string>(
        normalizeEnumToString(EventAccessType, party?.access) ?? "Public"
    );

    // Local editable start/end fields for organizer (datetime-local format)
    const [startInput, setStartInput] = React.useState<string>(isoToLocalInput(party?.startTime));
    const [endInput, setEndInput] = React.useState<string>(isoToLocalInput(party?.endTime));
    const [editHeaderDates, setEditHeaderDates] = React.useState<boolean>(false);

    // Ensure selection follows backend value when party loads/changes
    React.useEffect(() => {
        if (party) {
            const norm = normalizeEnumToString(EventAccessType, party.access) ?? "Public";
            setAccessSelection(norm);
            setStartInput(isoToLocalInput(party.startTime));
            setEndInput(isoToLocalInput(party.endTime));
        }
    }, [party]);

    // Auto-connect RTC when page loads
    React.useEffect(() => {
        dkLog('RTC', `Łączę z SignalR (RTC) dla imprezy #${id}...`);
        (async () => {
            try {
                await rtc.connect(async () => getAccessToken() || '');
                dkLog('RTC', `Połączono z SignalR ✓ (impreza #${id})`);
            } catch (_e) {
                dkLog('RTC', `Nie udało się połączyć z SignalR (oczekiwane gdy serwer niedostępny)`, _e);
                // Expected: RTC connect may fail if server unavailable or user unauthenticated
            }
        })();
        return () => {};
    }, []);

    // Gather all possible user profile IDs
    const userProfileIds: number[] = [userId].filter((pid): pid is number => typeof pid === "number");
    if (currentUser) {
        const profileIds = [currentUser.userId].filter((pid): pid is number => typeof pid === 'number');
        for (const pid of profileIds) {
            if (!userProfileIds.includes(pid)) userProfileIds.push(pid);
        }
    }

    // Subscribe to lobby and party events
    React.useEffect(() => {
        const onMembers = (members: LobbyMember[]) => {
            // members may be array of { ConnectionId?, Username? }
            const arr = Array.isArray(members) ? members : [];
            dkLog('LOBBY', `LobbyMembersUpdated — ${arr.length} members`, arr);
            // store raw members
            setLobbyMembers(arr);
        };
        const onPartyStatus = (_newStatus: unknown) => {
            dkLog('SIGNALR', `PartyStatusUpdated received`, _newStatus);
            // Invalidate or update party status cache
            if (party?.id) queryClient.invalidateQueries({ queryKey: ["karaoke", "party", party.id, "status"] });
        };
        const onPlayerAssigned = (payload: SignalRPlayerPayload) => {
            dkLog('SIGNALR', `PlayerAssigned received`, payload);
            try {
                if (!party) return;
                const pId = payload?.player?.id ?? payload?.userId ?? payload?.playerId;
                if (!pId) return;
                // If assigned into participants channel, optimistically add to cached status
                const key = ["karaoke", "party", party.id, "status"] as const;
                queryClient.setQueryData(key, (old: KaraokePartyStatus | undefined) => {
                    if (!old) return old;
                    const s = { ...old };
                    if (!Array.isArray(s.players)) s.players = [];
                    const exists = s.players.some((pl) => pl.id === pId);
                    if (!exists) {
                        const newPlayer: KaraokePlayer = payload.player ? { id: payload.player.id, name: payload.player.name ?? `#${pId}` } : { id: pId, name: `#${pId}` };
                        s.players = [...s.players, newPlayer];
                    }
                    return s;
                });
            } catch { /* Expected: optimistic cache update may fail if query data shape changed */ }
        };
        const onPlayerMovedIn = (payload: SignalRPlayerPayload) => {
            dkLog('SIGNALR', `PlayerMovedIn received`, payload);
            try {
                if (!party) return;
                const pId = payload?.player?.id ?? payload?.userId ?? payload?.playerId;
                const toChannel = payload?.toChannel ?? payload?.channel ?? 'default';
                if (!pId) return;
                if (toChannel === 'participants') {
                    const key = ["karaoke", "party", party.id, "status"] as const;
                    queryClient.setQueryData(key, (old: KaraokePartyStatus | undefined) => {
                        if (!old) return old;
                        const s = { ...old };
                        if (!Array.isArray(s.players)) s.players = [];
                        const exists = s.players.some((pl) => pl.id === pId);
                        if (!exists) {
                            const newPlayer: KaraokePlayer = payload.player ? { id: payload.player.id, name: payload.player.name ?? `#${pId}` } : { id: pId, name: `#${pId}` };
                            s.players = [...s.players, newPlayer];
                        }
                        return s;
                    });
                }
                // If local user was moved in, switch local lobby membership
                const isLocal = userProfileIds.includes(pId) || userId === pId || playerIds.includes(pId);
                if (isLocal) {
                    (async () => {
                        try { await rtc.service.leaveLobby(party.id, payload?.fromChannel ?? 'default'); } catch (_e) { /* Best-effort — no action needed on failure */ }
                        try {
                            const uname = (username ?? currentUser?.username ?? 'Anon').toString();
                            const decorated = `${uname}|${toChannel}`;
                            await rtc.service.joinLobby(party.id, decorated, toChannel);
                            setLobbyMode(toChannel === 'participants' ? 'participants' : 'spectators');
                        } catch (_e) { /* Best-effort — no action needed on failure */ }
                    })();
                }
            } catch (_e) { /* Expected: SignalR event handler may fail if party state is stale */ }
        };
        const onPlayerMovedOut = (payload: SignalRPlayerPayload) => {
            dkLog('SIGNALR', `PlayerMovedOut received`, payload);
            try {
                if (!party) return;
                const pId = payload?.player?.id ?? payload?.userId ?? payload?.playerId;
                const fromChannel = payload?.fromChannel ?? payload?.channel ?? 'default';
                if (!pId) return;
                if (fromChannel === 'participants') {
                    const key = ["karaoke", "party", party.id, "status"] as const;
                    queryClient.setQueryData(key, (old: KaraokePartyStatus | undefined) => {
                        if (!old) return old;
                        const s = { ...old };
                        if (!Array.isArray(s.players)) return s;
                        s.players = s.players.filter((pl) => pl.id !== pId);
                        return s;
                    });
                }
                // If local user was moved out, update local lobby membership
                const isLocal = userProfileIds.includes(pId) || userId === pId || playerIds.includes(pId);
                if (isLocal) {
                    (async () => {
                        try { await rtc.service.leaveLobby(party.id, fromChannel); } catch (_e) { /* Best-effort — no action needed on failure */ }
                        // join default/spectators after being moved out
                        try {
                            const to = payload?.toChannel ?? 'spectators';
                            const uname = (username ?? currentUser?.username ?? 'Anon').toString();
                            const decorated = `${uname}|${to}`;
                            await rtc.service.joinLobby(party.id, decorated, to);
                            setLobbyMode(to === 'participants' ? 'participants' : 'spectators');
                        } catch (_e) { /* Best-effort — no action needed on failure */ }
                    })();
                }
            } catch (_e) { /* Expected: SignalR event handler may fail if party state is stale */ }
        };
        rtc.service.on && rtc.service.on('LobbyMembersUpdated', onMembers as (...args: unknown[]) => void);
        rtc.service.on && rtc.service.on('PartyStatusUpdated', onPartyStatus as (...args: unknown[]) => void);
        rtc.service.on && rtc.service.on('PlayerAssigned', onPlayerAssigned as (...args: unknown[]) => void);
        rtc.service.on && rtc.service.on('PlayerMovedIn', onPlayerMovedIn as (...args: unknown[]) => void);
        rtc.service.on && rtc.service.on('PlayerMovedOut', onPlayerMovedOut as (...args: unknown[]) => void);
        const onPermissionsChanged = (payload: SignalRPermissionsPayload) => {
            dkLog('SIGNALR', `PermissionsChanged received`, payload);
            try {
                const pId = payload?.UserId ?? payload?.userId ?? payload?.PlayerId ?? payload?.playerId;
                if (!partyIdSafe) return;
                // refresh party status and specific player permissions
                queryClient.invalidateQueries({ queryKey: ["karaoke", "party", partyIdSafe, "status"] });
                if (pId) queryClient.invalidateQueries({ queryKey: ['party', 'permissions', partyIdSafe, pId] });
                queryClient.invalidateQueries({ queryKey: ['party', 'permissions', partyIdSafe, 'history'] });
            } catch (_e) { /* Best-effort — no action needed on failure */ }
        };
        const onPermissionsBulk = (_payload: unknown) => {
            dkLog('SIGNALR', `PermissionsBulkChanged received`, _payload);
            try {
                if (!partyIdSafe) return;
                queryClient.invalidateQueries({ queryKey: ["karaoke", "party", partyIdSafe, "status"] });
                queryClient.invalidateQueries({ queryKey: ['party', 'permissions', partyIdSafe, 'history'] });
            } catch (_e) { /* Best-effort — no action needed on failure */ }
        };
        rtc.service.on && rtc.service.on('PermissionsChanged', onPermissionsChanged as (...args: unknown[]) => void);
        rtc.service.on && rtc.service.on('PermissionsBulkChanged', onPermissionsBulk as (...args: unknown[]) => void);
        return () => {
            rtc.service.off && rtc.service.off('LobbyMembersUpdated', onMembers as (...args: unknown[]) => void);
            rtc.service.off && rtc.service.off('PartyStatusUpdated', onPartyStatus as (...args: unknown[]) => void);
            rtc.service.off && rtc.service.off('PlayerAssigned', onPlayerAssigned as (...args: unknown[]) => void);
            rtc.service.off && rtc.service.off('PlayerMovedIn', onPlayerMovedIn as (...args: unknown[]) => void);
            rtc.service.off && rtc.service.off('PlayerMovedOut', onPlayerMovedOut as (...args: unknown[]) => void);
            rtc.service.off && rtc.service.off('PermissionsChanged', onPermissionsChanged as (...args: unknown[]) => void);
            rtc.service.off && rtc.service.off('PermissionsBulkChanged', onPermissionsBulk as (...args: unknown[]) => void);
        };
    }, [rtc.service, party?.id]);

    // Auto-join appropriate lobby when RTC connected and party loaded
    React.useEffect(() => {
        if (!rtc.service || !party) return;
        const join = async (mode: 'participants' | 'spectators') => {
            const uname = (username ?? currentUser?.username ?? 'Anon').toString();
            const decorated = `${uname}|${mode}`;
                try {
                    dkLog('LOBBY', `Dołączam do lobby imprezy #${party.id} jako "${decorated}" (tryb: ${mode})...`);
                    await rtc.service.joinLobby(party.id, decorated, mode);
                    dkLog('LOBBY', `Dołączono do lobby ✓ (impreza #${party.id}, tryb: ${mode})`);
                } catch (_e) {
                    dkLog('LOBBY', `Nie udało się dołączyć do lobby (oczekiwane gdy RTC jeszcze nie połączone)`, _e);
                    // Expected: RTC lobby join may fail if not yet connected
                }
        };
        // Determine default: if user already joined as player show participants
        const sTyped = (status ?? {}) as KaraokePartyStatus;
        const isPlayer = !!(sTyped.players?.length && sTyped.players.some(
            (p) => p.id === userId || ('profileId' in p && (p as { profileId?: number }).profileId === userId)
        ));
        const desired = isPlayer ? 'participants' : 'spectators';
        dkLog('LOBBY', `Automatyczne dołączanie: użytkownik jest ${isPlayer ? 'graczem → kanał: participants' : 'widzem → kanał: spectators'} (${sTyped.players?.length ?? 0} graczy w imprezie)`);
        setLobbyMode(desired);
        join(desired);
    }, [rtc.service, party, status, username, currentUser, userId]);

    // Fetch participants from dedicated endpoint
    const { data: participantsRaw = [] } = useEventParticipantsQuery(id, {
        enabled: Number.isFinite(id) && id > 0,
        refetchOnWindowFocus: false,
        staleTime: 30_000,
    });

    // Map EventParticipant[] → KaraokePlayer[] for downstream consumers
    const participants: KaraokePlayer[] = React.useMemo(() => {
        if (participantsRaw.length) {
            return participantsRaw.map((pp: EventParticipant) => {
                const raw = pp.user as (Record<string, unknown> & { name?: string; displayName?: string }) | null | undefined;
                // Backend sends UserProfile (fullName, userName) — prefer normalized name/displayName,
                // fallback to fullName/userName for non-normalized data
                const displayName = raw?.name ?? raw?.displayName ?? (raw?.fullName as string | undefined) ?? (raw?.userName as string | undefined) ?? null;
                return {
                    id: pp.user?.id ?? pp.userId,
                    name: displayName ?? `#${pp.userId}`,
                };
            });
        }
        // Fallback: extract from status if the endpoint returned nothing
        const s = (status ?? {}) as KaraokePartyStatus;
        if (Array.isArray(s.players) && s.players.length) {
            dkLog('PARTICIPANTS', `Endpoint /participants nie zwrócił danych — używam fallback: status.players (${s.players.length} graczy)`, s.players.map(p => ({ id: p.id, name: p.name })));
            return s.players;
        }
        dkLog('PARTICIPANTS', `Brak uczestników z obu źródeł (GET /participants i status) — lista pusta`, { participantsRawCount: participantsRaw.length, statusPlayersCount: (status as { players?: unknown[] } | null | undefined)?.players?.length ?? 0 });
        return [];
    }, [participantsRaw, status]);

    React.useEffect(() => {
        dkLog('PARTICIPANTS', `Pobrano ${participantsRaw.length} uczestnik(ów) z GET /events/{id}/participants → zmapowano na ${participants.length} gracz(y) karaoke`, participants.map(p => ({ id: p.id, name: p.name })));
    }, [participantsRaw, participants]);

    // Computed helpers for Parts modal (extracted to simplify JSX)

    // Check if current user is already a player (by id or profileId)
    const alreadyJoined = !!participants.some((p) => userProfileIds.includes(p.id) || playerIds.includes(p.id));
    // Organizer check — supports both UserProfile-based and Player-based organizerId
    // (backward compat with current backend + forward compat with Player migration)
    const isOrganizer = userProfileIds.includes(party?.organizerId ?? NaN)
        || userId === party?.organizerId
        || playerIds.includes(party?.organizerId ?? NaN);

    React.useEffect(() => {
        dkLog('STATE', `Stan strony: ${alreadyJoined ? 'użytkownik jest graczem ✓' : 'użytkownik nie jest graczem'} | ${isOrganizer ? 'organizator ✓' : 'nie organizator'} | status imprezy: ${party?.status ?? '?'} | zakładka: ${activeTab}`);
    }, [alreadyJoined, isOrganizer, party?.status, activeTab]);

    // Invites (guard party.id to avoid TS possibly-undefined errors)
    const partyIdSafe = party?.id;
    const { data: invites = [], isLoading: invitesLoading } = useQuery({
        queryKey: ["karaoke", "party", partyIdSafe, "invites"],
        queryFn: async () => partyIdSafe ? await fetchPartyInvites(partyIdSafe) : [],
        enabled: Boolean(partyIdSafe),
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000,
    });
    const sendInviteMutation = useMutation({
        mutationFn: async (body: InviteBody) => {
            if (!partyIdSafe) throw new Error('No party id');
            return postSendPartyInvite(partyIdSafe, body);
        },
        onSuccess: () => { showToast(t('party.inviteSent'), 'success'); if (partyIdSafe) queryClient.invalidateQueries({ queryKey: ["karaoke", "party", partyIdSafe, "invites"] }); }
    });
    const cancelInviteMutation = useMutation({
        mutationFn: async (inviteId: number) => postCancelInvite(inviteId),
        onSuccess: () => { showToast(t('party.inviteCancelled'), 'success'); if (partyIdSafe) queryClient.invalidateQueries({ queryKey: ["karaoke", "party", partyIdSafe, "invites"] }); }
    });
    const [inviteEmail, setInviteEmail] = React.useState<string>('');
    const [inviteUserIdStr, setInviteUserIdStr] = React.useState<string>('');

    const handleAttractionSelect = (type: AttractionType) => {
        const nameMap: Record<AttractionType, string> = {
            karaoke: 'Karaoke',
            videoGame: t('party.sessionType.videoGame', 'Gra wideo'),
            boardGame: t('party.sessionType.boardGame', 'Gra planszowa'),
            photoBooth: 'Photo Booth',
            danceFloor: t('party.sessionType.danceFloor', 'Parkiet'),
            djSet: 'DJ Set',
            custom: t('party.sessionType.custom', 'Inna atrakcja'),
        };
        addAttractionMutation.mutate({
            type,
            name: nameMap[type],
            referenceId: '',
        });
        showToast(t('common.added'), 'success');
        setShowAttractionPicker(false);
    };

    return {
        // Translation
        t,

        // Route params
        id,
        partyId,

        // Queries
        party,
        partyLoading,
        status,
        currentUser,
        userId,
        username,
        queryClient,
        rtc,
        showToast,
        confirm,
        songs,
        songsLoading,
        invites,
        invitesLoading,

        // Mutations
        addParticipantMutation,
        deleteParticipantMutation,
        rsvpMutation,
        arriveMutation,
        cancelParticipationMutation,
        addRoundMutation,
        addSessionMutation,
        addRoundPartMutation,
        addAttractionMutation,
        updatePartyMutation,
        sendInviteMutation,
        cancelInviteMutation,

        // State + setters
        showPartsModal,
        setShowPartsModal,
        partsModalRoundId,
        showPlayersModal,
        setShowPlayersModal,
        playersModalRoundId,
        newPartNumber,
        setNewPartNumber,
        newPartPlayerId,
        setNewPartPlayerId,
        partsPage,
        setPartsPage,
        partsSortBy,
        setPartsSortBy,
        partsSortDir,
        setPartsSortDir,
        showAttractionPicker,
        setShowAttractionPicker,
        editingPartKey,
        setEditingPartKey,
        editingPlayerId,
        setEditingPlayerId,
        showAddRound,
        setShowAddRound,
        songIndex,
        setSongIndex,
        sessionName,
        setSessionName,
        selectedSessionId,
        setSelectedSessionId,
        lobbyMode,
        setLobbyMode,
        lobbyMembers,
        setLobbyMembers,
        activeTab,
        setActiveTab,
        chatUnread,
        setChatUnread,
        chatTotal,
        setChatTotal,
        accessSelection,
        setAccessSelection,
        startInput,
        setStartInput,
        endInput,
        setEndInput,
        editHeaderDates,
        setEditHeaderDates,
        inviteEmail,
        setInviteEmail,
        inviteUserIdStr,
        setInviteUserIdStr,

        // Computed
        userProfileIds,
        participants,
        participantsRaw,
        alreadyJoined,
        isOrganizer,
        partyIdSafe,

        // Helpers
        enumToInt,
        normalizeEnumToString,
        isoToLocalInput,
        localInputToIso,
        respondInvite: postRespondInvite,

        // Event handler
        handleAttractionSelect,

        // Constants
        partsPageSize,
    };
}
