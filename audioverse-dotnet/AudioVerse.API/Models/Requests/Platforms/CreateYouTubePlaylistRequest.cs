

namespace AudioVerse.API.Models.Requests.Platforms;

/// <summary>Request to create a YouTube playlist.</summary>
public record CreateYouTubePlaylistRequest(string Title, string? Description, string? PrivacyStatus);
