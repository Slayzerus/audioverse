using AudioVerse.Domain.Entities.Wishlists;
using MediatR;

namespace AudioVerse.Application.Commands.Wishlists;

/// <summary>Add an item to a wishlist.</summary>
public record AddWishlistItemCommand(
    int WishlistId, int OwnerUserId, WishlistItemType ItemType, string Name,
    string? Description, string? ImageUrl, string? ExternalUrl,
    decimal? EstimatedPrice, string? Currency, WishlistPriority Priority, int SortOrder,
    int? BoardGameId, int? VideoGameId, int? SteamAppId, int? BggId, string? Notes)
    : IRequest<WishlistItem?>;
