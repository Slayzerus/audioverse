using AudioVerse.Application.Commands.MiniGames;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.MiniGames;

/// <summary>Handles ending a mini-game session.</summary>
public class EndMiniGameSessionHandler(IGameRepository gameRepository)
    : IRequestHandler<EndMiniGameSessionCommand, bool>
{
    public async Task<bool> Handle(EndMiniGameSessionCommand request, CancellationToken cancellationToken)
    {
        return await gameRepository.EndMiniGameSessionAsync(request.SessionId);
    }
}
