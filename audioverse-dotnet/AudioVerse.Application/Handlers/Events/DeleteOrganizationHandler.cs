using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles deleting an organization.</summary>
public class DeleteOrganizationHandler(ILeagueRepository repo) : IRequestHandler<DeleteOrganizationCommand, bool>
{
    public Task<bool> Handle(DeleteOrganizationCommand req, CancellationToken ct) =>
        repo.DeleteOrganizationAsync(req.Id);
}
