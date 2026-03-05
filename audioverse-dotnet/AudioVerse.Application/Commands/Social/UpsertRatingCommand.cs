using AudioVerse.Domain.Enums;
using MediatR;

namespace AudioVerse.Application.Commands.Social;

/// <summary>Upsert a rating (one per player per entity). Returns the rating ID.</summary>
public record UpsertRatingCommand(
    RateableEntityType EntityType,
    int EntityId,
    int PlayerId,
    int OverallScore,
    RatingCriterion? Criterion1,
    int? Criterion1Score,
    RatingCriterion? Criterion2,
    int? Criterion2Score,
    RatingCriterion? Criterion3,
    int? Criterion3Score,
    string? ReviewText,
    bool ContainsSpoilers
) : IRequest<int>;
