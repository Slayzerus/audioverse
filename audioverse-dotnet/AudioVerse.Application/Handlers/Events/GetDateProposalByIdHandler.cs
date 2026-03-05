using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetDateProposalByIdHandler(IEventRepository r) : IRequestHandler<GetDateProposalByIdQuery, EventDateProposal?>
{ public Task<EventDateProposal?> Handle(GetDateProposalByIdQuery req, CancellationToken ct) => r.GetDateProposalByIdAsync(req.Id); }
