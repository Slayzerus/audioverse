using AudioVerse.Infrastructure.ExternalApis.Steam;
using MediatR;

namespace AudioVerse.Application.Queries.Steam
{
    public record GetSteamAchievementsQuery(string SteamId, int AppId) : IRequest<List<SteamPlayerAchievement>>;
}
