namespace AudioVerse.Application.Models.Requests.MiniGames;

/// <summary>Request to create a new mini-game session.</summary>
public record CreateMiniGameSessionRequest(int HostPlayerId, int? EventId = null, string? Title = null);
