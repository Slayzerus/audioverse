namespace AudioVerse.Application.Models.Requests.MiniGames;

/// <summary>Player result within a round submission request.</summary>
public record SubmitMiniGameRoundPlayerRequest(
    int PlayerId,
    int Score,
    int? Placement = null,
    string? ResultDetailsJson = null
);
