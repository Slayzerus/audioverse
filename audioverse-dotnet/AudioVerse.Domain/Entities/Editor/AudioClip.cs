namespace AudioVerse.Domain.Entities.Editor
{
    public class AudioClip
    {
        public int Id { get; set; }
        public int? UserProfileId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FileFormat { get; set; } = string.Empty;
        public byte[] Data { get; set; } = Array.Empty<byte>();
        public TimeSpan Duration { get; set; }
        public long Size { get; set; }
        public List<AudioClipTag> Tags { get; set; } = new();

        public AudioClip()
        {
            
        }

        public AudioClip(int id, string fileName, string fileFormat, byte[] data, TimeSpan duration, long size, int? userProfileId = null)
        {
            Id = id;
            FileName = fileName;
            FileFormat = fileFormat;
            Data = data;
            Duration = duration;
            Size = size;
            UserProfileId = userProfileId;
        }
    }
}
