using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.Tidal
{
    public sealed class TidalAuthTokens
    {
        [JsonPropertyName("access_token")] public string AccessToken { get; set; } = string.Empty;
        [JsonPropertyName("refresh_token")] public string RefreshToken { get; set; } = string.Empty;
        [JsonPropertyName("token_type")] public string TokenType { get; set; } = "Bearer";
        [JsonPropertyName("expires_in")] public int ExpiresInSeconds { get; set; }
        [JsonIgnore] public DateTimeOffset ExpiresAt { get; set; }
    }
}
