using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record DeleteGameVoteCommand(int PickId, int UserId) : IRequest<bool>;
