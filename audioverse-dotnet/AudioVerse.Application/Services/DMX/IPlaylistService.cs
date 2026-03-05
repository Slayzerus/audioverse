using AudioVerse.Application.Models.Audio;

namespace AudioVerse.Application.Services.DMX
{
    public interface IPlaylistService
    {
        Task<PlaylistResult> CreatePlaylistAsync(string platform, string name, IEnumerable<string> trackIds, string? description = null, CancellationToken ct = default);
    }
}
