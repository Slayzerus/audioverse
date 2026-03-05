// apiLocations.ts — Event locations CRUD + geocoding
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
    QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type { EventLocation } from "../../models/modelsKaraoke";

// === Base path ===
const LOCATIONS_BASE = "/api/events/locations";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const LOCATIONS_QK = {
    list: ["locations"] as const,
    single: (id: number) => ["locations", id] as const,
    geocode: (query: string) => ["locations", "geocode", query] as const,
};

// === DTOs ===
export interface CreateLocationDto {
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    placeId?: string;
    notes?: string;
}

export interface UpdateLocationDto extends Partial<CreateLocationDto> {
    id: number;
}

export interface GeocodeResult {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    placeId?: string;
}

// === Fetchers ===

/** @internal GET /api/events/locations — List user's saved locations */
export const fetchLocations = async (): Promise<EventLocation[]> => {
    const { data } = await apiClient.get<EventLocation[]>(apiPath(LOCATIONS_BASE, ""));
    return data ?? [];
};

/** @internal GET /api/events/locations/{id} — Single location */
export const fetchLocationById = async (id: number): Promise<EventLocation> => {
    const { data } = await apiClient.get<EventLocation>(apiPath(LOCATIONS_BASE, `/${id}`));
    return data;
};

/** @internal POST /api/events/locations — Create location */
export const postCreateLocation = async (dto: CreateLocationDto): Promise<EventLocation> => {
    const { data } = await apiClient.post<EventLocation>(apiPath(LOCATIONS_BASE, ""), dto);
    return data;
};

/** @internal PUT /api/events/locations/{id} — Update location */
export const putUpdateLocation = async (dto: UpdateLocationDto): Promise<EventLocation> => {
    const { data } = await apiClient.put<EventLocation>(
        apiPath(LOCATIONS_BASE, `/${dto.id}`),
        dto,
    );
    return data;
};

/** @internal DELETE /api/events/locations/{id} — Delete location */
export const deleteLocation = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(LOCATIONS_BASE, `/${id}`));
};

/** @internal GET /api/events/locations/search?query= — Search places (Google) */
export const fetchSearchPlaces = async (query: string): Promise<GeocodeResult[]> => {
    const { data } = await apiClient.get<GeocodeResult[]>(
        apiPath(LOCATIONS_BASE, "/search"),
        { params: { query } },
    );
    return data ?? [];
};

/** @internal GET /api/events/locations/geocode?address= — Address → coordinates */
export const fetchGeocode = async (address: string): Promise<GeocodeResult[]> => {
    const { data } = await apiClient.get<GeocodeResult[]>(
        apiPath(LOCATIONS_BASE, "/geocode"),
        { params: { address } },
    );
    return data ?? [];
};

/** @internal GET /api/events/locations/autocomplete?input=&lat=&lng= — Address autocomplete */
export const fetchAutocomplete = async (
    input: string,
    lat?: number,
    lng?: number,
): Promise<GeocodeResult[]> => {
    const { data } = await apiClient.get<GeocodeResult[]>(
        apiPath(LOCATIONS_BASE, "/autocomplete"),
        { params: { input, lat, lng } },
    );
    return data ?? [];
};

/** @internal GET /api/events/locations/reverse?lat=&lng= — Coordinates → address */
export const fetchReverseGeocode = async (lat: number, lng: number): Promise<GeocodeResult> => {
    const { data } = await apiClient.get<GeocodeResult>(
        apiPath(LOCATIONS_BASE, "/reverse"),
        { params: { lat, lng } },
    );
    return data;
};

export interface PlaceDetails {
    placeId: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    phone?: string;
    website?: string;
    openingHours?: string[];
    rating?: number;
    types?: string[];
}

/** @internal GET /api/events/locations/place/{placeId} — Place details (Google/OSM) */
export const fetchPlaceDetails = async (placeId: string): Promise<PlaceDetails> => {
    const { data } = await apiClient.get<PlaceDetails>(
        apiPath(LOCATIONS_BASE, `/place/${encodeURIComponent(placeId)}`),
    );
    return data;
};

export type TravelMode = "driving" | "walking" | "bicycling" | "transit";

export interface DirectionsResult {
    distanceKm: number;
    durationMin: number;
    polyline?: string;
    steps?: { instruction: string; distanceKm: number }[];
}

/** @internal GET /api/events/locations/directions?originLat=&originLng=&destLat=&destLng=&mode= */
export const fetchDirections = async (
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    mode: TravelMode = "driving",
): Promise<DirectionsResult> => {
    const { data } = await apiClient.get<DirectionsResult>(
        apiPath(LOCATIONS_BASE, "/directions"),
        { params: { originLat, originLng, destLat, destLng, mode } },
    );
    return data;
};

export interface TimezoneResult {
    timeZoneId: string;
    timeZoneName: string;
    utcOffset: number;
}

/** @internal GET /api/events/locations/timezone?lat=&lng= — Timezone for coordinates */
export const fetchTimezone = async (lat: number, lng: number): Promise<TimezoneResult> => {
    const { data } = await apiClient.get<TimezoneResult>(
        apiPath(LOCATIONS_BASE, "/timezone"),
        { params: { lat, lng } },
    );
    return data;
};

export interface NearbyEvent {
    id: number;
    title: string;
    locationName?: string;
    latitude: number;
    longitude: number;
    distanceKm: number;
    startTime?: string;
}

/** @internal GET /api/events/locations/nearby-events?lat=&lng=&radiusKm= */
export const fetchNearbyEvents = async (
    lat: number,
    lng: number,
    radiusKm = 10,
): Promise<NearbyEvent[]> => {
    const { data } = await apiClient.get<NearbyEvent[]>(
        apiPath(LOCATIONS_BASE, "/nearby-events"),
        { params: { lat, lng, radiusKm } },
    );
    return data ?? [];
};

// === React Query Hooks ===

export const useLocationsQuery = (
    options?: Partial<UseQueryOptions<EventLocation[], unknown, EventLocation[], QueryKey>>,
) =>
    useQuery({
        queryKey: LOCATIONS_QK.list,
        queryFn: fetchLocations,
        ...options,
    });

export const useLocationByIdQuery = (
    id: number,
    options?: Partial<UseQueryOptions<EventLocation, unknown, EventLocation, QueryKey>>,
) =>
    useQuery({
        queryKey: LOCATIONS_QK.single(id),
        queryFn: () => fetchLocationById(id),
        enabled: id > 0,
        ...options,
    });

export const useSearchPlacesQuery = (
    query: string,
    options?: Partial<UseQueryOptions<GeocodeResult[], unknown, GeocodeResult[], QueryKey>>,
) =>
    useQuery({
        queryKey: ["locations", "search", query] as const,
        queryFn: () => fetchSearchPlaces(query),
        enabled: query.length >= 2,
        staleTime: 60_000,
        ...options,
    });

export const useGeocodeQuery = (
    address: string,
    options?: Partial<UseQueryOptions<GeocodeResult[], unknown, GeocodeResult[], QueryKey>>,
) =>
    useQuery({
        queryKey: LOCATIONS_QK.geocode(address),
        queryFn: () => fetchGeocode(address),
        enabled: address.length >= 3,
        staleTime: 60_000,
        ...options,
    });

export const useAutocompleteQuery = (
    input: string,
    lat?: number,
    lng?: number,
    options?: Partial<UseQueryOptions<GeocodeResult[], unknown, GeocodeResult[], QueryKey>>,
) =>
    useQuery({
        queryKey: ["locations", "autocomplete", input, lat, lng] as const,
        queryFn: () => fetchAutocomplete(input, lat, lng),
        enabled: input.length >= 2,
        staleTime: 30_000,
        ...options,
    });

export const useReverseGeocodeQuery = (
    lat: number,
    lng: number,
    options?: Partial<UseQueryOptions<GeocodeResult, unknown, GeocodeResult, QueryKey>>,
) =>
    useQuery({
        queryKey: ["locations", "reverse", lat, lng] as const,
        queryFn: () => fetchReverseGeocode(lat, lng),
        enabled: lat !== 0 && lng !== 0,
        staleTime: 5 * 60_000,
        ...options,
    });

export const usePlaceDetailsQuery = (
    placeId: string,
    options?: Partial<UseQueryOptions<PlaceDetails, unknown, PlaceDetails, QueryKey>>,
) =>
    useQuery({
        queryKey: ["locations", "place", placeId] as const,
        queryFn: () => fetchPlaceDetails(placeId),
        enabled: placeId.length > 0,
        staleTime: 10 * 60_000,
        ...options,
    });

export const useDirectionsQuery = (
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    mode: TravelMode = "driving",
    options?: Partial<UseQueryOptions<DirectionsResult, unknown, DirectionsResult, QueryKey>>,
) =>
    useQuery({
        queryKey: ["locations", "directions", originLat, originLng, destLat, destLng, mode] as const,
        queryFn: () => fetchDirections(originLat, originLng, destLat, destLng, mode),
        enabled: originLat !== 0 && destLat !== 0,
        staleTime: 5 * 60_000,
        ...options,
    });

export const useTimezoneQuery = (
    lat: number,
    lng: number,
    options?: Partial<UseQueryOptions<TimezoneResult, unknown, TimezoneResult, QueryKey>>,
) =>
    useQuery({
        queryKey: ["locations", "timezone", lat, lng] as const,
        queryFn: () => fetchTimezone(lat, lng),
        enabled: lat !== 0 && lng !== 0,
        staleTime: 30 * 60_000,
        ...options,
    });

export const useNearbyEventsQuery = (
    lat: number,
    lng: number,
    radiusKm = 10,
    options?: Partial<UseQueryOptions<NearbyEvent[], unknown, NearbyEvent[], QueryKey>>,
) =>
    useQuery({
        queryKey: ["locations", "nearby-events", lat, lng, radiusKm] as const,
        queryFn: () => fetchNearbyEvents(lat, lng, radiusKm),
        enabled: lat !== 0 && lng !== 0,
        staleTime: 60_000,
        ...options,
    });

export const useCreateLocationMutation = () => {
    const qc = useQueryClient();
    return useMutation<EventLocation, unknown, CreateLocationDto>({
        mutationFn: (dto) => postCreateLocation(dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: LOCATIONS_QK.list });
        },
    });
};

export const useUpdateLocationMutation = () => {
    const qc = useQueryClient();
    return useMutation<EventLocation, unknown, UpdateLocationDto>({
        mutationFn: (dto) => putUpdateLocation(dto),
        onSuccess: (_, dto) => {
            qc.invalidateQueries({ queryKey: LOCATIONS_QK.list });
            qc.invalidateQueries({ queryKey: LOCATIONS_QK.single(dto.id) });
        },
    });
};

export const useDeleteLocationMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (id) => deleteLocation(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: LOCATIONS_QK.list });
        },
    });
};

export default {
    fetchLocations,
    fetchLocationById,
    postCreateLocation,
    putUpdateLocation,
    deleteLocation,
    fetchSearchPlaces,
    fetchGeocode,
    fetchAutocomplete,
    fetchReverseGeocode,
    fetchPlaceDetails,
    fetchDirections,
    fetchTimezone,
    fetchNearbyEvents,
};
