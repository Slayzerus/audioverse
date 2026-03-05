using MediatR;

namespace AudioVerse.Application.Queries.MiniGames;

/// <summary>Get leaderboard (best scores) for a specific mini-game, optionally filtered by mode.</summary>
public record GetMiniGameLeaderboardQuery(
    string Game,
    string? Mode,
    int Top
) : IRequest<List<MiniGameLeaderboardEntry>>;
