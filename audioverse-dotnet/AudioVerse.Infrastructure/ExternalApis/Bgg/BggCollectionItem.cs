namespace AudioVerse.Infrastructure.ExternalApis.Bgg;

/// <summary>
/// Item in a user's BGG collection.
/// </summary>
public class BggCollectionItem
{
    public int BggId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int? YearPublished { get; set; }
    public string? ThumbnailUrl { get; set; }
    public bool Owned { get; set; }
    public bool WantToPlay { get; set; }
    public bool WantToBuy { get; set; }
    public bool Wishlist { get; set; }
    public int? NumPlays { get; set; }
    public double? UserRating { get; set; }
}
