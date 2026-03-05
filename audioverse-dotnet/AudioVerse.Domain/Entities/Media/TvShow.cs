namespace AudioVerse.Domain.Entities.Media
{
    /// <summary>TV series / show entry in the catalog.</summary>
    public class TvShow
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? OriginalTitle { get; set; }
        public string? Description { get; set; }
        public int? FirstAirYear { get; set; }
        public int? LastAirYear { get; set; }
        public int? SeasonCount { get; set; }
        public int? EpisodeCount { get; set; }
        public string? Network { get; set; }
        public string? PosterUrl { get; set; }
        public string? Genre { get; set; }
        public double? Rating { get; set; }
        public string? Status { get; set; }
        public string? Language { get; set; }

        public int? OwnerId { get; set; }
        public UserProfiles.UserProfile? Owner { get; set; }

        // External catalog IDs
        public int? TmdbId { get; set; }
        public string? ImdbId { get; set; }
        public string? ImportedFrom { get; set; }

        public int? TvShowGenreId { get; set; }
        public TvShowGenre? TvShowGenre { get; set; }

        public List<TvShowTag> Tags { get; set; } = new();
    }
}
