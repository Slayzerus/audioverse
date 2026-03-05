using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>Update an organization.</summary>
public record UpdateOrganizationCommand(Organization Organization) : IRequest<bool>;
