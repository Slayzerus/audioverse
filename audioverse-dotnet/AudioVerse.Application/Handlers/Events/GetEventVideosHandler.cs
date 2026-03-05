using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetEventVideosHandler(IEventRepository r) : IRequestHandler<GetEventVideosQuery, IEnumerable<EventVideo>>
{ public Task<IEnumerable<EventVideo>> Handle(GetEventVideosQuery req, CancellationToken ct) => r.GetVideosByEventAsync(req.EventId); }
