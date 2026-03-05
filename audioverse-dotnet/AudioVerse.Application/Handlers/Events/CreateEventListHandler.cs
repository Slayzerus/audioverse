using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class CreateEventListHandler(IEventListRepository repo) : IRequestHandler<CreateEventListCommand, int>
{
    public async Task<int> Handle(CreateEventListCommand req, CancellationToken ct)
    {
        var list = new EventList
        {
            Name = req.Name,
            Description = req.Description,
            Type = req.Type,
            Visibility = req.Visibility,
            OwnerUserId = req.OwnerUserId,
            OrganizationId = req.OrganizationId,
            LeagueId = req.LeagueId,
            IconKey = req.IconKey,
            Color = req.Color
        };
        return await repo.CreateAsync(list, ct);
    }
}

/// <summary>Handles updating an event list.</summary>
