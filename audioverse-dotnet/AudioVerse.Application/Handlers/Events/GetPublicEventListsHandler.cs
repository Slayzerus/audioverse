using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetPublicEventListsHandler(IEventListRepository repo) : IRequestHandler<GetPublicEventListsQuery, IEnumerable<EventList>>
{
    public async Task<IEnumerable<EventList>> Handle(GetPublicEventListsQuery req, CancellationToken ct)
        => await repo.GetPublicListsAsync(req.Page, req.PageSize, ct);
}

/// <summary>Handles checking if event is in a list.</summary>
