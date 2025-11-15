namespace AudioVerse.Domain.Entities.Editor
{
    public class AudioProject
    {
        public int Id { get; set; }
        public bool IsTemplate { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Volume { get; set; } = 100;
        public int? UserProfileId { get; set; }
        public List<AudioSection> Sections { get; set; } = new();

        public AudioProject()
        {
            
        }

        public AudioProject(int id, string name, int? userProfileId = null, bool isTemplate = false)
        {
            Id = id;
            Name = name;
            UserProfileId = userProfileId;
            IsTemplate = isTemplate;
        }
    }
}
