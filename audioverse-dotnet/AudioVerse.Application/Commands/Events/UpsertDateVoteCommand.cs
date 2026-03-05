using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record UpsertDateVoteCommand(EventDateVote Vote) : IRequest<int>;
