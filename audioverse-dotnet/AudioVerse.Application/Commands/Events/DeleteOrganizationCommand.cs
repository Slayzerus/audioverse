using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>Delete an organization by ID.</summary>
public record DeleteOrganizationCommand(int Id) : IRequest<bool>;
