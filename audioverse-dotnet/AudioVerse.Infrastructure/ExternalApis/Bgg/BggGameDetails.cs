namespace AudioVerse.Infrastructure.ExternalApis.Bgg;

/// <summary>
/// Detailed info from BoardGameGeek.
/// </summary>
public class BggGameDetails
{
    public int BggId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int MinPlayers { get; set; }
    public int MaxPlayers { get; set; }
    public int? PlayingTimeMinutes { get; set; }
    public int? MinAge { get; set; }
    public int? YearPublished { get; set; }
    public string? ImageUrl { get; set; }
    public string? ThumbnailUrl { get; set; }
    public double? AverageRating { get; set; }
    public int? UsersRated { get; set; }
    public double? Weight { get; set; }
    public int? Rank { get; set; }
    public List<string> Categories { get; set; } = [];
    public List<string> Mechanics { get; set; } = [];
    public List<string> Designers { get; set; } = [];
    public List<string> Artists { get; set; } = [];
    public List<string> Publishers { get; set; } = [];
}
