using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetPaymentsByEventHandler(IEventRepository r) : IRequestHandler<GetPaymentsByEventQuery, IEnumerable<EventPayment>>
{ public Task<IEnumerable<EventPayment>> Handle(GetPaymentsByEventQuery req, CancellationToken ct) => r.GetPaymentsByEventAsync(req.EventId); }
