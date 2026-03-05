using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>
/// Command to split an expense equally among participants.
/// </summary>
public record SplitExpenseEquallyCommand(int ExpenseId) : IRequest<int>;
