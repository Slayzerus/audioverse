using AudioVerse.Application.Queries.MiniGames;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.MiniGames;

/// <summary>Handles retrieving the leaderboard for a specific mini-game.</summary>
public class GetMiniGameLeaderboardHandler(IGameRepository gameRepository)
    : IRequestHandler<GetMiniGameLeaderboardQuery, List<MiniGameLeaderboardEntry>>
{
    public async Task<List<MiniGameLeaderboardEntry>> Handle(GetMiniGameLeaderboardQuery request, CancellationToken cancellationToken)
    {
        var rows = await gameRepository.GetMiniGameLeaderboardAsync(request.Game, request.Mode, request.Top);
        return rows.Select(r => new MiniGameLeaderboardEntry(r.PlayerId, r.PlayerName, r.BestScore, r.TotalGames, r.AchievedAtUtc)).ToList();
    }
}
