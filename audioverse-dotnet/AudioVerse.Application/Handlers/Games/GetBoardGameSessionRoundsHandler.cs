using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class GetBoardGameSessionRoundsHandler(IGameRepository r) : IRequestHandler<GetBoardGameSessionRoundsQuery, IEnumerable<BoardGameSessionRound>>
{ public Task<IEnumerable<BoardGameSessionRound>> Handle(GetBoardGameSessionRoundsQuery req, CancellationToken ct) => r.GetBoardGameSessionRoundsAsync(req.SessionId); }
