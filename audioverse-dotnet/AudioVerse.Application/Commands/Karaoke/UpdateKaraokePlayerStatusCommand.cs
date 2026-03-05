using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using MediatR;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record UpdateKaraokePlayerStatusCommand(int EventId, int PlayerId, KaraokePlayerStatus Status) : IRequest<bool>;
}
