namespace AudioVerse.Domain.Entities.Games
{
    public class BoardGame
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int MinPlayers { get; set; }
        public int MaxPlayers { get; set; }
        public int? EstimatedDurationMinutes { get; set; }
        public string? Genre { get; set; }
        public string? ImageKey { get; set; }
        // Owner (user who added this game to collection)
        public int? OwnerId { get; set; }
        public UserProfiles.UserProfile? Owner { get; set; }

        // External catalog IDs
        public int? BggId { get; set; }
        public string? BggImageUrl { get; set; }
        public double? BggRating { get; set; }
        public int? BggYearPublished { get; set; }
        public string? BggThumbnailUrl { get; set; }
        public double? BggWeight { get; set; }
        public int? BggRank { get; set; }
        public int? BggUsersRated { get; set; }
        public int? BggMinAge { get; set; }
        public string? BggCategories { get; set; }
        public string? BggMechanics { get; set; }
        public string? BggDesigners { get; set; }
        public string? BggPublishers { get; set; }
        public DateTime? BggLastSyncUtc { get; set; }
        public bool IsFullBggData { get; set; }

        // Genre & tags
        public int? BoardGameGenreId { get; set; }
        public BoardGameGenre? BoardGameGenre { get; set; }
        public List<BoardGameTag> Tags { get; set; } = new();
    }
}
