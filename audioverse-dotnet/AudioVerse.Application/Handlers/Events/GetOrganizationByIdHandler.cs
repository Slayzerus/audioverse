using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles retrieving an organization by ID.</summary>
public class GetOrganizationByIdHandler(ILeagueRepository repo) : IRequestHandler<GetOrganizationByIdQuery, Organization?>
{
    public Task<Organization?> Handle(GetOrganizationByIdQuery req, CancellationToken ct) =>
        repo.GetOrganizationByIdAsync(req.Id);
}
