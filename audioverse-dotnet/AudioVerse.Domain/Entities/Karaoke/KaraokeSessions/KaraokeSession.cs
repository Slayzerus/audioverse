using AudioVerse.Domain.Diagrams;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Entities.Karaoke.KaraokeTeams;
using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.Karaoke.KaraokeSessions
{
    [DiagramNode("Karaoke", FillColor = "#e1d5e7", StrokeColor = "#9673a6", Icon = "🎤", Description = "Sesja karaoke w ramach eventu")]
    public class KaraokeSession
    {
        public int Id { get; set; }
        // Event-centric session
        public int? EventId { get; set; } = null;
        [DiagramRelation(Label = "N:1")]
        public Event? Event { get; set; } = null;
        public string Name { get; set; } = string.Empty;
        public KaraokeSessionMode Mode { get; set; } = KaraokeSessionMode.Classic;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? StartedAt { get; set; }
        public DateTime? EndedAt { get; set; }
        public bool TeamMode { get; set; } = false;
        public bool IsLimitedToEventPlaylist { get; set; } = false;
        public List<KaraokeTeam> Teams { get; set; } = new();
        public List<KaraokeSessionRound> Rounds { get; set; } = new();
    }
}
