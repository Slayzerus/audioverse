using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>
/// Command to update a payment record.
/// </summary>
public record UpdatePaymentCommand(EventPayment Payment) : IRequest<bool>;
