using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class AddDateProposalHandler(IEventRepository r) : IRequestHandler<AddDateProposalCommand, int>
{ public Task<int> Handle(AddDateProposalCommand req, CancellationToken ct) => r.AddDateProposalAsync(req.Proposal); }
