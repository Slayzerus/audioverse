namespace AudioVerse.Domain.Entities.Media
{
    /// <summary>Genre classification for books.</summary>
    public class BookGenre
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
