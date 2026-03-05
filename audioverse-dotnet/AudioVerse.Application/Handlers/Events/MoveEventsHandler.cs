using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class MoveEventsHandler(IEventListRepository repo) : IRequestHandler<MoveEventsCommand, int>
{
    public async Task<int> Handle(MoveEventsCommand req, CancellationToken ct)
        => await repo.MoveItemsAsync(req.SourceListId, req.TargetListId, req.EventIds, ct);
}

/// <summary>Handles copying events between lists.</summary>
