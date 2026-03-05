using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>
/// Command to add a payment record.
/// </summary>
public record AddPaymentCommand(EventPayment Payment) : IRequest<int>;
