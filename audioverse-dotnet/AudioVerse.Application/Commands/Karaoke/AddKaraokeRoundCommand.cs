using MediatR;
using AudioVerse.Domain.Entities.Karaoke;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record AddKaraokeRoundCommand(KaraokePartyRound Round) : IRequest<int>;
}
