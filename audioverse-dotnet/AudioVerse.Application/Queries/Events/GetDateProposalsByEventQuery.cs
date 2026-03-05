using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record GetDateProposalsByEventQuery(int EventId) : IRequest<IEnumerable<EventDateProposal>>;
