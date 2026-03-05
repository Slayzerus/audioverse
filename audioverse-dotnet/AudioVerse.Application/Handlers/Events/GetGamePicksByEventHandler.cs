using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetGamePicksByEventHandler(IEventRepository r) : IRequestHandler<GetGamePicksByEventQuery, IEnumerable<EventSessionGamePick>>
{ public Task<IEnumerable<EventSessionGamePick>> Handle(GetGamePicksByEventQuery req, CancellationToken ct) => r.GetGamePicksByEventAsync(req.EventId); }
