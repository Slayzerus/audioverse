namespace AudioVerse.Infrastructure.ExternalApis.Bgg;

/// <summary>
/// Client interface for BoardGameGeek API.
/// </summary>
public interface IBggClient
{
    /// <summary>
    /// Search for board games by name.
    /// </summary>
    Task<List<BggSearchResult>> SearchAsync(string query, CancellationToken ct = default);
    
    /// <summary>
    /// Get detailed info for a single game.
    /// </summary>
    Task<BggGameDetails?> GetDetailsAsync(int bggId, CancellationToken ct = default);
    
    /// <summary>
    /// Get detailed info for multiple games in a single request.
    /// </summary>
    Task<List<BggGameDetails>> GetDetailsBatchAsync(IEnumerable<int> bggIds, CancellationToken ct = default);
    
    /// <summary>
    /// Get the current hot/trending games list.
    /// </summary>
    Task<List<BggHotGame>> GetHotGamesAsync(CancellationToken ct = default);
    
    /// <summary>
    /// Get a user's game collection from BGG.
    /// </summary>
    Task<List<BggCollectionItem>> GetUserCollectionAsync(string username, bool owned = true, CancellationToken ct = default);
}
