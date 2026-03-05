using AudioVerse.Domain.Entities.Wishlists;

namespace AudioVerse.API.Models.Requests.Wishlists;

/// <summary>Request to add/update a wishlist item.</summary>
public record WishlistItemRequest(
    WishlistItemType ItemType, string Name, string? Description = null, string? ImageUrl = null,
    string? ExternalUrl = null, decimal? EstimatedPrice = null, string? Currency = null,
    WishlistPriority Priority = WishlistPriority.Normal, int SortOrder = 0,
    int? BoardGameId = null, int? VideoGameId = null, int? SteamAppId = null, int? BggId = null,
    string? Notes = null, bool IsAcquired = false);
