using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetBoardGameByIdHandler(IEventRepository r) : IRequestHandler<GetBoardGameByIdQuery, BoardGame?>
{ public Task<BoardGame?> Handle(GetBoardGameByIdQuery req, CancellationToken ct) => r.GetBoardGameByIdAsync(req.Id); }
