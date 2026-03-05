

namespace AudioVerse.API.Models.Requests.Platforms;

/// <summary>Request to play a Tidal track.</summary>
public record TidalPlayRequest(string? TrackId, AudioVerse.Application.Models.Platforms.Tidal.SoundQuality? Quality);
