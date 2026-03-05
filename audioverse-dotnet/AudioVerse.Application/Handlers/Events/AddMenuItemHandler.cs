using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class AddMenuItemHandler(IEventRepository r) : IRequestHandler<AddMenuItemCommand, int>
{ public Task<int> Handle(AddMenuItemCommand req, CancellationToken ct) => r.AddMenuItemAsync(req.Item); }
