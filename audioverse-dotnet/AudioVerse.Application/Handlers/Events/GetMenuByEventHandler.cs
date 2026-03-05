using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetMenuByEventHandler(IEventRepository r) : IRequestHandler<GetMenuByEventQuery, IEnumerable<EventMenuItem>>
{ public Task<IEnumerable<EventMenuItem>> Handle(GetMenuByEventQuery req, CancellationToken ct) => r.GetMenuByEventAsync(req.EventId); }
