using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetExpensesByEventHandler(IEventRepository r) : IRequestHandler<GetExpensesByEventQuery, IEnumerable<EventExpense>>
{ public Task<IEnumerable<EventExpense>> Handle(GetExpensesByEventQuery req, CancellationToken ct) => r.GetExpensesByEventAsync(req.EventId); }
