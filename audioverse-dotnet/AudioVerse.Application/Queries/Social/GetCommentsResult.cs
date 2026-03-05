using AudioVerse.Domain.Entities.Social;

namespace AudioVerse.Application.Queries.Social;

/// <summary>Paged result of comments for an entity.</summary>
public record GetCommentsResult(IEnumerable<UserComment> Items, int TotalCount);
