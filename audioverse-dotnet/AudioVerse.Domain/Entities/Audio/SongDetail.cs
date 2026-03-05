using AudioVerse.Domain.Enums.Audio;

namespace AudioVerse.Domain.Entities.Audio
{
    /// <summary>Flexible key-value detail for a song</summary>
    public class SongDetail
    {
        public int Id { get; set; }
        public int SongId { get; set; }
        public Song? Song { get; set; }
        public SongDetailType Type { get; set; }
        public string? Value { get; set; }
    }
}
