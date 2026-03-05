using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Queries.MiniGames;

/// <summary>Get a mini-game session with all rounds and player results.</summary>
public record GetMiniGameSessionQuery(int SessionId) : IRequest<MiniGameSession?>;
