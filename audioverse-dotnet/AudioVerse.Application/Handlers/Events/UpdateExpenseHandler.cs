using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class UpdateExpenseHandler(IEventRepository r) : IRequestHandler<UpdateExpenseCommand, bool>
{ public Task<bool> Handle(UpdateExpenseCommand req, CancellationToken ct) => r.UpdateExpenseAsync(req.Expense); }
