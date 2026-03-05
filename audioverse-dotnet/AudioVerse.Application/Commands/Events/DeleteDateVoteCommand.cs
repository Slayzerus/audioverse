using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record DeleteDateVoteCommand(int ProposalId, int UserId) : IRequest<bool>;
