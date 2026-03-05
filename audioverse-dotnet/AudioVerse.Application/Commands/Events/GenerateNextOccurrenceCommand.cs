using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>Generate the next occurrence of a recurring event, optionally carrying over un-picked proposals.</summary>
public record GenerateNextOccurrenceCommand(int EventId) : IRequest<int>;
