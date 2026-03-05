using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetOrganizationEventListsHandler(IEventListRepository repo) : IRequestHandler<GetOrganizationEventListsQuery, IEnumerable<EventList>>
{
    public async Task<IEnumerable<EventList>> Handle(GetOrganizationEventListsQuery req, CancellationToken ct)
        => await repo.GetByOrganizationAsync(req.OrganizationId, ct);
}

/// <summary>Handles getting league's lists.</summary>
