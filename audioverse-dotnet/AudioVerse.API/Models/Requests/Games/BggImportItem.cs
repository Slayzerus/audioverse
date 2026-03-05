namespace AudioVerse.API.Models.Requests.Games;

/// <summary>
/// DTO for importing BGG game catalog entries.
/// </summary>
public class BggImportItem
{
    public int BggId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int MinPlayers { get; set; }
    public int MaxPlayers { get; set; }
    public int? EstimatedDurationMinutes { get; set; }
    public string? BggImageUrl { get; set; }
    public string? BggThumbnailUrl { get; set; }
    public double? BggRating { get; set; }
    public int? BggYearPublished { get; set; }
    public double? BggWeight { get; set; }
    public int? BggRank { get; set; }
    public int? BggUsersRated { get; set; }
    public int? BggMinAge { get; set; }
    public string? BggCategories { get; set; }
    public string? BggMechanics { get; set; }
    public string? BggDesigners { get; set; }
    public string? BggPublishers { get; set; }
    public DateTime? BggLastSyncUtc { get; set; }
}
