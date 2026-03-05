using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Storage;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetEventPhotoVersionsHandler(IEventRepository r) : IRequestHandler<GetEventPhotoVersionsQuery, IEnumerable<EventPhoto>>
{ public Task<IEnumerable<EventPhoto>> Handle(GetEventPhotoVersionsQuery req, CancellationToken ct) => r.GetPhotoVersionsAsync(req.PhotoId); }
