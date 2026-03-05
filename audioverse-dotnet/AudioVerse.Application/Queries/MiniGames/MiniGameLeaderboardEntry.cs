namespace AudioVerse.Application.Queries.MiniGames;

/// <summary>Leaderboard entry for a specific mini-game.</summary>
public record MiniGameLeaderboardEntry(
    int PlayerId,
    string PlayerName,
    int BestScore,
    int TotalGames,
    DateTime AchievedAtUtc
);
