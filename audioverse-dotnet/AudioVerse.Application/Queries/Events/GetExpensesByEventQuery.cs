using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

/// <summary>
/// Query to get all expenses for an event.
/// </summary>
public record GetExpensesByEventQuery(int EventId) : IRequest<IEnumerable<EventExpense>>;
