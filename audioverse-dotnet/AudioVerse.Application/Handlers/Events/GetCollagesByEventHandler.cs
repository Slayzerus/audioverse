using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetCollagesByEventHandler(IEventRepository r) : IRequestHandler<GetCollagesByEventQuery, IEnumerable<EventCollage>>
{ public Task<IEnumerable<EventCollage>> Handle(GetCollagesByEventQuery req, CancellationToken ct) => r.GetCollagesByEventAsync(req.EventId); }
