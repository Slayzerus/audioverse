// apiPlayerLinks.ts — Player Links API (React Query hooks + fetchers)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type {
  PlayerLinkSearchRequest,
  PlayerLinkConfirmRequest,
  PlayerLinkSearchResponse,
  PlayerLinkDto,
  PlayerLinksResponse,
} from "../../models/modelsPlayerLinks";

// === Base path builder ===
const playerBase = (profileId: number, playerId: number) =>
  `/api/user/profiles/${profileId}/players/${playerId}`;

// === Query Keys ===
/** @internal  use React Query hooks below */
export const PLAYER_LINKS_QK = {
  links: (profileId: number, playerId: number) =>
    ["player-links", profileId, playerId] as const,
};

// === Low-level fetchers ===

/** POST .../link/search — step 1: search for linkable players */
export const searchPlayerLink = async (
  profileId: number,
  playerId: number,
  req: PlayerLinkSearchRequest,
): Promise<PlayerLinkSearchResponse> => {
  const { data } = await apiClient.post<PlayerLinkSearchResponse>(
    apiPath(playerBase(profileId, playerId), "link/search"),
    req,
  );
  return data;
};

/** POST .../link/confirm — step 2: confirm link */
export const confirmPlayerLink = async (
  profileId: number,
  playerId: number,
  req: PlayerLinkConfirmRequest,
): Promise<PlayerLinkDto> => {
  const { data } = await apiClient.post<PlayerLinkDto>(
    apiPath(playerBase(profileId, playerId), "link/confirm"),
    req,
  );
  return data;
};

/** @internal GET .../links — list all links for a player */
export const fetchPlayerLinks = async (
  profileId: number,
  playerId: number,
): Promise<PlayerLinksResponse> => {
  const { data } = await apiClient.get<PlayerLinksResponse>(
    apiPath(playerBase(profileId, playerId), "links"),
  );
  return data;
};

/** @internal DELETE .../links/{linkId} — revoke link */
export const deletePlayerLink = async (
  profileId: number,
  playerId: number,
  linkId: number,
): Promise<{ success: boolean }> => {
  const { data } = await apiClient.delete(
    apiPath(playerBase(profileId, playerId), `links/${linkId}`),
  );
  return data;
};

// === React Query hooks ===

/** List player links */
export const usePlayerLinksQuery = (profileId: number | undefined, playerId: number | undefined) =>
  useQuery({
    queryKey: PLAYER_LINKS_QK.links(profileId ?? 0, playerId ?? 0),
    queryFn: () => fetchPlayerLinks(profileId!, playerId!),
    enabled: !!profileId && !!playerId,
  });

/** Search for linkable players (step 1) */
export const useSearchPlayerLinkMutation = () =>
  useMutation({
    mutationFn: ({ profileId, playerId, req }: { profileId: number; playerId: number; req: PlayerLinkSearchRequest }) =>
      searchPlayerLink(profileId, playerId, req),
  });

/** Confirm player link (step 2) */
export const useConfirmPlayerLinkMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ profileId, playerId, req }: { profileId: number; playerId: number; req: PlayerLinkConfirmRequest }) =>
      confirmPlayerLink(profileId, playerId, req),
    onSuccess: (_data, { profileId, playerId }) => {
      qc.invalidateQueries({ queryKey: PLAYER_LINKS_QK.links(profileId, playerId) });
    },
  });
};

/** Revoke player link */
export const useDeletePlayerLinkMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ profileId, playerId, linkId }: { profileId: number; playerId: number; linkId: number }) =>
      deletePlayerLink(profileId, playerId, linkId),
    onSuccess: (_data, { profileId, playerId }) => {
      qc.invalidateQueries({ queryKey: PLAYER_LINKS_QK.links(profileId, playerId) });
    },
  });
};
