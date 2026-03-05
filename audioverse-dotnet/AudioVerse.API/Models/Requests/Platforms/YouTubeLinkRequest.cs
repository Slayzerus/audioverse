

namespace AudioVerse.API.Models.Requests.Platforms;

/// <summary>Request to link a YouTube account (OAuth code exchange).</summary>
public record YouTubeLinkRequest(string Code, string RedirectUri);
