

namespace AudioVerse.API.Models.Requests.Radio;

/// <summary>Request to react to a song.</summary>
public record SongReactionRequest(int? TrackId, string? ExternalTrackId, string? ReactionType);
