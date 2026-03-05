using MediatR;

namespace AudioVerse.Application.Commands.MiniGames;

/// <summary>End an active mini-game session.</summary>
public record EndMiniGameSessionCommand(int SessionId) : IRequest<bool>;
