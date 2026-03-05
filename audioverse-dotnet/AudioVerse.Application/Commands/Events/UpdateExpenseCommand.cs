using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>
/// Command to update an existing expense.
/// </summary>
public record UpdateExpenseCommand(EventExpense Expense) : IRequest<bool>;
