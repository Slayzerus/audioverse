namespace AudioVerse.Domain.Entities.Games;

public class BoardGameGenre
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int? ParentGenreId { get; set; }
    public BoardGameGenre? ParentGenre { get; set; }
    public List<BoardGameGenre> SubGenres { get; set; } = new();
}
