using AudioVerse.Application.Models.Platforms.Tidal;
using Album = AudioVerse.Application.Models.Platforms.Tidal.Album;
using Artist = AudioVerse.Application.Models.Platforms.Tidal.Artist;
using Playlist = AudioVerse.Application.Models.Platforms.Tidal.Playlist;
using SearchResults = AudioVerse.Application.Models.Platforms.Tidal.SearchResults;
using Track = AudioVerse.Application.Models.Platforms.Tidal.Track;

namespace AudioVerse.Application.Services.Platforms.Tidal
{
    public interface ITidalService
    {
        // Auth
        Task<TidalAuthTokens> AuthenticateWithAuthCodeAsync(string code, string redirectUri, CancellationToken ct = default);
        Task<TidalAuthTokens> RefreshTokenAsync(string refreshToken, CancellationToken ct = default);
        void SetAccessToken(string accessToken);

        // Search
        Task<SearchResults> SearchAsync(string query, int limit = 20, int offset = 0, CancellationToken ct = default);

        // Catalog
        Task<Track> GetTrackAsync(string trackId, CancellationToken ct = default);
        Task<Album> GetAlbumAsync(string albumId, CancellationToken ct = default);
        Task<PagedResponse<Track>> GetAlbumTracksAsync(string albumId, int limit = 50, int offset = 0, CancellationToken ct = default);
        Task<Artist> GetArtistAsync(string artistId, CancellationToken ct = default);
        Task<PagedResponse<Track>> GetArtistTopTracksAsync(string artistId, int limit = 20, int offset = 0, CancellationToken ct = default);

        // User
        Task<UserProfile> GetCurrentUserAsync(CancellationToken ct = default);
        Task<PagedResponse<Playlist>> GetUserPlaylistsAsync(string? userId = null, int limit = 50, int offset = 0, CancellationToken ct = default);

        // Playlists
        Task<Playlist> CreatePlaylistAsync(CreatePlaylistRequest request, CancellationToken ct = default);
        Task AddTracksToPlaylistAsync(string playlistId, AddTracksRequest request, CancellationToken ct = default);
        Task RemoveTracksFromPlaylistAsync(string playlistId, RemoveTracksRequest request, CancellationToken ct = default);
        Task<Playlist> GetPlaylistAsync(string playlistId, CancellationToken ct = default);
        Task<PagedResponse<PlaylistItem>> GetPlaylistItemsAsync(string playlistId, int limit = 100, int offset = 0, CancellationToken ct = default);

        // Library (likes/favorites)
        Task LikeTrackAsync(string trackId, CancellationToken ct = default);
        Task UnlikeTrackAsync(string trackId, CancellationToken ct = default);

        // Streams & extras
        Task<StreamUrlResponse> GetStreamUrlAsync(string trackId, SoundQuality? quality = null, CancellationToken ct = default);
        Task<Lyrics?> GetLyricsAsync(string trackId, CancellationToken ct = default);

        // Discovery
        Task<PagedResponse<Track>> GetRecommendationsAsync(string? seedTrackId = null, string? seedArtistId = null, int limit = 20, int offset = 0, CancellationToken ct = default);
        Task<IReadOnlyList<string>> GetGenresAsync(CancellationToken ct = default);
        Task<IReadOnlyList<string>> GetMoodsAndActivitiesAsync(CancellationToken ct = default);
    }
}
