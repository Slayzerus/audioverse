using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetEventListByIdHandler(IEventListRepository repo) : IRequestHandler<GetEventListByIdQuery, EventList?>
{
    public async Task<EventList?> Handle(GetEventListByIdQuery req, CancellationToken ct)
        => await repo.GetByIdWithItemsAsync(req.Id, ct);
}

/// <summary>Handles getting a list by share token.</summary>
