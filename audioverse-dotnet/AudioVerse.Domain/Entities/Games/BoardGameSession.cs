using System;
using System.Collections.Generic;
using AudioVerse.Domain.Entities.Events;

namespace AudioVerse.Domain.Entities.Games
{
    public class BoardGameSession
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public Event? Event { get; set; }
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? EndedAt { get; set; }
        public ICollection<BoardGameSessionRound> Rounds { get; set; } = new List<BoardGameSessionRound>();
    }
}
