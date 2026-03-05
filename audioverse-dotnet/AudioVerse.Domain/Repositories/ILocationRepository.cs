using AudioVerse.Domain.Entities.Events;

namespace AudioVerse.Domain.Repositories;

/// <summary>
/// Repository for event locations with geocoding support.
/// </summary>
public interface ILocationRepository
{
    /// <summary>
    /// Creates a new event location.
    /// </summary>
    /// <param name="location">The location to create</param>
    /// <returns>The ID of the created location</returns>
    Task<int> CreateAsync(EventLocation location);

    /// <summary>
    /// Gets a location by ID.
    /// </summary>
    Task<EventLocation?> GetByIdAsync(int id);

    /// <summary>
    /// Gets all locations.
    /// </summary>
    Task<IEnumerable<EventLocation>> GetAllAsync();

    /// <summary>
    /// Gets locations for a specific user (created by).
    /// </summary>
    Task<IEnumerable<EventLocation>> GetByUserAsync(int userId);

    /// <summary>
    /// Updates a location.
    /// </summary>
    Task<bool> UpdateAsync(EventLocation location);

    /// <summary>
    /// Deletes a location.
    /// </summary>
    Task<bool> DeleteAsync(int id);

    /// <summary>
    /// Finds locations within a radius of given coordinates.
    /// </summary>
    /// <param name="latitude">Center latitude</param>
    /// <param name="longitude">Center longitude</param>
    /// <param name="radiusKm">Radius in kilometers</param>
    /// <returns>Locations within the radius, ordered by distance</returns>
    Task<IEnumerable<EventLocation>> FindNearbyAsync(double latitude, double longitude, double radiusKm);

    /// <summary>
    /// Gets a location by Google Place ID.
    /// </summary>
    Task<EventLocation?> GetByGooglePlaceIdAsync(string googlePlaceId);

    /// <summary>
    /// Gets a location by OpenStreetMap node ID.
    /// </summary>
    Task<EventLocation?> GetByOsmNodeIdAsync(long osmNodeId);

    /// <summary>
    /// Searches locations by name or address.
    /// </summary>
    Task<IEnumerable<EventLocation>> SearchAsync(string query, int limit = 10);
}
