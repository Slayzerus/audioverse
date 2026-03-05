using AudioVerse.Application.Queries.MiniGames;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.MiniGames;

/// <summary>Handles retrieving a player's result from a specific mini-game round.</summary>
public class GetMiniGameRoundPlayerHandler(IGameRepository gameRepository)
    : IRequestHandler<GetMiniGameRoundPlayerQuery, MiniGameRoundPlayer?>
{
    public async Task<MiniGameRoundPlayer?> Handle(GetMiniGameRoundPlayerQuery request, CancellationToken cancellationToken)
    {
        return await gameRepository.GetMiniGameRoundPlayerAsync(request.RoundId, request.PlayerId);
    }
}
