namespace AudioVerse.Application.Services.MediaLibrary
{
    public interface IUltrastarFileService
    {
        Task<IReadOnlyList<UltrastarSongInfo>> ScanAsync(CancellationToken ct = default);
        Task<UltrastarSongInfo?> ParseFileAsync(string filePath, CancellationToken ct = default);
        Task ExportAsync(UltrastarSongInfo song, string outputPath, CancellationToken ct = default);
    }
}
