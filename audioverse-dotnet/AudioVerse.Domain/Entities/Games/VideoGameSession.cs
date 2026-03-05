using AudioVerse.Domain.Entities.Events;

namespace AudioVerse.Domain.Entities.Games
{
    public class VideoGameSession
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public Event? Event { get; set; }
        public int VideoGameId { get; set; }
        public VideoGame? VideoGame { get; set; }
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? EndedAt { get; set; }
        public ICollection<VideoGameSessionPlayer> Players { get; set; } = new List<VideoGameSessionPlayer>();
        public ICollection<VideoGameSessionRound> Rounds { get; set; } = new List<VideoGameSessionRound>();
    }
}

