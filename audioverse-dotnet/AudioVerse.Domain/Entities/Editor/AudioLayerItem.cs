namespace AudioVerse.Domain.Entities.Editor
{
    public class AudioLayerItem
    {
        public int Id { get; set; }
        public int LayerId { get; set; }
        public TimeSpan StartTime { get; set; }
        public string Parameters { get; set; } = string.Empty;

        public AudioLayerItem()
        {
            
        }

        public AudioLayerItem(int id, TimeSpan startTime, string parameters)
        {
            Id = id;
            StartTime = startTime;
            Parameters = parameters;
        }
    }
}
