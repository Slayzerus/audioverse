using AudioVerse.Application.Models.Platforms.Spotify;

namespace AudioVerse.Application.Services.Platforms.Spotify
{
    public interface ISpotifyService
    {
        // Auth
        Task<SpotifyAuthTokens> AuthenticateWithAuthCodeAsync(string code, string redirectUri, CancellationToken ct = default);
        Task<SpotifyAuthTokens> RefreshTokenAsync(string refreshToken, CancellationToken ct = default);
        void SetAccessToken(string accessToken);

        // Search
        Task<SearchResults> SearchAsync(string query, string types = "track,album,artist,playlist", int limit = 20, int offset = 0, CancellationToken ct = default);

        // Catalog
        Task<Track> GetTrackAsync(string trackId, CancellationToken ct = default);
        Task<Album> GetAlbumAsync(string albumId, CancellationToken ct = default);
        Task<PagedResponse<Track>> GetAlbumTracksAsync(string albumId, int limit = 50, int offset = 0, CancellationToken ct = default);
        Task<Artist> GetArtistAsync(string artistId, CancellationToken ct = default);
        Task<PagedResponse<Track>> GetArtistTopTracksAsync(string artistId, string? market = null, CancellationToken ct = default);

        // User
        Task<UserProfile> GetCurrentUserAsync(CancellationToken ct = default);
        Task<PagedResponse<Playlist>> GetUserPlaylistsAsync(string? userId = null, int limit = 50, int offset = 0, CancellationToken ct = default);

        // Playlists
        Task<Playlist> CreatePlaylistAsync(string userId, CreatePlaylistRequest request, CancellationToken ct = default);
        Task AddTracksToPlaylistAsync(string playlistId, AddTracksRequest request, CancellationToken ct = default);
        Task RemoveTracksFromPlaylistAsync(string playlistId, RemoveTracksRequest request, CancellationToken ct = default);
        Task<Playlist> GetPlaylistAsync(string playlistId, CancellationToken ct = default);
        Task<PagedResponse<PlaylistItem>> GetPlaylistItemsAsync(string playlistId, int limit = 100, int offset = 0, CancellationToken ct = default);

        // Library (saved tracks)
        Task LikeTracksAsync(IEnumerable<string> trackIds, CancellationToken ct = default);
        Task UnlikeTracksAsync(IEnumerable<string> trackIds, CancellationToken ct = default);
        Task<PagedResponse<Track>> GetUserSavedTracksAsync(int limit = 50, int offset = 0, CancellationToken ct = default);

        // Extras
        Task<AudioFeatures> GetAudioFeaturesAsync(string trackId, CancellationToken ct = default);
        Task<RecommendationsResponse> GetRecommendationsAsync(IEnumerable<string>? seedTracks = null, IEnumerable<string>? seedArtists = null, IEnumerable<string>? seedGenres = null, int limit = 20, CancellationToken ct = default);
        Task<IReadOnlyList<string>> GetAvailableGenreSeedsAsync(CancellationToken ct = default);

        // Following
        Task FollowArtistAsync(string artistId, CancellationToken ct = default);
        Task UnfollowArtistAsync(string artistId, CancellationToken ct = default);
    }
}
