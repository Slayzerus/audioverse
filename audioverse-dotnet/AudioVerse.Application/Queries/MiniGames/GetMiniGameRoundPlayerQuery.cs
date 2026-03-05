using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Queries.MiniGames;

/// <summary>Get a player's result in a specific mini-game round.</summary>
public record GetMiniGameRoundPlayerQuery(int RoundId, int PlayerId) : IRequest<MiniGameRoundPlayer?>;
