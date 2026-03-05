using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles paged league listing.</summary>
public class GetLeaguesHandler(ILeagueRepository repo) : IRequestHandler<GetLeaguesQuery, (IEnumerable<League> Items, int TotalCount)>
{
    public Task<(IEnumerable<League> Items, int TotalCount)> Handle(GetLeaguesQuery req, CancellationToken ct) =>
        repo.GetLeaguesPagedAsync(req.OrganizationId, req.Page, req.PageSize);
}
