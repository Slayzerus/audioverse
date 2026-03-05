using MediatR;

namespace AudioVerse.Application.Commands.MiniGames;

/// <summary>Create a new mini-game session.</summary>
public record CreateMiniGameSessionCommand(
    int? EventId,
    int HostPlayerId,
    string? Title
) : IRequest<int>;
