// modelsWishlist.ts — Wishlist DTOs (with Steam sync)

/** Item type enum */
export type WishlistItemType = "BoardGame" | "VideoGame" | "Movie" | "Book" | "Music" | "TvShow" | "Custom";

/** Numeric mapping matching backend enum */
export const WishlistItemTypeValues: Record<WishlistItemType, number> = {
    BoardGame: 0,
    VideoGame: 1,
    Movie: 2,
    Book: 3,
    Music: 4,
    TvShow: 5,
    Custom: 6,
};

/** Priority enum */
export type WishlistPriority = "Low" | "Normal" | "High" | "MustHave";

export const WishlistPriorityValues: Record<WishlistPriority, number> = {
    Low: 0,
    Normal: 1,
    High: 2,
    MustHave: 3,
};

// ── DTOs ───────────────────────────────────────────────────────────

/** Wishlist item */
export interface WishlistItemDto {
    id: number;
    wishlistId: number;
    itemType: number;
    name: string;
    description: string | null;
    imageUrl: string | null;
    externalUrl: string | null;
    bggId: number | null;
    steamAppId: number | null;
    priority: number;
    isAcquired: boolean;
    acquiredAt: string | null;
    addedAt: string;
}

/** Wishlist DTO */
export interface WishlistDto {
    id: number;
    userId: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    shareToken: string | null;
    syncSource: string | null;
    lastSyncUtc: string | null;
    createdAt: string;
    items: WishlistItemDto[];
}

/** POST /api/wishlists — create request */
export interface CreateWishlistRequest {
    name: string;
    description?: string | null;
    isPublic?: boolean;
}

/** PUT /api/wishlists/{id} — update request */
export interface UpdateWishlistRequest {
    name: string;
    description?: string | null;
    isPublic?: boolean;
}

/** POST /api/wishlists/{id}/items — create item request */
export interface CreateWishlistItemRequest {
    itemType: number;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    externalUrl?: string | null;
    bggId?: number | null;
    steamAppId?: number | null;
    priority?: number;
}

/** PUT /api/wishlists/{id}/items/{itemId} — update item request */
export interface UpdateWishlistItemRequest {
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    externalUrl?: string | null;
    priority?: number;
}
