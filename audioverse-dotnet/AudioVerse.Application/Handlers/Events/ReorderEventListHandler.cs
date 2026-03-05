using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class ReorderEventListHandler(IEventListRepository repo) : IRequestHandler<ReorderEventListCommand, bool>
{
    public async Task<bool> Handle(ReorderEventListCommand req, CancellationToken ct)
    {
        var ordering = req.ItemIdToOrder.Select(kv => (kv.Key, kv.Value));
        await repo.ReorderItemsAsync(req.ListId, ordering, ct);
        return true;
    }
}

/// <summary>Handles toggling favorite (add/remove from favorites list, auto-creates list if missing).</summary>
