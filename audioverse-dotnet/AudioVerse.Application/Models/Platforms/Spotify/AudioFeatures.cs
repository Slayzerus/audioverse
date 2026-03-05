using System.Text.Json.Serialization;

namespace AudioVerse.Application.Models.Platforms.Spotify
{
    public sealed class AudioFeatures
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("danceability")] public float Danceability { get; set; }
        [JsonPropertyName("energy")] public float Energy { get; set; }
        [JsonPropertyName("key")] public int Key { get; set; }
        [JsonPropertyName("loudness")] public float Loudness { get; set; }
        [JsonPropertyName("mode")] public int Mode { get; set; }
        [JsonPropertyName("speechiness")] public float Speechiness { get; set; }
        [JsonPropertyName("acousticness")] public float Acousticness { get; set; }
        [JsonPropertyName("instrumentalness")] public float Instrumentalness { get; set; }
        [JsonPropertyName("liveness")] public float Liveness { get; set; }
        [JsonPropertyName("valence")] public float Valence { get; set; }
        [JsonPropertyName("tempo")] public float Tempo { get; set; }
    }
}
