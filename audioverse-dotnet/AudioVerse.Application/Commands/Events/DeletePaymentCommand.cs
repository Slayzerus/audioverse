using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>
/// Command to delete a payment record.
/// </summary>
public record DeletePaymentCommand(int Id) : IRequest<bool>;
