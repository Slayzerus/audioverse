using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>Reschedule a recurring event occurrence to a new date/time.</summary>
public record RescheduleEventOccurrenceCommand(int EventId, DateTime NewStartTime, DateTime? NewEndTime = null) : IRequest<bool>;
