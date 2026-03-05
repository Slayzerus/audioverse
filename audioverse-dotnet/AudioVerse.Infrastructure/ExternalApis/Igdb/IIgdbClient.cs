namespace AudioVerse.Infrastructure.ExternalApis.Igdb;

public interface IIgdbClient
{
    Task<List<IgdbSearchResult>> SearchAsync(string query, int limit = 10, CancellationToken ct = default);
    Task<IgdbGameDetails?> GetByIdAsync(int igdbId, CancellationToken ct = default);
}
