

namespace AudioVerse.API.Models.Requests.Radio;

/// <summary>Request to add an external radio station.</summary>
public record ExternalRadioStationRequest(string Name, string Slug, string StreamUrl, string? WebsiteUrl, string? LogoUrl, string? CountryCode, string? CountryName, string? Language, string? Genre, int? BitrateKbps);
