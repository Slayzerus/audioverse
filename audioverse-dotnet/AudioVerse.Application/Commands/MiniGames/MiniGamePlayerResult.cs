namespace AudioVerse.Application.Commands.MiniGames;

/// <summary>Individual player result within a round submission.</summary>
public record MiniGamePlayerResult(
    int PlayerId,
    int Score,
    int? Placement,
    string? ResultDetailsJson
);
