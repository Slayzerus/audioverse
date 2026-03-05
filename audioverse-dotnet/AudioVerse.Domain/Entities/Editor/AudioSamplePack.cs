using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.Editor
{
    public class AudioSamplePack
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Genre { get; set; }
        public string? Instrument { get; set; }
        public decimal? Bpm { get; set; }
        public int? CreatedByUserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<AudioSample> Samples { get; set; } = new();
    }
}
