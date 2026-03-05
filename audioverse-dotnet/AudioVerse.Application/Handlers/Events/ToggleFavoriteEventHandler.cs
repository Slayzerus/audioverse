using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class ToggleFavoriteEventHandler(IEventListRepository repo) : IRequestHandler<ToggleFavoriteEventCommand, bool>
{
    public async Task<bool> Handle(ToggleFavoriteEventCommand req, CancellationToken ct)
    {
        var favorites = await repo.GetFavoritesListAsync(req.UserId, ct);
        if (favorites == null)
        {
            favorites = new EventList
            {
                Name = "Ulubione",
                Type = EventListType.Favorites,
                Visibility = EventListVisibility.Private,
                OwnerUserId = req.UserId,
                IconKey = "heart"
            };
            await repo.CreateAsync(favorites, ct);
        }

        if (await repo.IsEventInListAsync(favorites.Id, req.EventId, ct))
        {
            await repo.RemoveItemsBulkAsync(favorites.Id, [req.EventId], ct);
            return false;
        }

        await repo.AddItemAsync(new EventListItem
        {
            EventListId = favorites.Id,
            EventId = req.EventId,
            AddedByUserId = req.UserId
        }, ct);
        return true;
    }
}

// â”€â”€ Query handlers â”€â”€

/// <summary>Handles getting a list by ID.</summary>
