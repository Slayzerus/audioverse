// apiDmx.ts (React Query)
import { useQuery, useMutation, useQueryClient, QueryKey, UseQueryOptions } from "@tanstack/react-query";
import { apiClient, apiPath, DMX_BASE } from "./audioverseApiClient";
import {
    DmxStateDto,
    FtdiDeviceDto,
    DmxScene,
    DmxSceneSequence,
    BeatReactiveRequest,
    BeatTapRequest,
} from "../../models/modelsDmx";

// ---------------- Query Keys ----------------
/** @internal  use React Query hooks below */
export const DMX_QK = {
    state: ["dmx", "state"] as const,
    devices: ["dmx", "devices"] as const,
    scenes: ["dmx", "scenes"] as const,
    sequences: ["dmx", "sequences"] as const,
};

// ---------------- Low-level API (fetchers) ----------------
/** @internal */
export const fetchDmxState = async (): Promise<DmxStateDto> => {
    const res = await apiClient.get<DmxStateDto>(apiPath(DMX_BASE, "/state"));
    return res.data;
};

/** @internal */
export const fetchFtdiDevices = async (): Promise<FtdiDeviceDto[]> => {
    const res = await apiClient.get<FtdiDeviceDto[]>(apiPath(DMX_BASE, "/devices"));
    return res.data;
};

/** @internal */
export const postOpenDmxPort = async (id?: string): Promise<void> => {
    await apiClient.post(apiPath(DMX_BASE, "/port/open"), { id });
};

/** @internal */
export const postCloseDmxPort = async (): Promise<void> => {
    await apiClient.post(apiPath(DMX_BASE, "/port/close"), {});
};

/** @internal */
export const postConfigureDmx = async (fps: number, startCode: number): Promise<void> => {
    await apiClient.post(apiPath(DMX_BASE, "/config"), { fps, startCode });
};

/** @internal */
export const putDmxChannel = async (ch: number, value: number): Promise<void> => {
    await apiClient.put(apiPath(DMX_BASE, `/channel/${ch}`), { value });
};

const toNumberArray = (arr: ArrayLike<number>): number[] => Array.from(arr);

/** @internal */
export const putDmxUniverse = async (payload512: number[] | Uint8Array): Promise<void> => {
    const arr = toNumberArray(payload512);
    if (arr.length !== 512) throw new Error("Universe payload must have exactly 512 values.");
    await apiClient.put(apiPath(DMX_BASE, "/universe"), arr);
};

/** @internal */
export const postBlackout = async (): Promise<void> => {
    await apiClient.post(apiPath(DMX_BASE, "/blackout"), {});
};

// ---------------- React Query Hooks ----------------

// GET /state – polling by default every 500ms (can override in options)
export const useDmxStateQuery = (
    options?: Partial<UseQueryOptions<DmxStateDto, unknown, DmxStateDto, QueryKey>>
) => {
    return useQuery({
        queryKey: DMX_QK.state,
        queryFn: fetchDmxState,
        refetchInterval: 500,
        refetchOnWindowFocus: false,
        staleTime: 250,
        ...options,
    });
};

// GET /devices
export const useFtdiDevicesQuery = () => {
    return useQuery({
        queryKey: DMX_QK.devices,
        queryFn: fetchFtdiDevices,
        staleTime: 5 * 60 * 1000, // 5 min
    });
};

// POST /port/open
export const useOpenDmxPortMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id?: string) => postOpenDmxPort(id),
        onSuccess: async () => {
            // after opening port pull current state
            await qc.invalidateQueries({ queryKey: DMX_QK.state });
        },
    });
};

// POST /port/close
export const useCloseDmxPortMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => postCloseDmxPort(),
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: DMX_QK.state });
        },
    });
};

// POST /config
export const useConfigureDmxMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ fps, startCode }: { fps: number; startCode: number }) => postConfigureDmx(fps, startCode),
        // Opcjonalnie: optymistycznie przestaw startCode/fps w cache
        onMutate: async ({ fps, startCode }) => {
            await qc.cancelQueries({ queryKey: DMX_QK.state });
            const prev = qc.getQueryData<DmxStateDto>(DMX_QK.state);
            if (prev) {
                const next: DmxStateDto = {
                    ...prev,
                    fps,
                    startCode,
                    frontSnapshot: [...prev.frontSnapshot],
                };
                next.frontSnapshot[0] = startCode;
                qc.setQueryData(DMX_QK.state, next);
            }
            return { prev };
        },
        onError: (_e, _vars, ctx) => {
            if (ctx?.prev) qc.setQueryData(DMX_QK.state, ctx.prev);
        },
        onSettled: () => qc.invalidateQueries({ queryKey: DMX_QK.state }),
    });
};

// PUT /channel/{ch}
export const useSetDmxChannelMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ ch, value }: { ch: number; value: number }) => putDmxChannel(ch, value),
        onMutate: async ({ ch, value }) => {
            await qc.cancelQueries({ queryKey: DMX_QK.state });
            const prev = qc.getQueryData<DmxStateDto>(DMX_QK.state);
            if (prev && Array.isArray(prev.frontSnapshot) && prev.frontSnapshot.length >= 513) {
                const next: DmxStateDto = {
                    ...prev,
                    frontSnapshot: [...prev.frontSnapshot],
                };
                next.frontSnapshot[ch] = Math.max(0, Math.min(255, Math.round(value)));
                qc.setQueryData(DMX_QK.state, next);
            }
            return { prev };
        },
        onError: (_e, _vars, ctx) => {
            if (ctx?.prev) qc.setQueryData(DMX_QK.state, ctx.prev);
        },
        onSettled: () => qc.invalidateQueries({ queryKey: DMX_QK.state }),
    });
};

// PUT /universe
export const useLoadDmxUniverseMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload512: number[] | Uint8Array) => putDmxUniverse(payload512),
        onMutate: async (payload) => {
            await qc.cancelQueries({ queryKey: DMX_QK.state });
            const prev = qc.getQueryData<DmxStateDto>(DMX_QK.state);
            const arr = toNumberArray(payload);
            if (prev && arr.length === 512) {
                const next: DmxStateDto = {
                    ...prev,
                    frontSnapshot: [...prev.frontSnapshot],
                };
                for (let i = 0; i < 512; i++) {
                    next.frontSnapshot[i + 1] = Math.max(0, Math.min(255, Math.round(arr[i])));
                }
                qc.setQueryData(DMX_QK.state, next);
            }
            return { prev };
        },
        onError: (_e, _vars, ctx) => {
            if (ctx?.prev) qc.setQueryData(DMX_QK.state, ctx.prev);
        },
        onSettled: () => qc.invalidateQueries({ queryKey: DMX_QK.state }),
    });
};

// POST /blackout
export const useBlackoutDmxMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => postBlackout(),
        onMutate: async () => {
            await qc.cancelQueries({ queryKey: DMX_QK.state });
            const prev = qc.getQueryData<DmxStateDto>(DMX_QK.state);
            if (prev && Array.isArray(prev.frontSnapshot) && prev.frontSnapshot.length >= 513) {
                const next: DmxStateDto = {
                    ...prev,
                    frontSnapshot: [...prev.frontSnapshot],
                };
                // Clear channels 1..512 (slot 0 = start code leave)
                for (let i = 1; i < next.frontSnapshot.length; i++) next.frontSnapshot[i] = 0;
                qc.setQueryData(DMX_QK.state, next);
            }
            return { prev };
        },
        onError: (_e, _vars, ctx) => {
            if (ctx?.prev) qc.setQueryData(DMX_QK.state, ctx.prev);
        },
        onSettled: () => qc.invalidateQueries({ queryKey: DMX_QK.state }),
    });
};

// ── Scenes ────────────────────────────────────────────────────

/** @internal GET /api/dmx/scenes — List all scenes */
export const fetchScenes = async (): Promise<DmxScene[]> => {
    const { data } = await apiClient.get<DmxScene[]>(apiPath(DMX_BASE, "/scenes"));
    return data ?? [];
};

/** @internal POST /api/dmx/scenes — Create scene */
export const postCreateScene = async (scene: DmxScene): Promise<void> => {
    await apiClient.post(apiPath(DMX_BASE, "/scenes"), scene);
};

/** @internal DELETE /api/dmx/scenes/{id} — Delete scene */
export const deleteScene = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(DMX_BASE, `/scenes/${id}`));
};

/** @internal POST /api/dmx/scenes/{id}/apply — Apply scene to DMX output */
export const postApplyScene = async (id: number): Promise<void> => {
    await apiClient.post(apiPath(DMX_BASE, `/scenes/${id}/apply`));
};

// ── Sequences ─────────────────────────────────────────────────

/** @internal GET /api/dmx/sequences — List all sequences */
export const fetchSequences = async (): Promise<DmxSceneSequence[]> => {
    const { data } = await apiClient.get<DmxSceneSequence[]>(apiPath(DMX_BASE, "/sequences"));
    return data ?? [];
};

/** @internal POST /api/dmx/sequences — Create sequence */
export const postCreateSequence = async (seq: DmxSceneSequence): Promise<void> => {
    await apiClient.post(apiPath(DMX_BASE, "/sequences"), seq);
};

/** @internal DELETE /api/dmx/sequences/{id} — Delete sequence */
export const deleteSequence = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(DMX_BASE, `/sequences/${id}`));
};

/** @internal POST /api/dmx/sequences/{id}/run — Run sequence */
export const postRunSequence = async (id: number): Promise<void> => {
    await apiClient.post(apiPath(DMX_BASE, `/sequences/${id}/run`));
};

// ── Beat-reactive ─────────────────────────────────────────────

/** @internal POST /api/dmx/beat-reactive/start — Start beat-reactive mode */
export const postBeatReactiveStart = async (body: BeatReactiveRequest): Promise<void> => {
    await apiClient.post(apiPath(DMX_BASE, "/beat-reactive/start"), body);
};

/** @internal POST /api/dmx/beat-reactive/tap — Send beat tap */
export const postBeatTap = async (body: BeatTapRequest): Promise<void> => {
    await apiClient.post(apiPath(DMX_BASE, "/beat-reactive/tap"), body);
};

// ── Hooks: Scenes ─────────────────────────────────────────────

export const useScenesQuery = () =>
    useQuery({ queryKey: DMX_QK.scenes, queryFn: fetchScenes, staleTime: 60_000 });

export const useCreateSceneMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (scene: DmxScene) => postCreateScene(scene),
        onSuccess: () => { qc.invalidateQueries({ queryKey: DMX_QK.scenes }); },
    });
};

export const useDeleteSceneMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteScene(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: DMX_QK.scenes }); },
    });
};

export const useApplySceneMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => postApplyScene(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: DMX_QK.state }); },
    });
};

// ── Hooks: Sequences ──────────────────────────────────────────

export const useSequencesQuery = () =>
    useQuery({ queryKey: DMX_QK.sequences, queryFn: fetchSequences, staleTime: 60_000 });

export const useCreateSequenceMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (seq: DmxSceneSequence) => postCreateSequence(seq),
        onSuccess: () => { qc.invalidateQueries({ queryKey: DMX_QK.sequences }); },
    });
};

export const useDeleteSequenceMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteSequence(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: DMX_QK.sequences }); },
    });
};

export const useRunSequenceMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => postRunSequence(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: DMX_QK.state }); },
    });
};

// ── Hooks: Beat-reactive ──────────────────────────────────────

export const useBeatReactiveStartMutation = () =>
    useMutation({ mutationFn: (body: BeatReactiveRequest) => postBeatReactiveStart(body) });

export const useBeatTapMutation = () =>
    useMutation({ mutationFn: (body: BeatTapRequest) => postBeatTap(body) });
