namespace AudioVerse.API.Areas.Events.Controllers;

public class CreateLocationRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? StreetAddress { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
    public string? CountryCode { get; set; }
    public string? FormattedAddress { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? GooglePlaceId { get; set; }
    public long? OsmNodeId { get; set; }
    public string? OsmType { get; set; }
    public string? TimeZone { get; set; }
    public string? VirtualUrl { get; set; }
    public bool IsVirtual { get; set; }
    public string? Phone { get; set; }
    public string? Website { get; set; }
    public string? AccessInstructions { get; set; }
    public int? Capacity { get; set; }
    public bool HasParking { get; set; }
    public bool IsWheelchairAccessible { get; set; }
    public bool HasPublicTransport { get; set; }
}
