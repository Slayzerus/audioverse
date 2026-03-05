using AudioVerse.Domain.Enums.Audio;

namespace AudioVerse.Domain.Entities.Audio
{
    /// <summary>Structured fact about an artist</summary>
    public class ArtistFact
    {
        public int Id { get; set; }
        public int ArtistId { get; set; }
        public Artist? Artist { get; set; }
        public ArtistFactType Type { get; set; }
        public string? Value { get; set; }
        public DateOnly? DateValue { get; set; }
        public int? IntValue { get; set; }
        public string? Source { get; set; }
    }
}
