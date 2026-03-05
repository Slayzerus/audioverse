using AudioVerse.Application.Commands.MiniGames;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Enums;
using AudioVerse.Domain.Repositories;
using AudioVerse.Domain.Services;
using MediatR;

namespace AudioVerse.Application.Handlers.MiniGames;

/// <summary>Handles submitting a completed mini-game round — saves results, detects personal bests, awards XP.</summary>
public class SubmitMiniGameRoundHandler(IGameRepository gameRepository, IPlayerProgressService progressService)
    : IRequestHandler<SubmitMiniGameRoundCommand, SubmitMiniGameRoundResult>
{
    private const int BaseXp = 10;
    private const int WinnerBonusXp = 15;
    private const int PersonalBestBonusXp = 20;

    public async Task<SubmitMiniGameRoundResult> Handle(SubmitMiniGameRoundCommand request, CancellationToken cancellationToken)
    {
        var session = await gameRepository.GetMiniGameSessionByIdAsync(request.SessionId, includeRounds: false)
            ?? throw new InvalidOperationException("Session not found");

        var roundCount = await gameRepository.GetMiniGameRoundCountAsync(request.SessionId);

        var round = new MiniGameRound
        {
            SessionId = session.Id,
            RoundNumber = roundCount + 1,
            Game = request.Game,
            Mode = request.Mode,
            SettingsJson = request.SettingsJson,
            DurationSeconds = request.DurationSeconds,
            EndedAtUtc = DateTime.UtcNow
        };

        await gameRepository.AddMiniGameRoundAsync(round);

        var playerIds = request.Players.Select(p => p.PlayerId).ToList();
        var existingBests = await gameRepository.GetMiniGameBestScoresAsync(request.Game, request.Mode, playerIds);

        var playerResults = new List<MiniGamePlayerXpResult>();
        var roundPlayers = new List<MiniGameRoundPlayer>();

        foreach (var p in request.Players)
        {
            var isPersonalBest = !existingBests.TryGetValue(p.PlayerId, out var prevBest) || p.Score > prevBest;

            var xp = BaseXp;
            if (p.Placement == 1) xp += WinnerBonusXp;
            if (isPersonalBest) xp += PersonalBestBonusXp;

            roundPlayers.Add(new MiniGameRoundPlayer
            {
                RoundId = round.Id,
                PlayerId = p.PlayerId,
                Score = p.Score,
                Placement = p.Placement,
                IsPersonalBest = isPersonalBest,
                XpEarned = xp,
                ResultDetailsJson = p.ResultDetailsJson
            });

            var (newXp, newLevel, leveledUp) = await progressService.AddXpAsync(
                p.PlayerId, ProgressCategory.MiniGame, xp, "minigame_round", round.Id, cancellationToken);

            playerResults.Add(new MiniGamePlayerXpResult(
                p.PlayerId, p.Score, p.Placement, isPersonalBest, xp, newXp, newLevel, leveledUp));
        }

        await gameRepository.AddMiniGameRoundPlayersAsync(roundPlayers);

        return new SubmitMiniGameRoundResult(round.Id, round.RoundNumber, playerResults);
    }
}
