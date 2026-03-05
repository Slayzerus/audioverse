using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.Spotify
{
    public sealed class SpotifyAuthTokens
    {
        [JsonPropertyName("access_token")] public string AccessToken { get; set; } = string.Empty;
        [JsonPropertyName("refresh_token")] public string? RefreshToken { get; set; }
        [JsonPropertyName("token_type")] public string TokenType { get; set; } = "Bearer";
        [JsonPropertyName("expires_in")] public int ExpiresInSeconds { get; set; }
        [JsonIgnore] public DateTimeOffset ExpiresAt { get; set; }
        [JsonIgnore] public string? Scope { get; set; }
    }
}
