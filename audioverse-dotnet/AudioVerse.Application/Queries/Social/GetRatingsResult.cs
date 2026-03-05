using AudioVerse.Domain.Entities.Social;

namespace AudioVerse.Application.Queries.Social;

/// <summary>Paged result of ratings for an entity.</summary>
public record GetRatingsResult(IEnumerable<UserRating> Items, int TotalCount);
