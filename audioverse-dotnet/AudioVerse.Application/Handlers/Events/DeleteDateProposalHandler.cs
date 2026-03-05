using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class DeleteDateProposalHandler(IEventRepository r) : IRequestHandler<DeleteDateProposalCommand, bool>
{ public Task<bool> Handle(DeleteDateProposalCommand req, CancellationToken ct) => r.DeleteDateProposalAsync(req.Id); }
