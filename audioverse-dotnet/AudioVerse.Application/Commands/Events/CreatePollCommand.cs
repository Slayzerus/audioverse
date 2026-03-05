using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>
/// Command to create a new poll for an event.
/// </summary>
public record CreatePollCommand(EventPoll Poll) : IRequest<int>;
