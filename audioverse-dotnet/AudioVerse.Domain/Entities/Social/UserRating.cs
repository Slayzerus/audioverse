using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.Social;

/// <summary>
/// Universal user rating for any entity in the system.
/// Uses EntityType + EntityId polymorphism. Supports 3 criteria scores + overall + review text.
/// One rating per player per entity (upsert semantics).
/// </summary>
public class UserRating
{
    public int Id { get; set; }

    /// <summary>Type of entity being rated.</summary>
    public RateableEntityType EntityType { get; set; }

    /// <summary>Primary key of the rated entity.</summary>
    public int EntityId { get; set; }

    public int PlayerId { get; set; }
    public UserProfilePlayer? Player { get; set; }

    /// <summary>Overall score (1–10).</summary>
    public int OverallScore { get; set; }

    /// <summary>First criterion score (1–10). Meaning depends on EntityType.</summary>
    public int? Criterion1Score { get; set; }

    /// <summary>Which criterion Criterion1Score represents.</summary>
    public RatingCriterion? Criterion1 { get; set; }

    /// <summary>Second criterion score (1–10).</summary>
    public int? Criterion2Score { get; set; }

    /// <summary>Which criterion Criterion2Score represents.</summary>
    public RatingCriterion? Criterion2 { get; set; }

    /// <summary>Third criterion score (1–10).</summary>
    public int? Criterion3Score { get; set; }

    /// <summary>Which criterion Criterion3Score represents.</summary>
    public RatingCriterion? Criterion3 { get; set; }

    /// <summary>Optional review text (Markdown-capable).</summary>
    public string? ReviewText { get; set; }

    /// <summary>Whether this review contains spoilers.</summary>
    public bool ContainsSpoilers { get; set; }

    public bool IsDeleted { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
