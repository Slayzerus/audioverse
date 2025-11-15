using MediatR;
using AudioVerse.Domain.Entities.Karaoke;

namespace AudioVerse.Application.Queries.Karaoke
{
    public record GetPartyWithPlayersQuery(int PartyId) : IRequest<KaraokeParty?>;
}
