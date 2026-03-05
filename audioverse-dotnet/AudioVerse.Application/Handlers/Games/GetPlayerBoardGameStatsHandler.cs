using AudioVerse.Application.Models.Responses.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class GetPlayerBoardGameStatsHandler(IGameRepository gameRepo) : IRequestHandler<GetPlayerBoardGameStatsQuery, PlayerBoardGameStats>
{
    public async Task<PlayerBoardGameStats> Handle(GetPlayerBoardGameStatsQuery req, CancellationToken ct)
    {
        var partPlayers = await gameRepo.GetPartPlayersByPlayerAsync(req.PlayerId, ct);
        var sessions = (await gameRepo.GetSessionsByPlayerAsync(req.PlayerId, ct)).ToList();

        var scores = partPlayers.Where(pp => pp.Score.HasValue).Select(pp => pp.Score!.Value).ToList();

        int wins = 0;
        var gamePlayCounts = new Dictionary<int, (string Name, int Count, int? Best)>();

        foreach (var session in sessions)
        {
            var eventBg = await gameRepo.GetEventBoardGameByEventAsync(session.EventId, ct);

            var allPlayers = session.Rounds.SelectMany(r => r.Parts).SelectMany(p => p.Players).ToList();
            var playerTotals = allPlayers.GroupBy(p => p.PlayerId)
                .Select(g => new { PlayerId = g.Key, Total = g.Sum(p => p.Score ?? 0) })
                .OrderByDescending(x => x.Total).ToList();

            if (playerTotals.FirstOrDefault()?.PlayerId == req.PlayerId)
                wins++;

            if (eventBg?.BoardGame != null && eventBg.BoardGameId.HasValue)
            {
                var bgId = eventBg.BoardGameId.Value;
                var myBest = allPlayers.Where(p => p.PlayerId == req.PlayerId && p.Score.HasValue)
                    .Select(p => p.Score!.Value).DefaultIfEmpty(0).Max();
                if (gamePlayCounts.TryGetValue(bgId, out var existing))
                    gamePlayCounts[bgId] = (existing.Name, existing.Count + 1, Math.Max(existing.Best ?? 0, myBest));
                else
                    gamePlayCounts[bgId] = (eventBg.BoardGame.Name, 1, myBest);
            }
        }

        return new PlayerBoardGameStats
        {
            PlayerId = req.PlayerId,
            TotalSessions = sessions.Count,
            TotalWins = wins,
            WinRate = sessions.Count > 0 ? Math.Round((double)wins / sessions.Count * 100, 1) : 0,
            AverageScore = scores.Count > 0 ? Math.Round(scores.Average(), 1) : 0,
            TopGames = gamePlayCounts.OrderByDescending(kv => kv.Value.Count)
                .Take(5)
                .Select(kv => new TopGameDto
                {
                    BoardGameId = kv.Key,
                    BoardGameName = kv.Value.Name,
                    TimesPlayed = kv.Value.Count,
                    BestScore = kv.Value.Best
                }).ToList()
        };
    }
}
