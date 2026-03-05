using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.Karaoke.KaraokeSingings
{
    public class KaraokeSingingRecording
    {
        public int Id { get; set; }
        public int SingingId { get; set; }
        public KaraokeSinging Singing { get; set; } = null!;
        public string FileName { get; set; } = string.Empty;
        public byte[] Data { get; set; } = null!;
        public RecordingType Type { get; set; } // Audio, Video, etc.
    }
}
