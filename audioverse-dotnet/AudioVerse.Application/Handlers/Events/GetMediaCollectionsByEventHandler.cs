using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetMediaCollectionsByEventHandler(IEventRepository r) : IRequestHandler<GetMediaCollectionsByEventQuery, IEnumerable<EventMediaCollection>>
{ public Task<IEnumerable<EventMediaCollection>> Handle(GetMediaCollectionsByEventQuery req, CancellationToken ct) => r.GetMediaCollectionsByEventAsync(req.EventId); }
