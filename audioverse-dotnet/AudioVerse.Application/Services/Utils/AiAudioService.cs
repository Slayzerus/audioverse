using AudioVerse.Application.Models.Karaoke;
using AudioVerse.Application.Models.Utils;
using System.Net.Http.Json;

namespace AudioVerse.Application.Services.Utils
{
    public class AiAudioService : IAiAudioService
    {
        private readonly HttpClient _http;
        private readonly AiAudioOptions _opts;

        public AiAudioService(HttpClient http, Microsoft.Extensions.Options.IOptions<AiAudioOptions> options)
        {
            _http = http;
            _opts = options.Value;
        }

        // ── ASR (Faster Whisper) ──
        public async Task<AsrResult?> TranscribeAsync(Stream audio, string? language, CancellationToken ct)
        {
            if (string.IsNullOrEmpty(_opts.FasterWhisperBaseUrl)) return null;
            using var content = new MultipartFormDataContent();
            content.Add(new StreamContent(audio), "file", "audio.wav");
            if (language != null) content.Add(new StringContent(language), "language");
            content.Add(new StringContent(_opts.FasterWhisperDefaultModel), "model");
            var resp = await _http.PostAsync($"{_opts.FasterWhisperBaseUrl}/audio/transcriptions", content, ct);
            if (!resp.IsSuccessStatusCode) return null;
            return await resp.Content.ReadFromJsonAsync<AsrResult>(ct);
        }

        // ── TTS (Piper) ──
        public async Task<byte[]> SynthesizeAsync(string text, string voice, CancellationToken ct)
        {
            var baseUrl = !string.IsNullOrEmpty(_opts.PiperBaseUrl) ? _opts.PiperBaseUrl : _opts.CoquiBaseUrl;
            if (string.IsNullOrEmpty(baseUrl)) throw new InvalidOperationException("No TTS service configured");
            var resp = await _http.PostAsJsonAsync($"{baseUrl}{_opts.PiperEndpointPath}", new { text, voice }, ct);
            resp.EnsureSuccessStatusCode();
            return await resp.Content.ReadAsByteArrayAsync(ct);
        }

        // ── Audio Analysis (BPM, key, loudness) → POST /analyze ──
        public async Task<AudioAnalysisResult?> AnalyzeAsync(Stream audio, CancellationToken ct)
        {
            if (string.IsNullOrEmpty(_opts.AudioAnalysisBaseUrl)) return null;
            using var content = new MultipartFormDataContent();
            content.Add(new StreamContent(audio), "file", "audio.wav");
            var resp = await _http.PostAsync($"{_opts.AudioAnalysisBaseUrl}/analyze", content, ct);
            if (!resp.IsSuccessStatusCode) return null;
            return await resp.Content.ReadFromJsonAsync<AudioAnalysisResult>(ct);
        }

        // ── Singing Score → POST /score ──
        public async Task<SingingScore?> ScoreSingingAsync(Stream vocal, Stream reference, CancellationToken ct)
        {
            if (string.IsNullOrEmpty(_opts.SingingScoreBaseUrl)) return null;
            using var content = new MultipartFormDataContent();
            content.Add(new StreamContent(vocal), "vocal", "vocal.wav");
            content.Add(new StreamContent(reference), "reference", "reference.wav");
            var resp = await _http.PostAsync($"{_opts.SingingScoreBaseUrl}/score", content, ct);
            if (!resp.IsSuccessStatusCode) return null;
            return await resp.Content.ReadFromJsonAsync<SingingScore>(ct);
        }

        // ── Source Separation (Demucs) → POST /separate ──
        public async Task<byte[]> SeparateAsync(Stream audio, int stems, CancellationToken ct)
        {
            if (string.IsNullOrEmpty(_opts.SeparateBaseUrl)) throw new InvalidOperationException("Separate service not configured");
            using var content = new MultipartFormDataContent();
            content.Add(new StreamContent(audio), "file", "audio.wav");
            content.Add(new StringContent(stems.ToString()), "stems");
            var resp = await _http.PostAsync($"{_opts.SeparateBaseUrl}/separate", content, ct);
            resp.EnsureSuccessStatusCode();
            return await resp.Content.ReadAsByteArrayAsync(ct);
        }

        // ── Pitch Detection → POST /pitch ──
        public async Task<PitchResult?> DetectPitchAsync(Stream audio, CancellationToken ct)
        {
            if (string.IsNullOrEmpty(_opts.PitchBaseUrl)) return null;
            using var content = new MultipartFormDataContent();
            content.Add(new StreamContent(audio), "file", "audio.wav");
            var resp = await _http.PostAsync($"{_opts.PitchBaseUrl}/pitch", content, ct);
            if (!resp.IsSuccessStatusCode) return null;

            // Python audio_pitch returns: { "median_hz", "track": [{"t","hz"}], "voiced_mask" }
            var json = await resp.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>(ct);

            decimal? medianHz = json.TryGetProperty("median_hz", out var mh) && mh.ValueKind == System.Text.Json.JsonValueKind.Number
                ? mh.GetDecimal() : null;

            decimal[] frequencies = [];
            decimal[] timestamps = [];

            if (json.TryGetProperty("track", out var track) && track.ValueKind == System.Text.Json.JsonValueKind.Array)
            {
                var items = track.EnumerateArray().ToArray();
                frequencies = items.Select(i => i.TryGetProperty("hz", out var h) ? h.GetDecimal() : 0m).ToArray();
                timestamps = items.Select(i => i.TryGetProperty("t", out var t) ? t.GetDecimal() : 0m).ToArray();
            }

            return new PitchResult(frequencies, timestamps, medianHz);
        }

        // ── Rhythm Detection → POST /rhythm ──
        public async Task<RhythmResult?> DetectRhythmAsync(Stream audio, CancellationToken ct)
        {
            if (string.IsNullOrEmpty(_opts.RhythmBaseUrl)) return null;
            using var content = new MultipartFormDataContent();
            content.Add(new StreamContent(audio), "file", "audio.wav");
            var resp = await _http.PostAsync($"{_opts.RhythmBaseUrl}/rhythm", content, ct);
            if (!resp.IsSuccessStatusCode) return null;
            return await resp.Content.ReadFromJsonAsync<RhythmResult>(ct);
        }

        // ── Voice Activity Detection → POST /vad ──
        public async Task<VadResult?> DetectVoiceActivityAsync(Stream audio, CancellationToken ct)
        {
            if (string.IsNullOrEmpty(_opts.VadBaseUrl)) return null;
            using var content = new MultipartFormDataContent();
            content.Add(new StreamContent(audio), "file", "audio.wav");
            var resp = await _http.PostAsync($"{_opts.VadBaseUrl}/vad", content, ct);
            if (!resp.IsSuccessStatusCode) return null;
            return await resp.Content.ReadFromJsonAsync<VadResult>(ct);
        }

        // ── Audio Tags (PANNs) → POST /api/tags ──
        public async Task<AudioTagsResult?> DetectTagsAsync(Stream audio, CancellationToken ct)
        {
            if (string.IsNullOrEmpty(_opts.TagsBaseUrl)) return null;
            using var content = new MultipartFormDataContent();
            content.Add(new StreamContent(audio), "file", "audio.wav");
            var resp = await _http.PostAsync($"{_opts.TagsBaseUrl}/api/tags", content, ct);
            if (!resp.IsSuccessStatusCode) return null;
            return await resp.Content.ReadFromJsonAsync<AudioTagsResult>(ct);
        }

        // ── RVC Voice Conversion (not yet a standalone util — placeholder) ──
        public async Task<byte[]> RvcConvertAsync(Stream audio, string targetSinger, int? key, CancellationToken ct)
        {
            throw new NotSupportedException("RVC service is not yet available as a standalone util");
        }

        // ── MusicGen (AudioCraft) → POST /api/musicgen ──
        public async Task<byte[]> MusicGenAsync(string prompt, int? durationSec, CancellationToken ct)
        {
            if (string.IsNullOrEmpty(_opts.AudioCraftBaseUrl)) throw new InvalidOperationException("AudioCraft service not configured");
            var resp = await _http.PostAsJsonAsync($"{_opts.AudioCraftBaseUrl}/api/musicgen", new { prompt, duration_sec = durationSec ?? 10 }, ct);
            resp.EnsureSuccessStatusCode();
            return await resp.Content.ReadAsByteArrayAsync(ct);
        }

        // ── WaveGAN → POST /api/generate ──
        public async Task<byte[]> GenerateWaveGanAsync(string prompt, CancellationToken ct)
        {
            if (string.IsNullOrEmpty(_opts.WaveGanBaseUrl)) throw new InvalidOperationException("WaveGAN service not configured");
            var resp = await _http.PostAsJsonAsync($"{_opts.WaveGanBaseUrl}/api/generate", new { prompt }, ct);
            resp.EnsureSuccessStatusCode();
            return await resp.Content.ReadAsByteArrayAsync(ct);
        }
    }
}
