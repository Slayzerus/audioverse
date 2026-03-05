import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "../audioverseApiClient";
import { KARAOKE_BASE, KARAOKE_QK } from "./apiKaraokeBase";
import { logger } from "../../../utils/logger";
const log = logger.scoped('apiKaraokeRounds');
import type {
    KaraokePartyRound,
    KaraokeRoundPart,
    KaraokeSinging,
    KaraokeRoundPlayer,
    AddRoundPlayerRequest,
    UpdateRoundPlayerSlotRequest,
} from "../../../models/modelsKaraoke";

export const postAddRound = async (
    round: KaraokePartyRound
): Promise<KaraokePartyRound> => {
    const { data } = await apiClient.post<KaraokePartyRound>(
        apiPath(KARAOKE_BASE, "/add-round"),
        round
    );
    return data;
};

export const postAddRoundPart = async (
    part: Partial<KaraokeRoundPart>
): Promise<{ roundPartId: number } & KaraokeRoundPart> => {
    const { data } = await apiClient.post<{ roundPartId: number } & KaraokeRoundPart>(
        apiPath(KARAOKE_BASE, "/add-round-part"),
        part
    );
    return data;
};

// === Round players (new backend endpoints) ===
export const fetchRoundPlayers = async (roundId: number): Promise<KaraokeRoundPlayer[]> => {
    const { data } = await apiClient.get<KaraokeRoundPlayer[]>(apiPath(KARAOKE_BASE, `/rounds/${roundId}/players`));
    return Array.isArray(data) ? data : [];
};

export const postAddRoundPlayer = async (roundId: number, payload: AddRoundPlayerRequest): Promise<{ success: boolean; id: number }> => {
    const { data } = await apiClient.post(apiPath(KARAOKE_BASE, `/rounds/${roundId}/players`), payload);
    return data;
};

export const deleteRoundPlayer = async (roundId: number, id: number): Promise<void> => {
    await apiClient.delete(apiPath(KARAOKE_BASE, `/rounds/${roundId}/players/${id}`));
};

/** PATCH /api/karaoke/rounds/{roundId}/players/{id}/slot — Update slot for a round assignment */
export const patchRoundPlayerSlot = async (roundId: number, id: number, request: UpdateRoundPlayerSlotRequest): Promise<void> => {
    await apiClient.patch(apiPath(KARAOKE_BASE, `/rounds/${roundId}/players/${id}/slot`), request);
};

/** PATCH /api/karaoke/rounds/{roundId}/players/{id}/mic — Update mic assignment for a round player */
export const patchRoundPlayerMic = async (roundId: number, id: number, micDeviceId: string | null): Promise<void> => {
    await apiClient.patch(apiPath(KARAOKE_BASE, `/rounds/${roundId}/players/${id}/mic`), { micDeviceId });
};

export const postAddSongToRound = async (
    singing: KaraokeSinging
): Promise<KaraokeSinging> => {
    const { data } = await apiClient.post<KaraokeSinging>(
        apiPath(KARAOKE_BASE, "/add-song-to-round"),
        singing
    );
    return data;
};

export const postSaveResults = async (results: KaraokeSinging[]): Promise<void> => {
    await apiClient.post(apiPath(KARAOKE_BASE, "/save-results"), results);
};

/**
 * @deprecated POST /api/karaoke/singing/{singingId}/recording endpoint removed from swagger.
 * Upload recording is no longer supported via this endpoint.
 */
export const postUploadRecording = async (
    _singingId: number,
    _audioBlob: Blob,
    _fileName: string = "recording.webm",
): Promise<void> => {
    log.warn('postUploadRecording: /singing/{id}/recording endpoint removed from swagger.');
};

// ─── Session Rounds DTO ──────────────────────────────────────────

export interface SessionRoundDto {
    id: number;
    sessionId: number;
    songId: number;
    songTitle?: string | null;
    songArtist?: string | null;
    number: number;
    mode?: string | null;
    playerCount?: number;
}

// ─── Hooks ───────────────────────────────────────────────

/** GET /api/karaoke/sessions/{sessionId}/rounds — Fetch all rounds for a session */
export const fetchSessionRounds = async (sessionId: number): Promise<SessionRoundDto[]> => {
    const { data } = await apiClient.get<SessionRoundDto[]>(apiPath(KARAOKE_BASE, `/sessions/${sessionId}/rounds`));
    return Array.isArray(data) ? data : [];
};

export const useSessionRoundsQuery = (sessionId: number | null | undefined) =>
    useQuery({
        queryKey: KARAOKE_QK.sessionRounds(sessionId ?? 0),
        queryFn: () => fetchSessionRounds(sessionId!),
        enabled: sessionId != null && Number.isFinite(sessionId) && sessionId > 0,
    });

/** PUT /api/karaoke/sessions/{sessionId}/rounds/reorder — Persist new round order */
export const putReorderSessionRounds = async (sessionId: number, roundIds: number[]): Promise<void> => {
    await apiClient.put(apiPath(KARAOKE_BASE, `/sessions/${sessionId}/rounds/reorder`), roundIds);
};

export const useReorderSessionRoundsMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { sessionId: number; roundIds: number[] }>({
        mutationFn: ({ sessionId, roundIds }) => putReorderSessionRounds(sessionId, roundIds),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.sessionRounds(vars.sessionId) });
        },
    });
};

export const useAddRoundMutation = () => {
    const qc = useQueryClient();
    return useMutation<KaraokePartyRound, unknown, KaraokePartyRound>({
        mutationFn: (round) => postAddRound(round),
        onSuccess: (_created, vars) => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.parties });
            if (vars?.partyId) {
                qc.invalidateQueries({ queryKey: KARAOKE_QK.party(vars.partyId) });
                qc.invalidateQueries({ queryKey: KARAOKE_QK.partyStatus(vars.partyId) });
            }
            if (vars?.sessionId) {
                qc.invalidateQueries({ queryKey: KARAOKE_QK.sessionRounds(vars.sessionId) });
            }
        },
    });
};

export const useAddRoundPartMutation = () => {
    const qc = useQueryClient();
    return useMutation<{ roundPartId: number } & KaraokeRoundPart, unknown, Partial<KaraokeRoundPart>>({
        mutationFn: (p) => postAddRoundPart(p),
        onSuccess: (_data, vars) => {
            if (vars?.roundId) qc.invalidateQueries({ queryKey: KARAOKE_QK.parties });
            qc.invalidateQueries({ queryKey: KARAOKE_QK.parties });
        }
    });
};

export const useAddSongToRoundMutation = () => {
    const qc = useQueryClient();
    return useMutation<KaraokeSinging, unknown, KaraokeSinging>({
        mutationFn: (singing) => postAddSongToRound(singing),
        onSuccess: () => {
            // No certain partyId in payload — refresh party list globally
            qc.invalidateQueries({ queryKey: KARAOKE_QK.parties });
        },
    });
};

export const useSaveResultsMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, KaraokeSinging[]>({
        mutationFn: (results) => postSaveResults(results),
        onSuccess: () => qc.invalidateQueries({ queryKey: KARAOKE_QK.parties }),
    });
};

// === Round players hooks ===
export const useRoundPlayersQuery = (roundId: number) =>
    useQuery({ queryKey: ['karaoke', 'round', roundId, 'players'], queryFn: () => fetchRoundPlayers(roundId), enabled: Number.isFinite(roundId) });

export const useAddRoundPlayerMutation = () => {
    const qc = useQueryClient();
    return useMutation<{ success: boolean; id: number }, unknown, { roundId: number; payload: AddRoundPlayerRequest; sessionId?: number }>({
        mutationFn: ({ roundId, payload }) => postAddRoundPlayer(roundId, payload),
          onSuccess: (_data, vars) => {
              if (vars?.roundId) qc.invalidateQueries({ queryKey: ['karaoke', 'round', vars.roundId, 'players'] });
              if (vars?.sessionId) qc.invalidateQueries({ queryKey: KARAOKE_QK.sessionRounds(vars.sessionId) });
              qc.invalidateQueries({ queryKey: KARAOKE_QK.parties });
          }
        }
    );
};

export const useDeleteRoundPlayerMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { roundId: number; id: number }>(
        { mutationFn: ({ roundId, id }) => deleteRoundPlayer(roundId, id),
          onSuccess: (_data, vars) => {
              if (vars?.roundId) qc.invalidateQueries({ queryKey: ['karaoke', 'round', vars.roundId, 'players'] });
              qc.invalidateQueries({ queryKey: KARAOKE_QK.parties });
          }
        }
    );
};

export const usePatchRoundPlayerSlotMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { roundId: number; id: number; slot: number }>({
        mutationFn: ({ roundId, id, slot }) => patchRoundPlayerSlot(roundId, id, { slot }),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: ['karaoke', 'round', vars.roundId, 'players'] });
        },
    });
};

export const usePatchRoundPlayerMicMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { roundId: number; id: number; micDeviceId: string | null }>({
        mutationFn: ({ roundId, id, micDeviceId }) => patchRoundPlayerMic(roundId, id, micDeviceId),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: ['karaoke', 'round', vars.roundId, 'players'] });
        },
    });
};
