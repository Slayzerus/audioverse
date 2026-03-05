using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class AddEventTabHandler(IEventRepository r) : IRequestHandler<AddEventTabCommand, int>
{ public Task<int> Handle(AddEventTabCommand req, CancellationToken ct) => r.AddTabAsync(req.Tab); }
