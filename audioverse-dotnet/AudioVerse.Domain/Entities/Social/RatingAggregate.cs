using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.Social;

/// <summary>
/// Aggregated rating summary for a specific entity.
/// Pre-computed for fast reads — updated on every rating change.
/// </summary>
public class RatingAggregate
{
    public int Id { get; set; }

    /// <summary>Type of entity.</summary>
    public RateableEntityType EntityType { get; set; }

    /// <summary>Primary key of the entity.</summary>
    public int EntityId { get; set; }

    /// <summary>Total number of ratings.</summary>
    public int RatingCount { get; set; }

    /// <summary>Average overall score (1.0–10.0).</summary>
    public double AverageOverall { get; set; }

    /// <summary>Average criterion 1 score.</summary>
    public double? AverageCriterion1 { get; set; }

    /// <summary>Average criterion 2 score.</summary>
    public double? AverageCriterion2 { get; set; }

    /// <summary>Average criterion 3 score.</summary>
    public double? AverageCriterion3 { get; set; }

    /// <summary>Number of reviews with text.</summary>
    public int ReviewCount { get; set; }

    public DateTime LastUpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
