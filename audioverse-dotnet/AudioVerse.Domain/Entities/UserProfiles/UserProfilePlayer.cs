namespace AudioVerse.Domain.Entities.UserProfiles
{
    using AudioVerse.Domain.Entities.Events;
    using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
    using AudioVerse.Domain.Entities.Karaoke.KaraokeSingings;
    using System.ComponentModel.DataAnnotations.Schema;

    public class UserProfilePlayer
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int ProfileId { get; set; }
        public UserProfile? Profile { get; set; }
        // Comma-separated list of preferred colors selected on the front-end (e.g. "#FF0000,#00FF00")
        public string PreferredColors { get; set; } = string.Empty;
        // Shape pattern used for visual identity on the front-end (e.g. "Pill", "Circle", "Square")
        public string FillPattern { get; set; } = "Pill";
        // Indicates whether this player is the main/default player for the profile
        public bool IsPrimary { get; set; } = false;
        // Contact email for notifications (optional, independent of UserProfile.Email)
        public string? Email { get; set; }
        // Font Awesome icon name (e.g. "fa-guitar", "fa-microphone")
        public string? Icon { get; set; }
        // MinIO key for player photo (larger profile photo, e.g. "player-photos/{guid}.jpg")
        public string? PhotoKey { get; set; }

        public KaraokeSettings KaraokeSettings { get; set; } = new KaraokeSettings();

        [InverseProperty("Player")]
        public List<KaraokeSessionPlayer> KaraokeSessionsLinks { get; set; } = new List<KaraokeSessionPlayer>();

        [InverseProperty("Player")]
        public List<KaraokeSinging> LinkedSinging { get; set; } = new List<KaraokeSinging>();

        [InverseProperty("SourcePlayer")]
        public List<PlayerLink> OutgoingLinks { get; set; } = new List<PlayerLink>();

        [InverseProperty("TargetPlayer")]
        public List<PlayerLink> IncomingLinks { get; set; } = new List<PlayerLink>();
    }
}
