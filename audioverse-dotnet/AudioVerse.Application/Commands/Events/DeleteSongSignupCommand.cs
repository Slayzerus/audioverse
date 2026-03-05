using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record DeleteSongSignupCommand(int PickId, int UserId) : IRequest<bool>;
