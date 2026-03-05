using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke
{
    /// <summary>Returns a single karaoke round by ID.</summary>
    public class GetRoundByIdHandler(IKaraokeRepository repo) : IRequestHandler<GetRoundByIdQuery, KaraokeSessionRound?>
    {
        public async Task<KaraokeSessionRound?> Handle(GetRoundByIdQuery request, CancellationToken cancellationToken)
        {
            return await repo.GetRoundByIdAsync(request.RoundId);
        }
    }
}
