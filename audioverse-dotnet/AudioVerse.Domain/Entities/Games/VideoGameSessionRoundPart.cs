namespace AudioVerse.Domain.Entities.Games;

public class VideoGameSessionRoundPart
{
    public int Id { get; set; }
    public int RoundId { get; set; }
    public VideoGameSessionRound? Round { get; set; }
    public string Name { get; set; } = string.Empty;
    public TimeSpan Duration { get; set; }
    public ICollection<VideoGameSessionRoundPartPlayer> Players { get; set; } = new List<VideoGameSessionRoundPartPlayer>();
}
