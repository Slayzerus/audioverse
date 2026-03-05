using AudioVerse.Application.Queries.MiniGames;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.MiniGames;

/// <summary>Handles retrieving a player's personal best stats across all mini-games.</summary>
public class GetPlayerMiniGameStatsHandler(IGameRepository gameRepository)
    : IRequestHandler<GetPlayerMiniGameStatsQuery, List<PlayerMiniGameStat>>
{
    public async Task<List<PlayerMiniGameStat>> Handle(GetPlayerMiniGameStatsQuery request, CancellationToken cancellationToken)
    {
        var rows = await gameRepository.GetPlayerMiniGameStatsAsync(request.PlayerId);
        return rows.Select(r => new PlayerMiniGameStat(r.Game, r.Mode, r.BestScore, r.TotalGames, r.TotalXpEarned, r.LastPlayedAtUtc)).ToList();
    }
}
