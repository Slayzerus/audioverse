using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetScheduleItemByIdHandler(IEventRepository r) : IRequestHandler<GetScheduleItemByIdQuery, EventScheduleItem?>
{ public Task<EventScheduleItem?> Handle(GetScheduleItemByIdQuery req, CancellationToken ct) => r.GetScheduleItemByIdAsync(req.Id); }
