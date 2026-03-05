using MediatR;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Application.Queries.Karaoke
{
    public record GetRoundPlayersQuery(int RoundId) : IRequest<IEnumerable<KaraokeSessionRoundPlayer>>;
}
