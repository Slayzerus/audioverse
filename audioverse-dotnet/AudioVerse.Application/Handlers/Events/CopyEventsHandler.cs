using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class CopyEventsHandler(IEventListRepository repo) : IRequestHandler<CopyEventsCommand, int>
{
    public async Task<int> Handle(CopyEventsCommand req, CancellationToken ct)
        => await repo.CopyItemsAsync(req.SourceListId, req.TargetListId, req.EventIds, req.AddedByUserId, ct);
}

/// <summary>Handles reordering items within a list.</summary>
