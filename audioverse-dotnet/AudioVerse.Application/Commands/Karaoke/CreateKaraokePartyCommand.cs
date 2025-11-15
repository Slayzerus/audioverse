using MediatR;
using AudioVerse.Domain.Entities.Karaoke;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record CreateKaraokePartyCommand(KaraokeParty Party) : IRequest<int>;
}
