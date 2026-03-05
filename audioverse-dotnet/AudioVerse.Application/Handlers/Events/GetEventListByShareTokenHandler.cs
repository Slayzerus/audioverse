using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetEventListByShareTokenHandler(IEventListRepository repo) : IRequestHandler<GetEventListByShareTokenQuery, EventList?>
{
    public async Task<EventList?> Handle(GetEventListByShareTokenQuery req, CancellationToken ct)
        => await repo.GetByShareTokenAsync(req.ShareToken, ct);
}

/// <summary>Handles getting user's lists.</summary>
