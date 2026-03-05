using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class DeleteEventVideoHandler(IEventRepository r) : IRequestHandler<DeleteEventVideoCommand, bool>
{ public Task<bool> Handle(DeleteEventVideoCommand req, CancellationToken ct) => r.DeleteVideoAsync(req.Id); }
