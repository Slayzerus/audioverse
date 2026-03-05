using AudioVerse.Application.Models.Audio;

namespace AudioVerse.Application.Services.Platforms
{
    public interface IYouTubeSearchService
    {
        Task<IReadOnlyList<ExternalTrackResult>> SearchAsync(string query, int limit = 10, CancellationToken ct = default);
    }
}
