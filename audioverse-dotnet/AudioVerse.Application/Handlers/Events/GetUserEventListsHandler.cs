using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetUserEventListsHandler(IEventListRepository repo) : IRequestHandler<GetUserEventListsQuery, IEnumerable<EventList>>
{
    public async Task<IEnumerable<EventList>> Handle(GetUserEventListsQuery req, CancellationToken ct)
        => await repo.GetByOwnerAsync(req.UserId, ct);
}

/// <summary>Handles getting organization's lists.</summary>
