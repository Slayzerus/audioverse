using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class DeleteMenuItemHandler(IEventRepository r) : IRequestHandler<DeleteMenuItemCommand, bool>
{ public Task<bool> Handle(DeleteMenuItemCommand req, CancellationToken ct) => r.DeleteMenuItemAsync(req.Id); }
