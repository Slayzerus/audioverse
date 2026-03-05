using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Infrastructure.Repositories;

/// <summary>
/// Entity Framework implementation of ILocationRepository.
/// Handles event locations with geospatial queries.
/// </summary>
public class LocationRepositoryEF : ILocationRepository
{
    private readonly AudioVerseDbContext _dbContext;
    private readonly ILogger<LocationRepositoryEF> _logger;

    public LocationRepositoryEF(AudioVerseDbContext dbContext, ILogger<LocationRepositoryEF> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<int> CreateAsync(EventLocation location)
    {
        location.CreatedAt = DateTime.UtcNow;
        _dbContext.EventLocations.Add(location);
        await _dbContext.SaveChangesAsync();
        return location.Id;
    }

    /// <inheritdoc />
    public async Task<EventLocation?> GetByIdAsync(int id)
    {
        return await _dbContext.EventLocations.FindAsync(id);
    }

    /// <inheritdoc />
    public async Task<IEnumerable<EventLocation>> GetAllAsync()
    {
        return await _dbContext.EventLocations
            .OrderBy(l => l.Name)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<IEnumerable<EventLocation>> GetByUserAsync(int userId)
    {
        // Note: EventLocation doesn't have a direct CreatedByUserId field
        // This would need to be added if user-specific locations are needed
        return await _dbContext.EventLocations
            .OrderBy(l => l.Name)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<bool> UpdateAsync(EventLocation location)
    {
        var existing = await _dbContext.EventLocations.FindAsync(location.Id);
        if (existing == null) return false;

        existing.Name = location.Name;
        existing.Description = location.Description;
        existing.StreetAddress = location.StreetAddress;
        existing.City = location.City;
        existing.State = location.State;
        existing.PostalCode = location.PostalCode;
        existing.Country = location.Country;
        existing.CountryCode = location.CountryCode;
        existing.FormattedAddress = location.FormattedAddress;
        existing.Latitude = location.Latitude;
        existing.Longitude = location.Longitude;
        existing.GooglePlaceId = location.GooglePlaceId;
        existing.OsmNodeId = location.OsmNodeId;
        existing.OsmType = location.OsmType;
        existing.TimeZone = location.TimeZone;
        existing.VirtualUrl = location.VirtualUrl;
        existing.IsVirtual = location.IsVirtual;
        existing.Phone = location.Phone;
        existing.Website = location.Website;
        existing.AccessInstructions = location.AccessInstructions;
        existing.Capacity = location.Capacity;
        existing.HasParking = location.HasParking;
        existing.IsWheelchairAccessible = location.IsWheelchairAccessible;
        existing.HasPublicTransport = location.HasPublicTransport;
        existing.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
        return true;
    }

    /// <inheritdoc />
    public async Task<bool> DeleteAsync(int id)
    {
        var location = await _dbContext.EventLocations.FindAsync(id);
        if (location == null) return false;

        _dbContext.EventLocations.Remove(location);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    /// <inheritdoc />
    public async Task<IEnumerable<EventLocation>> FindNearbyAsync(double latitude, double longitude, double radiusKm)
    {
        // Using Haversine formula approximation for PostgreSQL
        // For better performance, consider using PostGIS extension
        var locations = await _dbContext.EventLocations
            .Where(l => l.Latitude.HasValue && l.Longitude.HasValue && !l.IsVirtual)
            .ToListAsync();

        // Calculate distance in memory (for small datasets)
        // For large datasets, use raw SQL with Haversine or PostGIS
        return locations
            .Select(l => new
            {
                Location = l,
                Distance = CalculateHaversineDistance(latitude, longitude, l.Latitude!.Value, l.Longitude!.Value)
            })
            .Where(x => x.Distance <= radiusKm)
            .OrderBy(x => x.Distance)
            .Select(x => x.Location);
    }

    /// <inheritdoc />
    public async Task<EventLocation?> GetByGooglePlaceIdAsync(string googlePlaceId)
    {
        return await _dbContext.EventLocations
            .FirstOrDefaultAsync(l => l.GooglePlaceId == googlePlaceId);
    }

    /// <inheritdoc />
    public async Task<EventLocation?> GetByOsmNodeIdAsync(long osmNodeId)
    {
        return await _dbContext.EventLocations
            .FirstOrDefaultAsync(l => l.OsmNodeId == osmNodeId);
    }

    /// <inheritdoc />
    public async Task<IEnumerable<EventLocation>> SearchAsync(string query, int limit = 10)
    {
        var lowerQuery = query.ToLower();
        return await _dbContext.EventLocations
            .Where(l => l.Name.ToLower().Contains(lowerQuery) ||
                       (l.FormattedAddress != null && l.FormattedAddress.ToLower().Contains(lowerQuery)) ||
                       (l.City != null && l.City.ToLower().Contains(lowerQuery)))
            .OrderBy(l => l.Name)
            .Take(limit)
            .ToListAsync();
    }

    /// <summary>
    /// Calculates distance between two coordinates using Haversine formula.
    /// </summary>
    /// <returns>Distance in kilometers</returns>
    private static double CalculateHaversineDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371; // Earth's radius in kilometers

        var dLat = DegreesToRadians(lat2 - lat1);
        var dLon = DegreesToRadians(lon2 - lon1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return R * c;
    }

    private static double DegreesToRadians(double degrees) => degrees * Math.PI / 180;
}
