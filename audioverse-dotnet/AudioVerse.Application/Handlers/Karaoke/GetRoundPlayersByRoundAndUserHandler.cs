using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke;

/// <summary>Returns karaoke round players that belong to a specific user (by ProfileId).</summary>
public class GetRoundPlayersByRoundAndUserHandler(IKaraokeRepository repo)
    : IRequestHandler<GetRoundPlayersByRoundAndUserQuery, IEnumerable<KaraokeSessionRoundPlayer>>
{
    public async Task<IEnumerable<KaraokeSessionRoundPlayer>> Handle(
        GetRoundPlayersByRoundAndUserQuery request, CancellationToken cancellationToken)
    {
        return await repo.GetRoundPlayersByUserAsync(request.RoundId, request.UserId);
    }
}
