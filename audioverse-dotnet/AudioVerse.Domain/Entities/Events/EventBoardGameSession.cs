using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Enums.Events;

namespace AudioVerse.Domain.Entities.Events
{
    public class EventBoardGameSession
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public int? BoardGameId { get; set; }
        public BoardGame? BoardGame { get; set; }
        // number of copies of the board game available at the event
        public int CopyCount { get; set; } = 1;
        public string? Location { get; set; }
        public GameStatus Status { get; set; }
    }
}
