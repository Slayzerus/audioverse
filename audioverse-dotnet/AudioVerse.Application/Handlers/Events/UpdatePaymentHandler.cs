using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class UpdatePaymentHandler(IEventRepository r) : IRequestHandler<UpdatePaymentCommand, bool>
{ public Task<bool> Handle(UpdatePaymentCommand req, CancellationToken ct) => r.UpdatePaymentAsync(req.Payment); }
