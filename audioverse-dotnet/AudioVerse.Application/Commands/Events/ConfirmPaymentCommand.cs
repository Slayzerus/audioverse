using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>
/// Command to confirm a payment as received.
/// </summary>
public record ConfirmPaymentCommand(int PaymentId, int ConfirmedByUserId) : IRequest<bool>;
