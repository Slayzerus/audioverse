using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class UpsertGameVoteHandler(IEventRepository r) : IRequestHandler<UpsertGameVoteCommand, int>
{ public Task<int> Handle(UpsertGameVoteCommand req, CancellationToken ct) => r.UpsertGameVoteAsync(req.Vote); }
