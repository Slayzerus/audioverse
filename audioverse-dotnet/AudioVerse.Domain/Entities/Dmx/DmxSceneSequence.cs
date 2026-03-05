namespace AudioVerse.Domain.Entities.Dmx
{
    public class DmxSceneSequence
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool Loop { get; set; }
        public List<DmxSceneStep> Steps { get; set; } = new();
    }
}
