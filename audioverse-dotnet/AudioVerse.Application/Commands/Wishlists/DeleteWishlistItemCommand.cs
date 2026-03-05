using MediatR;

namespace AudioVerse.Application.Commands.Wishlists;

/// <summary>Delete a wishlist item.</summary>
public record DeleteWishlistItemCommand(int WishlistId, int ItemId, int OwnerUserId) : IRequest<bool>;
