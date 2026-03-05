using AudioVerse.Application.Models.Utils;
using System.Net.Http.Json;

namespace AudioVerse.Application.Services.Utils
{
    public class AiVideoService : IAiVideoService
    {
        private readonly HttpClient _http;
        private readonly AiVideoOptions _opts;

        public AiVideoService(HttpClient http, Microsoft.Extensions.Options.IOptions<AiVideoOptions> options)
        {
            _http = http;
            _opts = options.Value;
        }

        public async Task<PoseDetectionResult?> DetectPoseAsync(Stream image, string engine, CancellationToken ct)
        {
            var baseUrl = ResolveEngineUrl(engine);
            if (string.IsNullOrEmpty(baseUrl)) return null;

            using var content = new MultipartFormDataContent();
            content.Add(new StreamContent(image), "image", "frame.jpg");
            var resp = await _http.PostAsync($"{baseUrl}/pose/image", content, ct);
            if (!resp.IsSuccessStatusCode) return null;
            return await resp.Content.ReadFromJsonAsync<PoseDetectionResult>(ct);
        }

        public async Task<PoseDetectionResult?> DetectPoseVideoAsync(Stream video, string engine, CancellationToken ct)
        {
            var baseUrl = ResolveEngineUrl(engine);
            if (string.IsNullOrEmpty(baseUrl)) return null;

            using var content = new MultipartFormDataContent();
            content.Add(new StreamContent(video), "video", "video.mp4");
            var resp = await _http.PostAsync($"{baseUrl}/pose/video", content, ct);
            if (!resp.IsSuccessStatusCode) return null;
            return await resp.Content.ReadFromJsonAsync<PoseDetectionResult>(ct);
        }

        public async Task<Pose3DResult?> DetectPose3DAsync(Stream video, CancellationToken ct)
        {
            if (string.IsNullOrEmpty(_opts.PoseFormerBaseUrl)) return null;

            using var content = new MultipartFormDataContent();
            content.Add(new StreamContent(video), "video", "video.mp4");
            var resp = await _http.PostAsync($"{_opts.PoseFormerBaseUrl}/pose3d", content, ct);
            if (!resp.IsSuccessStatusCode) return null;
            return await resp.Content.ReadFromJsonAsync<Pose3DResult>(ct);
        }

        private string? ResolveEngineUrl(string engine) => engine.ToLowerInvariant() switch
        {
            "mediapipe" => _opts.MediaPipeBaseUrl,
            "openpose" => _opts.OpenPoseBaseUrl,
            "alphapose" => _opts.AlphaPoseBaseUrl,
            "vitpose" => _opts.VitPoseBaseUrl,
            _ => _opts.MediaPipeBaseUrl
        };
    }
}
