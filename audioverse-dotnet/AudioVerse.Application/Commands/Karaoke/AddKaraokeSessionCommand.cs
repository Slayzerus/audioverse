using MediatR;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record AddKaraokeSessionCommand(KaraokeSession Session) : IRequest<int>;
}
