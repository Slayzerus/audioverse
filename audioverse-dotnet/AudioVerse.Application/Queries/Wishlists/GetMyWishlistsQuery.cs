using MediatR;

namespace AudioVerse.Application.Queries.Wishlists;

/// <summary>Get wishlists for the authenticated user.</summary>
public record GetMyWishlistsQuery(int UserId) : IRequest<IEnumerable<WishlistSummaryDto>>;
