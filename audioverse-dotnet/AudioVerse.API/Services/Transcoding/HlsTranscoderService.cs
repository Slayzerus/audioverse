using AudioVerse.Infrastructure.Persistence;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using System.Diagnostics;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.API.Services.Transcoding
{
    public class HlsTranscoderService : BackgroundService
    {
        private readonly ILogger<HlsTranscoderService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly AudioVerse.Infrastructure.Storage.IFileStorage? _storage;
        private readonly IConfiguration _config;
        private readonly TimeSpan _scanInterval = TimeSpan.FromMinutes(5);

        public HlsTranscoderService(ILogger<HlsTranscoderService> logger, IServiceScopeFactory scopeFactory, AudioVerse.Infrastructure.Storage.IFileStorage? storage = null, IConfiguration? config = null)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
            _storage = storage;
            _config = config ?? new ConfigurationBuilder().AddInMemoryCollection().Build();
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("HLS Transcoder starting");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    if (_storage != null)
                        await ScanAndTranscodeOnce(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "HLS transcoder iteration failed");
                }

                await Task.Delay(_scanInterval, stoppingToken);
            }

            _logger.LogInformation("HLS Transcoder stopping");
        }

        private async Task ScanAndTranscodeOnce(CancellationToken ct)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();

            // find audio files which have FilePath and no HLS index in storage
            var query = db.LibraryAudioFiles.Where(a => !string.IsNullOrEmpty(a.FilePath));
            var files = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(query, ct);

            var bucket = _config["Storage:AudioBucket"];
            if (string.IsNullOrEmpty(bucket))
            {
                var buckets = _config.GetSection("Storage:Buckets").Get<string[]>();
                if (buckets != null && buckets.Length > 0) bucket = buckets[0];
            }
            if (string.IsNullOrEmpty(bucket)) bucket = "audiofiles";

            foreach (var f in files)
            {
                ct.ThrowIfCancellationRequested();
                try
                {
                    var hlsKey = $"hls/{f.Id}/index.m3u8";
                    // check presence by attempting to download index.m3u8
                    var existingStream = await _storage.DownloadAsync(bucket, hlsKey);
                    if (existingStream != null)
                    {
                        existingStream.Dispose();
                        continue;
                    }

                    _logger.LogInformation("Transcoding audiofile {Id} to HLS", f.Id);

                    // Download original
                    using var stream = await _storage.DownloadAsync(bucket, f.FilePath!);
                    if (stream == null) { _logger.LogWarning("File {Path} not found in storage", f.FilePath); continue; }

                    var tempDir = Path.Combine(Path.GetTempPath(), "audioverse_hls", Guid.NewGuid().ToString("N"));
                    Directory.CreateDirectory(tempDir);
                    var ext = Path.GetExtension(f.FilePath) ?? ".mp3";
                    var localFile = Path.Combine(tempDir, "input" + ext);

                    using (var fs = System.IO.File.Create(localFile))
                    {
                        await stream.CopyToAsync(fs, ct);
                    }

                    // ffmpeg command to generate HLS
                    var ffmpegPath = _config["Transcoding:FfmpegPath"] ?? "ffmpeg";
                    var args = $"-y -i \"{localFile}\" -profile:v baseline -level 3.0 -start_number 0 -hls_time 10 -hls_list_size 0 -f hls index.m3u8";
                    var psi = new ProcessStartInfo(ffmpegPath, args)
                    {
                        WorkingDirectory = tempDir,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    };

                    using var proc = Process.Start(psi);
                    if (proc == null)
                    {
                        _logger.LogWarning("ffmpeg not available to transcode {Id}", f.Id);
                        Directory.Delete(tempDir, true);
                        continue;
                    }

                    var stderr = await proc.StandardError.ReadToEndAsync();
                    await proc.WaitForExitAsync(ct);

                    if (proc.ExitCode != 0)
                    {
                        _logger.LogWarning("ffmpeg failed for {Id}: {Error}", f.Id, stderr);
                        Directory.Delete(tempDir, true);
                        continue;
                    }

                    // upload generated files under hls/{id}/
                    var filesToUpload = Directory.GetFiles(tempDir);
                    foreach (var filePath in filesToUpload)
                    {
                        var name = Path.GetFileName(filePath);
                        var destKey = $"hls/{f.Id}/{name}";
                        using var upStream = System.IO.File.OpenRead(filePath);
                        var fileExt = Path.GetExtension(name)?.ToLowerInvariant();
                        var contentType = fileExt switch
                        {
                            ".m3u8" => "application/vnd.apple.mpegurl",
                            ".ts" => "video/MP2T",
                            _ => "application/octet-stream"
                        };
                        await _storage.UploadAsync(bucket, destKey, upStream, contentType, ct);
                    }

                    Directory.Delete(tempDir, true);
                    _logger.LogInformation("HLS generated and uploaded for {Id}", f.Id);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to transcode audiofile {Id}", f.Id);
                }
            }
        }
    }
}
