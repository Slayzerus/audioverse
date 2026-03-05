using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetPhotoTagsHandler(IEventRepository r) : IRequestHandler<GetPhotoTagsQuery, IEnumerable<EventMediaTag>>
{ public Task<IEnumerable<EventMediaTag>> Handle(GetPhotoTagsQuery req, CancellationToken ct) => r.GetMediaTagsByPhotoAsync(req.PhotoId); }
