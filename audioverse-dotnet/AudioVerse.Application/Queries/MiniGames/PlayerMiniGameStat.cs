namespace AudioVerse.Application.Queries.MiniGames;

/// <summary>Per-game personal best stat for a player.</summary>
public record PlayerMiniGameStat(
    string Game,
    string Mode,
    int BestScore,
    int TotalGames,
    int TotalXpEarned,
    DateTime LastPlayedAtUtc
);
