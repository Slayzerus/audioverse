using AudioVerse.Domain.Entities.Wishlists;
using MediatR;

namespace AudioVerse.Application.Commands.Wishlists;

/// <summary>Update a wishlist item.</summary>
public record UpdateWishlistItemCommand(
    int WishlistId, int ItemId, int OwnerUserId, string Name,
    string? Description, string? ImageUrl, string? ExternalUrl,
    decimal? EstimatedPrice, string? Currency, WishlistPriority Priority, int SortOrder,
    int? BoardGameId, int? VideoGameId, int? SteamAppId, int? BggId, string? Notes, bool IsAcquired)
    : IRequest<WishlistItem?>;
