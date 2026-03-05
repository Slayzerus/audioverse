using AudioVerse.Application.Commands.MiniGames;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.MiniGames;

/// <summary>Handles creating a new mini-game session.</summary>
public class CreateMiniGameSessionHandler(IGameRepository gameRepository)
    : IRequestHandler<CreateMiniGameSessionCommand, int>
{
    public async Task<int> Handle(CreateMiniGameSessionCommand request, CancellationToken cancellationToken)
    {
        var session = new MiniGameSession
        {
            EventId = request.EventId,
            HostPlayerId = request.HostPlayerId,
            Title = request.Title
        };

        return await gameRepository.AddMiniGameSessionAsync(session);
    }
}
