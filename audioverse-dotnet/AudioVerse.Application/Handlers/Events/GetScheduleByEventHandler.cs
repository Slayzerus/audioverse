using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetScheduleByEventHandler(IEventRepository r) : IRequestHandler<GetScheduleByEventQuery, IEnumerable<EventScheduleItem>>
{ public Task<IEnumerable<EventScheduleItem>> Handle(GetScheduleByEventQuery req, CancellationToken ct) => r.GetScheduleByEventAsync(req.EventId); }
