using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class DeleteDateVoteHandler(IEventRepository r) : IRequestHandler<DeleteDateVoteCommand, bool>
{ public Task<bool> Handle(DeleteDateVoteCommand req, CancellationToken ct) => r.DeleteDateVoteAsync(req.ProposalId, req.UserId); }
