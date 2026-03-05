using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class AddEventsBulkHandler(IEventListRepository repo) : IRequestHandler<AddEventsBulkCommand, int>
{
    public async Task<int> Handle(AddEventsBulkCommand req, CancellationToken ct)
        => await repo.AddItemsBulkAsync(req.ListId, req.EventIds, req.AddedByUserId, ct);
}

/// <summary>Handles bulk-removing events from a list.</summary>
