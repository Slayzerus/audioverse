using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class UpsertDateVoteHandler(IEventRepository r) : IRequestHandler<UpsertDateVoteCommand, int>
{ public Task<int> Handle(UpsertDateVoteCommand req, CancellationToken ct) => r.UpsertDateVoteAsync(req.Vote); }
