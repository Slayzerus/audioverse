using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class RemoveEventsBulkHandler(IEventListRepository repo) : IRequestHandler<RemoveEventsBulkCommand, int>
{
    public async Task<int> Handle(RemoveEventsBulkCommand req, CancellationToken ct)
        => await repo.RemoveItemsBulkAsync(req.ListId, req.EventIds, ct);
}

/// <summary>Handles moving events between lists.</summary>
