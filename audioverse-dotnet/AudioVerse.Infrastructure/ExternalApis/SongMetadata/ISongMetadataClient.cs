namespace AudioVerse.Infrastructure.ExternalApis;

/// <summary>Client for searching song metadata from YouTube and Spotify.</summary>
public interface ISongMetadataClient
{
    Task<SongMetadataResult?> SearchYouTubeAsync(string query);
    Task<SongMetadataResult?> GetYouTubeVideoAsync(string videoId);
    Task<SongMetadataResult?> SearchSpotifyAsync(string query);
}
