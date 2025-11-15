using NiceToDev.FunZone.Domain.Enums;

namespace NiceToDev.FunZone.Domain.Entities
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
