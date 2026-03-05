using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using MediatR;

namespace AudioVerse.Application.Queries.Karaoke
{
    /// <summary>Get a single karaoke round by its ID.</summary>
    public record GetRoundByIdQuery(int RoundId) : IRequest<KaraokeSessionRound?>;
}
