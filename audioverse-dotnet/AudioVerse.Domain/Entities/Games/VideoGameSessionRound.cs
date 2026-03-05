namespace AudioVerse.Domain.Entities.Games;

public class VideoGameSessionRound
{
    public int Id { get; set; }
    public int SessionId { get; set; }
    public VideoGameSession? Session { get; set; }
    public int Number { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<VideoGameSessionRoundPart> Parts { get; set; } = new List<VideoGameSessionRoundPart>();
}
