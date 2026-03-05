

namespace AudioVerse.API.Models.Requests.Platforms;

/// <summary>Request to play a Spotify track or context.</summary>
public record SpotifyPlayRequest(string? TrackUri, string? ContextUri, int? PositionMs, int? Offset, string? DeviceId);
