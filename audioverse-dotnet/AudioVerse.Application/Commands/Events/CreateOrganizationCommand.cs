using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>Create a new organization.</summary>
public record CreateOrganizationCommand(Organization Organization) : IRequest<int>;
