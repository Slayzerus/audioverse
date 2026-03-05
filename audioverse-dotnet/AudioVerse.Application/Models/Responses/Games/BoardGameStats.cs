namespace AudioVerse.Application.Models.Responses.Games;

public class BoardGameStats
{
    public int BoardGameId { get; set; }
    public int TotalPlayCount { get; set; }
    public double AverageSessionDurationMinutes { get; set; }
    public int UniquePlayerCount { get; set; }
    public int? HighestScore { get; set; }
}
