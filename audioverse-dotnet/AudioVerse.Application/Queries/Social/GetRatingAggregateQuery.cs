using AudioVerse.Domain.Entities.Social;
using AudioVerse.Domain.Enums;
using MediatR;

namespace AudioVerse.Application.Queries.Social;

/// <summary>Get rating aggregate (averages, counts) for an entity.</summary>
public record GetRatingAggregateQuery(RateableEntityType EntityType, int EntityId) : IRequest<RatingAggregate>;
