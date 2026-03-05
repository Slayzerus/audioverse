using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>
/// Command to update an existing poll.
/// </summary>
public record UpdatePollCommand(EventPoll Poll) : IRequest<bool>;
