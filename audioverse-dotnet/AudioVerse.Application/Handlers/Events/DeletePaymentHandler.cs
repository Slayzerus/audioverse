using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class DeletePaymentHandler(IEventRepository r) : IRequestHandler<DeletePaymentCommand, bool>
{ public Task<bool> Handle(DeletePaymentCommand req, CancellationToken ct) => r.DeletePaymentAsync(req.Id); }
