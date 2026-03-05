namespace AudioVerse.Domain.Entities.Games;

public class VideoGameGenre
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int? ParentGenreId { get; set; }
    public VideoGameGenre? ParentGenre { get; set; }
    public List<VideoGameGenre> SubGenres { get; set; } = new();
}
