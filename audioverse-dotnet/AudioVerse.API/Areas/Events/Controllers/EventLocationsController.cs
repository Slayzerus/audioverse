using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.ExternalApis;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.Events.Controllers;

/// <summary>
/// Event locations and geolocation services.
/// Supports multiple map providers (Google Maps, OpenStreetMap, Mapbox).
/// </summary>
[ApiController]
[Route("api/events/locations")]
[Authorize]
[Produces("application/json")]
[Tags("Events - Locations")]
public class EventLocationsController : ControllerBase
{
    private readonly ILocationRepository _locationRepo;
    private readonly IEventRepository _eventRepo;
    private readonly IGeocodingService? _geocoding;
    private readonly ILogger<EventLocationsController> _logger;

    public EventLocationsController(
        ILocationRepository locationRepo,
        IEventRepository eventRepo,
        IGeocodingService? geocoding,
        ILogger<EventLocationsController> logger)
    {
        _locationRepo = locationRepo;
        _eventRepo = eventRepo;
        _geocoding = geocoding;
        _logger = logger;
    }

    // ????????????????????????????????????????????????????????????
    //  LOCATION CRUD
    // ????????????????????????????????????????????????????????????

    /// <summary>
    /// Get all saved locations.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<EventLocation>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLocations()
    {
        var locations = await _locationRepo.GetAllAsync();
        return Ok(locations);
    }

    /// <summary>
    /// Get a location by ID.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(EventLocation), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetLocation(int id)
    {
        var location = await _locationRepo.GetByIdAsync(id);
        return location != null ? Ok(location) : NotFound();
    }

    /// <summary>
    /// Create a new location.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateLocation([FromBody] CreateLocationRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { Message = "Name is required" });

        var location = new EventLocation
        {
            Name = request.Name,
            Description = request.Description,
            StreetAddress = request.StreetAddress,
            City = request.City,
            State = request.State,
            PostalCode = request.PostalCode,
            Country = request.Country,
            CountryCode = request.CountryCode,
            FormattedAddress = request.FormattedAddress,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            GooglePlaceId = request.GooglePlaceId,
            OsmNodeId = request.OsmNodeId,
            OsmType = request.OsmType,
            TimeZone = request.TimeZone,
            VirtualUrl = request.VirtualUrl,
            IsVirtual = request.IsVirtual,
            Phone = request.Phone,
            Website = request.Website,
            AccessInstructions = request.AccessInstructions,
            Capacity = request.Capacity,
            HasParking = request.HasParking,
            IsWheelchairAccessible = request.IsWheelchairAccessible,
            HasPublicTransport = request.HasPublicTransport
        };

        // Auto-geocode if coordinates not provided
        if (!location.Latitude.HasValue && !string.IsNullOrEmpty(location.FormattedAddress) && _geocoding != null)
        {
            var geocoded = await _geocoding.GeocodeAsync(location.FormattedAddress);
            if (geocoded != null)
            {
                location.Latitude = geocoded.Latitude;
                location.Longitude = geocoded.Longitude;
                location.GooglePlaceId ??= geocoded.PlaceId;
            }
        }

        // Auto-get timezone if not provided
        if (string.IsNullOrEmpty(location.TimeZone) && location.Latitude.HasValue && location.Longitude.HasValue && _geocoding != null)
        {
            location.TimeZone = await _geocoding.GetTimezoneAsync(location.Latitude.Value, location.Longitude.Value);
        }

        var id = await _locationRepo.CreateAsync(location);

        return CreatedAtAction(nameof(GetLocation), new { id }, new { Id = id });
    }

    /// <summary>
    /// Update a location.
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateLocation(int id, [FromBody] CreateLocationRequest request)
    {
        var location = await _locationRepo.GetByIdAsync(id);
        if (location == null) return NotFound();

        location.Name = request.Name ?? location.Name;
        location.Description = request.Description ?? location.Description;
        location.StreetAddress = request.StreetAddress ?? location.StreetAddress;
        location.City = request.City ?? location.City;
        location.State = request.State ?? location.State;
        location.PostalCode = request.PostalCode ?? location.PostalCode;
        location.Country = request.Country ?? location.Country;
        location.CountryCode = request.CountryCode ?? location.CountryCode;
        location.FormattedAddress = request.FormattedAddress ?? location.FormattedAddress;
        location.Latitude = request.Latitude ?? location.Latitude;
        location.Longitude = request.Longitude ?? location.Longitude;
        location.GooglePlaceId = request.GooglePlaceId ?? location.GooglePlaceId;
        location.TimeZone = request.TimeZone ?? location.TimeZone;
        location.VirtualUrl = request.VirtualUrl ?? location.VirtualUrl;
        location.IsVirtual = request.IsVirtual;
        location.Phone = request.Phone ?? location.Phone;
        location.Website = request.Website ?? location.Website;
        location.AccessInstructions = request.AccessInstructions ?? location.AccessInstructions;
        location.Capacity = request.Capacity ?? location.Capacity;
        location.HasParking = request.HasParking;
        location.IsWheelchairAccessible = request.IsWheelchairAccessible;
        location.HasPublicTransport = request.HasPublicTransport;
        location.UpdatedAt = DateTime.UtcNow;

        await _locationRepo.UpdateAsync(location);
        return Ok(new { Success = true });
    }

    /// <summary>
    /// Delete a location.
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteLocation(int id)
    {
        var ok = await _locationRepo.DeleteAsync(id);
        return ok ? NoContent() : NotFound();
    }

    // ????????????????????????????????????????????????????????????
    //  GEOCODING / SEARCH
    // ????????????????????????????????????????????????????????????

    /// <summary>
    /// Search for places using configured map providers.
    /// Falls back to free OpenStreetMap if no paid API keys configured.
    /// </summary>
    /// <param name="query">Search query (address, place name, etc.)</param>
    /// <param name="region">Optional: country/region code to bias results</param>
    /// <param name="limit">Maximum results (default 10)</param>
    /// <summary>Search Places.</summary>
    [HttpGet("search")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<GeocodingResult>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> SearchPlaces([FromQuery] string query, [FromQuery] string? region = null, [FromQuery] int limit = 10)
    {
        if (_geocoding == null)
            return StatusCode(503, new { Message = "Geocoding service not configured" });

        if (string.IsNullOrWhiteSpace(query))
            return BadRequest(new { Message = "Query is required" });

        var results = await _geocoding.SearchAsync(query, region, limit);
        return Ok(new { Count = results.Count, Results = results });
    }

    /// <summary>
    /// Autocomplete for place search (real-time suggestions).
    /// </summary>
    /// <param name="input">Partial search input</param>
    /// <param name="lat">Optional: user's latitude for proximity bias</param>
    /// <param name="lng">Optional: user's longitude for proximity bias</param>
    /// <param name="limit">Maximum suggestions (default 5)</param>
    /// <summary>Autocomplete Places.</summary>
    [HttpGet("autocomplete")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<GeocodingResult>), StatusCodes.Status200OK)]
    public async Task<IActionResult> AutocompletePlaces([FromQuery] string input, [FromQuery] double? lat = null, [FromQuery] double? lng = null, [FromQuery] int limit = 5)
    {
        if (_geocoding == null)
            return StatusCode(503, new { Message = "Geocoding service not configured" });

        if (string.IsNullOrWhiteSpace(input))
            return Ok(new { Results = Array.Empty<GeocodingResult>() });

        var results = await _geocoding.AutocompleteAsync(input, lat, lng, limit);
        return Ok(new { Results = results });
    }

    /// <summary>
    /// Get detailed information about a place by its ID.
    /// </summary>
    /// <param name="placeId">Place ID from search results (Google/OSM/Mapbox)</param>
    [HttpGet("place/{placeId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PlaceDetails), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPlaceDetails(string placeId)
    {
        if (_geocoding == null)
            return StatusCode(503, new { Message = "Geocoding service not configured" });

        var details = await _geocoding.GetPlaceDetailsAsync(placeId);
        return details != null ? Ok(details) : NotFound();
    }

    /// <summary>
    /// Geocode an address to coordinates.
    /// </summary>
    /// <param name="address">Full address string</param>
    [HttpGet("geocode")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(GeocodingResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Geocode([FromQuery] string address)
    {
        if (_geocoding == null)
            return StatusCode(503, new { Message = "Geocoding service not configured" });

        var result = await _geocoding.GeocodeAsync(address);
        return result != null ? Ok(result) : NotFound(new { Message = "Address not found" });
    }

    /// <summary>
    /// Reverse geocode coordinates to an address.
    /// </summary>
    /// <param name="lat">Latitude</param>
    /// <param name="lng">Longitude</param>
    [HttpGet("reverse")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(GeocodingResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReverseGeocode([FromQuery] double lat, [FromQuery] double lng)
    {
        if (_geocoding == null)
            return StatusCode(503, new { Message = "Geocoding service not configured" });

        var result = await _geocoding.ReverseGeocodeAsync(lat, lng);
        return result != null ? Ok(result) : NotFound(new { Message = "Location not found" });
    }

    /// <summary>
    /// Get timezone for coordinates.
    /// </summary>
    /// <param name="lat">Latitude</param>
    /// <param name="lng">Longitude</param>
    [HttpGet("timezone")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTimezone([FromQuery] double lat, [FromQuery] double lng)
    {
        if (_geocoding == null)
            return StatusCode(503, new { Message = "Geocoding service not configured" });

        var timezone = await _geocoding.GetTimezoneAsync(lat, lng);
        return Ok(new { Latitude = lat, Longitude = lng, TimeZone = timezone });
    }

    /// <summary>
    /// Get directions between two points.
    /// </summary>
    /// <param name="originLat">Origin latitude</param>
    /// <param name="originLng">Origin longitude</param>
    /// <param name="destLat">Destination latitude</param>
    /// <param name="destLng">Destination longitude</param>
    /// <param name="mode">Travel mode: driving, walking, bicycling, transit</param>
    /// <summary>Get Directions.</summary>
    [HttpGet("directions")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(DirectionsResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDirections(
        [FromQuery] double originLat,
        [FromQuery] double originLng,
        [FromQuery] double destLat,
        [FromQuery] double destLng,
        [FromQuery] string mode = "driving")
    {
        if (_geocoding == null)
            return StatusCode(503, new { Message = "Geocoding service not configured" });

        var result = await _geocoding.GetDirectionsAsync(originLat, originLng, destLat, destLng, mode);
        return result != null ? Ok(result) : NotFound(new { Message = "Route not found" });
    }

    // ????????????????????????????????????????????????????????????
    //  EVENT-LOCATION ASSIGNMENT
    // ????????????????????????????????????????????????????????????

    /// <summary>
    /// Assign a location to an event.
    /// </summary>
    [HttpPost("/api/events/{eventId:int}/location")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignLocationToEvent(int eventId, [FromBody] AssignLocationRequest request)
    {
        var evt = await _eventRepo.GetEventByIdAsync(eventId);
        if (evt == null) return NotFound(new { Message = "Event not found" });

        if (request.LocationId.HasValue)
        {
            var location = await _locationRepo.GetByIdAsync(request.LocationId.Value);
            if (location == null) return NotFound(new { Message = "Location not found" });
            evt.LocationId = request.LocationId;
        }
        else if (request.Location != null)
        {
            var location = new EventLocation
            {
                Name = request.Location.Name ?? "Event Location",
                FormattedAddress = request.Location.FormattedAddress,
                Latitude = request.Location.Latitude,
                Longitude = request.Location.Longitude,
                GooglePlaceId = request.Location.GooglePlaceId,
                IsVirtual = request.Location.IsVirtual,
                VirtualUrl = request.Location.VirtualUrl
            };
            var locId = await _locationRepo.CreateAsync(location);
            evt.LocationId = locId;
        }

        await _eventRepo.UpdateEventAsync(evt);
        return Ok(new { Success = true, LocationId = evt.LocationId });
    }

    /// <summary>
    /// Get location for an event.
    /// </summary>
    [HttpGet("/api/events/{eventId:int}/location")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(EventLocation), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEventLocation(int eventId)
    {
        var evt = await _eventRepo.GetEventWithLocationAsync(eventId);

        if (evt == null) return NotFound(new { Message = "Event not found" });
        if (evt.Location == null) return NotFound(new { Message = "Event has no location" });

        return Ok(evt.Location);
    }

    // ????????????????????????????????????????????????????????????
    //  NEARBY EVENTS
    // ????????????????????????????????????????????????????????????

    /// <summary>
    /// Find public events near a location.
    /// </summary>
    /// <param name="lat">Latitude</param>
    /// <param name="lng">Longitude</param>
    /// <param name="radiusKm">Search radius in kilometers (default 50)</param>
    /// <param name="fromDate">Filter events starting from this date</param>
    /// <summary>Get Nearby Events.</summary>
    [HttpGet("nearby-events")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNearbyEvents(
        [FromQuery] double lat,
        [FromQuery] double lng,
        [FromQuery] double radiusKm = 50,
        [FromQuery] DateTime? fromDate = null)
    {
        var startDate = fromDate ?? DateTime.UtcNow;

        var nearbyLocations = await _locationRepo.FindNearbyAsync(lat, lng, radiusKm);
        var locationIds = nearbyLocations.Select(l => l.Id).ToHashSet();

        var allEvents = await _eventRepo.GetPublicEventsFromAsync(startDate, 50);
        var events = allEvents
            .Where(e => e.LocationId.HasValue && locationIds.Contains(e.LocationId.Value))
            .Select(e =>
            {
                var loc = nearbyLocations.FirstOrDefault(l => l.Id == e.LocationId);
                return new
                {
                    e.Id,
                    e.Title,
                    e.Description,
                    e.Type,
                    e.StartTime,
                    e.EndTime,
                    Location = loc == null ? null : new
                    {
                        loc.Name,
                        loc.FormattedAddress,
                        loc.Latitude,
                        loc.Longitude,
                        loc.City,
                        loc.Country
                    }
                };
            })
            .ToList();

        // Calculate actual distances
        var results = events.Select(e => new
        {
            e.Id,
            e.Title,
            e.Description,
            e.Type,
            e.StartTime,
            e.EndTime,
            e.Location,
            DistanceKm = e.Location?.Latitude != null
                ? CalculateDistance(lat, lng, e.Location.Latitude.Value, e.Location.Longitude!.Value)
                : (double?)null
        })
        .Where(e => e.DistanceKm == null || e.DistanceKm <= radiusKm)
        .OrderBy(e => e.DistanceKm)
        .ToList();

        return Ok(new { Count = results.Count, Events = results });
    }

    private static double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371; // Earth's radius in km
        var dLat = ToRad(lat2 - lat1);
        var dLon = ToRad(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return Math.Round(R * c, 2);
    }

    private static double ToRad(double deg) => deg * Math.PI / 180;
}
