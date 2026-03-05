// apiWiki.ts — Wiki API service (React Query hooks + low-level fetchers)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type {
  WikiPageListDto,
  WikiPageFullDto,
  WikiNavCategoryDto,
  WikiSearchResultDto,
  WikiCategoryDto,
  WikiRevisionListDto,
  WikiRevisionDto,
  WikiPageCreateRequest,
  WikiPageUpdateRequest,
  WikiReorderItem,
} from "../../models/modelsWiki";

// === Base path ===
export const WIKI_BASE = "/api/wiki";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const WIKI_QK = {
  all: ["wiki"] as const,
  nav: ["wiki", "nav"] as const,
  categories: ["wiki", "categories"] as const,
  page: (slug: string) => ["wiki", "page", slug] as const,
  search: (q: string) => ["wiki", "search", q] as const,
  revisions: (id: number) => ["wiki", "revisions", id] as const,
  revision: (id: number, rev: number) => ["wiki", "revisions", id, rev] as const,
};

// === Low-level fetchers ===

/** @internal GET /api/wiki — flat page list, optionally filtered by category */
export const fetchWikiPages = async (category?: string): Promise<WikiPageListDto[]> => {
  const params = category ? { category } : undefined;
  const { data } = await apiClient.get<WikiPageListDto[]>(WIKI_BASE, { params });
  return data;
};

/** @internal GET /api/wiki/nav — navigation tree grouped by category */
export const fetchWikiNav = async (): Promise<WikiNavCategoryDto[]> => {
  const { data } = await apiClient.get<WikiNavCategoryDto[]>(apiPath(WIKI_BASE, "nav"));
  return data;
};

/** @internal GET /api/wiki/{slug} — full page content (slug may contain '/') */
export const fetchWikiPage = async (slug: string): Promise<WikiPageFullDto> => {
  const { data } = await apiClient.get<WikiPageFullDto>(`${WIKI_BASE}/${slug}`);
  return data;
};

/** GET /api/wiki/search?q= — search in title, content, tags */
export const searchWiki = async (q: string): Promise<WikiSearchResultDto[]> => {
  const { data } = await apiClient.get<WikiSearchResultDto[]>(apiPath(WIKI_BASE, "search"), { params: { q } });
  return data;
};

/** @internal GET /api/wiki/categories — categories with page counts */
export const fetchWikiCategories = async (): Promise<WikiCategoryDto[]> => {
  const { data } = await apiClient.get<WikiCategoryDto[]>(apiPath(WIKI_BASE, "categories"));
  return data;
};

/** @internal GET /api/wiki/{id}/revisions — revision history */
export const fetchWikiRevisions = async (id: number): Promise<WikiRevisionListDto[]> => {
  const { data } = await apiClient.get<WikiRevisionListDto[]>(apiPath(WIKI_BASE, `${id}/revisions`));
  return data;
};

/** @internal GET /api/wiki/{id}/revisions/{rev} — specific revision snapshot */
export const fetchWikiRevision = async (id: number, rev: number): Promise<WikiRevisionDto> => {
  const { data } = await apiClient.get<WikiRevisionDto>(apiPath(WIKI_BASE, `${id}/revisions/${rev}`));
  return data;
};

/** POST /api/wiki/{id}/revisions/{rev}/revert — revert to revision (admin) */
export const revertWikiRevision = async (id: number, rev: number): Promise<{ success: boolean; revertedTo: number }> => {
  const { data } = await apiClient.post(apiPath(WIKI_BASE, `${id}/revisions/${rev}/revert`));
  return data;
};

/** POST /api/wiki — create page (admin) */
export const createWikiPage = async (req: WikiPageCreateRequest): Promise<WikiPageFullDto> => {
  const { data } = await apiClient.post<WikiPageFullDto>(WIKI_BASE, req);
  return data;
};

/** PUT /api/wiki/{id} — update page (admin) */
export const updateWikiPage = async (id: number, req: WikiPageUpdateRequest): Promise<WikiPageFullDto> => {
  const { data } = await apiClient.put<WikiPageFullDto>(apiPath(WIKI_BASE, `${id}`), req);
  return data;
};

/** @internal DELETE /api/wiki/{id} — delete page (admin) */
export const deleteWikiPage = async (id: number): Promise<void> => {
  await apiClient.delete(apiPath(WIKI_BASE, `${id}`));
};

/** POST /api/wiki/reorder — reorder pages (admin) */
export const reorderWikiPages = async (items: WikiReorderItem[]): Promise<{ updated: number }> => {
  const { data } = await apiClient.post(apiPath(WIKI_BASE, "reorder"), items);
  return data;
};

/** POST /api/wiki/import-from-docs — import from Markdown files (admin) */
export const importWikiFromDocs = async (): Promise<{ imported: number; skipped: number; total: number }> => {
  const { data } = await apiClient.post(apiPath(WIKI_BASE, "import-from-docs"));
  return data;
};

// === React Query hooks ===

/** Fetch navigation tree for sidebar */
export const useWikiNavQuery = () =>
  useQuery({ queryKey: WIKI_QK.nav, queryFn: fetchWikiNav, staleTime: 5 * 60_000 });

/** Fetch a single wiki page by slug */
export const useWikiPageQuery = (slug: string | undefined) =>
  useQuery({
    queryKey: WIKI_QK.page(slug ?? ""),
    queryFn: () => fetchWikiPage(slug!),
    enabled: !!slug,
  });

/** Search wiki pages */
export const useWikiSearchQuery = (q: string) =>
  useQuery({
    queryKey: WIKI_QK.search(q),
    queryFn: () => searchWiki(q),
    enabled: q.length >= 2,
    staleTime: 30_000,
  });

/** Fetch categories */
export const useWikiCategoriesQuery = () =>
  useQuery({ queryKey: WIKI_QK.categories, queryFn: fetchWikiCategories, staleTime: 5 * 60_000 });

/** Fetch revisions for a page */
export const useWikiRevisionsQuery = (pageId: number | undefined) =>
  useQuery({
    queryKey: WIKI_QK.revisions(pageId ?? 0),
    queryFn: () => fetchWikiRevisions(pageId!),
    enabled: !!pageId,
  });

/** Fetch a specific revision */
export const useWikiRevisionQuery = (pageId: number | undefined, rev: number | undefined) =>
  useQuery({
    queryKey: WIKI_QK.revision(pageId ?? 0, rev ?? 0),
    queryFn: () => fetchWikiRevision(pageId!, rev!),
    enabled: !!pageId && !!rev,
  });

/** Create a new wiki page (admin) */
export const useCreateWikiPageMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: WikiPageCreateRequest) => createWikiPage(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WIKI_QK.all });
      qc.invalidateQueries({ queryKey: WIKI_QK.nav });
    },
  });
};

/** Update a wiki page (admin) */
export const useUpdateWikiPageMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: number; req: WikiPageUpdateRequest }) => updateWikiPage(id, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WIKI_QK.all });
      qc.invalidateQueries({ queryKey: WIKI_QK.nav });
    },
  });
};

/** Delete a wiki page (admin) */
export const useDeleteWikiPageMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteWikiPage(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WIKI_QK.all });
      qc.invalidateQueries({ queryKey: WIKI_QK.nav });
    },
  });
};

/** Revert to a revision (admin) */
export const useRevertWikiRevisionMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rev }: { id: number; rev: number }) => revertWikiRevision(id, rev),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WIKI_QK.all });
      qc.invalidateQueries({ queryKey: WIKI_QK.nav });
    },
  });
};

/** Reorder wiki pages (admin) */
export const useReorderWikiPagesMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: WikiReorderItem[]) => reorderWikiPages(items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WIKI_QK.nav });
    },
  });
};

/** Import wiki pages from docs (admin) */
export const useImportWikiFromDocsMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => importWikiFromDocs(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WIKI_QK.all });
      qc.invalidateQueries({ queryKey: WIKI_QK.nav });
    },
  });
};
