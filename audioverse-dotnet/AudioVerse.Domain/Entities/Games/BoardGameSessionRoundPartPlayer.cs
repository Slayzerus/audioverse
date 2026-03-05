using System;

namespace AudioVerse.Domain.Entities.Games
{
    public class BoardGameSessionRoundPartPlayer
    {
        public int Id { get; set; }
        public int PartId { get; set; }
        public BoardGameSessionRoundPart? Part { get; set; }
        public int PlayerId { get; set; }
        public int? Score { get; set; }
    }
}
