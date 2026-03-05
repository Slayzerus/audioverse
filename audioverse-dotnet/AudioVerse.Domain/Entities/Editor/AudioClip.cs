namespace AudioVerse.Domain.Entities.Editor
{
    public class AudioClip
    {
        public int Id { get; set; }
        public int? UserProfileId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FileFormat { get; set; } = string.Empty;
        public string? ObjectKey { get; set; }
        public TimeSpan Duration { get; set; }
        public long Size { get; set; }
        public List<AudioClipTag> Tags { get; set; } = new();
    }
}
