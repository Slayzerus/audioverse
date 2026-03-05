namespace AudioVerse.Domain.Repositories
{
    /// <summary>
    /// Marker interface for the EF Core-based IKaraokeRepository implementation.
    /// Inject this when you explicitly need EF features (change tracking, navigation properties, etc.).
    /// </summary>
    public interface IEfKaraokeRepository : IKaraokeRepository { }
}
