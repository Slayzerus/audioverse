using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>
/// Command to import expenses from poll results.
/// </summary>
public record ImportExpensesFromPollCommand(int PollId) : IRequest<int>;
