// modelsGiftRegistry.ts — Gift registry / group gift DTOs

// ── DTOs ───────────────────────────────────────────────────────────

/** Gift contribution DTO */
export interface GiftContributionDto {
    id: number;
    giftItemId: number;
    guestName: string;
    guestEmail: string | null;
    amount: number | null;
    message: string | null;
    isAnonymous: boolean;
    contributedAt: string;
}

/** Gift item DTO */
export interface GiftItemDto {
    id: number;
    giftRegistryId: number;
    name: string;
    description: string | null;
    imageUrl: string | null;
    externalUrl: string | null;
    targetAmount: number | null;
    currency: string | null;
    maxContributors: number | null;
    currentAmount: number;
    currentContributors: number;
    isFullyReserved: boolean;
    contributions: GiftContributionDto[];
}

/** Gift registry DTO */
export interface GiftRegistryDto {
    id: number;
    userId: string;
    name: string;
    description: string | null;
    eventId: number | null;
    isActive: boolean;
    shareToken: string | null;
    createdAt: string;
    items: GiftItemDto[];
}

// ── Request bodies ─────────────────────────────────────────────────

/** POST /api/gift-registry — create */
export interface CreateGiftRegistryRequest {
    name: string;
    description?: string | null;
    eventId?: number | null;
}

/** PUT /api/gift-registry/{id} — update */
export interface UpdateGiftRegistryRequest {
    name: string;
    description?: string | null;
}

/** POST /api/gift-registry/{id}/items — add gift */
export interface CreateGiftItemRequest {
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    externalUrl?: string | null;
    targetAmount?: number | null;
    currency?: string | null;
    maxContributors?: number | null;
}

/** PUT /api/gift-registry/{id}/items/{itemId} — update gift */
export interface UpdateGiftItemRequest {
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    externalUrl?: string | null;
    targetAmount?: number | null;
    currency?: string | null;
    maxContributors?: number | null;
}

/** POST /api/gift-registry/items/{itemId}/contribute — public */
export interface ContributeRequest {
    guestName: string;
    guestEmail?: string | null;
    amount?: number | null;
    message?: string | null;
    isAnonymous?: boolean;
}

/** POST contribute → response */
export interface ContributeResponse {
    id: number;
    isFullyReserved: boolean;
}
