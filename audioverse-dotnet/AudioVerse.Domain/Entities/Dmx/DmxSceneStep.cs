namespace AudioVerse.Domain.Entities.Dmx
{
    public class DmxSceneStep
    {
        public int Id { get; set; }
        public int SequenceId { get; set; }
        public int SceneId { get; set; }
        public DmxScene? Scene { get; set; }
        public int Order { get; set; }
        public int HoldMs { get; set; }
        public int FadeMs { get; set; }
    }
}
