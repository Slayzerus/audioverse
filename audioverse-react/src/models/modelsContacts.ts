// modelsContacts.ts — Contacts & Address Book DTOs

// === Enums ===

export enum ContactImportSource {
  Manual = 0,
  Google = 1,
  Microsoft = 2,
  Apple = 3,
  Csv = 4,
  VCard = 5,
  Phone = 6,
  Facebook = 7,
  LinkedIn = 8,
  CardDav = 9,
}

export enum ContactEmailType {
  Personal = 0,
  Work = 1,
  Other = 2,
}

export enum ContactPhoneType {
  Mobile = 0,
  Home = 1,
  Work = 2,
  Fax = 3,
  Other = 4,
}

export enum ContactAddressType {
  Home = 0,
  Work = 1,
  Billing = 2,
  Shipping = 3,
  Other = 4,
}

// === Response DTOs ===

export interface ContactListDto {
  id: number;
  displayName: string;
  /** Private display name (visible only to contact owner) */
  displayNamePrivate: string;
  firstName: string;
  lastName: string;
  company: string | null;
  avatarUrl: string | null;
  isFavorite: boolean;
  isOrganization: boolean;
  linkedUserId: number | null;
  organizationId: number | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  importSource: number;
}

export interface ContactDetailDto {
  id: number;
  firstName: string;
  lastName: string;
  displayName: string;
  /** Private display name (visible only to contact owner) */
  displayNamePrivate: string;
  nickname: string | null;
  company: string | null;
  jobTitle: string | null;
  notes: string | null;
  avatarUrl: string | null;
  isOrganization: boolean;
  isFavorite: boolean;
  linkedUserId: number | null;
  organizationId: number | null;
  importSource: number;
  externalId: string | null;
  createdAt: string;
  updatedAt: string;
  emails: ContactEmailDto[];
  phones: ContactPhoneDto[];
  addresses: ContactAddressDto[];
  groups: ContactGroupRefDto[];
}

export interface ContactEmailDto {
  id: number;
  email: string;
  type: number;
  isPrimary: boolean;
}

export interface ContactPhoneDto {
  id: number;
  phoneNumber: string;
  type: number;
  isPrimary: boolean;
}

export interface ContactAddressDto {
  id: number;
  type: number;
  label: string | null;
  street: string;
  street2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  isPrimary: boolean;
}

export interface ContactGroupRefDto {
  groupId: number;
  groupName: string;
}

export interface ContactGroupListDto {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  organizationId: number | null;
  memberCount: number;
}

export interface ContactUserSuggestionDto {
  userId: number;
  username: string;
  fullName: string;
  email: string | null;
}

export interface ContactsPaginatedResponse {
  total: number;
  page: number;
  pageSize: number;
  items: ContactListDto[];
}

export interface ContactImportResultDto {
  imported: number;
  updated: number;
  skipped: number;
  total: number;
}

// === Request DTOs ===

export interface ContactCreateRequest {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  displayNamePrivate?: string;
  nickname?: string;
  company?: string;
  jobTitle?: string;
  notes?: string;
  avatarUrl?: string;
  isOrganization?: boolean;
  linkedUserId?: number;
  organizationId?: number;
  isFavorite?: boolean;
  importSource?: number;
  emails?: ContactEmailInput[];
  phones?: ContactPhoneInput[];
  addresses?: ContactAddressInput[];
  groupIds?: number[];
}

export interface ContactUpdateRequest {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  displayNamePrivate?: string;
  nickname?: string;
  company?: string;
  jobTitle?: string;
  notes?: string;
  avatarUrl?: string;
  isOrganization?: boolean;
  linkedUserId?: number;
  organizationId?: number;
  isFavorite?: boolean;
  emails?: ContactEmailInput[];
  phones?: ContactPhoneInput[];
  addresses?: ContactAddressInput[];
}

export interface ContactEmailInput {
  email: string;
  type?: number;
  isPrimary?: boolean;
}

export interface ContactPhoneInput {
  phoneNumber: string;
  type?: number;
  isPrimary?: boolean;
}

export interface ContactAddressInput {
  type?: number;
  label?: string;
  street: string;
  street2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  isPrimary?: boolean;
}

export interface ContactGroupCreateRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  organizationId?: number;
}

export interface GroupMembersRequest {
  contactIds: number[];
}

export interface ContactImportRequest {
  source: number;
  groupId?: number;
  contacts: ContactImportItem[];
}

export interface ContactImportItem {
  externalId?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  company?: string;
  jobTitle?: string;
  avatarUrl?: string;
  isOrganization?: boolean;
  emails?: ContactEmailInput[];
  phones?: ContactPhoneInput[];
  addresses?: ContactAddressInput[];
}
