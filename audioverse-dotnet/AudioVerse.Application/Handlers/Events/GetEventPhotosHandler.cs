using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Storage;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetEventPhotosHandler(IEventRepository r) : IRequestHandler<GetEventPhotosQuery, IEnumerable<EventPhoto>>
{ public Task<IEnumerable<EventPhoto>> Handle(GetEventPhotosQuery req, CancellationToken ct) => r.GetPhotosByEventAsync(req.EventId); }
