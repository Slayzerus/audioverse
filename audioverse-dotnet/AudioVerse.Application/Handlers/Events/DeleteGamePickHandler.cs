using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class DeleteGamePickHandler(IEventRepository r) : IRequestHandler<DeleteGamePickCommand, bool>
{ public Task<bool> Handle(DeleteGamePickCommand req, CancellationToken ct) => r.DeleteGamePickAsync(req.Id); }
