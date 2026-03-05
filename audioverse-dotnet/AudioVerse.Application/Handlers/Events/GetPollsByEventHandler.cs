using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetPollsByEventHandler(IEventRepository r) : IRequestHandler<GetPollsByEventQuery, IEnumerable<EventPoll>>
{ public Task<IEnumerable<EventPoll>> Handle(GetPollsByEventQuery req, CancellationToken ct) => r.GetPollsByEventAsync(req.EventId); }
