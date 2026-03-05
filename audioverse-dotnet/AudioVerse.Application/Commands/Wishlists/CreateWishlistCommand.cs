using AudioVerse.Domain.Entities.Wishlists;
using MediatR;

namespace AudioVerse.Application.Commands.Wishlists;

/// <summary>Create a new wishlist.</summary>
public record CreateWishlistCommand(int OwnerUserId, string Name, string? Description, bool IsPublic) : IRequest<Wishlist>;
