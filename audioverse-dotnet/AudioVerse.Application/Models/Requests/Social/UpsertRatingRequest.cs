namespace AudioVerse.Application.Models.Requests.Social;

/// <summary>Request to upsert a rating for any entity.</summary>
public record UpsertRatingRequest(
    string EntityType,
    int EntityId,
    int PlayerId,
    int OverallScore,
    string? Criterion1,
    int? Criterion1Score,
    string? Criterion2,
    int? Criterion2Score,
    string? Criterion3,
    int? Criterion3Score,
    string? ReviewText,
    bool ContainsSpoilers = false
);
