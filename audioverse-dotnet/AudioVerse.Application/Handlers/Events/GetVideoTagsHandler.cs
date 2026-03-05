using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetVideoTagsHandler(IEventRepository r) : IRequestHandler<GetVideoTagsQuery, IEnumerable<EventMediaTag>>
{ public Task<IEnumerable<EventMediaTag>> Handle(GetVideoTagsQuery req, CancellationToken ct) => r.GetMediaTagsByVideoAsync(req.VideoId); }

// â”€â”€ Media Collections â”€â”€
