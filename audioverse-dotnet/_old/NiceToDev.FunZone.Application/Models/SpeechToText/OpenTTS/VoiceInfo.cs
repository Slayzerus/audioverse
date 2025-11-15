using System.Text.Json.Serialization;

namespace NiceToDev.FunZone.Application.Models.SpeechToText.OpenTTS
{
    /// <summary>
    /// Model danych dla głosu w OpenTTS.
    /// </summary> 
    public class VoiceInfo
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("language")]
        public string Language { get; set; } = string.Empty;

        [JsonPropertyName("locale")]
        public string Locale { get; set; } = string.Empty;

        [JsonPropertyName("gender")]
        public string Gender { get; set; } = string.Empty;

        [JsonPropertyName("multispeaker")]
        public bool MultiSpeaker { get; set; }

        [JsonPropertyName("tts_name")]
        public string TtsName { get; set; } = string.Empty;
    }

}
