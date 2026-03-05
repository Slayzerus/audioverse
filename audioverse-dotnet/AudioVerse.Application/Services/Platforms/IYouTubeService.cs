using AudioVerse.Application.Models.Platforms.YouTube;

namespace AudioVerse.Application.Services.Platforms
{
    public interface IYouTubeService
    {
        // Search
        Task<SearchResponse<SearchItem>> SearchAsync(string query, string type = "video", int maxResults = 25, string? pageToken = null, CancellationToken ct = default);
        Task<string?> SearchSongAsync(string artist, string title); // existing convenience
        string GetEmbedUrl(string videoId);

        // Videos
        Task<Video?> GetVideoAsync(string id, CancellationToken ct = default);
        Task<List<Video>> GetVideosAsync(IEnumerable<string> ids, CancellationToken ct = default);

        // Channels
        Task<Channel?> GetChannelAsync(string id, CancellationToken ct = default);

        // Playlists
        Task<Playlist?> GetPlaylistAsync(string id, CancellationToken ct = default);
        Task<SearchResponse<PlaylistItem>> GetPlaylistItemsAsync(string playlistId, int maxResults = 50, string? pageToken = null, CancellationToken ct = default);
        Task<SearchResponse<Playlist>> ListChannelPlaylistsAsync(string channelId, int maxResults = 50, string? pageToken = null, CancellationToken ct = default);

        // Comments
        Task<SearchResponse<CommentThread>> GetCommentsAsync(string videoId, string order = "relevance", int maxResults = 20, string? pageToken = null, CancellationToken ct = default);

        // Captions & categories
        Task<SearchResponse<Caption>> GetCaptionsAsync(string videoId, CancellationToken ct = default);
        Task<SearchResponse<VideoCategory>> GetVideoCategoriesAsync(string regionCode = "PL", CancellationToken ct = default);

        // OAuth-protected actions (require AccessToken)
        void SetAccessToken(string accessToken);
        Task RateVideoAsync(string videoId, string rating, CancellationToken ct = default); // like|dislike|none
        Task<Playlist> CreatePlaylistAsync(string title, string? description = null, string privacyStatus = "private", CancellationToken ct = default);
        Task<PlaylistItem> AddVideoToPlaylistAsync(string playlistId, string videoId, CancellationToken ct = default);
        Task RemovePlaylistItemAsync(string playlistItemId, CancellationToken ct = default);
        Task<SearchResponse<Playlist>> GetMyPlaylistsAsync(int maxResults = 50, string? pageToken = null, CancellationToken ct = default);
        Task SubscribeAsync(string channelId, CancellationToken ct = default);
        Task UnsubscribeAsync(string subscriptionId, CancellationToken ct = default);
    }

}
