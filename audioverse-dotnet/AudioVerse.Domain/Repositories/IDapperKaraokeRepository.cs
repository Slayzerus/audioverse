namespace AudioVerse.Domain.Repositories
{
    /// <summary>
    /// Marker interface for the Dapper-based IKaraokeRepository implementation.
    /// Inject this when you explicitly need raw SQL / Dapper for read-heavy or performance-critical queries.
    /// </summary>
    public interface IDapperKaraokeRepository : IKaraokeRepository { }
}
