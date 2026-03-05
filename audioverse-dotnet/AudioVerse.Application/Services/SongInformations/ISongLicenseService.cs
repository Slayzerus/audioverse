namespace AudioVerse.Application.Services.SongInformations
{
    public interface ISongLicenseService
    {
        Task<IReadOnlyList<SongLicenseInfo>> GetLicenseInfoAsync(string title, string artist, CancellationToken ct = default);
    }
}
