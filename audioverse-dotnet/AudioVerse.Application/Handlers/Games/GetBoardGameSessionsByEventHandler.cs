using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class GetBoardGameSessionsByEventHandler(IGameRepository r) : IRequestHandler<GetBoardGameSessionsByEventQuery, IEnumerable<BoardGameSession>>
{ public Task<IEnumerable<BoardGameSession>> Handle(GetBoardGameSessionsByEventQuery req, CancellationToken ct) => r.GetBoardGameSessionsByEventAsync(req.EventId); }
