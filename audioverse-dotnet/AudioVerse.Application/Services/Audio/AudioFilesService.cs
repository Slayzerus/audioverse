using AudioVerse.Application.Models.Audio;

namespace AudioVerse.Application.Services.Audio
{
    public class AudioFilesService : IAudioFilesService
    {
        public Task<IReadOnlyList<ScannedAudioFile>> ScanDirectoryAsync(string path, CancellationToken ct)
        {
            var results = new List<ScannedAudioFile>();
            if (!Directory.Exists(path)) return Task.FromResult<IReadOnlyList<ScannedAudioFile>>(results);

            var extensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".mp3", ".flac", ".wav", ".ogg", ".m4a", ".aac", ".wma" };
            foreach (var file in Directory.EnumerateFiles(path, "*.*", SearchOption.AllDirectories))
            {
                if (!extensions.Contains(Path.GetExtension(file))) continue;
                var fileName = Path.GetFileNameWithoutExtension(file);
                var parts = fileName.Split(" - ", 2);
                results.Add(new ScannedAudioFile(
                    FilePath: file,
                    FileName: Path.GetFileName(file),
                    Title: parts.Length > 1 ? parts[1].Trim() : fileName,
                    Artist: parts.Length > 1 ? parts[0].Trim() : null,
                    Album: null, Genre: null, Year: null, Duration: null, SampleRate: null, Channels: null
                ));
            }
            return Task.FromResult<IReadOnlyList<ScannedAudioFile>>(results);
        }
    }
}
