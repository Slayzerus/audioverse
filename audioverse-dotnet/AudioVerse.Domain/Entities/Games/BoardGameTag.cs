namespace AudioVerse.Domain.Entities.Games;

public class BoardGameTag
{
    public int Id { get; set; }
    public int BoardGameId { get; set; }
    public BoardGame? BoardGame { get; set; }
    public string Name { get; set; } = string.Empty;
}
