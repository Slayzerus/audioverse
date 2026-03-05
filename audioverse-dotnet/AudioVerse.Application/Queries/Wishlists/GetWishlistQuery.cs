using AudioVerse.Domain.Entities.Wishlists;
using MediatR;

namespace AudioVerse.Application.Queries.Wishlists;

/// <summary>Pobierz wishlistę po ID.</summary>
public record GetWishlistQuery(int WishlistId, int? UserId) : IRequest<Wishlist?>;
