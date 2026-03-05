using Microsoft.Extensions.Logging;

namespace AudioVerse.Application.Services.MediaLibrary
{
    public class DownloadService : IDownloadService
    {
        private readonly HttpClient _http;
        private readonly ILogger<DownloadService> _logger;
        private readonly string _downloadFolder = "Downloads";

        public DownloadService(HttpClient http, ILogger<DownloadService> logger)
        {
            _http = http;
            _logger = logger;
            Directory.CreateDirectory(_downloadFolder);
        }

        public Task<DownloadedFile?> DownloadAudioAsync(string url, string? fileName, CancellationToken ct)
            => DownloadCoreAsync(url, fileName, "Audio", ct);

        public Task<DownloadedFile?> DownloadImageAsync(string url, string? fileName, CancellationToken ct)
            => DownloadCoreAsync(url, fileName, "Images", ct);

        public Task<DownloadedFile?> DownloadFileAsync(string url, string? fileName, CancellationToken ct)
            => DownloadCoreAsync(url, fileName, "General", ct);

        private async Task<DownloadedFile?> DownloadCoreAsync(string url, string? fileName, string subFolder, CancellationToken ct)
        {
            try
            {
                var resp = await _http.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, ct);
                if (!resp.IsSuccessStatusCode) return null;

                var name = fileName ?? GetFileNameFromUrl(url);
                var folder = Path.Combine(_downloadFolder, subFolder);
                Directory.CreateDirectory(folder);
                var path = Path.Combine(folder, name);

                await using var fs = File.Create(path);
                await resp.Content.CopyToAsync(fs, ct);
                var size = fs.Length;

                _logger.LogInformation("Downloaded {Url} ? {Path} ({Size} bytes)", url, path, size);
                return new DownloadedFile(name, path, url, size);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to download {Url}", url);
                return null;
            }
        }

        private static string GetFileNameFromUrl(string url)
        {
            try { return Path.GetFileName(new Uri(url).AbsolutePath); }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or System.Text.Json.JsonException) { return $"download_{Guid.NewGuid():N}"; }
        }
    }
}
