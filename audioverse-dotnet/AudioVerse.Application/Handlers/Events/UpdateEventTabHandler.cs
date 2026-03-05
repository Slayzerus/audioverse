using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class UpdateEventTabHandler(IEventRepository r) : IRequestHandler<UpdateEventTabCommand, bool>
{ public Task<bool> Handle(UpdateEventTabCommand req, CancellationToken ct) => r.UpdateTabAsync(req.Tab); }
