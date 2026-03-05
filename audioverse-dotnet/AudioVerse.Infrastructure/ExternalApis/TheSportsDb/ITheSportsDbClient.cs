namespace AudioVerse.Infrastructure.ExternalApis.TheSportsDb;

/// <summary>Client for TheSportsDB API — search sports, leagues, upcoming events.</summary>
public interface ITheSportsDbClient
{
    Task<List<SportsDbSearchResult>> SearchSportsAsync(string query, CancellationToken ct = default);
    Task<List<SportsDbEvent>> GetUpcomingEventsAsync(int leagueId, CancellationToken ct = default);
    Task<List<SportsDbLeague>> GetAllLeaguesAsync(CancellationToken ct = default);
}
