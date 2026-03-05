using AudioVerse.Application.Models.Audio;
using AudioVerse.Application.Services.Platforms.Spotify;

namespace AudioVerse.Application.Services.DMX
{
    public class PlaylistService : IPlaylistService
    {
        private readonly ISpotifyService? _spotify;
        public PlaylistService(ISpotifyService? spotify = null) { _spotify = spotify; }

        public async Task<PlaylistResult> CreatePlaylistAsync(string platform, string name, IEnumerable<string> trackIds, string? description, CancellationToken ct)
        {
            await Task.CompletedTask;
            var count = trackIds.Count();
            return new PlaylistResult(platform, Guid.NewGuid().ToString(), null, count);
        }
    }
}
