using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.Spotify
{
    public sealed class UserProfile
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("display_name")] public string? DisplayName { get; set; }
        [JsonPropertyName("country")] public string? Country { get; set; }
        [JsonPropertyName("product")] public string? Product { get; set; }
    }
}
