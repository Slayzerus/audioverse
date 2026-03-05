namespace AudioVerse.Infrastructure.ExternalApis;

/// <summary>
/// Multi-provider geocoding service interface.
/// Supports: Google Maps, OpenStreetMap/Nominatim, Mapbox, HERE.
/// </summary>
public interface IGeocodingService
{
    /// <summary>Search for places by text query.</summary>
    Task<List<GeocodingResult>> SearchAsync(string query, string? region = null, int limit = 10, CancellationToken ct = default);

    /// <summary>Geocode an address to coordinates.</summary>
    Task<GeocodingResult?> GeocodeAsync(string address, CancellationToken ct = default);

    /// <summary>Reverse geocode coordinates to address.</summary>
    Task<GeocodingResult?> ReverseGeocodeAsync(double lat, double lng, CancellationToken ct = default);

    /// <summary>Get detailed place information.</summary>
    Task<PlaceDetails?> GetPlaceDetailsAsync(string placeId, CancellationToken ct = default);

    /// <summary>Autocomplete place search.</summary>
    Task<List<GeocodingResult>> AutocompleteAsync(string input, double? lat = null, double? lng = null, int limit = 5, CancellationToken ct = default);

    /// <summary>Get directions between two points.</summary>
    Task<DirectionsResult?> GetDirectionsAsync(double originLat, double originLng, double destLat, double destLng, string mode = "driving", CancellationToken ct = default);

    /// <summary>Get timezone for coordinates.</summary>
    Task<string?> GetTimezoneAsync(double lat, double lng, CancellationToken ct = default);
}
