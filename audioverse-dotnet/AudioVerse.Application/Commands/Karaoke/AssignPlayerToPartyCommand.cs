using MediatR;
using AudioVerse.Domain.Entities.Karaoke;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record AssignPlayerToPartyCommand(KaraokePartyPlayer PartyPlayer) : IRequest<bool>;
}
