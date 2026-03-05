using AudioVerse.Application.Models.Responses.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class GetBoardGameStatsHandler(IGameRepository gameRepo) : IRequestHandler<GetBoardGameStatsQuery, BoardGameStats>
{
    public async Task<BoardGameStats> Handle(GetBoardGameStatsQuery req, CancellationToken ct)
    {
        var sessions = (await gameRepo.GetSessionsByBoardGameAsync(req.BoardGameId, ct)).ToList();

        var allPlayers = sessions.SelectMany(s => s.Rounds).SelectMany(r => r.Parts).SelectMany(p => p.Players).ToList();
        var allScores = allPlayers.Where(p => p.Score.HasValue).Select(p => p.Score!.Value).ToList();

        double avgDuration = 0;
        var sessionsWithEnd = sessions.Where(s => s.EndedAt.HasValue).ToList();
        if (sessionsWithEnd.Count > 0)
            avgDuration = sessionsWithEnd.Average(s => (s.EndedAt!.Value - s.StartedAt).TotalMinutes);

        return new BoardGameStats
        {
            BoardGameId = req.BoardGameId,
            TotalPlayCount = sessions.Count,
            AverageSessionDurationMinutes = Math.Round(avgDuration, 1),
            UniquePlayerCount = allPlayers.Select(p => p.PlayerId).Distinct().Count(),
            HighestScore = allScores.Count > 0 ? allScores.Max() : null
        };
    }
}
