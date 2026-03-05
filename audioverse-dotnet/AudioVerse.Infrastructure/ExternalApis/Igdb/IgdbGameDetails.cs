namespace AudioVerse.Infrastructure.ExternalApis.Igdb;

public class IgdbGameDetails
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string? CoverUrl { get; set; }
    public double? Rating { get; set; }
    public int? FirstReleaseDate { get; set; }
    public List<string> Genres { get; set; } = new();
    public List<string> Platforms { get; set; } = new();
    public int? MinPlayers { get; set; }
    public int? MaxPlayers { get; set; }
}
