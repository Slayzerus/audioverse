

namespace AudioVerse.API.Models.Requests.Platforms;

/// <summary>Request to link a Tidal account (OAuth code exchange).</summary>
public record TidalLinkRequest(string Code, string RedirectUri);
