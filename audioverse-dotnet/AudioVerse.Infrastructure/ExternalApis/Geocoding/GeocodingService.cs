using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Infrastructure.ExternalApis;

/// <summary>
/// Multi-provider geocoding service with fallback.
/// Supports: Google Maps, OpenStreetMap/Nominatim, Mapbox, HERE.
/// Falls back to free providers if paid APIs are unavailable.
/// </summary>
public class GeocodingService : IGeocodingService
{
    private readonly HttpClient _http;
    private readonly string? _googleApiKey;
    private readonly string? _mapboxToken;
    private readonly string? _hereApiKey;
    private readonly ILogger<GeocodingService>? _logger;

    public GeocodingService(HttpClient http, IConfiguration? configuration = null, ILogger<GeocodingService>? logger = null)
    {
        _http = http;
        _http.DefaultRequestHeaders.UserAgent.TryParseAdd("AudioVerse/1.0");
        _logger = logger;

        _googleApiKey = configuration?["GoogleMaps:ApiKey"] ?? Environment.GetEnvironmentVariable("GOOGLE_MAPS_API_KEY");
        _mapboxToken = configuration?["Mapbox:AccessToken"] ?? Environment.GetEnvironmentVariable("MAPBOX_ACCESS_TOKEN");
        _hereApiKey = configuration?["Here:ApiKey"] ?? Environment.GetEnvironmentVariable("HERE_API_KEY");
    }

    public async Task<List<GeocodingResult>> SearchAsync(string query, string? region = null, int limit = 10, CancellationToken ct = default)
    {
        if (!string.IsNullOrEmpty(_googleApiKey))
        {
            var results = await SearchGoogleAsync(query, region, limit, ct);
            if (results.Count > 0) return results;
        }

        if (!string.IsNullOrEmpty(_mapboxToken))
        {
            var results = await SearchMapboxAsync(query, region, limit, ct);
            if (results.Count > 0) return results;
        }

        return await SearchNominatimAsync(query, limit, ct);
    }

    public async Task<GeocodingResult?> GeocodeAsync(string address, CancellationToken ct = default)
    {
        var results = await SearchAsync(address, limit: 1, ct: ct);
        return results.FirstOrDefault();
    }

    public async Task<GeocodingResult?> ReverseGeocodeAsync(double lat, double lng, CancellationToken ct = default)
    {
        if (!string.IsNullOrEmpty(_googleApiKey))
        {
            var result = await ReverseGeocodeGoogleAsync(lat, lng, ct);
            if (result != null) return result;
        }

        return await ReverseGeocodeNominatimAsync(lat, lng, ct);
    }

    public async Task<PlaceDetails?> GetPlaceDetailsAsync(string placeId, CancellationToken ct = default)
    {
        if (!string.IsNullOrEmpty(_googleApiKey) && !placeId.StartsWith("osm:"))
            return await GetPlaceDetailsGoogleAsync(placeId, ct);

        if (placeId.StartsWith("osm:"))
            return await GetPlaceDetailsNominatimAsync(placeId, ct);

        return null;
    }

    public async Task<List<GeocodingResult>> AutocompleteAsync(string input, double? lat = null, double? lng = null, int limit = 5, CancellationToken ct = default)
    {
        if (!string.IsNullOrEmpty(_googleApiKey))
            return await AutocompleteGoogleAsync(input, lat, lng, limit, ct);

        if (!string.IsNullOrEmpty(_mapboxToken))
            return await AutocompleteMapboxAsync(input, lat, lng, limit, ct);

        return await SearchNominatimAsync(input, limit, ct);
    }

    public async Task<DirectionsResult?> GetDirectionsAsync(double originLat, double originLng, double destLat, double destLng, string mode = "driving", CancellationToken ct = default)
    {
        if (!string.IsNullOrEmpty(_googleApiKey))
            return await GetDirectionsGoogleAsync(originLat, originLng, destLat, destLng, mode, ct);

        return await GetDirectionsOsrmAsync(originLat, originLng, destLat, destLng, ct);
    }

    public async Task<string?> GetTimezoneAsync(double lat, double lng, CancellationToken ct = default)
    {
        if (!string.IsNullOrEmpty(_googleApiKey))
        {
            var url = $"https://maps.googleapis.com/maps/api/timezone/json?location={lat},{lng}&timestamp={DateTimeOffset.UtcNow.ToUnixTimeSeconds()}&key={_googleApiKey}";
            var response = await _http.GetFromJsonAsync<JsonElement>(url, ct);
            if (response.TryGetProperty("timeZoneId", out var tz))
                return tz.GetString();
        }

        var offsetHours = (int)Math.Round(lng / 15.0);
        return $"Etc/GMT{(offsetHours >= 0 ? "-" : "+")}{Math.Abs(offsetHours)}";
    }

    // ── GOOGLE MAPS ──

    private async Task<List<GeocodingResult>> SearchGoogleAsync(string query, string? region, int limit, CancellationToken ct)
    {
        try
        {
            var url = $"https://maps.googleapis.com/maps/api/place/textsearch/json?query={Uri.EscapeDataString(query)}&key={_googleApiKey}";
            if (!string.IsNullOrEmpty(region)) url += $"&region={region}";

            var response = await _http.GetFromJsonAsync<JsonElement>(url, ct);
            if (!response.TryGetProperty("results", out var results)) return [];

            return results.EnumerateArray().Take(limit).Select(r => ParseGooglePlace(r)).ToList();
        }
        catch (Exception ex) { _logger?.LogWarning(ex, "Google Places search failed"); return []; }
    }

    private async Task<List<GeocodingResult>> AutocompleteGoogleAsync(string input, double? lat, double? lng, int limit, CancellationToken ct)
    {
        try
        {
            var url = $"https://maps.googleapis.com/maps/api/place/autocomplete/json?input={Uri.EscapeDataString(input)}&key={_googleApiKey}";
            if (lat.HasValue && lng.HasValue) url += $"&location={lat},{lng}&radius=50000";

            var response = await _http.GetFromJsonAsync<JsonElement>(url, ct);
            if (!response.TryGetProperty("predictions", out var predictions)) return [];

            return predictions.EnumerateArray().Take(limit).Select(p => new GeocodingResult
            {
                PlaceId = p.GetProperty("place_id").GetString(),
                FormattedAddress = p.GetProperty("description").GetString(),
                Name = p.TryGetProperty("structured_formatting", out var sf) ? sf.GetProperty("main_text").GetString() : null,
                Provider = "Google"
            }).ToList();
        }
        catch (Exception ex) { _logger?.LogWarning(ex, "Google autocomplete failed"); return []; }
    }

    private async Task<GeocodingResult?> ReverseGeocodeGoogleAsync(double lat, double lng, CancellationToken ct)
    {
        try
        {
            var url = $"https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lng}&key={_googleApiKey}";
            var response = await _http.GetFromJsonAsync<JsonElement>(url, ct);
            if (response.TryGetProperty("results", out var results) && results.GetArrayLength() > 0)
                return ParseGoogleGeocodeResult(results[0]);
            return null;
        }
        catch (Exception ex) { _logger?.LogWarning(ex, "Google reverse geocode failed"); return null; }
    }

    private async Task<PlaceDetails?> GetPlaceDetailsGoogleAsync(string placeId, CancellationToken ct)
    {
        try
        {
            var url = $"https://maps.googleapis.com/maps/api/place/details/json?place_id={placeId}&fields=name,formatted_address,geometry,formatted_phone_number,website,rating,user_ratings_total,types,opening_hours,photos,address_components&key={_googleApiKey}";
            var response = await _http.GetFromJsonAsync<JsonElement>(url, ct);
            if (!response.TryGetProperty("result", out var result)) return null;

            var details = new PlaceDetails
            {
                PlaceId = placeId, Provider = "Google",
                Name = result.TryGetProperty("name", out var n) ? n.GetString() : null,
                FormattedAddress = result.TryGetProperty("formatted_address", out var fa) ? fa.GetString() : null,
                Phone = result.TryGetProperty("formatted_phone_number", out var ph) ? ph.GetString() : null,
                Website = result.TryGetProperty("website", out var ws) ? ws.GetString() : null,
                Rating = result.TryGetProperty("rating", out var rt) ? rt.GetDouble() : null,
                UserRatingsTotal = result.TryGetProperty("user_ratings_total", out var urt) ? urt.GetInt32() : null
            };

            if (result.TryGetProperty("geometry", out var geo) && geo.TryGetProperty("location", out var loc))
            { details.Latitude = loc.GetProperty("lat").GetDouble(); details.Longitude = loc.GetProperty("lng").GetDouble(); }

            if (result.TryGetProperty("types", out var types))
                details.Types = types.EnumerateArray().Select(t => t.GetString() ?? "").Where(t => t != "").ToList();

            if (result.TryGetProperty("opening_hours", out var oh))
                details.OpeningHours = new OpeningHours
                {
                    IsOpenNow = oh.TryGetProperty("open_now", out var on) && on.GetBoolean(),
                    WeekdayText = oh.TryGetProperty("weekday_text", out var wt) ? wt.EnumerateArray().Select(d => d.GetString() ?? "").ToList() : []
                };

            ParseGoogleAddressComponents(result, details);
            return details;
        }
        catch (Exception ex) { _logger?.LogWarning(ex, "Google place details failed"); return null; }
    }

    private async Task<DirectionsResult?> GetDirectionsGoogleAsync(double originLat, double originLng, double destLat, double destLng, string mode, CancellationToken ct)
    {
        try
        {
            var url = $"https://maps.googleapis.com/maps/api/directions/json?origin={originLat},{originLng}&destination={destLat},{destLng}&mode={mode}&key={_googleApiKey}";
            var response = await _http.GetFromJsonAsync<JsonElement>(url, ct);
            if (!response.TryGetProperty("routes", out var routes) || routes.GetArrayLength() == 0) return null;

            var route = routes[0]; var leg = route.GetProperty("legs")[0];
            return new DirectionsResult
            {
                DistanceMeters = leg.GetProperty("distance").GetProperty("value").GetInt32(),
                DistanceText = leg.GetProperty("distance").GetProperty("text").GetString(),
                DurationSeconds = leg.GetProperty("duration").GetProperty("value").GetInt32(),
                DurationText = leg.GetProperty("duration").GetProperty("text").GetString(),
                EncodedPolyline = route.TryGetProperty("overview_polyline", out var poly) ? poly.GetProperty("points").GetString() : null
            };
        }
        catch (Exception ex) { _logger?.LogWarning(ex, "Google directions failed"); return null; }
    }

    private static GeocodingResult ParseGooglePlace(JsonElement place)
    {
        var result = new GeocodingResult
        {
            PlaceId = place.TryGetProperty("place_id", out var pid) ? pid.GetString() : null,
            Name = place.TryGetProperty("name", out var n) ? n.GetString() : null,
            FormattedAddress = place.TryGetProperty("formatted_address", out var fa) ? fa.GetString() : null,
            Provider = "Google"
        };
        if (place.TryGetProperty("geometry", out var geo) && geo.TryGetProperty("location", out var loc))
        { result.Latitude = loc.GetProperty("lat").GetDouble(); result.Longitude = loc.GetProperty("lng").GetDouble(); }
        return result;
    }

    private static GeocodingResult ParseGoogleGeocodeResult(JsonElement result)
    {
        var geo = new GeocodingResult
        {
            PlaceId = result.TryGetProperty("place_id", out var pid) ? pid.GetString() : null,
            FormattedAddress = result.TryGetProperty("formatted_address", out var fa) ? fa.GetString() : null,
            Provider = "Google"
        };
        if (result.TryGetProperty("geometry", out var geom) && geom.TryGetProperty("location", out var loc))
        { geo.Latitude = loc.GetProperty("lat").GetDouble(); geo.Longitude = loc.GetProperty("lng").GetDouble(); }
        ParseGoogleAddressComponents(result, geo);
        return geo;
    }

    private static void ParseGoogleAddressComponents(JsonElement result, GeocodingResult geo)
    {
        if (!result.TryGetProperty("address_components", out var components)) return;
        foreach (var comp in components.EnumerateArray())
        {
            var types = comp.GetProperty("types").EnumerateArray().Select(t => t.GetString()).ToList();
            var value = comp.GetProperty("long_name").GetString();
            var shortValue = comp.GetProperty("short_name").GetString();
            if (types.Contains("street_number") || types.Contains("route"))
                geo.StreetAddress = string.IsNullOrEmpty(geo.StreetAddress) ? value : $"{geo.StreetAddress} {value}";
            else if (types.Contains("locality")) geo.City = value;
            else if (types.Contains("administrative_area_level_1")) geo.State = value;
            else if (types.Contains("postal_code")) geo.PostalCode = value;
            else if (types.Contains("country")) { geo.Country = value; geo.CountryCode = shortValue; }
        }
    }

    // ── NOMINATIM (OpenStreetMap) — FREE ──

    private async Task<List<GeocodingResult>> SearchNominatimAsync(string query, int limit, CancellationToken ct)
    {
        try
        {
            var url = $"https://nominatim.openstreetmap.org/search?q={Uri.EscapeDataString(query)}&format=json&addressdetails=1&limit={limit}";
            var results = await _http.GetFromJsonAsync<List<JsonElement>>(url, ct);
            return results?.Select(r => ParseNominatimResult(r)).ToList() ?? [];
        }
        catch (Exception ex) { _logger?.LogWarning(ex, "Nominatim search failed"); return []; }
    }

    private async Task<GeocodingResult?> ReverseGeocodeNominatimAsync(double lat, double lng, CancellationToken ct)
    {
        try
        {
            var url = $"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json&addressdetails=1";
            var result = await _http.GetFromJsonAsync<JsonElement>(url, ct);
            return ParseNominatimResult(result);
        }
        catch (Exception ex) { _logger?.LogWarning(ex, "Nominatim reverse geocode failed"); return null; }
    }

    private async Task<PlaceDetails?> GetPlaceDetailsNominatimAsync(string placeId, CancellationToken ct)
    {
        try
        {
            var parts = placeId.Replace("osm:", "").ToCharArray();
            var osmId = new string(parts.Skip(1).ToArray());
            var url = $"https://nominatim.openstreetmap.org/lookup?osm_ids={parts[0]}{osmId}&format=json&addressdetails=1";
            var results = await _http.GetFromJsonAsync<List<JsonElement>>(url, ct);
            if (results == null || results.Count == 0) return null;

            var geo = ParseNominatimResult(results[0]);
            return new PlaceDetails
            {
                PlaceId = placeId, Name = geo.Name, FormattedAddress = geo.FormattedAddress,
                Latitude = geo.Latitude, Longitude = geo.Longitude,
                StreetAddress = geo.StreetAddress, City = geo.City, State = geo.State,
                PostalCode = geo.PostalCode, Country = geo.Country, CountryCode = geo.CountryCode,
                Provider = "OpenStreetMap"
            };
        }
        catch (Exception ex) { _logger?.LogWarning(ex, "Nominatim place details failed"); return null; }
    }

    private static GeocodingResult ParseNominatimResult(JsonElement result)
    {
        var geo = new GeocodingResult
        {
            FormattedAddress = result.TryGetProperty("display_name", out var dn) ? dn.GetString() : null,
            Latitude = double.TryParse(result.GetProperty("lat").GetString(), out var lat) ? lat : 0,
            Longitude = double.TryParse(result.GetProperty("lon").GetString(), out var lng) ? lng : 0,
            Provider = "OpenStreetMap"
        };
        if (result.TryGetProperty("osm_type", out var osmType) && result.TryGetProperty("osm_id", out var osmId))
            geo.PlaceId = $"osm:{osmType.GetString()?.ToUpperInvariant()[0] ?? 'N'}{osmId}";
        if (result.TryGetProperty("address", out var addr))
        {
            geo.Name = addr.TryGetProperty("amenity", out var am) ? am.GetString() : addr.TryGetProperty("building", out var bl) ? bl.GetString() : null;
            geo.StreetAddress = BuildStreetAddress(addr);
            geo.City = addr.TryGetProperty("city", out var c) ? c.GetString() : addr.TryGetProperty("town", out var t) ? t.GetString() : addr.TryGetProperty("village", out var v) ? v.GetString() : null;
            geo.State = addr.TryGetProperty("state", out var s) ? s.GetString() : null;
            geo.PostalCode = addr.TryGetProperty("postcode", out var pc) ? pc.GetString() : null;
            geo.Country = addr.TryGetProperty("country", out var co) ? co.GetString() : null;
            geo.CountryCode = addr.TryGetProperty("country_code", out var cc) ? cc.GetString()?.ToUpperInvariant() : null;
        }
        return geo;
    }

    private static string? BuildStreetAddress(JsonElement addr)
    {
        var parts = new List<string?>();
        if (addr.TryGetProperty("house_number", out var hn)) parts.Add(hn.GetString());
        if (addr.TryGetProperty("road", out var rd)) parts.Add(rd.GetString());
        return parts.Count > 0 ? string.Join(" ", parts.Where(p => p != null)) : null;
    }

    // ── MAPBOX ──

    private async Task<List<GeocodingResult>> SearchMapboxAsync(string query, string? region, int limit, CancellationToken ct)
    {
        try
        {
            var url = $"https://api.mapbox.com/geocoding/v5/mapbox.places/{Uri.EscapeDataString(query)}.json?access_token={_mapboxToken}&limit={limit}";
            if (!string.IsNullOrEmpty(region)) url += $"&country={region}";
            var response = await _http.GetFromJsonAsync<JsonElement>(url, ct);
            if (!response.TryGetProperty("features", out var features)) return [];
            return features.EnumerateArray().Select(f => ParseMapboxFeature(f)).ToList();
        }
        catch (Exception ex) { _logger?.LogWarning(ex, "Mapbox search failed"); return []; }
    }

    private async Task<List<GeocodingResult>> AutocompleteMapboxAsync(string input, double? lat, double? lng, int limit, CancellationToken ct)
    {
        try
        {
            var url = $"https://api.mapbox.com/geocoding/v5/mapbox.places/{Uri.EscapeDataString(input)}.json?access_token={_mapboxToken}&autocomplete=true&limit={limit}";
            if (lat.HasValue && lng.HasValue) url += $"&proximity={lng},{lat}";
            var response = await _http.GetFromJsonAsync<JsonElement>(url, ct);
            if (!response.TryGetProperty("features", out var features)) return [];
            return features.EnumerateArray().Select(f => ParseMapboxFeature(f)).ToList();
        }
        catch (Exception ex) { _logger?.LogWarning(ex, "Mapbox autocomplete failed"); return []; }
    }

    private static GeocodingResult ParseMapboxFeature(JsonElement feature)
    {
        var geo = new GeocodingResult
        {
            PlaceId = feature.TryGetProperty("id", out var id) ? id.GetString() : null,
            Name = feature.TryGetProperty("text", out var txt) ? txt.GetString() : null,
            FormattedAddress = feature.TryGetProperty("place_name", out var pn) ? pn.GetString() : null,
            Provider = "Mapbox"
        };
        if (feature.TryGetProperty("center", out var center) && center.GetArrayLength() == 2)
        { geo.Longitude = center[0].GetDouble(); geo.Latitude = center[1].GetDouble(); }
        if (feature.TryGetProperty("context", out var context))
        {
            foreach (var c in context.EnumerateArray())
            {
                var cid = c.TryGetProperty("id", out var cId) ? cId.GetString() : "";
                var ctext = c.TryGetProperty("text", out var ct2) ? ct2.GetString() : null;
                var ccode = c.TryGetProperty("short_code", out var sc) ? sc.GetString() : null;
                if (cid?.StartsWith("place") == true) geo.City = ctext;
                else if (cid?.StartsWith("region") == true) geo.State = ctext;
                else if (cid?.StartsWith("postcode") == true) geo.PostalCode = ctext;
                else if (cid?.StartsWith("country") == true) { geo.Country = ctext; geo.CountryCode = ccode?.ToUpperInvariant(); }
            }
        }
        return geo;
    }

    // ── OSRM (Open Source Routing Machine) — FREE ──

    private async Task<DirectionsResult?> GetDirectionsOsrmAsync(double originLat, double originLng, double destLat, double destLng, CancellationToken ct)
    {
        try
        {
            var url = $"https://router.project-osrm.org/route/v1/driving/{originLng},{originLat};{destLng},{destLat}?overview=full&geometries=polyline";
            var response = await _http.GetFromJsonAsync<JsonElement>(url, ct);
            if (!response.TryGetProperty("routes", out var routes) || routes.GetArrayLength() == 0) return null;
            var route = routes[0];
            return new DirectionsResult
            {
                DistanceMeters = route.GetProperty("distance").GetDouble(),
                DurationSeconds = (int)route.GetProperty("duration").GetDouble(),
                DistanceText = $"{route.GetProperty("distance").GetDouble() / 1000:F1} km",
                DurationText = FormatDuration((int)route.GetProperty("duration").GetDouble()),
                EncodedPolyline = route.TryGetProperty("geometry", out var geom) ? geom.GetString() : null
            };
        }
        catch (Exception ex) { _logger?.LogWarning(ex, "OSRM directions failed"); return null; }
    }

    private static string FormatDuration(int seconds)
    {
        var ts = TimeSpan.FromSeconds(seconds);
        return ts.TotalHours >= 1 ? $"{(int)ts.TotalHours}h {ts.Minutes}min" : $"{ts.Minutes} min";
    }
}
