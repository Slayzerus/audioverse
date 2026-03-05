using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class DeleteCollageHandler(IEventRepository r) : IRequestHandler<DeleteCollageCommand, bool>
{ public Task<bool> Handle(DeleteCollageCommand req, CancellationToken ct) => r.DeleteCollageAsync(req.Id); }
