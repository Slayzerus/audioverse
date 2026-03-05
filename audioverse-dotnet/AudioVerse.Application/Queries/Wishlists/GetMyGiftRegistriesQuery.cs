using MediatR;

namespace AudioVerse.Application.Queries.Wishlists;

/// <summary>Moje listy prezentowe.</summary>
public record GetMyGiftRegistriesQuery(int UserId) : IRequest<IEnumerable<GiftRegistrySummaryDto>>;
