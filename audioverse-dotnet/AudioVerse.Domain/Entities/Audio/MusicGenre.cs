namespace AudioVerse.Domain.Entities.Audio
{
    /// <summary>
    /// Music genre with name, color code, and active status.
    /// </summary>
    public class MusicGenre
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int? ParentGenreId { get; set; }
        public MusicGenre? ParentGenre { get; set; }
        public List<MusicGenre> SubGenres { get; set; } = new();
    }
}