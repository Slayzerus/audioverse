

namespace AudioVerse.API.Models.Requests.Radio;

/// <summary>Request to send a chat message.</summary>
public record ChatMessageRequest(string Content, string? DisplayName = null);
