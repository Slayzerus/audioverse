using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class ConfirmPaymentHandler(IEventRepository r) : IRequestHandler<ConfirmPaymentCommand, bool>
{ public Task<bool> Handle(ConfirmPaymentCommand req, CancellationToken ct) => r.ConfirmPaymentAsync(req.PaymentId, req.ConfirmedByUserId); }
