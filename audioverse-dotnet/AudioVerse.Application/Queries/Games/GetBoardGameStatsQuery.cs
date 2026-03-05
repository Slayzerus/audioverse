using AudioVerse.Application.Models.Responses.Games;
using MediatR;

namespace AudioVerse.Application.Queries.Games;

public record GetBoardGameStatsQuery(int BoardGameId) : IRequest<BoardGameStats>;
