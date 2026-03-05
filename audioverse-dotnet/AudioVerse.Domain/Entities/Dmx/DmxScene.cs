namespace AudioVerse.Domain.Entities.Dmx
{
    public class DmxScene
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string ChannelValuesJson { get; set; } = "{}";
        public int? DurationMs { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
