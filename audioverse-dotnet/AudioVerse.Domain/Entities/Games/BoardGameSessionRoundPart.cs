using System;
using System.Collections.Generic;

namespace AudioVerse.Domain.Entities.Games
{
    public class BoardGameSessionRoundPart
    {
        public int Id { get; set; }
        public int RoundId { get; set; }
        public BoardGameSessionRound? Round { get; set; }
        public string Name { get; set; } = string.Empty;
        public TimeSpan Duration { get; set; }
        public ICollection<BoardGameSessionRoundPartPlayer> Players { get; set; } = new List<BoardGameSessionRoundPartPlayer>();
    }
}
