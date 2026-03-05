using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetExpenseByIdHandler(IEventRepository r) : IRequestHandler<GetExpenseByIdQuery, EventExpense?>
{ public Task<EventExpense?> Handle(GetExpenseByIdQuery req, CancellationToken ct) => r.GetExpenseByIdAsync(req.Id); }
