namespace AudioVerse.Application.Commands.MiniGames;

/// <summary>XP result per player after a mini-game round.</summary>
public record MiniGamePlayerXpResult(
    int PlayerId,
    int Score,
    int? Placement,
    bool IsPersonalBest,
    int XpEarned,
    int NewTotalXp,
    int NewLevel,
    bool LeveledUp
);
