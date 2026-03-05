namespace AudioVerse.Domain.Entities.Media
{
    /// <summary>Many-to-many link between a TV show collection and a TV show.</summary>
    public class TvShowCollectionTvShow
    {
        public int Id { get; set; }
        public int CollectionId { get; set; }
        public TvShowCollection? Collection { get; set; }
        public int TvShowId { get; set; }
        public TvShow? TvShow { get; set; }
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    }
}
