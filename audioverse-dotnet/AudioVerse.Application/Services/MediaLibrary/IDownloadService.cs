namespace AudioVerse.Application.Services.MediaLibrary
{
    public interface IDownloadService
    {
        Task<DownloadedFile?> DownloadAudioAsync(string url, string? fileName = null, CancellationToken ct = default);
        Task<DownloadedFile?> DownloadImageAsync(string url, string? fileName = null, CancellationToken ct = default);
        Task<DownloadedFile?> DownloadFileAsync(string url, string? fileName = null, CancellationToken ct = default);
    }
}
