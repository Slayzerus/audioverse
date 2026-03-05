using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.Spotify
{
    public sealed class ErrorResponse
    {
        [JsonPropertyName("error")] public object? Error { get; set; } // can be string or { status, message }
    }
}
