namespace AudioVerse.Application.Models.Responses.Games;

public class TopGameDto
{
    public int BoardGameId { get; set; }
    public string BoardGameName { get; set; } = string.Empty;
    public int TimesPlayed { get; set; }
    public int? BestScore { get; set; }
}
