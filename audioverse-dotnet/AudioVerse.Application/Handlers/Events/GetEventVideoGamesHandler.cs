using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetEventVideoGamesHandler(IEventRepository r) : IRequestHandler<GetEventVideoGamesQuery, IEnumerable<EventVideoGameSession>>
{ public Task<IEnumerable<EventVideoGameSession>> Handle(GetEventVideoGamesQuery req, CancellationToken ct) => r.GetEventVideoGamesAsync(req.EventId); }
