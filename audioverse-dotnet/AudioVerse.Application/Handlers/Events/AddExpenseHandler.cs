using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class AddExpenseHandler(IEventRepository r) : IRequestHandler<AddExpenseCommand, int>
{ public Task<int> Handle(AddExpenseCommand req, CancellationToken ct) => r.AddExpenseAsync(req.Expense); }
