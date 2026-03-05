using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class AddEventToListHandler(IEventListRepository repo) : IRequestHandler<AddEventToListCommand, int>
{
    public async Task<int> Handle(AddEventToListCommand req, CancellationToken ct)
    {
        if (await repo.IsEventInListAsync(req.ListId, req.EventId, ct))
            return 0;

        var item = new EventListItem
        {
            EventListId = req.ListId,
            EventId = req.EventId,
            Note = req.Note,
            Tags = req.Tags,
            AddedByUserId = req.AddedByUserId
        };
        return await repo.AddItemAsync(item, ct);
    }
}

/// <summary>Handles removing an item from a list.</summary>
