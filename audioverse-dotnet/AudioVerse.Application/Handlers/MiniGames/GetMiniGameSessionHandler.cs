using AudioVerse.Application.Queries.MiniGames;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.MiniGames;

/// <summary>Handles retrieving a mini-game session with all rounds and player results.</summary>
public class GetMiniGameSessionHandler(IGameRepository gameRepository)
    : IRequestHandler<GetMiniGameSessionQuery, MiniGameSession?>
{
    public async Task<MiniGameSession?> Handle(GetMiniGameSessionQuery request, CancellationToken cancellationToken)
    {
        return await gameRepository.GetMiniGameSessionByIdAsync(request.SessionId);
    }
}
