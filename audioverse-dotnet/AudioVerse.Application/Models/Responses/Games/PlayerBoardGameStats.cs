namespace AudioVerse.Application.Models.Responses.Games;

public class PlayerBoardGameStats
{
    public int PlayerId { get; set; }
    public int TotalSessions { get; set; }
    public int TotalWins { get; set; }
    public double WinRate { get; set; }
    public double AverageScore { get; set; }
    public List<TopGameDto> TopGames { get; set; } = new();
}
