using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class DeleteEventTabHandler(IEventRepository r) : IRequestHandler<DeleteEventTabCommand, bool>
{ public Task<bool> Handle(DeleteEventTabCommand req, CancellationToken ct) => r.DeleteTabAsync(req.Id); }
