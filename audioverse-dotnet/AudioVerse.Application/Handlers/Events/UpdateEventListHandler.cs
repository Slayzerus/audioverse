using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class UpdateEventListHandler(IEventListRepository repo) : IRequestHandler<UpdateEventListCommand, bool>
{
    public async Task<bool> Handle(UpdateEventListCommand req, CancellationToken ct)
    {
        var list = new EventList
        {
            Id = req.Id,
            Name = req.Name,
            Description = req.Description,
            Visibility = req.Visibility,
            IconKey = req.IconKey,
            Color = req.Color,
            IsPinned = req.IsPinned,
            SortOrder = req.SortOrder
        };
        return await repo.UpdateAsync(list, ct);
    }
}

/// <summary>Handles deleting an event list.</summary>
