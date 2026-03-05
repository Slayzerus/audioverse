using MediatR;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Application.Commands.Events
{
    public record AddSessionToEventCommand(int EventId, KaraokeSession Session) : IRequest<int>;
}
