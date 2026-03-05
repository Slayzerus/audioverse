using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles updating an organization.</summary>
public class UpdateOrganizationHandler(ILeagueRepository repo) : IRequestHandler<UpdateOrganizationCommand, bool>
{
    public Task<bool> Handle(UpdateOrganizationCommand req, CancellationToken ct) =>
        repo.UpdateOrganizationAsync(req.Organization);
}
