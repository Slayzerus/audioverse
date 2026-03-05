namespace AudioVerse.Domain.Entities.Media
{
    /// <summary>Movie entry in the catalog.</summary>
    public class Movie
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? OriginalTitle { get; set; }
        public string? Description { get; set; }
        public int? RuntimeMinutes { get; set; }
        public int? ReleaseYear { get; set; }
        public string? Director { get; set; }
        public string? PosterUrl { get; set; }
        public string? Genre { get; set; }
        public double? Rating { get; set; }
        public string? Language { get; set; }

        // Owner (user who added this)
        public int? OwnerId { get; set; }
        public UserProfiles.UserProfile? Owner { get; set; }

        // External catalog IDs
        public int? TmdbId { get; set; }
        public string? ImdbId { get; set; }
        public string? ImportedFrom { get; set; }

        // Genre FK
        public int? MovieGenreId { get; set; }
        public MovieGenre? MovieGenre { get; set; }

        // Tags
        public List<MovieTag> Tags { get; set; } = new();
    }
}
