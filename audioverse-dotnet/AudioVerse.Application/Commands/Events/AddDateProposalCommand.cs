using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record AddDateProposalCommand(EventDateProposal Proposal) : IRequest<int>;
