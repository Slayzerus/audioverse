using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetLeagueEventListsHandler(IEventListRepository repo) : IRequestHandler<GetLeagueEventListsQuery, IEnumerable<EventList>>
{
    public async Task<IEnumerable<EventList>> Handle(GetLeagueEventListsQuery req, CancellationToken ct)
        => await repo.GetByLeagueAsync(req.LeagueId, ct);
}

/// <summary>Handles getting public lists.</summary>
