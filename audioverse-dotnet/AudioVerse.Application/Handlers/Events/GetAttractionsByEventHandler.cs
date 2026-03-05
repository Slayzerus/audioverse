using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetAttractionsByEventHandler(IEventRepository r) : IRequestHandler<GetAttractionsByEventQuery, IEnumerable<EventAttraction>>
{ public Task<IEnumerable<EventAttraction>> Handle(GetAttractionsByEventQuery req, CancellationToken ct) => r.GetAttractionsByEventAsync(req.EventId); }
