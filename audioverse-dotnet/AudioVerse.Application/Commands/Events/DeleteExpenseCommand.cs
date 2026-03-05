using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>
/// Command to delete an expense.
/// </summary>
public record DeleteExpenseCommand(int Id) : IRequest<bool>;
