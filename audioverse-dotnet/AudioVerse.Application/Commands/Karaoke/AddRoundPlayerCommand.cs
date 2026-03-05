using MediatR;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record AddRoundPlayerCommand(KaraokeSessionRoundPlayer Player) : IRequest<int>;
}
