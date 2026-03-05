using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetDateProposalsByEventHandler(IEventRepository r) : IRequestHandler<GetDateProposalsByEventQuery, IEnumerable<EventDateProposal>>
{ public Task<IEnumerable<EventDateProposal>> Handle(GetDateProposalsByEventQuery req, CancellationToken ct) => r.GetDateProposalsByEventAsync(req.EventId); }
