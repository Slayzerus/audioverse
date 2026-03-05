using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Enums.Events;

namespace AudioVerse.Domain.Entities.Events
{
    public class EventVideoGameSession
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public int VideoGameId { get; set; }
        public VideoGame? VideoGame { get; set; }
        public string? Station { get; set; }
        public GameStatus Status { get; set; }
    }
}
