using AudioVerse.Application.Queries.Steam;
using AudioVerse.Infrastructure.ExternalApis.Steam;
using MediatR;

namespace AudioVerse.Application.Handlers.Steam
{
    public class GetSteamGlobalAchievementsHandler : IRequestHandler<GetSteamGlobalAchievementsQuery, List<SteamGlobalAchievement>>
    {
        private readonly ISteamClient _steam;
        public GetSteamGlobalAchievementsHandler(ISteamClient steam) => _steam = steam;

        public async Task<List<SteamGlobalAchievement>> Handle(GetSteamGlobalAchievementsQuery request, CancellationToken ct)
            => await _steam.GetGlobalAchievementPercentagesAsync(request.AppId, ct);
    }
}
