namespace AudioVerse.Domain.Entities.Editor
{
    public class AudioLayer
    {
        public int Id { get; set; }
        public int? SectionId { get; set; }
        public int? InputPresetId { get; set; }
        public int? AudioClipId { get; set; }
        public AudioClip? AudioClip { get; set; }
        public string Name { get; set; } = string.Empty;
        public string AudioSource { get; set; } = string.Empty;
        public TimeSpan Duration { get; set; }
        public decimal BPM { get; set; }
        public int Volume { get; set; } = 100;
        public string AudioSourceParameters { get; set; } = string.Empty;
        public List<AudioLayerItem> Items { get; set; } = new();
        public List<AudioInputMapping> InputMappings { get; set; } = new();



        public AudioLayer()
        {
            
        }

        public AudioLayer(
            string name, 
            string audioSource, 
            string audioSourceParameters, 
            TimeSpan duration, 
            int bpm, 
            List<AudioInputMapping> inputMappings)
        {
            Name = name;
            AudioSource = audioSource;
            AudioSourceParameters = audioSourceParameters;
            Duration = duration;
            BPM = bpm;
            InputMappings = inputMappings;  
        }
    }
}
