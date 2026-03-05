using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Domain.Entities.Karaoke.KaraokeTeams
{
    public class KaraokeTeam
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int? EventId { get; set; }
        public int CreatedByPlayerId { get; set; }
        public string? AvatarKey { get; set; }
        public string? Color { get; set; }

        public UserProfilePlayer? CreatedByPlayer { get; set; }
        public List<KaraokeTeamPlayer> Players { get; set; } = new();
    }
}
