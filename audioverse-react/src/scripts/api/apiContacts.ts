// apiContacts.ts — Contacts & Address Book API (React Query hooks + fetchers)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type {
  ContactDetailDto,
  ContactGroupListDto,
  ContactUserSuggestionDto,
  ContactsPaginatedResponse,
  ContactImportResultDto,
  ContactCreateRequest,
  ContactUpdateRequest,
  ContactGroupCreateRequest,
  GroupMembersRequest,
  ContactImportRequest,
} from "../../models/modelsContacts";

// === Base path ===
export const CONTACTS_BASE = "/api/contacts";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const CONTACTS_QK = {
  all: ["contacts"] as const,
  list: (params: Record<string, unknown>) => ["contacts", "list", params] as const,
  detail: (id: number) => ["contacts", id] as const,
  groups: ["contacts", "groups"] as const,
  searchUsers: (q: string) => ["contacts", "search-users", q] as const,
};

// === Contacts query params ===
export interface ContactsListParams {
  search?: string;
  groupId?: number;
  organizationId?: number;
  favorites?: boolean;
  page?: number;
  pageSize?: number;
}

// === Low-level fetchers ===

/** @internal GET /api/contacts — paginated contact list */
export const fetchContacts = async (params?: ContactsListParams): Promise<ContactsPaginatedResponse> => {
  const { data } = await apiClient.get<ContactsPaginatedResponse>(CONTACTS_BASE, { params });
  return data;
};

/** @internal GET /api/contacts/{id} — contact detail */
export const fetchContactById = async (id: number): Promise<ContactDetailDto> => {
  const { data } = await apiClient.get<ContactDetailDto>(apiPath(CONTACTS_BASE, `${id}`));
  return data;
};

/** POST /api/contacts — create contact */
export const createContact = async (req: ContactCreateRequest): Promise<ContactDetailDto> => {
  const { data } = await apiClient.post<ContactDetailDto>(CONTACTS_BASE, req);
  return data;
};

/** PUT /api/contacts/{id} — update contact */
export const updateContact = async (id: number, req: ContactUpdateRequest): Promise<ContactDetailDto> => {
  const { data } = await apiClient.put<ContactDetailDto>(apiPath(CONTACTS_BASE, `${id}`), req);
  return data;
};

/** @internal DELETE /api/contacts/{id} — delete contact */
export const deleteContact = async (id: number): Promise<void> => {
  await apiClient.delete(apiPath(CONTACTS_BASE, `${id}`));
};

/** POST /api/contacts/{id}/toggle-favorite */
export const toggleContactFavorite = async (id: number): Promise<{ id: number; isFavorite: boolean }> => {
  const { data } = await apiClient.post(apiPath(CONTACTS_BASE, `${id}/toggle-favorite`));
  return data;
};

// --- Groups ---

/** @internal GET /api/contacts/groups */
export const fetchContactGroups = async (): Promise<ContactGroupListDto[]> => {
  const { data } = await apiClient.get<ContactGroupListDto[]>(apiPath(CONTACTS_BASE, "groups"));
  return data;
};

/** POST /api/contacts/groups */
export const createContactGroup = async (req: ContactGroupCreateRequest): Promise<ContactGroupListDto> => {
  const { data } = await apiClient.post<ContactGroupListDto>(apiPath(CONTACTS_BASE, "groups"), req);
  return data;
};

/** PUT /api/contacts/groups/{groupId} */
export const updateContactGroup = async (groupId: number, req: ContactGroupCreateRequest): Promise<ContactGroupListDto> => {
  const { data } = await apiClient.put<ContactGroupListDto>(apiPath(CONTACTS_BASE, `groups/${groupId}`), req);
  return data;
};

/** @internal DELETE /api/contacts/groups/{groupId} */
export const deleteContactGroup = async (groupId: number): Promise<void> => {
  await apiClient.delete(apiPath(CONTACTS_BASE, `groups/${groupId}`));
};

/** POST /api/contacts/groups/{groupId}/members — add contacts to group (batch) */
export const addGroupMembers = async (groupId: number, req: GroupMembersRequest): Promise<{ added: number }> => {
  const { data } = await apiClient.post(apiPath(CONTACTS_BASE, `groups/${groupId}/members`), req);
  return data;
};

/** DELETE /api/contacts/groups/{groupId}/members/{contactId} — remove from group */
export const removeGroupMember = async (groupId: number, contactId: number): Promise<void> => {
  await apiClient.delete(apiPath(CONTACTS_BASE, `groups/${groupId}/members/${contactId}`));
};

// --- Import ---

/** POST /api/contacts/import — batch import */
export const importContacts = async (req: ContactImportRequest): Promise<ContactImportResultDto> => {
  const { data } = await apiClient.post<ContactImportResultDto>(apiPath(CONTACTS_BASE, "import"), req);
  return data;
};

// --- User search ---

/** GET /api/contacts/search-users?q= — search system users for linking */
export const searchContactUsers = async (q: string): Promise<ContactUserSuggestionDto[]> => {
  const { data } = await apiClient.get<ContactUserSuggestionDto[]>(apiPath(CONTACTS_BASE, "search-users"), { params: { q } });
  return data;
};

// === React Query hooks ===

/** Paginated contacts list */
export const useContactsQuery = (params?: ContactsListParams) =>
  useQuery({
    queryKey: CONTACTS_QK.list((params ?? {}) as Record<string, unknown>),
    queryFn: () => fetchContacts(params),
  });

/** Contact detail */
export const useContactDetailQuery = (
  id: number | undefined,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: CONTACTS_QK.detail(id ?? 0),
    queryFn: () => fetchContactById(id!),
    enabled: (options?.enabled ?? true) && !!id,
  });

/** Contact groups */
export const useContactGroupsQuery = () =>
  useQuery({ queryKey: CONTACTS_QK.groups, queryFn: fetchContactGroups });

/** Search users for linking */
export const useContactUsersSearchQuery = (q: string) =>
  useQuery({
    queryKey: CONTACTS_QK.searchUsers(q),
    queryFn: () => searchContactUsers(q),
    enabled: q.length >= 2,
  });

/** Create contact */
export const useCreateContactMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: ContactCreateRequest) => createContact(req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CONTACTS_QK.all }); },
  });
};

/** Update contact */
export const useUpdateContactMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: number; req: ContactUpdateRequest }) => updateContact(id, req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CONTACTS_QK.all }); },
  });
};

/** Delete contact */
export const useDeleteContactMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteContact(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CONTACTS_QK.all }); },
  });
};

/** Toggle favorite */
export const useToggleContactFavoriteMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => toggleContactFavorite(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CONTACTS_QK.all }); },
  });
};

/** Create group */
export const useCreateContactGroupMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: ContactGroupCreateRequest) => createContactGroup(req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CONTACTS_QK.groups }); },
  });
};

/** Update group */
export const useUpdateContactGroupMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, req }: { groupId: number; req: ContactGroupCreateRequest }) => updateContactGroup(groupId, req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CONTACTS_QK.groups }); },
  });
};

/** Delete group */
export const useDeleteContactGroupMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: number) => deleteContactGroup(groupId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CONTACTS_QK.groups }); },
  });
};

/** Add members to group */
export const useAddGroupMembersMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, req }: { groupId: number; req: GroupMembersRequest }) => addGroupMembers(groupId, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CONTACTS_QK.all });
      qc.invalidateQueries({ queryKey: CONTACTS_QK.groups });
    },
  });
};

/** Remove member from group */
export const useRemoveGroupMemberMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, contactId }: { groupId: number; contactId: number }) => removeGroupMember(groupId, contactId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CONTACTS_QK.all });
      qc.invalidateQueries({ queryKey: CONTACTS_QK.groups });
    },
  });
};

/** Import contacts */
export const useImportContactsMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: ContactImportRequest) => importContacts(req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CONTACTS_QK.all }); },
  });
};
