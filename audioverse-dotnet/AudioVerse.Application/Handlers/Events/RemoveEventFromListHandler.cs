using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class RemoveEventFromListHandler(IEventListRepository repo) : IRequestHandler<RemoveEventFromListCommand, bool>
{
    public async Task<bool> Handle(RemoveEventFromListCommand req, CancellationToken ct)
        => await repo.RemoveItemAsync(req.ItemId, ct);
}

/// <summary>Handles updating a list item.</summary>
