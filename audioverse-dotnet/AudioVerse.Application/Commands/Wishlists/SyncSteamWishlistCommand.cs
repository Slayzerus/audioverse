using MediatR;

namespace AudioVerse.Application.Commands.Wishlists;

/// <summary>Synchronize a wishlist with Steam — import new items.</summary>
public record SyncSteamWishlistCommand(int WishlistId, int OwnerUserId, string SteamId) : IRequest<(int Imported, int Total)>;
