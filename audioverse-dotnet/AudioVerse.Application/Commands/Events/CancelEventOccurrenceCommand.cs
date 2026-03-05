using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>Cancel a single event occurrence (or the whole event if not recurring). Sets CancellationReason.</summary>
public record CancelEventOccurrenceCommand(int EventId, string? Reason = null) : IRequest<bool>;
