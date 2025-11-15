namespace AudioVerse.Domain.Entities.Karaoke
{
    public class KaraokeTeamPlayer
    {
        public int PlayerId { get; set; }
        public KaraokePlayer Player { get; set; } = null!;

        public int TeamId { get; set; }
        public KaraokeTeam Team { get; set; } = null!;

    }
}
