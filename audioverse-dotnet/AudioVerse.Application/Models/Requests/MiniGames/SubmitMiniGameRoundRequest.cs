namespace AudioVerse.Application.Models.Requests.MiniGames;

/// <summary>Request to submit a completed mini-game round with player results.</summary>
public record SubmitMiniGameRoundRequest(
    string Game,
    string Mode,
    string? SettingsJson,
    int? DurationSeconds,
    List<SubmitMiniGameRoundPlayerRequest> Players
);
