using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>
/// Command to delete a poll.
/// </summary>
public record DeletePollCommand(int PollId) : IRequest<bool>;
