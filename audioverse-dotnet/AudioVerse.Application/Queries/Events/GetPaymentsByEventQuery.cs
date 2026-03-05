using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

/// <summary>
/// Query to get all payments for an event.
/// </summary>
public record GetPaymentsByEventQuery(int EventId) : IRequest<IEnumerable<EventPayment>>;
