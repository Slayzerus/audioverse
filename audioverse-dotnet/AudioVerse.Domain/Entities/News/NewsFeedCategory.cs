namespace AudioVerse.Domain.Entities.News;

/// <summary>
/// Kategoria feedów RSS (np. Muzyka, Sport, Gry, Filmy, Technologia).
/// </summary>
public class NewsFeedCategory
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<NewsFeed> Feeds { get; set; } = new List<NewsFeed>();
}
