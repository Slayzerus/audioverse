namespace AudioVerse.Domain.Entities.Games
{
    public class VideoGameSessionPlayer
    {
        public int Id { get; set; }
        public int SessionId { get; set; }
        public VideoGameSession? Session { get; set; }
        public int PlayerId { get; set; }
        public int? Score { get; set; }
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    }
}

