using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class SetEventListItemObservedHandler(IEventListRepository listRepo, IEventSubscriptionRepository subRepo)
    : IRequestHandler<SetEventListItemObservedCommand, bool>
{
    public async Task<bool> Handle(SetEventListItemObservedCommand req, CancellationToken ct)
    {
        var item = await listRepo.GetItemByIdAsync(req.ItemId, ct);
        if (item == null) return false;

        item.IsObserved = req.IsObserved;
        await listRepo.UpdateItemAsync(item, ct);

        if (req.IsObserved)
        {
            var existing = await subRepo.GetAsync(req.UserId, item.EventId, ct);
            if (existing == null)
            {
                await subRepo.CreateAsync(new EventSubscription
                {
                    UserId = req.UserId,
                    EventId = item.EventId,
                    Level = req.Level
                }, ct);
            }
        }
        else
        {
            await subRepo.DeleteAsync(req.UserId, item.EventId, ct);
        }

        return true;
    }
}

// â”€â”€ Query handlers â”€â”€
