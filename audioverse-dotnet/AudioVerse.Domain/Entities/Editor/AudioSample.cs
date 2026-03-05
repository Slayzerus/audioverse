namespace AudioVerse.Domain.Entities.Editor
{
    public class AudioSample
    {
        public int Id { get; set; }
        public int PackId { get; set; }
        public AudioSamplePack? Pack { get; set; }
        public string Name { get; set; } = string.Empty;
        public string ObjectKey { get; set; } = string.Empty;
        public string? MimeType { get; set; }
        public int? DurationMs { get; set; }
        public decimal? Bpm { get; set; }
        public string? Key { get; set; }
    }
}
