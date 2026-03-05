using AudioVerse.Domain.Enums.Events;

namespace AudioVerse.Domain.Entities.Games
{
    public class VideoGame
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public GamePlatform Platform { get; set; }
        public int MinPlayers { get; set; }
        public int MaxPlayers { get; set; }
        public string? Genre { get; set; }
        public string? ImageKey { get; set; }
        public bool IsLocal { get; set; }
        public bool IsOnline { get; set; }
        // Owner (user who added this game)
        public int? OwnerId { get; set; }
        public UserProfiles.UserProfile? Owner { get; set; }

        // External catalog IDs
        public int? SteamAppId { get; set; }
        public string? SteamHeaderImageUrl { get; set; }
        public int? IgdbId { get; set; }
        public string? CoverImageUrl { get; set; }
        public string? ImportedFrom { get; set; }

        // Genre
        public int? VideoGameGenreId { get; set; }
        public VideoGameGenre? VideoGameGenre { get; set; }
    }
}

