using AudioVerse.Domain.Entities.Wishlists;
using MediatR;

namespace AudioVerse.Application.Commands.Wishlists;

/// <summary>Update a wishlist.</summary>
public record UpdateWishlistCommand(int WishlistId, int OwnerUserId, string Name, string? Description, bool IsPublic) : IRequest<Wishlist?>;
