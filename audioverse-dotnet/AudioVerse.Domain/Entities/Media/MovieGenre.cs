namespace AudioVerse.Domain.Entities.Media
{
    /// <summary>Genre classification for movies.</summary>
    public class MovieGenre
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
