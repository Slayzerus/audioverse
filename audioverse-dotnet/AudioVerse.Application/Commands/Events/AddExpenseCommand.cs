using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>
/// Command to add an expense to an event.
/// </summary>
public record AddExpenseCommand(EventExpense Expense) : IRequest<int>;
