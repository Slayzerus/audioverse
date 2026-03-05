namespace AudioVerse.Domain.Entities.Games;

/// <summary>
/// Achievement / milestone that can be unlocked by playing a specific game.
/// </summary>
public class AvGameAchievement
{
    public int Id { get; set; }

    public int GameId { get; set; }
    public AvGame? Game { get; set; }

    /// <summary>Unique code within the game (e.g. "first_win", "score_1000", "play_100_rounds").</summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>Display name.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>How to unlock this achievement.</summary>
    public string? Description { get; set; }

    /// <summary>Icon name or image URL.</summary>
    public string? Icon { get; set; }

    /// <summary>XP reward when unlocked.</summary>
    public int XpReward { get; set; }

    /// <summary>Sort order for display.</summary>
    public int SortOrder { get; set; }

    /// <summary>Whether this achievement is currently active.</summary>
    public bool IsEnabled { get; set; } = true;
}
