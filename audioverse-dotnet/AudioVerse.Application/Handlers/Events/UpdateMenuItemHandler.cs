using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class UpdateMenuItemHandler(IEventRepository r) : IRequestHandler<UpdateMenuItemCommand, bool>
{ public Task<bool> Handle(UpdateMenuItemCommand req, CancellationToken ct) => r.UpdateMenuItemAsync(req.Item); }
