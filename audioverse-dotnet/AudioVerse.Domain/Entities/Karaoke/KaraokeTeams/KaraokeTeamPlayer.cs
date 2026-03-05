using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Domain.Entities.Karaoke.KaraokeTeams
{
    public class KaraokeTeamPlayer
    {
        public int Id { get; set; }
        public int PlayerId { get; set; }
        public UserProfilePlayer? Player { get; set; }
        public int TeamId { get; set; }
        public KaraokeTeam? Team { get; set; }
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
        public string? Role { get; set; }
    }
}
