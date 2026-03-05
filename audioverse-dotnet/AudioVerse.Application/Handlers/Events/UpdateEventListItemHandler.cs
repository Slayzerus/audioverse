using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class UpdateEventListItemHandler(IEventListRepository repo) : IRequestHandler<UpdateEventListItemCommand, bool>
{
    public async Task<bool> Handle(UpdateEventListItemCommand req, CancellationToken ct)
    {
        var item = await repo.GetItemByIdAsync(req.ItemId, ct);
        if (item == null) return false;
        item.Note = req.Note;
        item.Tags = req.Tags;
        item.SortOrder = req.SortOrder;
        return await repo.UpdateItemAsync(item, ct);
    }
}

/// <summary>Handles bulk-adding events to a list.</summary>
