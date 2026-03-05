using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>Soft-delete an event (sets IsDeleted = true).</summary>
public record SoftDeleteEventCommand(int EventId, int DeletedByUserId) : IRequest<bool>;
