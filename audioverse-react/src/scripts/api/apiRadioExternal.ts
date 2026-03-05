// apiRadioExternal.ts — External (internet) radio stations
import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type {
    ExternalRadioStationDto,
    CreateExternalStationRequest,
    CountryStationCountDto,
    PaginatedResponse,
} from "../../models/modelsRadio";

// === Base path ===
export const EXT_RADIO_BASE = "/api/radio/external";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const EXT_RADIO_QK = {
    stations: (country?: string, language?: string, genre?: string, page?: number, pageSize?: number) =>
        ["radio", "external", { country, language, genre, page, pageSize }] as const,
    countries: () => ["radio", "external", "countries"] as const,
};

// ── Endpoints ──────────────────────────────────────────────────────

/** @internal GET /api/radio/external?country=&language=&genre=&page=&pageSize= */
export const fetchExternalStations = async (
    country?: string,
    language?: string,
    genre?: string,
    page = 1,
    pageSize = 50,
): Promise<PaginatedResponse<ExternalRadioStationDto>> => {
    const { data } = await apiClient.get<PaginatedResponse<ExternalRadioStationDto>>(
        apiPath(EXT_RADIO_BASE, ""),
        { params: { country, language, genre, page, pageSize } },
    );
    return data;
};

/** @internal GET /api/radio/external/countries */
export const fetchExternalCountries = async (): Promise<CountryStationCountDto[]> => {
    const { data } = await apiClient.get<CountryStationCountDto[]>(
        apiPath(EXT_RADIO_BASE, "/countries"),
    );
    return data ?? [];
};

/** @internal POST /api/radio/external (admin) */
export const postExternalStation = async (
    body: CreateExternalStationRequest,
): Promise<ExternalRadioStationDto> => {
    const { data } = await apiClient.post<ExternalRadioStationDto>(
        apiPath(EXT_RADIO_BASE, ""),
        body,
    );
    return data;
};

/** @internal PATCH /api/radio/external/{stationId}/toggle (admin) */
export const patchToggleStation = async (stationId: number): Promise<void> => {
    await apiClient.patch(apiPath(EXT_RADIO_BASE, `/${stationId}/toggle`));
};

// === React Query Hooks ===

export const useExternalStationsQuery = (
    country?: string,
    language?: string,
    genre?: string,
    page = 1,
    pageSize = 50,
) =>
    useQuery({
        queryKey: EXT_RADIO_QK.stations(country, language, genre, page, pageSize),
        queryFn: () => fetchExternalStations(country, language, genre, page, pageSize),
        placeholderData: keepPreviousData,
    });

export const useExternalCountriesQuery = () =>
    useQuery({
        queryKey: EXT_RADIO_QK.countries(),
        queryFn: fetchExternalCountries,
        staleTime: 10 * 60 * 1000,
    });

// ── Mutations ─────────────────────────────────────────────────────

export const useCreateStationMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: CreateExternalStationRequest) => postExternalStation(body),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["radio", "external"] }),
    });
};

export const useToggleStationMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (stationId: number) => patchToggleStation(stationId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["radio", "external"] }),
    });
};

export default {
    fetchExternalStations,
    fetchExternalCountries,
    postExternalStation,
    patchToggleStation,
};
