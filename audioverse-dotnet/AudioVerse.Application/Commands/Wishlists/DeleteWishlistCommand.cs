using MediatR;

namespace AudioVerse.Application.Commands.Wishlists;

/// <summary>Delete a wishlist (cascading).</summary>
public record DeleteWishlistCommand(int WishlistId, int OwnerUserId) : IRequest<bool>;
