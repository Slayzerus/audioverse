using MediatR;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record AssignPlayerToKaraokeSessionCommand(KaraokeSessionPlayer SessionPlayer) : IRequest<bool>;
}
