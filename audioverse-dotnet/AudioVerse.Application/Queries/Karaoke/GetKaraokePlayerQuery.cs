using MediatR;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Application.Queries.Karaoke
{
    public record GetKaraokePlayerQuery(int EventId, int PlayerId) : IRequest<KaraokeSessionPlayer?>;
}
