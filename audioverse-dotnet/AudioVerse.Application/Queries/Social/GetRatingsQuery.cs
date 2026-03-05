using AudioVerse.Domain.Entities.Social;
using AudioVerse.Domain.Enums;
using MediatR;

namespace AudioVerse.Application.Queries.Social;

/// <summary>Get ratings for an entity (paged).</summary>
public record GetRatingsQuery(
    RateableEntityType EntityType,
    int EntityId,
    int Page,
    int PageSize
) : IRequest<GetRatingsResult>;
