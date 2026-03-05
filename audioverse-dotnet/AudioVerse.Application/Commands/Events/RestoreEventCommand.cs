using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>Restore a soft-deleted event (admin).</summary>
public record RestoreEventCommand(int EventId) : IRequest<bool>;
