using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Storage;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetEventCommentsHandler(IEventRepository r) : IRequestHandler<GetEventCommentsQuery, IEnumerable<EventComment>>
{ public Task<IEnumerable<EventComment>> Handle(GetEventCommentsQuery req, CancellationToken ct) => r.GetCommentsByEventAsync(req.EventId); }
