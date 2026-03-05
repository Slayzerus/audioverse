using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

/// <summary>
/// Query to get an expense by ID.
/// </summary>
public record GetExpenseByIdQuery(int Id) : IRequest<EventExpense?>;
