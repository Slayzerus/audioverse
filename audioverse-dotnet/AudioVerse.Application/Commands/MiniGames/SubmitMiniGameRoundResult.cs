namespace AudioVerse.Application.Commands.MiniGames;

/// <summary>Result returned after submitting a mini-game round.</summary>
public record SubmitMiniGameRoundResult(
    int RoundId,
    int RoundNumber,
    List<MiniGamePlayerXpResult> PlayerResults
);
