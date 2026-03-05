namespace AudioVerse.Domain.Entities.Media
{
    /// <summary>Sport/physical activity entry (e.g. running, cycling, climbing).</summary>
    public class SportActivity
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Category { get; set; }
        public bool IsTeamSport { get; set; }
        public bool IsIndoor { get; set; }
        public bool IsOutdoor { get; set; }
        public int? MinPlayers { get; set; }
        public int? MaxPlayers { get; set; }
        public string? IconUrl { get; set; }
        public string? Equipment { get; set; }

        public int? OwnerId { get; set; }
        public UserProfiles.UserProfile? Owner { get; set; }

        // External IDs
        public int? WikidataId { get; set; }
        public string? ImportedFrom { get; set; }

        public int? SportGenreId { get; set; }
        public SportGenre? SportGenre { get; set; }

        public List<SportTag> Tags { get; set; } = new();
    }
}
