using MediatR;

namespace AudioVerse.Application.Queries.MiniGames;

/// <summary>Get a player's personal best scores across all mini-games.</summary>
public record GetPlayerMiniGameStatsQuery(int PlayerId) : IRequest<List<PlayerMiniGameStat>>;
