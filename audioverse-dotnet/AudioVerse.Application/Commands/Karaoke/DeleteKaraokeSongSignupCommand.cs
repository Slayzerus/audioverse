using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using MediatR;

namespace AudioVerse.Application.Commands.Karaoke;

public record DeleteKaraokeSongSignupCommand(int PickId, int PlayerId) : IRequest<bool>;
