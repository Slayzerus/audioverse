namespace AudioVerse.Infrastructure.ExternalApis;

/// <summary>Place details with additional info.</summary>
public class PlaceDetails : GeocodingResult
{
    public string? Phone { get; set; }
    public string? Website { get; set; }
    public double? Rating { get; set; }
    public int? UserRatingsTotal { get; set; }
    public List<string> Types { get; set; } = [];
    public OpeningHours? OpeningHours { get; set; }
    public List<string> PhotoUrls { get; set; } = [];
}
