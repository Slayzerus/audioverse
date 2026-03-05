using MediatR;

namespace AudioVerse.Application.Commands.MiniGames;

/// <summary>Submit a completed mini-game round with player results. XP is awarded automatically.</summary>
public record SubmitMiniGameRoundCommand(
    int SessionId,
    string Game,
    string Mode,
    string? SettingsJson,
    int? DurationSeconds,
    List<MiniGamePlayerResult> Players
) : IRequest<SubmitMiniGameRoundResult>;
