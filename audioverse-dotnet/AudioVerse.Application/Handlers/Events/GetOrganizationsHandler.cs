using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles paged organization listing.</summary>
public class GetOrganizationsHandler(ILeagueRepository repo) : IRequestHandler<GetOrganizationsQuery, (IEnumerable<Organization> Items, int TotalCount)>
{
    public Task<(IEnumerable<Organization> Items, int TotalCount)> Handle(GetOrganizationsQuery req, CancellationToken ct) =>
        repo.GetOrganizationsPagedAsync(req.Page, req.PageSize);
}
