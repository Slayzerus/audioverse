using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class IsEventInListHandler(IEventListRepository repo) : IRequestHandler<IsEventInListQuery, bool>
{
    public async Task<bool> Handle(IsEventInListQuery req, CancellationToken ct)
        => await repo.IsEventInListAsync(req.ListId, req.EventId, ct);
}
