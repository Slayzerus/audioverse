namespace AudioVerse.Infrastructure.ExternalApis;

/// <summary>Result from geocoding/place search.</summary>
public class GeocodingResult
{
    public string? PlaceId { get; set; }
    public string? FormattedAddress { get; set; }
    public string? Name { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string? StreetAddress { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
    public string? CountryCode { get; set; }
    public string? Provider { get; set; }
    public string? TimeZone { get; set; }
}
