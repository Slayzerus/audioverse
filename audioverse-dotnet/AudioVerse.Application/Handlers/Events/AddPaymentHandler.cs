using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class AddPaymentHandler(IEventRepository r) : IRequestHandler<AddPaymentCommand, int>
{ public Task<int> Handle(AddPaymentCommand req, CancellationToken ct) => r.AddPaymentAsync(req.Payment); }
