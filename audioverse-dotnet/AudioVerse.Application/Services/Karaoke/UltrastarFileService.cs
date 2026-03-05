using System.Text.Json;
using AudioVerse.Application.Services.MediaLibrary;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AudioVerse.Application.Services.Karaoke
{
    public class UltrastarFileService : IUltrastarFileService
    {
        private readonly UltrastarFileOptions _options;
        private readonly ILogger<UltrastarFileService> _logger;

        public UltrastarFileService(IOptions<UltrastarFileOptions> options, ILogger<UltrastarFileService> logger)
        {
            _options = options.Value;
            _logger = logger;
        }

        public Task<IReadOnlyList<UltrastarSongInfo>> ScanAsync(CancellationToken ct = default)
        {
            var results = new List<UltrastarSongInfo>();
            foreach (var root in GetAllRoots())
            {
                if (!Directory.Exists(root)) continue;
                foreach (var file in Directory.EnumerateFiles(root, "*.txt", SearchOption.AllDirectories))
                {
                    ct.ThrowIfCancellationRequested();
                    var song = ParseFileSync(file);
                    if (song != null) results.Add(song);
                }
            }
            return Task.FromResult<IReadOnlyList<UltrastarSongInfo>>(results);
        }

        public Task<UltrastarSongInfo?> ParseFileAsync(string filePath, CancellationToken ct = default)
        {
            return Task.FromResult(ParseFileSync(filePath));
        }

        public async Task ExportAsync(UltrastarSongInfo song, string outputPath, CancellationToken ct = default)
        {
            var lines = new List<string>();
            if (!string.IsNullOrEmpty(song.Title)) lines.Add($"#TITLE:{song.Title}");
            if (!string.IsNullOrEmpty(song.Artist)) lines.Add($"#ARTIST:{song.Artist}");
            if (!string.IsNullOrEmpty(song.Genre)) lines.Add($"#GENRE:{song.Genre}");
            if (!string.IsNullOrEmpty(song.Language)) lines.Add($"#LANGUAGE:{song.Language}");
            if (song.Year.HasValue) lines.Add($"#YEAR:{song.Year}");
            if (song.Bpm.HasValue) lines.Add($"#BPM:{song.Bpm}");
            if (song.Gap.HasValue) lines.Add($"#GAP:{song.Gap}");
            if (!string.IsNullOrEmpty(song.AudioPath)) lines.Add($"#MP3:{song.AudioPath}");
            if (!string.IsNullOrEmpty(song.VideoPath)) lines.Add($"#VIDEO:{song.VideoPath}");
            if (!string.IsNullOrEmpty(song.CoverPath)) lines.Add($"#COVER:{song.CoverPath}");
            lines.Add("E");

            Directory.CreateDirectory(Path.GetDirectoryName(outputPath)!);
            await File.WriteAllLinesAsync(outputPath, lines, ct);
        }

        private UltrastarSongInfo? ParseFileSync(string filePath)
        {
            try
            {
                var song = new UltrastarSongInfo { FilePath = filePath };
                foreach (var line in File.ReadLines(filePath))
                {
                    if (!line.StartsWith('#')) break;
                    if (line.StartsWith("#TITLE:", StringComparison.OrdinalIgnoreCase))
                        song.Title = line["#TITLE:".Length..].Trim();
                    else if (line.StartsWith("#ARTIST:", StringComparison.OrdinalIgnoreCase))
                        song.Artist = line["#ARTIST:".Length..].Trim();
                    else if (line.StartsWith("#GENRE:", StringComparison.OrdinalIgnoreCase))
                        song.Genre = line["#GENRE:".Length..].Trim();
                    else if (line.StartsWith("#LANGUAGE:", StringComparison.OrdinalIgnoreCase))
                        song.Language = line["#LANGUAGE:".Length..].Trim();
                    else if (line.StartsWith("#YEAR:", StringComparison.OrdinalIgnoreCase) && int.TryParse(line["#YEAR:".Length..].Trim(), out var year))
                        song.Year = year;
                    else if (line.StartsWith("#BPM:", StringComparison.OrdinalIgnoreCase) && int.TryParse(line["#BPM:".Length..].Trim(), out var bpm))
                        song.Bpm = bpm;
                    else if (line.StartsWith("#GAP:", StringComparison.OrdinalIgnoreCase) && int.TryParse(line["#GAP:".Length..].Trim(), out var gap))
                        song.Gap = gap;
                    else if (line.StartsWith("#COVER:", StringComparison.OrdinalIgnoreCase))
                        song.CoverPath = line["#COVER:".Length..].Trim();
                    else if (line.StartsWith("#MP3:", StringComparison.OrdinalIgnoreCase))
                        song.AudioPath = line["#MP3:".Length..].Trim();
                    else if (line.StartsWith("#VIDEO:", StringComparison.OrdinalIgnoreCase))
                        song.VideoPath = line["#VIDEO:".Length..].Trim();
                }
                return string.IsNullOrWhiteSpace(song.Title) || string.IsNullOrWhiteSpace(song.Artist) ? null : song;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse UltraStar file: {Path}", filePath);
                return null;
            }
        }

        private IEnumerable<string> GetAllRoots()
        {
            yield return Path.GetFullPath(_options.RootDirectory);
            foreach (var add in _options.AdditionalRootDirectories ?? Array.Empty<string>())
                if (!string.IsNullOrWhiteSpace(add)) yield return Path.GetFullPath(add);
        }
    }
}
