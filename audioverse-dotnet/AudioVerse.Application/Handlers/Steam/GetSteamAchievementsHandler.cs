using AudioVerse.Application.Queries.Steam;
using AudioVerse.Infrastructure.ExternalApis.Steam;
using MediatR;

namespace AudioVerse.Application.Handlers.Steam
{
    public class GetSteamAchievementsHandler : IRequestHandler<GetSteamAchievementsQuery, List<SteamPlayerAchievement>>
    {
        private readonly ISteamClient _steam;
        public GetSteamAchievementsHandler(ISteamClient steam) => _steam = steam;

        public async Task<List<SteamPlayerAchievement>> Handle(GetSteamAchievementsQuery request, CancellationToken ct)
            => await _steam.GetPlayerAchievementsAsync(request.SteamId, request.AppId, ct);
    }
}
