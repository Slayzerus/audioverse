namespace AudioVerse.Application.Services.Utils
{
    public class AiAudioOptions
    {
        public string FasterWhisperBaseUrl { get; set; } = "";
        public string FasterWhisperDefaultModel { get; set; } = "Systran/faster-distil-whisper-large-v3";
        public string VoskWsUrl { get; set; } = "";
        public string PiperBaseUrl { get; set; } = "";
        public string PiperEndpointPath { get; set; } = "/api/tts";
        public string AudioAnalysisBaseUrl { get; set; } = "";
        public string SingingScoreBaseUrl { get; set; } = "";
        public string RhythmBaseUrl { get; set; } = "";
        public string PitchBaseUrl { get; set; } = "";
        public string VadBaseUrl { get; set; } = "";
        public string SeparateBaseUrl { get; set; } = "";
        public string TagsBaseUrl { get; set; } = "";
        public string CoquiBaseUrl { get; set; } = "";
        public string OpenTtsBaseUrl { get; set; } = "";
        public string RiffusionBaseUrl { get; set; } = "";
        public string AudioCraftBaseUrl { get; set; } = "";
        public string WaveGanBaseUrl { get; set; } = "";
    }
}
