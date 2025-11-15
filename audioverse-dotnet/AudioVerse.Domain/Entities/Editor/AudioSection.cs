namespace AudioVerse.Domain.Entities.Editor
{
    public class AudioSection
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string Name { get; set; } = string.Empty;
        public TimeSpan Duration { get; set; }
        public decimal BPM { get; set; }
        public int OrderNumber { get; set; }
        public List<AudioLayer> Layers { get; set; } = new();
        public List<AudioInputMapping> InputMappings { get; set; } = new();

        public AudioSection()
        {
            
        }

        public AudioSection(int id, string name, int orderNumber, TimeSpan duration, int bpm = 60)
        {
            Id = id;
            Name = name;
            OrderNumber = orderNumber;
            Duration = duration;
            BPM = bpm;
        }
    }
}
