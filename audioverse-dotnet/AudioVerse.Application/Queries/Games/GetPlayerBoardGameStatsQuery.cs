using AudioVerse.Application.Models.Responses.Games;
using MediatR;

namespace AudioVerse.Application.Queries.Games;

public record GetPlayerBoardGameStatsQuery(int PlayerId) : IRequest<PlayerBoardGameStats>;
