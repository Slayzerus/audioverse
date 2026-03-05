

namespace AudioVerse.API.Models.Requests.Platforms;

/// <summary>Request to link a Spotify account (OAuth code exchange).</summary>
public record SpotifyLinkRequest(string Code, string RedirectUri);
