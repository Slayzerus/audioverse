using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record UpsertGameVoteCommand(EventSessionGameVote Vote) : IRequest<int>;
