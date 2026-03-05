using System;
using System.Collections.Generic;

namespace AudioVerse.Domain.Entities.Games
{
    public class BoardGameSessionRound
    {
        public int Id { get; set; }
        public int SessionId { get; set; }
        public BoardGameSession? Session { get; set; }
        public int Number { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public ICollection<BoardGameSessionRoundPart> Parts { get; set; } = new List<BoardGameSessionRoundPart>();
    }
}
