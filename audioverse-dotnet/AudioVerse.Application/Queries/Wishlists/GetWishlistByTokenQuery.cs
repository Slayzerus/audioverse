using AudioVerse.Domain.Entities.Wishlists;
using MediatR;

namespace AudioVerse.Application.Queries.Wishlists;

/// <summary>Pobierz wishlistę po publicznym tokenie.</summary>
public record GetWishlistByTokenQuery(string Token) : IRequest<Wishlist?>;
