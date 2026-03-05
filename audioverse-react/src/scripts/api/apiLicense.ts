// apiLicense.ts — License lookup for songs
import {
    useQuery,
    UseQueryOptions,
    QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";

// === Types ===
export interface LicenseInfo {
    title: string;
    artist: string;
    licenseName?: string | null;
    licenseUrl?: string | null;
    source?: string | null;
    isPublicDomain?: boolean;
    isCopyrighted?: boolean;
    notes?: string | null;
}

// === Base path ===
const LICENSE_BASE = "/api/library/license";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const LICENSE_QK = {
    lookup: (title: string, artist: string) => ["license", title, artist] as const,
};

// === Fetchers ===

/** @internal GET /api/library/license?title=&artist= — Lookup license information */
export const fetchLicenseInfo = async (
    title: string,
    artist: string,
): Promise<LicenseInfo[]> => {
    const { data } = await apiClient.get<LicenseInfo[]>(apiPath(LICENSE_BASE, ""), {
        params: { title, artist },
    });
    return data ?? [];
};

// === React Query Hooks ===

export const useLicenseLookupQuery = (
    title: string,
    artist: string,
    options?: Partial<UseQueryOptions<LicenseInfo[], unknown, LicenseInfo[], QueryKey>>,
) =>
    useQuery({
        queryKey: LICENSE_QK.lookup(title, artist),
        queryFn: () => fetchLicenseInfo(title, artist),
        enabled: title.length > 0 && artist.length > 0,
        staleTime: 10 * 60_000,
        ...options,
    });

export default {
    fetchLicenseInfo,
};
