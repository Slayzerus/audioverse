using AudioVerse.Application.Models.Karaoke;
using AudioVerse.Application.Models.Utils;

namespace AudioVerse.Application.Services.Utils
{
    public interface IAiAudioService
    {
        Task<AsrResult?> TranscribeAsync(Stream audio, string? language = null, CancellationToken ct = default);
        Task<byte[]> SynthesizeAsync(string text, string voice, CancellationToken ct = default);
        Task<AudioAnalysisResult?> AnalyzeAsync(Stream audio, CancellationToken ct = default);
        Task<SingingScore?> ScoreSingingAsync(Stream vocal, Stream reference, CancellationToken ct = default);
        Task<byte[]> SeparateAsync(Stream audio, int stems = 2, CancellationToken ct = default);
        Task<byte[]> RvcConvertAsync(Stream audio, string targetSinger, int? key = null, CancellationToken ct = default);
        Task<byte[]> MusicGenAsync(string prompt, int? durationSec = null, CancellationToken ct = default);
        Task<PitchResult?> DetectPitchAsync(Stream audio, CancellationToken ct = default);
        Task<RhythmResult?> DetectRhythmAsync(Stream audio, CancellationToken ct = default);
        Task<VadResult?> DetectVoiceActivityAsync(Stream audio, CancellationToken ct = default);
        Task<AudioTagsResult?> DetectTagsAsync(Stream audio, CancellationToken ct = default);
        Task<byte[]> GenerateWaveGanAsync(string prompt, CancellationToken ct = default);
    }
}
