using AudioVerse.Application.Models.Audio;

namespace AudioVerse.Application.Services.Audio
{
    public interface IAudioFilesService
    {
        Task<IReadOnlyList<ScannedAudioFile>> ScanDirectoryAsync(string path, CancellationToken ct = default);
    }
}
