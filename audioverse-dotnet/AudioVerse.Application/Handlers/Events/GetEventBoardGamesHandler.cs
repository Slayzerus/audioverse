using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetEventBoardGamesHandler(IEventRepository r) : IRequestHandler<GetEventBoardGamesQuery, IEnumerable<EventBoardGameSession>>
{ public Task<IEnumerable<EventBoardGameSession>> Handle(GetEventBoardGamesQuery req, CancellationToken ct) => r.GetEventBoardGamesAsync(req.EventId); }
