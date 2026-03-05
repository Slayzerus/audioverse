using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles creating an organization.</summary>
public class CreateOrganizationHandler(ILeagueRepository repo) : IRequestHandler<CreateOrganizationCommand, int>
{
    public Task<int> Handle(CreateOrganizationCommand req, CancellationToken ct) =>
        repo.CreateOrganizationAsync(req.Organization);
}
