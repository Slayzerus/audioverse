using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.Editor
{
    public class AudioEffect
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public AudioEffectType Type { get; set; }
        public string ParametersJson { get; set; } = "{}";
    }
}
