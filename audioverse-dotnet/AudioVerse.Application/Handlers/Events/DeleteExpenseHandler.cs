using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class DeleteExpenseHandler(IEventRepository r) : IRequestHandler<DeleteExpenseCommand, bool>
{ public Task<bool> Handle(DeleteExpenseCommand req, CancellationToken ct) => r.DeleteExpenseAsync(req.Id); }
