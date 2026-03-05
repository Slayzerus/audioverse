namespace AudioVerse.Domain.Entities.Media
{
    /// <summary>Genre/category classification for sports.</summary>
    public class SportGenre
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
