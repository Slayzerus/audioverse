using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetEventTabsByEventHandler(IEventRepository r) : IRequestHandler<GetEventTabsByEventQuery, IEnumerable<EventTab>>
{ public Task<IEnumerable<EventTab>> Handle(GetEventTabsByEventQuery req, CancellationToken ct) => r.GetTabsByEventAsync(req.EventId); }
