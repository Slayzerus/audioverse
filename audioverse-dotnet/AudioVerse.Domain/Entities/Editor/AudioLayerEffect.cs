namespace AudioVerse.Domain.Entities.Editor
{
    public class AudioLayerEffect
    {
        public int Id { get; set; }
        public int LayerId { get; set; }
        public AudioLayer? Layer { get; set; }
        public int EffectId { get; set; }
        public AudioEffect? Effect { get; set; }
        public int Order { get; set; }
        public string? ParamsOverrideJson { get; set; }
    }
}
