namespace AudioVerse.Domain.Entities.Media
{
    /// <summary>Many-to-many link between a movie collection and a movie.</summary>
    public class MovieCollectionMovie
    {
        public int Id { get; set; }
        public int CollectionId { get; set; }
        public MovieCollection? Collection { get; set; }
        public int MovieId { get; set; }
        public Movie? Movie { get; set; }
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    }
}
