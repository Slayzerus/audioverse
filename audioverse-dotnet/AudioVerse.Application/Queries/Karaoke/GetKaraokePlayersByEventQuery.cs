using MediatR;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Application.Queries.Karaoke
{
    /// <summary>Get karaoke session players for an event (player-level, with permissions).</summary>
    public record GetKaraokePlayersByEventQuery(int EventId) : IRequest<IEnumerable<KaraokeSessionPlayer>>;
}
