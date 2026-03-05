namespace AudioVerse.Domain.Entities.Vendors;

/// <summary>
/// Zdjęcie w portfolio / galerii vendora.
/// </summary>
public class VendorPortfolioItem
{
    public int Id { get; set; }
    public int VendorProfileId { get; set; }

    public string? Title { get; set; }
    public string? Description { get; set; }
    public string ImageUrl { get; set; } = string.Empty;

    /// <summary>Typ: photo, video (link YouTube/Vimeo).</summary>
    public string MediaType { get; set; } = "photo";

    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
