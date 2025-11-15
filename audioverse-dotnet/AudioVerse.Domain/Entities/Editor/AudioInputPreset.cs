namespace AudioVerse.Domain.Entities.Editor
{
    public class AudioInputPreset
    {
        public int Id { get; set; }
        public string Version { get; set; } = string.Empty;
        public int? UserProfileId { get; set; }
        public string Name { get; set; } = string.Empty;
        public List<AudioLayer> Layers { get; set; } = new();

        public AudioInputPreset()
        {
            
        }

        public AudioInputPreset(int id, string version, string name, int? userProfileId = null)
        {
            Id = id;
            Version = version;
            Name = name;
            UserProfileId = userProfileId;
        }
    }
}
