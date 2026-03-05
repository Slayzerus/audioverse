using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class DeleteGameVoteHandler(IEventRepository r) : IRequestHandler<DeleteGameVoteCommand, bool>
{ public Task<bool> Handle(DeleteGameVoteCommand req, CancellationToken ct) => r.DeleteGameVoteAsync(req.PickId, req.UserId); }
